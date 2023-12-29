import * as workflow from '@temporalio/workflow';
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
    nonRetryableErrorTypes: ['DuplicateNotAllowed'],
  },
});

//Keep it in sync with interface and don't import from external sources
type RegisterUserInput = {
  email: string;
  password: string;
};
//Keep it in sync with interface and don't import from external sources
type RegisterUserOutput = {
  status: string;
};
//Keep it in sync with interface and don't import from external sources
const activateUserSignal = workflow.defineSignal('activateUserSignal');
//Keep it in sync with interface and don't import from external sources
const isActiveUserQuery = workflow.defineQuery('isActiveUserQuery');

export async function registerUser(
  input: RegisterUserInput
): Promise<RegisterUserOutput> {
  await checkUserNotExists(input.email);
  const password = await hashPassword(input.password);
  const user = await createUser(input.email, password);
  await sendActivationEmail(input.email, workflow.workflowInfo().workflowId);
  let isActive = false;
  workflow.setHandler(activateUserSignal, () => {
    isActive = true;
  });
  workflow.setHandler(isActiveUserQuery, () => isActive);
  if (await workflow.condition(() => isActive, 1000 * 60 * 3)) {
    await activateUser(user._id.toString());
  } else {
    await deactivateUser(user._id.toString());
  }
  return { status: 'done' };
}
