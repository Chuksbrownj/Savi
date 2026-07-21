export interface IPushSender {
  sendPush(token: string, title: string, body: string, data?: Record<string, string>): Promise<void>;
  sendMulticast(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<void>;
}

export const PUSH_SENDER = Symbol('IPushSender');
