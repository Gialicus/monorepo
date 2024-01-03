export type PaymentInput = {
  user_id: string;
  email: string;
  target: string;
  amount: number;
};

export type PaymentOptions = {
  isNew: boolean;
};

export type PaymentOutput = {
  status: 'done' | 'fail';
};

export class PaymentFailError extends Error {}

export const PAYMENT_QUEUE = 'payment';

export declare function paymentWorkflow(
  input: PaymentInput,
  options: PaymentOptions
): Promise<PaymentOutput>;
