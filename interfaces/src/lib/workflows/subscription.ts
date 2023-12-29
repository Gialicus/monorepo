import { defineSignal } from '@temporalio/workflow';
export type SubscriptionInput = {
  user_id: string;
  email: string;
};
export type SubscriptionOutput = {
  status: string;
};
export const cancelSignal = defineSignal('cancelSignal');
export const payedSignal = defineSignal('payedSignal');

export declare function subscriptionWorkflow(
  input: SubscriptionInput
): Promise<SubscriptionOutput>;
