import { Module } from '@shattercms/types';
import { ShardContainer } from './entities/ShardContainer';
import { Shard } from './entities/Shard';
import { ShardResolver } from './resolvers/shard';
import { Layout } from './entities/Layout';
import { LayoutResolver } from './resolvers/layout';
import { Page } from './entities/Page';
import { PageResolver } from './resolvers/page';

// Export entities for other modules to modify
export { Shard } from './entities/Shard';

const apiModule: Module = {
  name: 'shards',
  entities: [Shard, Page, Layout, ShardContainer],
  resolvers: [ShardResolver, PageResolver, LayoutResolver],
};
export default apiModule;
