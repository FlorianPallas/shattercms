import {
  Arg,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
} from 'type-graphql';
import { getRepository } from 'typeorm';
import { Layout } from '../entities/Layout';
import { Page } from '../entities/Page';
import { ShardContainerResolver } from './shardContainer';

@InputType()
class CreatePageInput {
  @Field()
  path: string;
  @Field()
  title: string;
  @Field()
  description: string;
  @Field(() => Int, { nullable: true })
  layoutId?: number;
}

@InputType()
class UpdatePageInput {
  @Field({ nullable: true })
  path?: string;
  @Field({ nullable: true })
  title?: string;
  @Field({ nullable: true })
  description?: string;
  @Field(() => Int, { nullable: true })
  layoutId?: number;
}

@Resolver(Page)
export class PageResolver extends ShardContainerResolver {
  constructor(protected repository = getRepository(Page)) {
    super();
  }

  @Query(() => [Page])
  page_getAll() {
    return this.repository.find();
  }

  @Query(() => Page, { nullable: true })
  page_get(@Arg('id', () => Int) id: number) {
    return this.repository.findOne(id);
  }

  @Query(() => Page, { nullable: true })
  async page_at(@Arg('path', () => String) path: string) {
    return this.repository.findOne({ where: { path } });
  }

  @Mutation(() => Page)
  page_create(@Arg('params') params: CreatePageInput) {
    const page = this.repository.create(params);
    return this.repository.save(page);
  }

  @Mutation(() => Boolean)
  async page_update(
    @Arg('id', () => Int) id: number,
    @Arg('params') params: UpdatePageInput
  ) {
    await this.repository.update(id, params);
    return true;
  }

  @Mutation(() => Boolean)
  async page_delete(@Arg('id', () => Int) id: number) {
    await this.repository.delete(id);
    return true;
  }

  @FieldResolver(() => Page, { nullable: true })
  layout(@Root() page: Page) {
    if (!page.layoutId) {
      return;
    }
    return getRepository(Layout).findOne(page.layoutId);
  }
}
