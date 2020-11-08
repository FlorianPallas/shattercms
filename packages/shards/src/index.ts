import { Module } from '@shattercms/types';

import { Page } from './entities/Page';
import { Shard } from './entities/Shard';
import { PageResolver } from './resolvers/page';
import { ShardResolver } from './resolvers/shard';

// Export entities for other modules to modify
export { Page } from './entities/Page';
export { Shard } from './entities/Shard';

const apiModule: Module = {
  name: 'shards',
  entities: [Page, Shard],
  resolvers: [PageResolver, ShardResolver],
};
export default apiModule;
