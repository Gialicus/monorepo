/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  createWithTimestamp,
  deleteById,
  findById,
  updateWithTimestamp,
} from '@monorepo/database';
import {
  DuplicateNotAllowed,
  MONGO_COLLECTIONS,
  NotFoundError,
} from '@monorepo/interfaces';
import { MongoClient, ObjectId } from 'mongodb';
import { createHash } from 'node:crypto';
import { SendMailOptions, Transporter } from 'nodemailer';

export function registerUserActivityFactory(
  client: MongoClient,
  transporter: Transporter
) {
  return {
    checkUserNotExists: async (email: string) => {
      const user = await client
        .db()
        .collection(MONGO_COLLECTIONS.USERS)
        .findOne({ email });
      if (user) throw new DuplicateNotAllowed(`${email} already taken`);
    },
    hashPassword: async (password: string, salt: string) => {
      const hash = createHash('sha256');
      hash.update(password + salt);
      const hashedPassword = hash.digest('hex');
      return hashedPassword;
    },
    createUser: async (email: string, hashedPassword: string) => {
      const user = {
        email: email,
        password: hashedPassword,
      };
      const insertedResult = await createWithTimestamp<typeof user>(
        client.db().collection(MONGO_COLLECTIONS.USERS)
      )(user);
      return insertedResult;
    },
    sendActivationEmail: async (email: string, wfId: string) => {
      const mailOptions: SendMailOptions = {
        from: 'noreply@platform.com',
        to: email,
        subject: 'Attiva il tuo account',
        html: `Completa la tua registrazione cliccando al seguente link: <a href="http://localhost:3000/auth/register/activate/${wfId}">Attiva</a>`,
      };
      await transporter.sendMail(mailOptions);
    },
    activateUser: async (id: string) => {
      const col = client.db().collection(MONGO_COLLECTIONS.USERS);
      const document = await findById(col)(id);
      if (!document) throw new NotFoundError('User not found');
      const activatedAt = new Date();
      return updateWithTimestamp(col)(id, { activatedAt });
    },
    deactivateUser: async (id: string) => {
      await deleteById(client.db().collection(MONGO_COLLECTIONS.USERS))(id);
    },
  };
}
