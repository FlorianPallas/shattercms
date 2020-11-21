import { Module } from '@shattercms/types';

import { User } from './entities/User';
import { UserResolver } from './resolvers/user';

// Export entities for other modules to modify
export { User } from './entities/User';

const apiModule: Module = {
  name: 'users',
  entities: [User],
  resolvers: [UserResolver],
};
export default apiModule;

export interface ModuleConfig {
  jwtSecret: string;
}
