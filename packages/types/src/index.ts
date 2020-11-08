import { EntitySchema } from 'typeorm';

export type Entity = string | Function | EntitySchema<any> | undefined;

export interface Module {
  name: string;
  entities: Array<Entity>;
  resolvers: Array<Function>;
}

export interface Context {
  req: Request;
  res: Response;
  config: { [key: string]: any };
}
