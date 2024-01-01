import { createWithTimestamp, findById } from '@monorepo/database';
import {
  MONGO_COLLECTIONS,
  NotFoundError,
  SubscriptionPeriod,
} from '@monorepo/interfaces';
import { MongoClient, ObjectId } from 'mongodb';
import { SendMailOptions, Transporter } from 'nodemailer';

export function subscriptionActivityFactory(
  client: MongoClient,
  transporter: Transporter
) {
  return {
    createSubscriptionPeriod: async (id: string | ObjectId) => {
      const user = await findById(
        client.db().collection(MONGO_COLLECTIONS.USERS)
      )(id);
      if (!user) throw new NotFoundError('User not found');
      const payload: SubscriptionPeriod = {
        user_id: user._id,
        email: user.email,
        trialPeriod: '2 minutes',
        billingPeriod: '2 minutes',
      };
      const trial = await createWithTimestamp<typeof payload>(
        client.db().collection(MONGO_COLLECTIONS.SUBSCRIPTIONS)
      )(payload);
      return trial;
    },
    sendWelcomeMail: async (email: string) => {
      const mailOptions: SendMailOptions = {
        from: 'noreply@platform.com',
        to: email,
        subject: 'Inizio periodo di prova',
        html: `Benvenuto/a utente il tuo periodo scadrà tra 30 giorni. Goditi i nostri contenuti`,
      };
      await transporter.sendMail(mailOptions);
    },
    sendSubscriptionCancellationMail: async (email: string) => {
      const mailOptions: SendMailOptions = {
        from: 'noreply@platform.com',
        to: email,
        subject: 'Cancellazione sottoscrizione',
        html: `Gentile utente hai cancellato la tua sottoscrizione`,
      };
      await transporter.sendMail(mailOptions);
    },
    sendSubscriptionRenewalMail: async (email: string) => {
      const mailOptions: SendMailOptions = {
        from: 'noreply@platform.com',
        to: email,
        subject: 'Rinnovo sottoscrizione',
        html: `Gentile utente hai rinnovato la tua sottoscrizione`,
      };
      await transporter.sendMail(mailOptions);
    },
    sendAutopaymentMail: async (email: string) => {
      const mailOptions: SendMailOptions = {
        from: 'noreply@platform.com',
        to: email,
        subject: 'Rinnovo sottoscrizione automatica',
        html: `Gentile utente la tua sottoscrizione da ora si rinnoverà automaticamente`,
      };
      await transporter.sendMail(mailOptions);
    },
  };
}
