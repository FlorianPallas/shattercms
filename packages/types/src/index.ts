import { Connection, EntitySchema } from 'typeorm';
import { SchemaDirectiveVisitor } from 'apollo-server-express';

export type Entity = string | Function | EntitySchema<any> | undefined;

export interface Module {
  name: string;
  entities?: Array<Entity>;
  resolvers?: Array<Function>;
  directives?: { [directiveName: string]: typeof SchemaDirectiveVisitor };
}

export interface Context {
  req: Request;
  res: Response;
  config: { [key: string]: any };
  orm: Connection;
}
