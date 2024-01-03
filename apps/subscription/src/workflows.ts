import * as workflow from '@temporalio/workflow';
import { subscriptionActivityFactory } from './activities';
import {
  SubscriptionInput,
  SubscriptionOptions,
  SubscriptionOutput,
  cancelSignal,
  payedSignal,
} from './interface';

const {
  createSubscriptionPeriod,
  sendWelcomeMail,
  sendSubscriptionCancellationMail,
  sendSubscriptionRenewalMail,
  sendAutopaymentMail,
} = workflow.proxyActivities<ReturnType<typeof subscriptionActivityFactory>>({
  startToCloseTimeout: '1 minute',
  retry: {
    nonRetryableErrorTypes: ['DuplicateNotAllowed'],
  },
});

export async function subscriptionWorkflow(
  input: SubscriptionInput,
  options: SubscriptionOptions = { isNew: true, isPayed: false, isAuto: false }
): Promise<SubscriptionOutput> {
  let isCanceled = false;
  workflow.setHandler(payedSignal, async ({ isAuto }) => {
    options.isPayed = true;
    if (isAuto) {
      options.isAuto = isAuto;
      await sendAutopaymentMail(subscription.email);
    }
  });
  workflow.setHandler(cancelSignal, async () => {
    isCanceled = true;
    await sendSubscriptionCancellationMail(subscription.email);
  });
  const subscription = await createSubscriptionPeriod(input.user_id);
  if (options.isNew) {
    workflow.log.info('trial created');
    await sendWelcomeMail(input.email);
    workflow.log.info('wait for trial period');
    await workflow.sleep(subscription.trialPeriod);
    if (isCanceled) {
      workflow.log.info('trial cancelled');
      return { status: 'done' };
    }
  }
  workflow.log.info('start billing cicle');
  while (options.isPayed) {
    await sendSubscriptionRenewalMail(subscription.email);
    //azzero il pagamento e aspetto un periodo
    options.isPayed = false;
    await workflow.sleep(subscription.billingPeriod);
    if (options.isAuto) {
      const handle = await workflow.startChild('paymentWorkflow', {
        taskQueue: 'payment',
        args: [
          {
            user_id: input.user_id,
            email: input.email,
            target: 'sottoscrizione',
            amount: 15,
          },
          {
            isNew: true,
          },
        ],
        workflowId: 'payment:' + input.user_id,
      });
      const payResult = await handle.result();
      options.isPayed = payResult.status === 'done' ? true : false;
    }
    // se cancellato o non pagato esco
    workflow.log.info(
      'payed status: ' + options.isPayed + ' ' + options.isAuto
    );
    if (isCanceled || !options.isPayed) break;
    await workflow.continueAsNew<typeof subscriptionWorkflow>(input, {
      isNew: false,
      isPayed: true,
      isAuto: options.isAuto,
    });
  }
  workflow.log.info('end billing cicle');
  return { status: 'done' };
}
