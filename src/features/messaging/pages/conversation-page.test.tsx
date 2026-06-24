import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { ConversationPage } from './conversation-page';
import type { ConversationDetails } from '@/services/contracts/messaging.contract';

const mocks = vi.hoisted(() => ({
  user: { uid: 'customer-nour', role: 'customer' },
  details: null as ConversationDetails | null,
  reportMessage: vi.fn(),
  sendMessage: vi.fn(),
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@/hooks/use-conversation', () => ({
  useConversation: () => ({ data: mocks.details }),
  useSendMessage: () => ({ mutate: (variables: unknown, options: unknown) => mocks.sendMessage(variables, options) }),
  useReportMessage: () => ({ mutateAsync: mocks.reportMessage }),
}));

function conversationDetails(): ConversationDetails {
  return {
    conversation: {
      id: 'conversation-1',
      participants: ['customer-nour', 'provider-demo'],
      providerId: 'provider-demo',
      customerId: 'customer-nour',
      lastMessage: 'Can you help?',
      lastMessageAt: '2026-01-03T00:00:00.000Z',
      unreadCount: { 'customer-nour': 1, 'provider-demo': 0 },
    },
    messages: [
      {
        id: 'message-1',
        conversationId: 'conversation-1',
        senderId: 'provider-demo',
        text: 'Yes, I can visit tomorrow.',
        createdAt: '2026-01-03T00:00:00.000Z',
        read: false,
      },
    ],
  };
}

function renderConversation() {
  return render(
    <MemoryRouter initialEntries={['/messages/conversation-1']}>
      <Routes>
        <Route path="/messages/:id" element={<ConversationPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ConversationPage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    mocks.details = conversationDetails();
    mocks.reportMessage.mockReset();
    mocks.reportMessage.mockResolvedValue(undefined);
    mocks.sendMessage.mockReset();
  });

  it('shows success feedback after reporting an incoming message', async () => {
    renderConversation();

    await userEvent.click(screen.getByRole('button', { name: 'Report message' }));

    expect(mocks.reportMessage).toHaveBeenCalledWith({
      reporterId: 'customer-nour',
      messageId: 'message-1',
      reason: 'report.reason.messageAbuse',
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Message report sent for admin review.',
    );
  });

  it('shows localized rate-limit feedback after report failure', async () => {
    mocks.reportMessage.mockRejectedValueOnce(new Error('error.rateLimit.exceeded'));

    renderConversation();

    await userEvent.click(screen.getByRole('button', { name: 'Report message' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many actions in a short time. Try again later.',
    );
  });

  it('shows localized rate-limit feedback after send failure and preserves the draft', async () => {
    mocks.sendMessage.mockImplementationOnce((_variables, options) => {
      options.onError(new Error('error.rateLimit.exceeded'));
    });

    renderConversation();

    const input = screen.getByPlaceholderText('Write your message');
    await userEvent.type(input, 'Please confirm timing');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many actions in a short time. Try again later.',
    );
    expect(input).toHaveValue('Please confirm timing');
  });
});
