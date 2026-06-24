import type { Firestore, Transaction } from 'firebase-admin/firestore';

export interface AuditInput {
  adminId: string;
  targetType: 'provider' | 'profession' | 'visibilityRequest' | 'review' | 'report' | 'user';
  targetId: string;
  action: string;
  reason: string;
  createdAt: string;
}

export function assertAdminReason(reason: string) {
  if (reason.trim().length < 5) throw new Error('Admin reason is required');
}

export function writeAudit(
  transaction: Transaction,
  firestore: Firestore,
  input: AuditInput,
) {
  transaction.set(firestore.collection('adminActions').doc(), input);
}
