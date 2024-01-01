import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import {
  SUBSCRIPTION_QUEUE,
  payedSignal,
  subscriptionWorkflow,
} from '@monorepo/interfaces';
import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<JsonSchemaToTsProvider>();
  app.addHook('onRequest', async (req) => {
    try {
      await req.jwtVerify();
    } catch (error) {
      throw app.httpErrors.unauthorized;
    }
  });
  app.post('/trial', async function (request) {
    const { id, email } = request.user as Record<string, string>;
    const handle = await app.temporal.workflow.start(
      subscriptionWorkflow ?? 'subscriptionWorkflow',
      {
        taskQueue: SUBSCRIPTION_QUEUE,
        args: [
          {
            user_id: id,
            email: email,
          },
        ],
        workflowId: id,
      }
    );
    return { workflow: handle.workflowId };
  });
  app.post('/pay', async function (request) {
    const { id } = request.user as Record<string, string>;
    const handle = app.temporal.workflow.getHandle(id);
    await handle.signal(payedSignal);
    return { workflow: handle.workflowId };
  });
}
