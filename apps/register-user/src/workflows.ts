import * as workflow from '@temporalio/workflow';
import type { registerUserActivityFactory } from './activities';
import {
  RegisterUserInput,
  RegisterUserOutput,
  activateUserSignal,
  isActiveUserQuery,
} from './generated/register-user';

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

export async function registerUserWorkflow(
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
  if (await workflow.condition(() => isActive, '3 minutes')) {
    await activateUser(user._id.toString());
  } else {
    await deactivateUser(user._id.toString());
  }
  return { status: 'done' };
}
