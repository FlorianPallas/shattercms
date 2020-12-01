import express from 'express';
import { ConnectionOptions, createConnection } from 'typeorm';
import { buildSchema } from 'type-graphql';
import { ApolloServer, SchemaDirectiveVisitor } from 'apollo-server-express';
import { GraphQLSchema } from 'graphql';
import { mergeSchemas } from 'graphql-tools';
import { Module, Entity, DeepPartial } from '@shattercms/types';
import defu from 'defu';
import { authHandler } from './middleware';
import { Context, AuthHandler } from '@shattercms/types';

export interface GatewayOptions {
  modules: Module[];
  config: {
    [key: string]: any;
  };
  server: {
    host: string;
    port: number;
  };
  connection: {
    database: string;
    username: string;
    password: string;
    logging: boolean;
  };
  permissions: { [scope: string]: any };
}
const defaultOptions: GatewayOptions = {
  modules: [],
  config: {},
  server: {
    host: 'localhost',
    port: 4000,
  },
  connection: {
    database: 'cms',
    username: 'postgres',
    password: 'postgres',
    logging: false,
  },
  permissions: [],
};

export class Gateway {
  private options: GatewayOptions;

  constructor(
    options: DeepPartial<GatewayOptions> | Pick<GatewayOptions, 'config'>
  ) {
    this.options = defu(options as GatewayOptions, defaultOptions);
    this.init();
  }

  private async init() {
    const app = express();

    // Build modules
    const schemas: GraphQLSchema[] = [];
    const entities: Entity[] = [];
    let directives = {};
    const authHandlers: AuthHandler[] = [];

    for (const module of this.options.modules) {
      // Build schema
      if (module.resolvers) {
        let schema = await buildSchema({
          resolvers: module.resolvers as any,
          globalMiddlewares: [authHandler],
        });
        schemas.push(schema);
      }

      // Gather entities
      if (module.entities) {
        entities.push(...module.entities);
      }

      // Gather directives
      if (module.directives) {
        directives = Object.assign(module.directives, directives);
      }

      // Gather auth handlers
      if (module.authHandler) {
        authHandlers.push(module.authHandler);
      }
    }

    // Register directives
    schemas.forEach((schema) => {
      SchemaDirectiveVisitor.visitSchemaDirectives(schema, directives);
    });

    // Create database connection
    const orm = await createConnection({
      ...this.options.connection,
      name: 'default',
      type: 'postgres',
      synchronize: true,
      entities,
    } as ConnectionOptions);

    // Setup Apollo
    const apolloServer = new ApolloServer({
      schema: mergeSchemas({
        schemas,
        throwOnConflict: true,
      }),
      context: ({ req, res }) =>
        ({
          req,
          res,
          config: this.options.config,
          orm,
          auth: {
            hasPermission: async (resource, context) => {
              // Get permissions from scope
              resource.permission = this.options.permissions[resource.scope];

              // Execute all auth handlers
              for (const handler of authHandlers) {
                const hasAccess = await handler(resource, context);
                if (!hasAccess) {
                  return false;
                }
              }
              return true;
            },
          },
        } as Context),
    });

    // Set GraphQL endpoint
    apolloServer.applyMiddleware({ app });

    // Start listening
    const host = this.options.server.host;
    const port = this.options.server.port;
    app.listen(port, host, () => {
      console.log(`ShatterCMS Gateway • http://${host}:${port}/graphql`);
    });
  }
}
export default Gateway;
