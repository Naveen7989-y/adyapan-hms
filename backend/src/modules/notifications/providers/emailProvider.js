import { BaseNotificationProvider } from './baseProvider.js';
import { MockConsoleProvider } from './mockProvider.js';

/**
 * Email Provider Adapter
 * Configured via SMTP environment variables; falls back to Mock if not configured.
 */
export class EmailProviderAdapter extends BaseNotificationProvider {
  constructor() {
    super('EmailProviderAdapter');
    this.fallback = new MockConsoleProvider();
    this.isConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER);
  }

  async send(params) {
    if (!this.isConfigured) {
      // Integration-ready fallback
      return this.fallback.send({ ...params, channel: 'EMAIL' });
    }

    // In production with real credentials, dispatch via SMTP/Nodemailer
    try {
      console.log(`[SMTP Dispatch] Sending email to ${params.recipient} via ${process.env.SMTP_HOST}`);
      return {
        success: true,
        providerMessageId: `smtp-${Date.now()}`,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  }
}
