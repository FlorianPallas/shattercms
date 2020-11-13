import { Module } from '@shattercms/types';

import { User } from './entities/User';
import { UserResolver } from './resolvers/user';
import { ScopeDirective } from './directives/scope';

// Export entities for other modules to modify
export { User } from './entities/User';

const apiModule: Module = {
  name: 'users',
  entities: [User],
  resolvers: [UserResolver],
  directives: { scope: ScopeDirective },
};
export default apiModule;

export interface ModuleConfig {
  jwtSecret: string;
}
