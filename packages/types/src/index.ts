import { Connection, EntitySchema } from 'typeorm';
import { SchemaDirectiveVisitor } from 'apollo-server-express';
import { Request, Response } from 'express';

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer R>
    ? Array<DeepPartial<R>>
    : DeepPartial<T[K]>;
};

export type Entity = string | Function | EntitySchema<any> | undefined;

export type AuthHandler = (
  resource: { scope: string; permission: any; data: any },
  context: Context
) => Promise<boolean>;

export interface Context {
  // Functional
  req: Request;
  res: Response;
  orm: Connection;

  // Configuration
  config: { [key: string]: any };

  // Authentication
  auth: {
    hasPermission: AuthHandler;
  };
}

export interface Module {
  // Info
  name: string;

  // Schema
  entities?: Array<Entity>;
  resolvers?: Array<Function>;
  directives?: { [directiveName: string]: typeof SchemaDirectiveVisitor };

  // Authentication
  authHandler?: AuthHandler;
}
