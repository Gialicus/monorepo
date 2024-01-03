import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import {
  PAYMENT_QUEUE,
  SUBSCRIPTION_QUEUE,
  cancelSignal,
  payedSignal,
  paymentWorkflow,
  subscriptionWorkflow,
} from '@monorepo/interfaces';
import { IsAutoSchema } from '@monorepo/schemas';
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
        workflowId: 'subscription:' + id,
      }
    );
    return { workflow: handle.workflowId };
  });
  app.post(
    '/pay',
    {
      schema: {
        body: IsAutoSchema,
      },
    },
    async function (request) {
      const { id, email } = request.user as Record<string, string>;
      const handle = app.temporal.workflow.getHandle('subscription:' + id);
      const payedHandle = await app.temporal.workflow.start(
        paymentWorkflow ?? 'paymentWorkflow',
        {
          taskQueue: PAYMENT_QUEUE,
          args: [
            {
              user_id: id,
              email: email,
              target: 'pacchetto promo 1',
              amount: 1500,
            },
            {
              isNew: true,
            },
          ],
          workflowId: 'payment:' + id,
        }
      );
      const paymentResult = await payedHandle.result();
      if (paymentResult.status === 'fail') {
        throw fastify.httpErrors.insufficientStorage('Pagamento fallito');
      }
      await handle.signal(payedSignal, { isAuto: request.body.isAuto });
      return { workflow: handle.workflowId };
    }
  );
  app.post('/cancel', async function (request) {
    const { id } = request.user as Record<string, string>;
    const handle = app.temporal.workflow.getHandle(id);
    await handle.signal(cancelSignal);
    return { workflow: handle.workflowId };
  });
}
