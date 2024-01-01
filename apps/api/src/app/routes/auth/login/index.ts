import { FastifyPluginAsync } from 'fastify';
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { LoginSchema } from '@monorepo/schemas';
import { MONGO_COLLECTIONS } from '@monorepo/interfaces';
import { hashPassword } from '@monorepo/database';

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
      if (
        !user ||
        user.password !== hashPassword(password, process.env.SALT_KEY)
      ) {
        throw fastify.httpErrors.unauthorized;
      }
      return { token: fastify.jwt.sign({ id: user._id.toString(), email }) };
    }
  );
};

export default login;
