import * as workflow from '@temporalio/workflow';
import { subscriptionActivityFactory } from './activities';
import { SubscriptionPeriod } from '@monorepo/interfaces';

const {
  startTrialPeriod,
  sendWelcomeMail,
  sendSubscriptionCancellationMail,
  sendSubscriptionRenewalMail,
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
type SubscriptionOutput = {
  status: string;
};
//Keep it in sync with interface and don't import from external sources
const cancelSignal = workflow.defineSignal('cancelSignal');
//Keep it in sync with interface and don't import from external sources
const payedSignal = workflow.defineSignal('payedSignal');

async function billingCycle(subcription: SubscriptionPeriod) {
  let isCanceled = false;
  let isPayed = false;
  workflow.setHandler(cancelSignal, () => void (isCanceled = true));
  workflow.setHandler(payedSignal, () => void (isPayed = true));
  workflow.log.info('start billing cicle ' + isPayed);
  await workflow.sleep(subcription.extraPeriod);
  while (isPayed) {
    //azzero il pagamento e aspetto un periodo
    isPayed = false;
    await workflow.sleep(subcription.billingPeriod);
    // se cancellato o non pagato esco altrimenti invio mail di rinnovo
    if (isCanceled || !isPayed) break;
    await sendSubscriptionRenewalMail(subcription.email);
  }
  workflow.log.info('end billing cicle ' + isPayed);
  await sendSubscriptionCancellationMail(subcription.email);
}

export async function subscriptionWorkflow(
  input: SubscriptionInput
): Promise<SubscriptionOutput> {
  const trial = await startTrialPeriod(input.user_id);
  workflow.log.info('trial created');
  await sendWelcomeMail(input.email);
  workflow.log.info('welcome email was sended');
  let trialCanceled = false;
  workflow.setHandler(cancelSignal, () => {
    trialCanceled = true;
  });
  await workflow.sleep(trial.trialPeriod);
  if (trialCanceled) {
    await sendSubscriptionCancellationMail(input.email);
    workflow.log.info('trial was ended or cancelled');
    return { status: 'done' };
  } else {
    await billingCycle(trial);
  }
  return { status: 'done' };
}
