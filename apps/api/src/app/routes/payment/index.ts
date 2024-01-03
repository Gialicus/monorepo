import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { PAYMENT_QUEUE, paymentWorkflow } from '@monorepo/interfaces';
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
  app.post('/', async function (request) {
    const { id, email } = request.user as Record<string, string>;
    const handle = await app.temporal.workflow.start(
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
    return await handle.result();
  });
}
