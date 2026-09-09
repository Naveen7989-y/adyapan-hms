import { BaseNotificationProvider } from './baseProvider.js';

/**
 * Mock / Console Notification Provider
 * Used for zero-cost development and local testing.
 */
export class MockConsoleProvider extends BaseNotificationProvider {
  constructor() {
    super('MockConsoleProvider');
  }

  async send({ recipient, channel, eventType, title, message }) {
    console.log(`\n🔔 [NOTIFICATION ADAPTER DISPATCH - ${channel}]`);
    console.log(`│ Event:     ${eventType}`);
    console.log(`│ Recipient: ${recipient}`);
    console.log(`│ Title:     ${title}`);
    console.log(`│ Message:   ${message}`);
    console.log(`└ Status:    Delivered (Simulated)\n`);

    return {
      success: true,
      providerMessageId: `mock-msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
  }
}
