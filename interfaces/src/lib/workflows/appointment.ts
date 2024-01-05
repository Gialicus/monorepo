import { Duration } from '@temporalio/common';
import { defineSignal } from '@temporalio/workflow';

export type AppointmentInput = {
  user_id: string;
  participants: string[];
  start: Date;
  duration: Duration;
};

export type AppointmentOptions = {
  isNew: boolean;
};

export type AppointmentOutput = {
  status: 'done' | 'fail';
};

export const APPOINTMENT_QUEUE = 'appointment';

export type ConfirmSignalInput = {
  id: string;
};

export const confirmSignal =
  defineSignal<[ConfirmSignalInput]>('confirmSignal');
export const rejectSignal = defineSignal<[ConfirmSignalInput]>('rejectSignal');
export const outcomeSignal = defineSignal('outcomeSignal');

export declare function appointmentWorkflow(
  input: AppointmentInput,
  options: AppointmentOptions
): Promise<AppointmentOutput>;
