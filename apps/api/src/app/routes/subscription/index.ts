import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import {
  SUBSCRIPTION_QUEUE,
  autoSignal,
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
          { isNew: true, isPayed: false, isAuto: false },
        ],
        workflowId: id,
      }
    );
    return { workflow: handle.workflowId };
  });
  app.post(
    '/pay',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            isAuto: { type: 'boolean' },
          },
          required: ['isAuto'],
        } as const,
      },
    },
    async function (request) {
      const { id } = request.user as Record<string, string>;
      const handle = app.temporal.workflow.getHandle(id);
      await handle.signal(payedSignal);
      if (request.body.isAuto) {
        await handle.signal(autoSignal);
      }
      return { workflow: handle.workflowId };
    }
  );
}
