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

async function billingCycle(customer: SubscriptionPeriod) {
  let isCanceled = false;
  let isPayed = false;
  workflow.setHandler(cancelSignal, () => void (isCanceled = true));
  workflow.setHandler(payedSignal, () => void (isPayed = true));
  while (await workflow.condition(() => isCanceled, customer.billingPeriod)) {
    if (await workflow.condition(() => isPayed, customer.extraPeriod)) {
      await sendSubscriptionRenewalMail(customer.email);
    } else {
      await sendSubscriptionCancellationMail(customer.email);
    }
  }
}

export async function subscriptionWorkflow(
  input: SubscriptionInput
): Promise<SubscriptionOutput> {
  const trial = await startTrialPeriod(input.user_id);
  await sendWelcomeMail(input.email);
  let trialCanceled = false;
  workflow.setHandler(cancelSignal, () => {
    trialCanceled = true;
  });
  if (await workflow.condition(() => trialCanceled, trial.trialPeriod)) {
    await sendSubscriptionCancellationMail(input.email);
  } else {
    await billingCycle(trial);
  }

  return { status: 'done' };
}
