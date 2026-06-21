import { beforeEach, describe, expect, it } from 'vitest';
import { reportMessage, startConversation } from './messaging.service';
import { providerContacts, reportProvider, revealWhatsApp } from './providers.service';
import { readDb, resetDemoDb, writeDb } from './demo/demo-db';
import { nowIso } from '@/lib/dates';
import { dailyRateLimits } from '@/lib/rate-limits';

describe('providers service contacts', () => {
  beforeEach(() => resetDemoDb());

  it('deduplicates repeated WhatsApp reveals for a customer/provider pair', async () => {
    await revealWhatsApp('customer-nour', 'provider-cleaning');
    await revealWhatsApp('customer-nour', 'provider-cleaning');

    const contacts = await providerContacts('provider-cleaning');
    expect(
      contacts.filter(
        (contact) =>
          contact.customerId === 'customer-nour' &&
          contact.type === 'whatsapp_reveal',
      ),
    ).toHaveLength(1);
  });

  it('deduplicates platform-message contacts while allowing multiple messages', async () => {
    await startConversation('customer-nour', 'provider-demo', 'First message');
    await startConversation('customer-nour', 'provider-demo', 'Second message');

    const contacts = await providerContacts('provider-demo');
    expect(
      contacts.filter(
        (contact) =>
          contact.customerId === 'customer-nour' &&
          contact.type === 'platform_message',
      ),
    ).toHaveLength(1);
  });

  it('rate limits new WhatsApp reveals without blocking repeated reveals', async () => {
    const db = readDb();
    db.contacts = db.contacts.filter((item) => !(item.customerId === 'customer-nour' && item.type === 'whatsapp_reveal'));
    db.contacts.push({
      id: 'existing-reveal',
      customerId: 'customer-nour',
      providerId: 'provider-cleaning',
      type: 'whatsapp_reveal',
      createdAt: nowIso(),
      hasReview: false,
    });
    for (let index = 0; index < dailyRateLimits.whatsappReveals; index += 1) {
      db.contacts.push({
        id: `limit-reveal-${index}`,
        customerId: 'customer-nour',
        providerId: `provider-limit-${index}`,
        type: 'whatsapp_reveal',
        createdAt: nowIso(),
        hasReview: false,
      });
    }
    writeDb(db);

    await expect(revealWhatsApp('customer-nour', 'provider-cleaning')).resolves.toBeTruthy();
    await expect(revealWhatsApp('customer-nour', 'provider-demo')).rejects.toThrow('error.rateLimit.exceeded');
  });

  it('rate limits new conversation starts without blocking existing conversations', async () => {
    const db = readDb();
    db.conversations = db.conversations.filter((item) => item.customerId !== 'customer-nour');
    db.conversations.push({
      id: 'customer-nour_provider-demo',
      participants: ['customer-nour', 'provider-demo'],
      customerId: 'customer-nour',
      providerId: 'provider-demo',
      lastMessage: 'existing',
      lastMessageAt: nowIso(),
      unreadCount: { 'customer-nour': 0, 'provider-demo': 0 },
    });
    for (let index = 0; index < dailyRateLimits.conversationStarts; index += 1) {
      db.conversations.push({
        id: `customer-nour_provider-limit-${index}`,
        participants: ['customer-nour', `provider-limit-${index}`],
        customerId: 'customer-nour',
        providerId: `provider-limit-${index}`,
        lastMessage: 'limit',
        lastMessageAt: nowIso(),
        unreadCount: { 'customer-nour': 0, [`provider-limit-${index}`]: 0 },
      });
    }
    writeDb(db);

    await expect(startConversation('customer-nour', 'provider-demo', 'Existing thread')).resolves.toBeTruthy();
    await expect(startConversation('customer-nour', 'provider-cleaning', 'New thread')).rejects.toThrow('error.rateLimit.exceeded');
  });

  it('rate limits message reports per reporter', async () => {
    const db = readDb();
    db.reports = db.reports.filter((item) => item.reporterId !== 'customer-nour');
    for (let index = 0; index < dailyRateLimits.reports; index += 1) {
      db.reports.push({
        id: `limit-message-report-${index}`,
        targetType: 'message',
        targetId: `message-limit-${index}`,
        reporterId: 'customer-nour',
        reason: 'report.reason.messageAbuse',
        status: 'open',
        createdAt: nowIso(),
      });
    }
    writeDb(db);

    await expect(reportMessage('customer-nour', 'message-1', 'report.reason.messageAbuse')).rejects.toThrow('error.rateLimit.exceeded');
  });

  it('creates provider reports with target context', async () => {
    await reportProvider('customer-nour', 'provider-demo', 'report.reason.providerIssue');

    const report = readDb().reports.find((item) => item.targetType === 'provider' && item.targetId === 'provider-demo' && item.reporterId === 'customer-nour');
    expect(report).toMatchObject({
      targetLabel: 'أحمد السبّاك',
      reporterName: 'نور السيد',
      reason: 'report.reason.providerIssue',
      status: 'open',
    });
  });

  it('rate limits provider reports per reporter', async () => {
    const db = readDb();
    db.reports = db.reports.filter((item) => item.reporterId !== 'customer-nour');
    for (let index = 0; index < dailyRateLimits.reports; index += 1) {
      db.reports.push({
        id: `limit-provider-report-${index}`,
        targetType: 'provider',
        targetId: `provider-limit-${index}`,
        reporterId: 'customer-nour',
        reason: 'report.reason.providerIssue',
        status: 'open',
        createdAt: nowIso(),
      });
    }
    writeDb(db);

    await expect(reportProvider('customer-nour', 'provider-demo', 'report.reason.providerIssue')).rejects.toThrow('error.rateLimit.exceeded');
  });
});
