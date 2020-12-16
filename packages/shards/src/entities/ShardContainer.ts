import { Field, Int, ObjectType } from 'type-graphql';
import {
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  TableInheritance,
} from 'typeorm';
import { Shard } from './Shard';

@ObjectType({ isAbstract: true })
@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class ShardContainer {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => [Shard])
  @OneToMany(() => Shard, (shard) => shard.container)
  shards: Shard[];
}
