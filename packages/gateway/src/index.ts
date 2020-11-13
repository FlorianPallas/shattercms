import express from 'express';
import { ConnectionOptions, createConnection } from 'typeorm';
import { buildSchema } from 'type-graphql';
import { ApolloServer, SchemaDirectiveVisitor } from 'apollo-server-express';
import { GraphQLSchema } from 'graphql';
import { mergeSchemas } from 'graphql-tools';
import { Module, Entity } from '@shattercms/types';
import defu from 'defu';

export interface GatewayOptions {
  modules: Module[];
  config: { [key: string]: any };
  connection: {
    database?: string;
    username?: string;
    password?: string;
  };
}
const defaultOptions: GatewayOptions = {
  modules: [],
  config: {},
  connection: {
    database: 'cm',
    username: 'postgres',
    password: 'postgres',
  },
};

export class Gateway {
  private options: GatewayOptions;

  constructor(options: Partial<GatewayOptions>) {
    this.options = defu(options as GatewayOptions, defaultOptions);
    this.init();
  }

  private async init() {
    const app = express();

    // Build modules
    const schemas: GraphQLSchema[] = [];
    const entities: Entity[] = [];
    let directives = {};

    for (const module of this.options.modules) {
      // Build schema
      if (module.resolvers) {
        let schema = await buildSchema({
          resolvers: module.resolvers as any,
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
      logging: true,
      synchronize: true,
      entities,
    } as ConnectionOptions);

    // Setup Apollo
    const apolloServer = new ApolloServer({
      schema: mergeSchemas({
        schemas,
        throwOnConflict: true,
      }),
      context: ({ req, res }) => ({
        req,
        res,
        config: this.options.config,
        orm,
      }),
    });

    // Set GraphQL endpoint
    apolloServer.applyMiddleware({ app });

    // Start listening
    app.listen(4000, () => {
      console.log('Listening on localhost:4000');
    });
  }
}
export default Gateway;
