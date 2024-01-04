import * as workflow from '@temporalio/workflow';
import type { appointmentActivityFactory } from './activities';
import {
  AppointmentInput,
  AppointmentOutput,
  outcomeSignal,
} from './generated/appointment';
import ms from 'ms';

const {
  createAppointment,
  sendMailToCreator,
  sendMailToParticipant,
  sendReminder,
  sendOutcomeReminder,
} = workflow.proxyActivities<ReturnType<typeof appointmentActivityFactory>>({
  startToCloseTimeout: '1 minute',
});

export async function appointmentWorkflow(
  input: AppointmentInput
): Promise<AppointmentOutput> {
  const appointment = await createAppointment(input);
  await sendMailToCreator(appointment.user_id);
  const mails = appointment.participants.map((p) =>
    sendMailToParticipant(p, appointment.start)
  );
  await Promise.all(mails);
  const reminderTime =
    appointment.start.getTime() - new Date().getTime() - ms('1 minute');
  await workflow.sleep(reminderTime);
  const reminders = appointment.participants.map((p) =>
    sendReminder(p, appointment.start)
  );
  await Promise.all(reminders);
  const outcome = new workflow.Trigger<boolean>();
  workflow.setHandler(outcomeSignal, () => outcome.resolve(true));
  let isConfirmed: boolean | void = false;
  while (!isConfirmed) {
    isConfirmed = await Promise.race([outcome, workflow.sleep('2 minutes')]);
    if (!isConfirmed) {
      sendOutcomeReminder(appointment.user_id, appointment.start);
    }
  }
  return { status: 'done' };
}
