import {
  Arg,
  Field,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver,
} from 'type-graphql';
import { getRepository } from 'typeorm';
import { Layout } from '../entities/Layout';
import { ShardContainerResolver } from './shardContainer';

@InputType()
class CreateLayoutInput {
  @Field()
  title: string;
  @Field()
  description: string;
  @Field(() => Int, { nullable: true })
  bodyIndex?: number;
}

@InputType()
class UpdateLayoutInput {
  @Field({ nullable: true })
  title?: string;
  @Field({ nullable: true })
  description?: string;
  @Field(() => Int, { nullable: true })
  bodyIndex?: number;
}

@Resolver(Layout)
export class LayoutResolver extends ShardContainerResolver {
  constructor(protected repository = getRepository(Layout)) {
    super();
  }

  @Query(() => [Layout])
  layout_getAll() {
    return this.repository.find();
  }

  @Query(() => Layout, { nullable: true })
  layout_get(@Arg('id', () => Int) id: number) {
    return this.repository.findOne(id);
  }

  @Mutation(() => Layout)
  layout_create(@Arg('params') params: CreateLayoutInput) {
    const layout = this.repository.create(params);
    return this.repository.save(layout);
  }

  @Mutation(() => Boolean)
  async layout_update(
    @Arg('id', () => Int) id: number,
    @Arg('params') params: UpdateLayoutInput
  ) {
    await this.repository.update(id, params);
    return true;
  }

  @Mutation(() => Boolean)
  async layout_delete(@Arg('id', () => Int) id: number) {
    await this.repository.delete(id);
    return true;
  }
}
