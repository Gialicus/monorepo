import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import {
  APPOINTMENT_QUEUE,
  appointmentWorkflow,
  confirmSignal,
  outcomeSignal,
  rejectSignal,
} from '@monorepo/interfaces';
import { AppointmentSchema, IdSchema } from '@monorepo/schemas';
import { Duration } from '@temporalio/common';
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
  app.post(
    '/',
    {
      schema: {
        body: AppointmentSchema,
      },
    },
    async function (request) {
      const { id } = request.user as Record<string, string>;
      const handle = await app.temporal.workflow.start(
        appointmentWorkflow ?? 'appointmentWorkflow',
        {
          taskQueue: APPOINTMENT_QUEUE,
          args: [
            {
              user_id: request.body.user_id,
              start: new Date(request.body.start),
              duration: request.body.duration as Duration,
              participants: request.body.participants,
            },
            { isNew: true },
          ],
          workflowId: `appointment:${request.body.start}:${id}`,
        }
      );
      return { workflow: handle.workflowId };
    }
  );
  app.get(
    '/confirm/:id',
    {
      schema: {
        params: IdSchema,
      },
    },
    async function (request) {
      const wfId = request.params.id;
      const index = wfId.lastIndexOf(':');
      const userId = wfId.slice(index);
      console.log('USER ID', userId);
      const handle = app.temporal.workflow.getHandle(wfId);
      await handle.signal(confirmSignal, { id: userId });
      return { workflow: handle.workflowId };
    }
  );
  app.get(
    '/reject/:id',
    {
      schema: {
        params: IdSchema,
      },
    },
    async function (request) {
      const wfId = request.params.id;
      const index = wfId.lastIndexOf(':');
      const userId = wfId.slice(index);
      console.log('USER ID', userId);
      const handle = app.temporal.workflow.getHandle(wfId);
      await handle.signal(rejectSignal, { id: userId });
      return { workflow: handle.workflowId };
    }
  );
  app.get(
    '/outcome/:id',
    {
      schema: {
        params: IdSchema,
      },
    },
    async function (request) {
      const wfId = request.params.id;
      const handle = app.temporal.workflow.getHandle(wfId);
      await handle.signal(outcomeSignal);
      return { workflow: handle.workflowId };
    }
  );
}
