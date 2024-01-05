import { createWithTimestamp, findById } from '@monorepo/database';
import { AppointmentInput, MONGO_COLLECTIONS } from '@monorepo/interfaces';
import { MongoClient, ObjectId } from 'mongodb';
import { SendMailOptions, Transporter } from 'nodemailer';

export function appointmentActivityFactory(
  client: MongoClient,
  transporter: Transporter
) {
  return {
    createAppointment: async (event: AppointmentInput) => {
      const insertedResult = await createWithTimestamp<typeof event>(
        client.db().collection(MONGO_COLLECTIONS.APPOINTMENTS)
      )(event);
      return insertedResult;
    },
    sendMailToCreator: async (id: string | ObjectId) => {
      const user = await findById(
        client.db().collection(MONGO_COLLECTIONS.USERS)
      )(id);
      const mailOptions: SendMailOptions = {
        from: 'noreply@platform.com',
        to: user.email,
        subject: 'Il tuo appuntamento è stato creato con successo',
        html: `Il tuo appuntamento è stato creato con successo`,
      };
      await transporter.sendMail(mailOptions);
    },
    sendMailToParticipant: async (
      id: string | ObjectId,
      date: Date,
      workflowId: string
    ) => {
      const user = await findById(
        client.db().collection(MONGO_COLLECTIONS.USERS)
      )(id);
      const mailOptions: SendMailOptions = {
        from: 'noreply@platform.com',
        to: user.email,
        subject: 'appuntamento per il ' + date,
        html: `Appuntamento fissato per il ${date}.
        conferma la tua patecipazione:
        <a href="http://localhost:3000/appointment/confirm/${workflowId}/${user._id.toString()}">Conferma</a>
        <a href="http://localhost:3000/appointment/reject/${workflowId}/${user._id.toString()}">Rifiuta</a>`,
      };
      await transporter.sendMail(mailOptions);
    },
    sendReminder: async (
      id: string | ObjectId,
      date: Date,
      workflowId: string
    ) => {
      const user = await findById(
        client.db().collection(MONGO_COLLECTIONS.USERS)
      )(id);
      const mailOptions: SendMailOptions = {
        from: 'noreply@platform.com',
        to: user.email,
        subject: "ti ricordiamo l'appuntamento per il " + date,
        html: `Ti ricordiamo l'appuntamento fissato per il ${date}.
        conferma la tua patecipazione:
        <a href="http://localhost:3000/appointment/confirm/${workflowId}/${user._id.toString()}">Conferma</a>
        <a href="http://localhost:3000/appointment/reject/${workflowId}/${user._id.toString()}">Rifiuta</a>`,
      };
      await transporter.sendMail(mailOptions);
    },
    sendOutcomeReminder: async (
      id: string | ObjectId,
      date: Date,
      workflowId: string
    ) => {
      const user = await findById(
        client.db().collection(MONGO_COLLECTIONS.USERS)
      )(id);
      const mailOptions: SendMailOptions = {
        from: 'noreply@platform.com',
        to: user.email,
        subject: "Conferma l'esito per l'appuntamento per il " + date,
        html: `Conferma l'esito per l'appuntamento fissato per il ${date}.
        <a href="http://localhost:3000/appointment/outcome/${workflowId}">Eseguito</a>`,
      };
      await transporter.sendMail(mailOptions);
    },
  };
}
