import { FastifyPluginAsync } from 'fastify';
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { LoginSchema } from '@monorepo/schemas';

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
      return { token: email + password };
    }
  );
};

export default login;
