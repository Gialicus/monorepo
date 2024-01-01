import * as workflow from '@temporalio/workflow';
import { subscriptionActivityFactory } from './activities';

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

//Keep it in sync with interface and don't import from external sources
type SubscriptionInput = {
  user_id: string;
  email: string;
};
//Keep it in sync with interface and don't import from external sources
type SubscriptionOption = {
  isNew: boolean;
  isPayed: boolean;
  isAuto: boolean;
};
//Keep it in sync with interface and don't import from external sources
type SubscriptionOutput = {
  status: string;
};
//Keep it in sync with interface and don't import from external sources
const cancelSignal = workflow.defineSignal('cancelSignal');
//Keep it in sync with interface and don't import from external sources
const payedSignal = workflow.defineSignal('payedSignal');
//Keep it in sync with interface and don't import from external sources
const autoSignal = workflow.defineSignal('autoSignal');

export async function subscriptionWorkflow(
  input: SubscriptionInput,
  options: SubscriptionOption = { isNew: true, isPayed: false, isAuto: false }
): Promise<SubscriptionOutput> {
  let isCanceled = false;
  workflow.setHandler(payedSignal, async () => {
    options.isPayed = true;
    await sendSubscriptionRenewalMail(subscription.email);
  });
  workflow.setHandler(autoSignal, async () => {
    options.isAuto = true;
    await sendAutopaymentMail(subscription.email);
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
    //azzero il pagamento e aspetto un periodo
    options.isPayed = false;
    await workflow.sleep(subscription.billingPeriod);
    if (options.isAuto) {
      //se automatico setto isPayed a true
      options.isPayed = true;
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
