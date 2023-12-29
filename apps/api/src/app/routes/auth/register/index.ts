import { FastifyPluginAsync } from 'fastify';
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { IdSchema, LoginSchema } from '@monorepo/schemas';
import { REGISTER_USER_QUEUE, registerUser } from '@monorepo/interfaces';
import { uuid4 } from '@temporalio/workflow';

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
      const handle = await app.temporal.workflow.start(
        registerUser ?? 'registerUser',
        {
          taskQueue: REGISTER_USER_QUEUE,
          args: [
            {
              email: email,
              password: password,
            },
          ],
          workflowId: uuid4(),
        }
      );
      return { workflow: handle.workflowId };
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
