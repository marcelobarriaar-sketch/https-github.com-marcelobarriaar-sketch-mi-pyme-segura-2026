import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'node:crypto';
import { equal, secret, redis, prefix, setNotification } from '../server/evaluation-store.js';
import { headers, fail } from '../server/evaluation-http.js';
import { notify } from '../server/evaluation-notify.js';
// Raw body is necessary for Meta's signature verification.
export const config = { api: { bodyParser: false } };
export default async function handler(req: VercelRequest, res: VercelResponse) {
  headers(res);
  try {
    if (req.method === 'GET' && req.query.action === 'drain') {
      if (!equal(String(req.headers.authorization || ''), `Bearer ${secret('CRON_SECRET', 32)}`)) return res.status(401).end();
      const ids = await redis<string[]>('SRANDMEMBER', `${prefix()}:outbox`, 5);
      const results = await Promise.allSettled(ids.map(id => notify(id)));
      return res.json({ processed: ids.length, failed: results.filter(r => r.status === 'rejected').length });
    }
    if (req.method === 'GET') {
      if (req.query['hub.mode'] === 'subscribe' && equal(String(req.query['hub.verify_token'] || ''), secret('WHATSAPP_WEBHOOK_VERIFY_TOKEN', 32))) return res.status(200).send(String(req.query['hub.challenge']));
      return res.status(403).end();
    }
    if (req.method !== 'POST') return res.status(405).end();
    const chunks: Buffer[] = []; let size = 0;
    for await (const chunk of req) { const b = Buffer.from(chunk); size += b.length; if (size > 1000000) return res.status(413).end(); chunks.push(b); }
    const raw = Buffer.concat(chunks);
    const signature = 'sha256=' + createHmac('sha256', secret('WHATSAPP_APP_SECRET')).update(raw).digest('hex');
    if (!equal(String(req.headers['x-hub-signature-256'] || ''), signature)) return res.status(403).end();
    let payload; try { payload = JSON.parse(raw.toString()); } catch { return res.status(400).end(); }
    for (const entry of payload.entry || []) for (const change of entry.changes || []) {
      if (String(change.value?.metadata?.phone_number_id) !== secret('WHATSAPP_PHONE_NUMBER_ID')) continue;
      for (const status of change.value?.statuses || []) {
        const [id, attempt] = String(status.biz_opaque_callback_data || '').split(':');
        if (id && attempt && ['sent', 'delivered', 'read', 'failed'].includes(status.status)) await setNotification(id, attempt, status.status, String(status.id), status.errors?.[0]?.code ? `META_${Number(status.errors[0].code)}` : '');
      }
    }
    return res.status(200).end();
  } catch (e) { return fail(res, e); }
}
