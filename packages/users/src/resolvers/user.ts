import { User } from '../entities/User';
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';
import argon2 from 'argon2';
import { Context } from '@shattercms/types';
import * as jwt from '../jwt';

@InputType()
class RegisterInput {
  @Field()
  username: string;
  @Field()
  email: string;
  @Field()
  password: string;
}

@InputType()
class LoginInput {
  @Field()
  email: string;
  @Field()
  password: string;
}

@ObjectType()
class LoginOutput {
  @Field()
  accessToken: string;
  @Field()
  refreshToken: string;
}

@Resolver()
export class UserResolver {
  @Query(() => [User])
  users() {
    return User.find();
  }

  @Query(() => User, { nullable: true })
  user(@Arg('id', () => Int) id: number) {
    return User.findOne(id);
  }

  @Mutation(() => LoginOutput)
  async register(
    @Arg('params') params: RegisterInput,
    @Ctx() { config }: Context
  ): Promise<LoginOutput> {
    // Validate password
    if (params.username.length <= 2) {
      throw new Error('length of username must be greater than 2');
    }
    if (params.password.length <= 2) {
      throw new Error('length of password must be greater than 2');
    }

    // Hash password and save user
    const hash = await argon2.hash(params.password);
    const user = await User.create({
      username: params.username,
      email: params.email,
      password: hash,
    }).save();

    // Handle session
    const payload = {
      userId: user.id,
      username: user.username,
    };
    const accessToken = jwt.sign(config, payload, 'access');
    if (!accessToken) {
      throw new Error('failed to create session');
    }
    const refreshToken = jwt.sign(config, payload, 'refresh');
    if (!refreshToken) {
      throw new Error('failed to create session');
    }

    return {
      accessToken,
      refreshToken,
    };
  }

  @Mutation(() => LoginOutput)
  async login(
    @Arg('params') params: LoginInput,
    @Ctx() { config }: Context
  ): Promise<LoginOutput> {
    const user = await User.findOne({ email: params.email });
    if (!user) {
      throw new Error('email or password incorrect');
    }
    const valid = await argon2.verify(user.password, params.password);
    if (!valid) {
      throw new Error('email or password incorrect');
    }

    // Handle session
    const payload = {
      userId: user.id,
      username: user.username,
    };
    const accessToken = jwt.sign(config, payload, 'access');
    if (!accessToken) {
      throw new Error('failed to create session');
    }
    const refreshToken = jwt.sign(config, payload, 'refresh');
    if (!refreshToken) {
      throw new Error('failed to create session');
    }

    return {
      accessToken,
      refreshToken,
    };
  }

  @Mutation(() => LoginOutput)
  async refresh(
    @Arg('refreshToken') token: string,
    @Ctx() { config }: Context
  ): Promise<LoginOutput> {
    const data = jwt.verify(config, token, 'refresh');
    if (!data || !data.userId) {
      throw new Error('failed to validate session');
    }
    const user = await User.findOne({ id: data.userId });
    if (!user) {
      throw new Error('session is invalid');
    }

    // Handle session
    const payload = {
      userId: user.id,
      username: user.username,
    };
    const accessToken = jwt.sign(config, payload, 'access');
    if (!accessToken) {
      throw new Error('failed to create session');
    }
    const refreshToken = jwt.sign(config, payload, 'refresh');
    if (!refreshToken) {
      throw new Error('failed to create session');
    }

    return {
      accessToken,
      refreshToken,
    };
  }
}
