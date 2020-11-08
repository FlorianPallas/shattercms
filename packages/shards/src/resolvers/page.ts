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
import { getManager } from 'typeorm';
import { Page } from '../entities/Page';
import { Shard } from '../entities/Shard';

@InputType()
class PageInput {
  @Field()
  path: string;
  @Field()
  title: string;
  @Field()
  description: string;
}

@Resolver(Page)
export class PageResolver {
  @Query(() => [Page])
  pages() {
    return Page.find();
  }

  @Query(() => Page, { nullable: true })
  page(@Arg('id', () => Int) id: number) {
    return Page.findOne(id);
  }

  @Query(() => Page, { nullable: true })
  async pageAt(@Arg('path', () => String) path: string) {
    return Page.findOne({ where: { path } });
  }

  @Mutation(() => Page)
  createPage(@Arg('params') params: PageInput) {
    return Page.create({
      ...params,
    }).save();
  }

  @Mutation(() => Boolean)
  async deletePage(@Arg('id', () => Int) id: number) {
    try {
      await Page.delete(id);
    } catch {
      return false;
    }
    return true;
  }

  @FieldResolver()
  shards(@Root() shards: Shard[]): Promise<Shard[]> {
    return getManager()
      .createQueryBuilder()
      .relation(Page, 'shards')
      .of(shards)
      .loadMany();
  }
}
