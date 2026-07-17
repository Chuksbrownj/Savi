/**
 * IOtpSender — interface for sending OTP codes and messages.
 * Concrete implementations: ConsolOtpSender (dev/test), BrevOtpSender (prod), etc.
 */
export interface IOtpSender {
  send(to: string, message: string): Promise<void>;
}

export const OTP_SENDER = Symbol('IOtpSender');
