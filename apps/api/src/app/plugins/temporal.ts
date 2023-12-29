import { Client, Connection } from '@temporalio/client';
import fp from 'fastify-plugin';

export interface TemporalPluginOptions {
  address: string;
}

export default fp<TemporalPluginOptions>(async (fastify, opts) => {
  const connection = await Connection.connect({
    address: opts.address || 'localhost:7233',
  });
  const client = new Client({
    connection,
  });
  fastify.decorate('temporal', client);
});

declare module 'fastify' {
  export interface FastifyInstance {
    temporal: Client;
  }
}
