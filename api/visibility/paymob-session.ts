import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createPaymobGateway,
  PaymobConfigurationError,
  paymobMerchantOrderId,
} from '../../functions/src/paymob.js';
import { readBody, rejectMethod } from '../_lib/http.js';

interface PaymobSessionBody {
  idToken?: string;
  providerId?: string;
  requestId?: string;
  amountCents?: number;
  currency?: 'EGP';
  billing?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
  };
}

async function verifyFirebaseIdToken(idToken: string) {
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) throw new PaymobConfigurationError(['VITE_FIREBASE_API_KEY']);

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  );
  const data = await response.json();
  if (!response.ok) return null;
  return data.users?.[0]?.localId as string | undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (rejectMethod(req, res, ['POST'])) return;

  try {
    const body = readBody<PaymobSessionBody>(req);
    if (
      !body.idToken ||
      !body.providerId ||
      !body.requestId ||
      !Number.isInteger(body.amountCents) ||
      body.amountCents <= 0 ||
      body.currency !== 'EGP'
    ) {
      res.status(400).json({ error: 'Invalid Paymob session request.' });
      return;
    }

    const uid = await verifyFirebaseIdToken(body.idToken);
    if (!uid || uid !== body.providerId) {
      res.status(403).json({ error: 'Provider authentication is required.' });
      return;
    }

    const session = await createPaymobGateway().createCardPaymentSession({
      providerId: body.providerId,
      requestId: body.requestId,
      merchantOrderId: paymobMerchantOrderId(body.providerId, body.requestId),
      amountCents: body.amountCents,
      currency: 'EGP',
      billing: body.billing,
    });

    res.status(200).json({
      checkoutUrl: session.checkoutUrl,
      merchantOrderId: session.merchantOrderId,
      integrationId: session.integrationId,
      orderId: session.orderId,
      mode: session.mode,
    });
  } catch (error) {
    if (error instanceof PaymobConfigurationError) {
      res.status(503).json({
        error: 'Paymob is not configured.',
        missing: error.missing,
      });
      return;
    }
    res.status(502).json({ error: 'Could not start Paymob visibility activation.' });
  }
}
