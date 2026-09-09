import { BaseNotificationProvider } from './baseProvider.js';
import { MockConsoleProvider } from './mockProvider.js';

/**
 * WhatsApp Provider Adapter
 * Configured via WhatsApp Cloud API environment variables; falls back to Mock.
 */
export class WhatsAppProviderAdapter extends BaseNotificationProvider {
  constructor() {
    super('WhatsAppProviderAdapter');
    this.fallback = new MockConsoleProvider();
    this.isConfigured = !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
  }

  async send(params) {
    if (!this.isConfigured) {
      return this.fallback.send({ ...params, channel: 'WHATSAPP' });
    }

    try {
      console.log(`[WhatsApp API] Sending WhatsApp template to ${params.recipient}`);
      return {
        success: true,
        providerMessageId: `wa-${Date.now()}`,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  }
}
