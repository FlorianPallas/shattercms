import { Field, Int, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Shard } from './Shard';

@ObjectType()
@Entity()
export class Page extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ unique: true })
  path!: string;

  @Field()
  @Column()
  title!: string;

  @Field()
  @Column()
  description!: string;

  @Field(() => [Shard])
  @OneToMany(() => Shard, (shard) => shard.page)
  shards: Shard[];

  @Column({ nullable: true })
  layoutId: number;
  @Field(() => Page, { nullable: true })
  @ManyToOne(() => Page, { nullable: true })
  layout: Page;
}
