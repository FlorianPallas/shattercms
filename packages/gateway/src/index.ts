import express from 'express';
import { ConnectionOptions, createConnection } from 'typeorm';
import { buildSchema } from 'type-graphql';
import { ApolloServer, SchemaDirectiveVisitor } from 'apollo-server-express';
import { GraphQLSchema } from 'graphql';
import { mergeSchemas } from 'graphql-tools';
import { Module, Entity } from '@shattercms/types';

export interface GatewayOptions {
  modules: Module[];
  config: { [key: string]: any };
}
const defaultOptions: GatewayOptions = {
  modules: [],
  config: {},
};

export class Gateway {
  private options: GatewayOptions;

  constructor(options: Partial<GatewayOptions>) {
    this.options = Object.assign(defaultOptions, options);
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
      let schema = await buildSchema({
        resolvers: module.resolvers as any,
      });

      // Gather schemas, entities and directives
      schemas.push(schema);
      entities.push(...module.entities);
      directives = {
        ...directives,
        ...module.directives,
      };
    }

    // Register directives
    schemas.forEach((schema) => {
      SchemaDirectiveVisitor.visitSchemaDirectives(schema, directives);
    });

    // Create database connection
    const orm = await createConnection({
      name: 'default',
      database: 'cms',
      type: 'postgres',
      username: 'postgres',
      password: 'postgres',
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
