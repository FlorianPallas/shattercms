import { AuthHandler } from '@shattercms/types';
import { verify } from './jwt';

export const scopeHandler: AuthHandler = async (
  { scope, permission },
  context
) => {
  // Only check fields that have 'scope' access restrictions
  if (permission !== 'scope') {
    return;
  }

  // Parse JWT from headers, deny if invalid
  const header = context.req.headers.authorization;
  const token = header?.split(' ')[1];
  if (!token) {
    return false;
  }

  // Decode JWT, deny if invalid
  const payload = verify(context.config, token, 'access');
  if (!payload) {
    return false;
  }

  return (
    payload.scopes &&
    Array.isArray(payload.scopes) &&
    payload.scopes.includes(scope)
  );
};

export const validHandler: AuthHandler = async ({ permission }, context) => {
  // Only check fields that have 'scope' access restrictions
  if (permission !== 'valid') {
    return;
  }

  // Parse JWT from headers, deny if invalid
  const header = context.req.headers.authorization;
  const token = header?.split(' ')[1];
  if (!token) {
    return false;
  }

  // Decode JWT, deny if invalid
  const payload = verify(context.config, token, 'access');
  return payload !== undefined;
};
