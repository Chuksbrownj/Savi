export interface IEmailSender {
  sendEmail(to: string, subject: string, html: string): Promise<void>;
}

export const EMAIL_SENDER = Symbol('IEmailSender');
