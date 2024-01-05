import * as workflow from '@temporalio/workflow';
import type { appointmentActivityFactory } from './activities';
import {
  AppointmentInput,
  AppointmentOutput,
  confirmSignal,
  outcomeSignal,
  rejectSignal,
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

const REMINDER_DELAY = '1 minute';
const OUTCOME_DELAY = '2 minutes';

export async function appointmentWorkflow(
  input: AppointmentInput
): Promise<AppointmentOutput> {
  const appointment = await createAppointment(input);
  await sendMailToCreator(appointment.user_id);
  const mails = appointment.participants.map((p) =>
    sendMailToParticipant(
      p,
      appointment.start,
      workflow.workflowInfo().workflowId
    )
  );
  await Promise.all(mails);
  const usersMap = new Map(appointment.participants.map((u) => [u, 0]));
  workflow.setHandler(confirmSignal, (confirm) => {
    if (usersMap.has(confirm.id)) {
      usersMap.set(confirm.id, 1);
    }
  });
  workflow.setHandler(rejectSignal, (confirm) => {
    if (usersMap.has(confirm.id)) {
      usersMap.set(confirm.id, -1);
    }
  });
  const start = new Date(appointment.start);
  const reminderTime =
    start.getTime() - new Date().getTime() - ms(REMINDER_DELAY);
  await workflow.sleep(reminderTime);
  const reminders = Array.from(usersMap)
    .map(([user, confirm]) => {
      if (confirm >= 0) return user;
      return null;
    })
    .filter(Boolean)
    .map((p) =>
      sendReminder(p, appointment.start, workflow.workflowInfo().workflowId)
    );
  await Promise.all(reminders);
  const outcome = new workflow.Trigger<boolean>();
  workflow.setHandler(outcomeSignal, () => outcome.resolve(true));
  let isConfirmed: boolean | void = false;
  await workflow.sleep(ms(REMINDER_DELAY) + ms(appointment.duration));
  while (!isConfirmed) {
    isConfirmed = await Promise.race([outcome, workflow.sleep(OUTCOME_DELAY)]);
    if (!isConfirmed) {
      sendOutcomeReminder(
        appointment.user_id,
        appointment.start,
        workflow.workflowInfo().workflowId
      );
    }
  }
  return { status: 'done' };
}
