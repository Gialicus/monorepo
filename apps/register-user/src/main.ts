import { NativeConnection, Worker } from '@temporalio/worker';
import { registerUserActivityFactory } from './activities';
import { MongoClient } from 'mongodb';
import { createTransport } from 'nodemailer';
import { REGISTER_USER_QUEUE } from '@monorepo/interfaces';
import { config } from 'dotenv';
config();
async function run() {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_SERVER_ADDRESS,
  });
  const client = new MongoClient(process.env.MONGO_URI);
  const transport = createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  const worker = await Worker.create({
    connection,
    namespace: 'default',
    taskQueue: REGISTER_USER_QUEUE,
    workflowsPath: require.resolve('./workflows'),
    activities: registerUserActivityFactory(client, transport),
  });
  await worker.run();
}

run().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
