import { ITEMS, chileDate, type Evaluation } from '../shared/evaluation.js';
import { claimNotification, setNotification } from './evaluation-store.js';
import { notifyEmail } from './evaluation-email.js';
const REQUIRED = ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_TEMPLATE_NAME', 'WHATSAPP_TEMPLATE_LANGUAGE', 'WHATSAPP_GRAPH_VERSION'];
export function templateParameters(row: Evaluation) {
  return [chileDate(row.createdAt), row.reference || 'Sin referencia', ...ITEMS.map(([k]) => row.scores[k] === null ? 'No aplica' : `${row.scores[k]}/5`), row.recommendation, row.comment || 'Sin comentario'].map(text => text.replace(/[\t\r\n]+/g, ' ').replace(/ {4,}/g, ' '));
}
export async function notify(id: string) {
  if (process.env.EVALUATION_NOTIFICATION_CHANNEL === 'email') return notifyEmail(id);
  const row = await claimNotification(id);
  if (!row) return;
  const attempt = row.notification.attempt!;
  if (process.env.WHATSAPP_NOTIFICATIONS_ENABLED !== 'true' || REQUIRED.some(k => !process.env[k])) {
    await setNotification(id, attempt, 'not_configured', '', 'CONFIGURATION_REQUIRED'); return;
  }
  // Never retry an ambiguous HTTP result automatically: Meta has no exactly-once send key.
  // An authenticated webhook can reconcile an accepted message after a transport timeout.
  try {
    const response = await fetch(`https://graph.facebook.com/${process.env.WHATSAPP_GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: '56986141302', type: 'template', biz_opaque_callback_data: `${id}:${attempt}`, template: { name: process.env.WHATSAPP_TEMPLATE_NAME, language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE }, components: [{ type: 'body', parameters: templateParameters(row).map(text => ({ type: 'text', text })) }] } }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    if (response.ok && data.messages?.[0]?.id) await setNotification(id, attempt, 'accepted', data.messages[0].id);
    else if (response.status >= 400 && response.status < 500) await setNotification(id, attempt, 'failed', '', `META_${Number(data.error?.code) || response.status}`);
    else await setNotification(id, attempt, 'unknown', '', 'PROVIDER_RESULT_UNCERTAIN');
  } catch { await setNotification(id, attempt, 'unknown', '', 'TRANSPORT_RESULT_UNCERTAIN'); }
}
