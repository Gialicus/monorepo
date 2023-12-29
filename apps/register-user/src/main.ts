import { NativeConnection, Worker } from '@temporalio/worker';
import { registerUserActivityFactory } from './activities';

async function run() {
  const connection = await NativeConnection.connect({
    address: 'localhost:7233',
  });
  const worker = await Worker.create({
    connection,
    namespace: 'default',
    taskQueue: 'register-user',
    workflowsPath: require.resolve('./workflows'),
    activities: registerUserActivityFactory(),
  });
  await worker.run();
}

run().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
