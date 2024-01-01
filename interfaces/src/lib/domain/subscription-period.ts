import { Duration } from '@temporalio/common';
import { ObjectId } from 'mongodb';

export type SubscriptionPeriod = {
  user_id: ObjectId;
  email: string;
  trialPeriod: Duration;
  billingPeriod: Duration;
};
