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
import { getManager, getRepository } from 'typeorm';
import { ShardContainer } from '../entities/ShardContainer';

@InputType()
class CreateShardInput {
  @Field(() => Int)
  containerId: number;
  @Field()
  type: string;
  @Field({ nullable: true })
  data?: string;
  @Field(() => Int)
  order: number;
}

@InputType()
class UpdateShardInput {
  @Field({ nullable: true })
  type?: string;
  @Field({ nullable: true })
  data?: string;
}

@Resolver(Shard)
export class ShardResolver {
  constructor(protected repository = getRepository(Shard)) {}

  @Query(() => [Shard])
  shard_getAll() {
    return this.repository.find();
  }

  @Query(() => Shard, { nullable: true })
  shard_get(@Arg('id', () => Int) id: number) {
    return this.repository.findOne(id);
  }

  @Mutation(() => Shard)
  async shard_create(@Arg('params') params: CreateShardInput): Promise<Shard> {
    // Create shard
    const shard = this.repository.create(params);

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
          .where('containerId = :containerId', {
            containerId: shard.containerId,
          })
          .andWhere('order >= :order', { order: shard.order })
          .execute();

        // Insert shard
        return transactionalEntityManager.save(shard);
      }
    );
  }

  @Mutation(() => Boolean)
  async shard_delete(@Arg('id', () => Int) id: number): Promise<boolean> {
    // Find shard
    const shard = await this.repository.findOne({ id });
    if (!shard) {
      throw new Error('Shard not found');
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
        .where('containerId = :containerId', { containerId: shard.containerId })
        .andWhere('order >= :order', { order: shard.order })
        .execute();

      // Delete shard
      await transactionalEntityManager.delete(Shard, { id });
    });

    return true;
  }

  @Mutation(() => Boolean)
  async shard_update(
    @Arg('id', () => Int) id: number,
    @Arg('params') params: UpdateShardInput
  ): Promise<boolean> {
    // Update shard
    await this.repository.update({ id }, { ...params });
    return true;
  }

  @Mutation(() => Boolean)
  async shard_reorder(
    @Arg('id', () => Int) id: number,
    @Arg('order', () => Int) newOrder: number
  ): Promise<boolean> {
    // Find shard
    const shard = await this.repository.findOne({ id });
    if (!shard) {
      throw new Error('Shard not found');
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
        .andWhere('containerId = :containerId', {
          containerId: shard.containerId,
        })
        .execute();

      // Update shard
      shard.order = newOrder;
      await transactionalEntityManager.save(shard);
    });

    return true;
  }

  @FieldResolver(() => ShardContainer)
  container(@Root() shard: Shard) {
    return getRepository(ShardContainer).findOne(shard.containerId);
  }
}
