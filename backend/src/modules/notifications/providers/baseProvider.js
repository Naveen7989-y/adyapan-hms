/**
 * Base Notification Provider Interface
 */
export class BaseNotificationProvider {
  constructor(name) {
    this.name = name;
  }

  /**
   * Dispatches a notification to recipient
   * @param {Object} params - { recipient, channel, eventType, title, message }
   * @returns {Promise<{ success: boolean, providerMessageId?: string, error?: string }>}
   */
  async send(params) {
    throw new Error('Method send() must be implemented by provider adapter');
  }
}
