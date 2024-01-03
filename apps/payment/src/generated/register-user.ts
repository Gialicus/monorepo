import * as workflow from '@temporalio/workflow';

export type RegisterUserInput = {
  email: string;
  password: string;
};

export type RegisterUserOutput = {
  status: string;
};

export declare function registerUserWorkflow(
  input: RegisterUserInput
): Promise<RegisterUserOutput>;

export const REGISTER_USER_QUEUE = 'register-user';

export const activateUserSignal = workflow.defineSignal('activateUserSignal');
export const isActiveUserQuery = workflow.defineQuery('isActiveUserQuery');
