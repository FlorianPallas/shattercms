import express from 'express';
import defu from 'defu';
import { ConnectionOptions, createConnection } from 'typeorm';
import { buildSchema } from 'type-graphql';
import { ApolloServer, SchemaDirectiveVisitor } from 'apollo-server-express';
import { Module, Entity, DeepPartial } from '@shattercms/types';
import { authHandler } from './middleware';
import { Context, AuthHandler } from '@shattercms/types';
import { CorsOptions, CorsOptionsDelegate } from 'cors';

export interface GatewayOptions {
  modules: Module[];
  config: {
    [key: string]: any;
  };
  server: {
    host: string;
    port: number;
    cors?: CorsOptions | CorsOptionsDelegate | boolean;
  };
  connection: {
    url?: string;
    database: string;
    username: string;
    password: string;
    logging: boolean;
    synchronize: boolean;
    migrations?: (string | Function)[];
  };
  auth: {
    defaultResponse: boolean;
  };
  permissions: { [scope: string]: any };
}
const defaultOptions: GatewayOptions = {
  modules: [],
  config: {},
  server: {
    host: 'localhost',
    port: 4000,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: 'content-type, authorization',
    },
  },
  connection: {
    database: 'cms',
    username: 'postgres',
    password: 'postgres',
    logging: false,
    synchronize: false,
    migrations: [],
  },
  auth: {
    defaultResponse: false,
  },
  permissions: [],
};

export class Gateway {
  private options: GatewayOptions;

  constructor(
    options:
      | DeepPartial<GatewayOptions>
      | Pick<GatewayOptions, 'config' & 'permissions'>
  ) {
    this.options = defu(options as GatewayOptions, defaultOptions);
    this.init();
  }

  private async init() {
    const app = express();

    // Build modules
    const resolvers: Function[] = [];
    const entities: Entity[] = [];
    let directives = {};
    const authHandlers: AuthHandler[] = [];

    for (const module of this.options.modules) {
      if (module.resolvers) {
        resolvers.push(...module.resolvers);
      }
      if (module.entities) {
        entities.push(...module.entities);
      }
      if (module.directives) {
        directives = Object.assign(module.directives, directives);
      }
      if (module.authHandlers) {
        authHandlers.push(...module.authHandlers);
      }
    }

    // Create database connection
    const orm = await createConnection({
      ...this.options.connection,
      name: 'default',
      type: 'postgres',
      entities,
    } as ConnectionOptions);
    orm.runMigrations();

    // Build schema
    const schema = await buildSchema({
      resolvers: resolvers as any,
      globalMiddlewares: [authHandler],
    });
    SchemaDirectiveVisitor.visitSchemaDirectives(schema, directives);

    // Setup Apollo
    const apolloServer = new ApolloServer({
      schema,
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
                if (hasAccess !== undefined) {
                  return hasAccess;
                }
              }

              // Deny requests by default
              return this.options.auth.defaultResponse;
            },
          },
        } as Context),
    });

    // Set GraphQL endpoint
    apolloServer.applyMiddleware({ app, cors: this.options.server.cors });

    // Start listening
    const host = this.options.server.host;
    const port = this.options.server.port;
    app.listen(port, host, () => {
      console.log(`ShatterCMS Gateway • http://${host}:${port}/graphql`);
    });
  }
}
export default Gateway;
