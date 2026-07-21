export interface ISmsSender {
  sendSms(to: string, message: string): Promise<void>;
}

export const SMS_SENDER = Symbol('ISmsSender');
