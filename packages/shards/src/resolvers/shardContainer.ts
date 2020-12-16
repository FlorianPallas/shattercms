import { FieldResolver, Resolver, Root, ClassType } from 'type-graphql';
import { getManager } from 'typeorm';
import { Shard } from '../entities/Shard';
import { ShardContainer } from '../entities/ShardContainer';

@Resolver(ShardContainer as ClassType, { isAbstract: true })
export abstract class ShardContainerResolver {
  @FieldResolver()
  async shards(@Root() shards: Shard[]): Promise<Shard[]> {
    const items: Shard[] = await getManager()
      .createQueryBuilder()
      .relation(ShardContainer, 'shards')
      .of(shards)
      .loadMany();
    items.sort((a, b) => a.order - b.order);
    return items;
  }
}
