import * as workflow from '@temporalio/workflow';
// Only import the activity types
import type { registerUserActivityFactory } from './activities';

const {
  checkUserNotExists,
  hashPassword,
  createUser,
  sendActivationEmail,
  activateUser,
  deactivateUser,
} = workflow.proxyActivities<ReturnType<typeof registerUserActivityFactory>>({
  startToCloseTimeout: '1 minute',
  retry: {
    nonRetryableErrorTypes: [],
  },
});

type RegisterUserInput = {
  email: string;
  password: string;
};

type RegisterUserOutput = {
  status: string;
};

export const activateUserSignal = workflow.defineSignal('activateUserSignal');
export const isActiveUserQuery = workflow.defineQuery('isActiveUserQuery');

export async function registerUser(
  input: RegisterUserInput
): Promise<RegisterUserOutput> {
  await checkUserNotExists(input.email);
  const password = await hashPassword(input.password, 'super_secret');
  await createUser(input.email, password);
  await sendActivationEmail(input.email, workflow.workflowInfo().workflowId);
  let isActive = false;
  workflow.setHandler(activateUserSignal, () => {
    isActive = true;
  });
  workflow.setHandler(isActiveUserQuery, () => isActive);
  if (await workflow.condition(() => isActive, 1000 * 60 * 3)) {
    await activateUser('');
  } else {
    await deactivateUser('');
  }
  return { status: 'done' };
}
