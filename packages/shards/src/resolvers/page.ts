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
  @Field(() => Int, { nullable: true })
  layoutId: number;
}

@InputType()
class LayoutInput {
  @Field()
  name: string;
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

  @Mutation(() => Page)
  createLayoutPage(@Arg('params') params: LayoutInput) {
    const title = `#layout/${params.name}`;
    return Page.create({
      path: title,
      title,
      description: params.description,
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
  async shards(@Root() shards: Shard[]): Promise<Shard[]> {
    const items: Shard[] = await getManager()
      .createQueryBuilder()
      .relation(Page, 'shards')
      .of(shards)
      .loadMany();
    items.sort((a, b) => a.order - b.order);
    return items;
  }

  @FieldResolver(() => Page, { nullable: true })
  layout(@Root() page: Page) {
    if (!page.layoutId) {
      return;
    }
    return Page.findOne(page.layoutId);
  }
}
