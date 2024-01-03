import { createWithTimestamp, deleteById, findById } from '@monorepo/database';
import {
  MONGO_COLLECTIONS,
  PaymentFailError,
  PaymentInput,
} from '@monorepo/interfaces';
import { MongoClient, ObjectId } from 'mongodb';
import { SendMailOptions, Transporter } from 'nodemailer';

export function paymentActivityFactory(
  client: MongoClient,
  transporter: Transporter
) {
  return {
    createPaymentOrder: async (payment: PaymentInput) => {
      const insertedResult = await createWithTimestamp<typeof payment>(
        client.db().collection(MONGO_COLLECTIONS.PAYMENTS)
      )(payment);
      return insertedResult;
    },
    deleteOrderIfExists: async (id: string | ObjectId) => {
      const col = client.db().collection(MONGO_COLLECTIONS.PAYMENTS);
      const order = await findById(col)(id);
      if (!order) {
        return false;
      }
      await deleteById(col)(id);
      return true;
    },
    payOrder: async (id: string | ObjectId) => {
      if (Math.random() > 0.3) {
        throw new PaymentFailError('Pagamento fallito, id: ' + id);
      }
      console.log('Pagamento Riuscito');
    },
    paymentSuccessMail: async (email: string) => {
      const mailOptions: SendMailOptions = {
        from: 'noreply@platform.com',
        to: email,
        subject: 'Pagamento avvenuto con successo',
        html: `Il tuo pagamento è andato a buon fine`,
      };
      await transporter.sendMail(mailOptions);
    },
  };
}
