import { Field, Int, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ShardContainer } from './ShardContainer';

@ObjectType()
@Entity()
export class Shard {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  type!: string;

  @Field(() => Int)
  @Column()
  order!: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  data?: string;

  @Column()
  containerId: number;
  @Field(() => ShardContainer)
  @ManyToOne(() => ShardContainer, (container) => container.shards, {
    onDelete: 'CASCADE',
  })
  container: ShardContainer;
}
