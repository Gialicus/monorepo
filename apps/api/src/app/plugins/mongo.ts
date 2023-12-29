import fp from 'fastify-plugin';

export interface MongoPluginOptions {
  uri: string;
}

export default fp<MongoPluginOptions>(async (fastify, opts) => {
  fastify.register(import('@fastify/mongodb'), {
    forceClose: true,
    url: opts.uri || 'mongodb://mongo/mydb',
  });
});
