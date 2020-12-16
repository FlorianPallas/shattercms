import { Field, Int, ObjectType } from 'type-graphql';
import { ChildEntity, Column } from 'typeorm';
import { ShardContainer } from './ShardContainer';

@ObjectType()
@ChildEntity()
export class Layout extends ShardContainer {
  @Field()
  @Column()
  title!: string;

  @Field()
  @Column()
  description!: string;

  @Field(() => Int)
  @Column({ default: 0 })
  bodyIndex!: number;
}
