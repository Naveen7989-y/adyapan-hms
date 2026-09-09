import { MockConsoleProvider } from './mockProvider.js';
import { EmailProviderAdapter } from './emailProvider.js';
import { SmsProviderAdapter } from './smsProvider.js';
import { WhatsAppProviderAdapter } from './whatsappProvider.js';

const emailProvider = new EmailProviderAdapter();
const smsProvider = new SmsProviderAdapter();
const whatsAppProvider = new WhatsAppProviderAdapter();
const mockProvider = new MockConsoleProvider();

/**
 * Resolve provider adapter based on channel
 */
export const getNotificationProvider = (channel) => {
  switch (channel?.toUpperCase()) {
    case 'EMAIL':
      return emailProvider;
    case 'SMS':
      return smsProvider;
    case 'WHATSAPP':
      return whatsAppProvider;
    default:
      return mockProvider;
  }
};
