import { defineSignal } from '@temporalio/workflow';
export type SubscriptionInput = {
  user_id: string;
  email: string;
};
export type SubscriptionOptions = {
  isNew: boolean;
  isPayed: boolean;
  isAuto: boolean;
};
export type SubscriptionOutput = {
  status: string;
};

export const SUBSCRIPTION_QUEUE = 'subscription';

export const cancelSignal = defineSignal('cancelSignal');
export const payedSignal = defineSignal('payedSignal');
export const autoSignal = defineSignal('autoSignal');

export declare function subscriptionWorkflow(
  input: SubscriptionInput,
  options: SubscriptionOptions
): Promise<SubscriptionOutput>;
