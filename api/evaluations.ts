import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { validateInput } from '../shared/evaluation.js';
import { HttpError, rateLimit, ipKey, token, verify, saveEvaluation, getEvaluation, sign } from '../server/evaluation-store.js';
import { headers, sameOrigin, body, fail } from '../server/evaluation-http.js';
import { notify } from '../server/evaluation-notify.js';
import { getForm } from '../server/evaluation-form.js';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  headers(res);
  try {
    if (req.method === 'GET') {
      await rateLimit(`challenge:${ipKey(req)}`, 40, 600);
      const form = await getForm();
      return res.json({ form, challenge: token('form', { version: form.version, id: randomUUID(), issued: Date.now(), exp: Date.now() + 86400000 }) });
    }
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).end(); }
    sameOrigin(req); const data = body(req);
    if (data.website) throw new HttpError(400, 'No se pudo validar el envío.');
    const challenge = verify(String(data.challenge || ''), 'form');
    if (!challenge || Date.now() - challenge.issued < 2000) throw new HttpError(400, 'Actualiza la validación del formulario e intenta nuevamente.');
    let input; try { input = validateInput(data); } catch (e) { throw new HttpError(400, (e as Error).message); }
    const existing = await getEvaluation(challenge.id);
    if (existing) return res.json({ success: true, id: existing.id });
    await rateLimit(`submit:${ipKey(req)}`, 10, 3600);
    const form = await getForm(challenge.version || 'original');
    const row = await saveEvaluation(challenge.id, input, sign(`${ipKey(req)}:${JSON.stringify(input)}`), form);
    // The durable row and pending outbox already exist. Notification failure never changes save success.
    try { await notify(row.id); } catch { /* Outbox remains available to the protected retry worker. */ }
    return res.status(201).json({ success: true, id: row.id });
  } catch (e) { return fail(res, e); }
}
