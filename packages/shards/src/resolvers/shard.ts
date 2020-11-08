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
import { Shard } from '../entities/Shard';
import { Page } from '../entities/Page';
import { getManager } from 'typeorm';

@InputType()
class ShardInput {
  @Field(() => Int)
  pageId: number;
  @Field()
  type: string;
  @Field({ nullable: true })
  data?: string;
  @Field(() => Int)
  order: number;
}

@InputType()
class ShardUpdateInput {
  @Field({ nullable: true })
  type?: string;
  @Field({ nullable: true })
  data?: string;
}

@Resolver(Shard)
export class ShardResolver {
  @Query(() => [Shard])
  shards() {
    return Shard.find();
  }

  @Query(() => Shard, { nullable: true })
  shard(@Arg('id', () => Int) id: number) {
    return Shard.findOne(id);
  }

  @Mutation(() => Shard)
  async createShard(@Arg('params') params: ShardInput): Promise<Shard> {
    // Create shard
    const shard = Shard.create({
      ...params,
    });

    // Start transaction
    return getManager().transaction<Shard>(
      async (transactionalEntityManager) => {
        // Move all shards down by 1
        await transactionalEntityManager
          .createQueryBuilder()
          .update(Shard)
          .set({
            order: () => '"order" + 1',
          })
          .where('pageId = :pageid', { pageid: shard.pageId })
          .andWhere('order >= :order', { order: shard.order })
          .execute();

        // Insert shard
        return transactionalEntityManager.save(shard);
      }
    );
  }

  @Mutation(() => Boolean)
  async deleteShard(@Arg('id', () => Int) id: number): Promise<boolean> {
    // Find shard
    const shard = await Shard.findOne({ id });
    if (!shard) {
      throw new Error('shard not found');
    }

    // Start transaction
    await getManager().transaction(async (transactionalEntityManager) => {
      // Move other shards to fill gap
      await transactionalEntityManager
        .createQueryBuilder()
        .update(Shard)
        .set({
          order: () => '"order" - 1',
        })
        .where('pageId = :pageid', { pageid: shard.pageId })
        .andWhere('order >= :order', { order: shard.order })
        .execute();

      // Delete shard
      await transactionalEntityManager.delete(Shard, { id });
    });

    return true;
  }

  @Mutation(() => Boolean)
  async updateShard(
    @Arg('id', () => Int) id: number,
    @Arg('params') params: ShardUpdateInput
  ): Promise<boolean> {
    // Update shard
    await Shard.update({ id }, { ...params });
    return true;
  }

  @Mutation(() => Boolean)
  async reorderShard(
    @Arg('id', () => Int) id: number,
    @Arg('order', () => Int) newOrder: number
  ): Promise<boolean> {
    // Find shard
    const shard = await Shard.findOne({ id });
    if (!shard) {
      throw new Error('shard not found');
    }
    // Return if the shard is already at the correct spot
    if (shard.order === newOrder) {
      return true;
    }

    // Start transaction
    await getManager().transaction(async (transactionalEntityManager) => {
      // Shift other shards accordingly
      const query = transactionalEntityManager
        .createQueryBuilder()
        .update(Shard);

      if (shard.order < newOrder) {
        query
          .set({
            order: () => '"order" - 1',
          })
          .where('order > :order', { order: shard.order })
          .andWhere('order <= :neworder', { neworder: newOrder });
      } else {
        query
          .set({
            order: () => '"order" + 1',
          })
          .where('order >= :neworder', { neworder: newOrder })
          .andWhere('order < :order', { order: shard.order });
      }
      await query
        .andWhere('pageId = :pageid', { pageid: shard.pageId })
        .execute();

      // Update shard
      shard.order = newOrder;
      await transactionalEntityManager.save(shard);
    });

    return true;
  }

  @FieldResolver(() => Page)
  page(@Root() shard: Shard) {
    return Page.findOne(shard.pageId);
  }
}
