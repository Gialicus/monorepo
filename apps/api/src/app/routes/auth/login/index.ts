import { FastifyPluginAsync } from 'fastify';
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { LoginSchema } from '@monorepo/schemas';
import { MONGO_COLLECTIONS } from '@monorepo/interfaces';
import { createHash } from 'node:crypto';

function hashPassword(password) {
  const hash = createHash('sha256');
  hash.update(password + process.env.SALT_KEY);
  const hashedPassword = hash.digest('hex');
  return hashedPassword;
}

const login: FastifyPluginAsync = async (fastify): Promise<void> => {
  const app = fastify.withTypeProvider<JsonSchemaToTsProvider>();
  app.post(
    '/',
    {
      schema: {
        body: LoginSchema,
      },
    },
    async function (request) {
      const { email, password } = request.body;
      const user = await fastify.mongo.db
        .collection(MONGO_COLLECTIONS.USERS)
        .findOne({ email });
      if (!user || user.password !== hashPassword(password)) {
        throw fastify.httpErrors.unauthorized;
      }
      return { token: fastify.jwt.sign({ email }) };
    }
  );
};

export default login;
