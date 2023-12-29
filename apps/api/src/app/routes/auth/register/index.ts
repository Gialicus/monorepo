import { FastifyPluginAsync } from 'fastify';
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { IdSchema, LoginSchema } from '@monorepo/schemas';

const register: FastifyPluginAsync = async (fastify): Promise<void> => {
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
      return { email, password };
    }
  );
  app.get(
    '/activate/:id',
    {
      schema: {
        params: IdSchema,
      },
    },
    async function (request) {
      const { id } = request.params;
      return id;
    }
  );
};

export default register;
