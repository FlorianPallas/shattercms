import { Field, Int, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Page } from './Page';

@ObjectType()
@Entity()
export class Shard extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  pageId: number;
  @Field(() => Page)
  @ManyToOne(() => Page, (page) => page.shards)
  page: Page;

  @Field()
  @Column()
  type!: string;

  @Field(() => Int)
  @Column()
  order!: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  data: string;
}
