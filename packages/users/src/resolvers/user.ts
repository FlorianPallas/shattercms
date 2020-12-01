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
import { getRepository } from 'typeorm';

@InputType()
class RegisterUserInput {
  @Field()
  username: string;
  @Field()
  email: string;
  @Field()
  password: string;
}

@InputType()
class LoginUserInput {
  @Field()
  email: string;
  @Field()
  password: string;
}

@ObjectType()
class Session {
  @Field()
  accessToken: string;
  @Field()
  refreshToken: string;
}

@Resolver()
export class UserResolver {
  constructor(protected repository = getRepository(User)) {}

  @Query(() => [User])
  user_getAll() {
    return this.repository.find();
  }

  @Query(() => User, { nullable: true })
  user_get(@Arg('id', () => Int) id: number) {
    return this.repository.findOne(id);
  }

  @Mutation(() => Session)
  async user_register(
    @Arg('params') params: RegisterUserInput,
    @Ctx() { config }: Context
  ): Promise<Session> {
    // Validate password
    if (params.username.length <= 2) {
      throw new Error('length of username must be greater than 2');
    }
    if (params.password.length <= 2) {
      throw new Error('length of password must be greater than 2');
    }

    // Hash password and save user
    const hash = await argon2.hash(params.password);
    const userRaw = this.repository.create({
      username: params.username,
      email: params.email,
      password: hash,
    });
    const user = await this.repository.save(userRaw);

    // Handle session
    const payload = {
      userId: user.id,
      username: user.username,
    };
    const accessToken = jwt.sign(config, payload, 'access');
    if (!accessToken) {
      throw new Error('Failed to create session');
    }
    const refreshToken = jwt.sign(config, payload, 'refresh');
    if (!refreshToken) {
      throw new Error('Failed to create session');
    }

    return {
      accessToken,
      refreshToken,
    };
  }

  @Mutation(() => Session)
  async user_login(
    @Arg('params') params: LoginUserInput,
    @Ctx() { config }: Context
  ): Promise<Session> {
    const user = await this.repository.findOne({ email: params.email });
    if (!user) {
      throw new Error('E-Mail or Password incorrect');
    }
    const valid = await argon2.verify(user.password, params.password);
    if (!valid) {
      throw new Error('E-Mail or Password incorrect');
    }

    // Handle session
    const payload = {
      userId: user.id,
      username: user.username,
    };
    const accessToken = jwt.sign(config, payload, 'access');
    if (!accessToken) {
      throw new Error('Failed to create session');
    }
    const refreshToken = jwt.sign(config, payload, 'refresh');
    if (!refreshToken) {
      throw new Error('Failed to create session');
    }

    return {
      accessToken,
      refreshToken,
    };
  }

  @Mutation(() => Session)
  async user_refresh(
    @Arg('refreshToken') token: string,
    @Ctx() { config }: Context
  ): Promise<Session> {
    const data = jwt.verify(config, token, 'refresh');
    if (!data || !data.userId) {
      throw new Error('Failed to validate session');
    }
    const user = await this.repository.findOne({ id: data.userId });
    if (!user) {
      throw new Error('Session is invalid');
    }

    // Handle session
    const payload = {
      userId: user.id,
      username: user.username,
    };
    const accessToken = jwt.sign(config, payload, 'access');
    if (!accessToken) {
      throw new Error('Failed to create session');
    }
    const refreshToken = jwt.sign(config, payload, 'refresh');
    if (!refreshToken) {
      throw new Error('Failed to create session');
    }

    return {
      accessToken,
      refreshToken,
    };
  }
}
