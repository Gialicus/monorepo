/* eslint-disable @typescript-eslint/no-unused-vars */
import { createHash } from 'node:crypto';

export function registerUserActivityFactory() {
  return {
    checkUserNotExists: async (email: string) => {},
    hashPassword: async (password: string, salt: string) => {
      const hash = createHash('sha256');
      hash.update(password + salt);
      const hashedPassword = hash.digest('hex');
      return hashedPassword;
    },
    createUser: async (email: string, hashedPassword: string) => {},
    sendActivationEmail: async (email: string, wfId: string) => {},
    activateUser: async (id: string) => {},
    deactivateUser: async (id: string) => {},
  };
}
