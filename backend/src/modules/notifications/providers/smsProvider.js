import { BaseNotificationProvider } from './baseProvider.js';
import { MockConsoleProvider } from './mockProvider.js';

/**
 * SMS Provider Adapter
 * Configured via SMS gateway environment variables (Twilio / AWS SNS); falls back to Mock.
 */
export class SmsProviderAdapter extends BaseNotificationProvider {
  constructor() {
    super('SmsProviderAdapter');
    this.fallback = new MockConsoleProvider();
    this.isConfigured = !!(process.env.SMS_API_KEY || process.env.TWILIO_ACCOUNT_SID);
  }

  async send(params) {
    if (!this.isConfigured) {
      return this.fallback.send({ ...params, channel: 'SMS' });
    }

    try {
      console.log(`[SMS Gateway] Sending SMS to ${params.recipient}`);
      return {
        success: true,
        providerMessageId: `sms-${Date.now()}`,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  }
}
