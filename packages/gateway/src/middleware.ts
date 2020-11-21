import { Context } from '@shattercms/types';
import { MiddlewareFn } from 'type-graphql';

export const authHandler: MiddlewareFn<Context> = async (
  { context, info, root },
  next
) => {
  let node = info.path;
  let stages: string[] = [];

  // Root Path (Query, Mutation, ...)
  if (!node.prev && node.typename) {
    const type = node.typename?.toLowerCase();
    const action = node.key.toString().toLowerCase();
    stages = [type, action];
  }

  // Regular Paths (user.id, user.posts.title, ...)
  if (node.prev) {
    stages.unshift(node.key.toString().toLowerCase());
  }
  while (node.prev) {
    if (!node.prev.typename && node.typename) {
      stages.unshift(node.typename.toLowerCase());
      break;
    }
    node = node.prev;
    if (node.typename) {
      stages.unshift(node.key.toString().toLowerCase());
    }
  }

  // Construct scope and check permission
  const scope = stages.join('.');
  const hasAccess = await context.auth.hasPermission(
    { scope, permission: undefined, data: root },
    context
  );
  if (!hasAccess) {
    throw new Error(`Unauthorized`);
  }

  return next();
};
