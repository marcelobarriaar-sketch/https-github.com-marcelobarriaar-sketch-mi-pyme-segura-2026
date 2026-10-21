import { ITEMS, chileDate, type Evaluation } from '../shared/evaluation.js';
import { claimNotification, setNotification, getEvaluation, HttpError } from './evaluation-store.js';
export function emailText(row: Evaluation) {
  return ['Nueva evaluación — Mi Pyme Segura', `Fecha y hora de Chile: ${chileDate(row.createdAt)}`, `Nombre o referencia: ${row.reference || 'Sin referencia'}`, '', ...ITEMS.map(([k,label]) => `${row.form?.labels[k] || label}: ${row.scores[k] === null ? 'No aplica' : `${row.scores[k]} / 5`}`), `¿Nos recomendarías?: ${row.recommendation}`, '', 'Comentario completo:', row.comment || 'Sin comentario', '', `ID: ${row.id}`, 'Resultados protegidos: https://www.mipymesegura.cl/evaluacion-resultados'].join('\n');
}
export async function notifyEmail(id: string) {
  const row = await claimNotification(id,'email'); if (!row) return;
  const attempt = row.notification.attempt!;
  if (!process.env.RESEND_API_KEY || !process.env.EVALUATION_EMAIL_TO || !process.env.EVALUATION_EMAIL_FROM) { await setNotification(id,attempt,'not_configured','','EMAIL_CONFIGURATION_REQUIRED'); return; }
  try {
    const response = await fetch('https://api.resend.com/emails', {method:'POST', headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`mps-evaluation/${row.id}`}, body:JSON.stringify({from:process.env.EVALUATION_EMAIL_FROM,to:[process.env.EVALUATION_EMAIL_TO],subject:'Nueva evaluación de servicio | Mi Pyme Segura',text:emailText(row)}),signal:AbortSignal.timeout(10000)});
    const data = await response.json();
    if (response.ok && typeof data.id === 'string') await setNotification(id,attempt,'accepted',data.id);
    else if (response.status >= 400 && response.status < 500) await setNotification(id,attempt,'failed','',`RESEND_${response.status}`);
    else await setNotification(id,attempt,'unknown','','EMAIL_RESULT_UNCERTAIN');
  } catch { await setNotification(id,attempt,'unknown','','EMAIL_TRANSPORT_UNCERTAIN'); }
}
export async function checkEmail(id: string) {
  const row = await getEvaluation(id);
  if (!row || row.notification.channel !== 'email' || !row.notification.messageId || !row.notification.attempt) throw new HttpError(409,'No hay un correo aceptado para consultar.');
  if (!process.env.RESEND_API_KEY) throw new HttpError(503,'Falta configurar Resend.');
  const response = await fetch(`https://api.resend.com/emails/${encodeURIComponent(row.notification.messageId)}`,{headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`},signal:AbortSignal.timeout(10000)});
  if (!response.ok) throw new HttpError(502,`Resend no permitió consultar la entrega (HTTP ${response.status}).`);
  const data = await response.json(); const status = ({delivered:'delivered',sent:'sent',bounced:'failed',failed:'failed',complained:'failed',suppressed:'failed'} as Record<string,string>)[data.last_event];
  if (status) await setNotification(id,row.notification.attempt,status,row.notification.messageId,status === 'failed' ? `EMAIL_${data.last_event.toUpperCase()}` : '');
}
