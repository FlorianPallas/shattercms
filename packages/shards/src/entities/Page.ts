import { Field, ObjectType } from 'type-graphql';
import { Column, ChildEntity, ManyToOne } from 'typeorm';
import { ShardContainer } from './ShardContainer';
import { Layout } from './Layout';

@ObjectType()
@ChildEntity()
export class Page extends ShardContainer {
  @Field()
  @Column({ unique: true })
  path!: string;

  @Field()
  @Column()
  title!: string;

  @Field()
  @Column()
  description!: string;

  @Column({ nullable: true })
  layoutId?: number;
  @Field(() => Layout, { nullable: true })
  @ManyToOne(() => Layout, { nullable: true })
  layout?: Layout;
}
