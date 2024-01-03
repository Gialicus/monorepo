import * as workflow from '@temporalio/workflow';
import type { paymentActivityFactory } from './activities';
import { PaymentInput, PaymentOutput } from './interface';

const { createPaymentOrder, deleteOrderIfExists, paymentSuccessMail } =
  workflow.proxyActivities<ReturnType<typeof paymentActivityFactory>>({
    startToCloseTimeout: '1 minute',
  });
const { payOrder } = workflow.proxyActivities<
  ReturnType<typeof paymentActivityFactory>
>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3,
  },
});

export async function paymentWorkflow(
  input: PaymentInput
): Promise<PaymentOutput> {
  const order = await createPaymentOrder(input);
  workflow.log.info('Order created with id: ' + order._id.toString());
  try {
    await payOrder(order._id);
  } catch (error) {
    if (error?.cause?.type === 'PaymentFailError') {
      workflow.log.info('PaymentFailError was catched start recounciliation');
      await deleteOrderIfExists(order._id);
    }
  }
  await paymentSuccessMail(order.email);
  return { status: 'done' };
}
