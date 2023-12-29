import { Duration } from '@temporalio/common';
import { ObjectId } from 'mongodb';

export type SubscriptionPeriod = {
  user_id: ObjectId;
  email: string;
  status: 'active' | 'inactive';
  trialPeriod: Duration;
  billingPeriod: Duration;
  credit: number;
};
