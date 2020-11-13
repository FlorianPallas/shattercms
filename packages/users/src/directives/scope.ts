// https://www.apollographql.com/docs/apollo-server/schema/creating-directives/#enforcing-access-permissions
import { Context } from '@shattercms/types';
import { SchemaDirectiveVisitor } from 'apollo-server-express';
import { GraphQLField, defaultFieldResolver, GraphQLObjectType } from 'graphql';
import { User } from '../entities/User';
import { verify } from '../jwt';

const errorUnauthorized = (fieldName: string, requiredScope: string) =>
  new Error(
    `Unauthorized to return value of field '${fieldName}', scope '${requiredScope}' missing.`
  );

export class ScopeDirective extends SchemaDirectiveVisitor {
  visitObject(type: GraphQLObjectType) {
    this.ensureFieldsWrapped(type);
    (type as any)._requiredScope = this.args.requires;
  }

  // Visitor methods for nested types like fields and arguments
  // also receive a details object that provides information about
  // the parent and grandparent types.
  visitFieldDefinition(field: GraphQLField<any, any>, details: any) {
    this.ensureFieldsWrapped(details.objectType);
    (field as any)._requiredScope = this.args.requires;
  }

  ensureFieldsWrapped(objectType: GraphQLObjectType) {
    // Mark the GraphQLObjectType object to avoid re-wrapping:
    if ((objectType as any)._scopeFieldsWrapped) {
      return;
    }
    (objectType as any)._scopeFieldsWrapped = true;

    const fields = objectType.getFields();

    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      const { resolve = defaultFieldResolver } = field;
      field.resolve = async function (...args: any) {
        // Get the required Role from the field first, falling back
        // to the objectType if no Role is required by the field:
        const requiredScope: string =
          (field as any)._requiredScope || (objectType as any)._requiredScope;

        if (!requiredScope) {
          return resolve.apply(this, args);
        }

        const context: Context = args[2];

        // Get token
        const header = (context.req.headers as any).authorization;
        if (!header) {
          throw errorUnauthorized(fieldName, requiredScope);
        }

        // Verify token
        const token = header.split(' ')[1];
        const decoded = verify(context.config, token, 'access');
        if (!decoded || !decoded.userId) {
          throw errorUnauthorized(fieldName, requiredScope);
        }

        // Fetch user and check scopes
        const user = await context.orm
          .createEntityManager()
          .findOne(User, decoded.userId);
        console.log(user);
        if (!user || !user.scopes || !user.scopes.includes(requiredScope)) {
          throw errorUnauthorized(fieldName, requiredScope);
        }

        return resolve.apply(this, args);
      };
    });
  }
}
