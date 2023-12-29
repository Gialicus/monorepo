import fp from 'fastify-plugin';

export default fp(async (fastify) => {
  fastify.register(import('@fastify/jwt'), {
    secret: process.env.JWT_SECRET,
  });
});
