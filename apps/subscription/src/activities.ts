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
    startTrialPeriod: async (id: string | ObjectId) => {
      const user = await findById(
        client.db().collection(MONGO_COLLECTIONS.USERS)
      )(id);
      if (!user) throw new NotFoundError('User not found');
      const payload: SubscriptionPeriod = {
        user_id: user._id,
        email: user.email,
        status: 'active',
        trialPeriod: '5 minutes',
        billingPeriod: '10 minutes',
        credit: 0,
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
  };
}
