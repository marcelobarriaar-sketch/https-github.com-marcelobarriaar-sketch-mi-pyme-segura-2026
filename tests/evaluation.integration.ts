import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID, scryptSync, createHmac } from 'node:crypto';
import { Readable } from 'node:stream';
import evaluations from '../api/evaluations';
import admin from '../api/evaluation-admin';
import whatsapp from '../api/evaluation-whatsapp';
import { token, getEvaluation, metrics, saveEvaluation, pageRows, redis, prefix, claimNotification, setNotification } from '../server/evaluation-store';
import { notify, templateParameters } from '../server/evaluation-notify';
import { DEFAULT_FORM } from '../shared/evaluation-form';
import { getForm } from '../server/evaluation-form';
import { emailText, checkEmail } from '../server/evaluation-email';
import { validateInput, csvCell, chileDate } from '../shared/evaluation';
Object.assign(process.env, JSON.parse(readFileSync(process.env.TEST_ENV_FILE || '../test-env-private.json', 'utf8')));
process.env.EVALUATION_NAMESPACE += ':integration:' + randomUUID();
const input = { scores: { attention: 5, punctuality: 4, care: null, explanation: 3, overall: 5 }, recommendation: 'Sí', reference: 'PRUEBA SINTÉTICA', comment: '=SUM(1;1)\nInstalación de prueba; sin datos personales' };
function request(method: string, data?: any, cookie = '') { return { method, body: data, headers: { origin: process.env.EVALUATION_ORIGIN, 'content-type': 'application/json', cookie }, query: {}, socket: { remoteAddress: 'test-only' } } as any; }
function response() {
  return { statusCode: 200, headers: {} as any, value: null as any, text: '', headersSent: false,
    setHeader(k: string, v: any) { this.headers[k] = v; return this; }, status(v: number) { this.statusCode = v; return this; }, json(v: any) { this.value = v; return this; }, write(v: string) { this.headersSent = true; this.text += v; }, end() { return this; }, destroy() { throw Error('stream failed'); } } as any;
}
test('Validación, fechas de Chile y CSV seguro', () => {
  assert.deepEqual(validateInput(input), input);
  for (const scores of [{ ...input.scores, attention: 0 }, { ...input.scores, overall: null }, { ...input.scores, care: '5' }]) assert.throws(() => validateInput({ ...input, scores }));
  assert.throws(() => validateInput({ ...input, recommendation: 'Quizá' }));
  assert.throws(() => validateInput({ ...input, comment: 'x'.repeat(501) }));
  assert.equal(csvCell('=1+1'), '"\'=1+1"'); assert.equal(csvCell('texto;"ok"'), '"texto;""ok"""');
  assert.ok(chileDate('2026-07-01T15:00:00Z').includes('11:00'));
  assert.ok(chileDate('2026-12-01T15:00:00Z').includes('12:00'));
});
test('Flujo real con Redis temporal: API, persistencia, duplicados, protección, métricas y fallos WhatsApp', async () => {
  const id = randomUUID(), challenge = token('form', { id, issued: Date.now() - 3000, exp: Date.now() + 600000 });
  const payload = { ...input, challenge, website: '' };
  const blocked = response(); await evaluations({ ...request('POST', payload), headers: { ...request('POST').headers, origin: 'https://otro.test' } }, blocked); assert.equal(blocked.statusCode, 403);
  const invalid = response(); await evaluations(request('POST', { ...payload, scores: {} }), invalid); assert.equal(invalid.statusCode, 400);
  const spam = response(); await evaluations(request('POST', { ...payload, website: 'spam' }), spam); assert.equal(spam.statusCode, 400);
  const first = response(), duplicate = response();
  await Promise.all([evaluations(request('POST', payload), first), evaluations(request('POST', payload), duplicate)]);
  assert.equal(first.value.success, true, JSON.stringify(first.value)); assert.equal(duplicate.value.id, first.value.id);
  const row = await getEvaluation(id); assert.equal(row?.comment, input.comment); assert.equal(row?.notification.status, 'not_configured');
  const extra = await saveEvaluation(randomUUID(), input as any, 'duplicate-identical');
  const second = await saveEvaluation(randomUUID(), input as any, 'duplicate-identical'); assert.equal(extra.id, second.id);
  const summary = await metrics(); assert.equal(summary.total, 2); assert.equal(summary.averages.care, null); assert.equal(summary.averages.punctuality, 4); assert.equal(summary.recommendation['Sí'], 2);
  const denied = response(); await admin(request('GET'), denied); assert.equal(denied.statusCode, 401);
  process.env.EVALUATION_ADMIN_PASSWORD_HASH = 'synthetic:' + scryptSync('synthetic-test-password', 'synthetic', 64).toString('hex');
  const login = response(); await admin(request('POST', { action: 'login', password: 'synthetic-test-password' }), login); assert.equal(login.value.success, true);
  assert.ok(login.headers['Set-Cookie'].includes('HttpOnly; Secure; SameSite=Strict'));
  const cookie = login.headers['Set-Cookie'].split(';')[0];
  const result = response(); await admin(request('GET', undefined, cookie), result); assert.equal(result.value.summary.total, 2); assert.equal(result.value.rows.length, 2);
  const csv = response(); await admin({ ...request('GET', undefined, cookie), query: { format: 'csv' } }, csv); assert.ok(csv.text.includes("'=SUM")); assert.ok(csv.text.includes('No aplica')); assert.ok(csv.text.includes('PRUEBA SINTÉTICA'));
  const tampered = response(); await admin(request('GET', undefined, cookie + 'tampered'), tampered); assert.equal(tampered.statusCode, 401);
  // Mock only Meta; Redis remains the real remote durable test database.
  Object.assign(process.env, { WHATSAPP_NOTIFICATIONS_ENABLED: 'true', WHATSAPP_ACCESS_TOKEN: 'synthetic', WHATSAPP_PHONE_NUMBER_ID: 'synthetic', WHATSAPP_TEMPLATE_NAME: 'test', WHATSAPP_TEMPLATE_LANGUAGE: 'es_CL', WHATSAPP_GRAPH_VERSION: 'v-test' });
  const originalFetch = globalThis.fetch; let sends = 0;
  globalThis.fetch = async (url: any, options?: any) => { if (String(url).startsWith('https://graph.facebook.com/')) { sends++; return new Response(JSON.stringify({ messages: [{ id: 'synthetic-meta-id' }] }), { status: 200 }); } return originalFetch(url, options); };
  try {
    await Promise.all([notify(id), notify(id)]); assert.equal(sends, 1); assert.equal((await getEvaluation(id))?.notification.status, 'accepted');
    await notify(id); assert.equal(sends, 1);
    const accepted = (await getEvaluation(id))!;
    await setNotification(id, accepted.notification.attempt!, 'delivered', 'synthetic-meta-id');
    await setNotification(id, accepted.notification.attempt!, 'sent', 'synthetic-meta-id'); assert.equal((await getEvaluation(id))?.notification.status, 'delivered');
    const params = templateParameters(accepted); assert.equal(params.at(-1), input.comment.replace(/\n/g, ' ')); assert.equal(params[4], 'No aplica');
    globalThis.fetch = async (url: any, options?: any) => { if (String(url).startsWith('https://graph.facebook.com/')) { sends++; throw Error('synthetic transport failure'); } return originalFetch(url, options); };
    await notify(extra.id); assert.equal((await getEvaluation(extra.id))?.notification.status, 'unknown'); const before = sends; await notify(extra.id); assert.equal(sends, before);
    assert.equal((await getEvaluation(extra.id))?.comment, input.comment);
    const retryBlocked = response(); await admin(request('POST', { action: 'retry', id: extra.id }, cookie), retryBlocked); assert.equal(retryBlocked.statusCode, 409);
  } finally { globalThis.fetch = originalFetch; process.env.WHATSAPP_NOTIFICATIONS_ENABLED = 'false'; }
  process.env.WHATSAPP_APP_SECRET = 'synthetic-app-secret';
  const current = (await getEvaluation(id))!;
  const webhookBody = Buffer.from(JSON.stringify({ entry: [{ changes: [{ value: { metadata: { phone_number_id: 'synthetic' }, statuses: [{ id: 'synthetic-meta-id', status: 'read', biz_opaque_callback_data: `${id}:${current.notification.attempt}` }] } }] }] }));
  function webhookRequest(signature: string) { return Object.assign(Readable.from([webhookBody]), { method: 'POST', headers: { 'x-hub-signature-256': signature }, query: {} }); }
  const rejectedWebhook = response(); await whatsapp(webhookRequest('bad') as any, rejectedWebhook); assert.equal(rejectedWebhook.statusCode, 403);
  const verifiedWebhook = response(); await whatsapp(webhookRequest('sha256=' + createHmac('sha256', process.env.WHATSAPP_APP_SECRET).update(webhookBody).digest('hex')) as any, verifiedWebhook); assert.equal(verifiedWebhook.statusCode, 200); assert.equal((await getEvaluation(id))?.notification.status, 'read');
  const formDenied = response(); await admin(request('POST',{action:'save_form',form:DEFAULT_FORM,expectedVersion:'original'}),formDenied); assert.equal(formDenied.statusCode,401);
  const edited = {...DEFAULT_FORM,title:'Tu opinión nos ayuda',labels:{...DEFAULT_FORM.labels,attention:'¿Cómo calificas la atención recibida?'}};
  const savedForm = response(); await admin(request('POST',{action:'save_form',form:edited,expectedVersion:'original'},cookie),savedForm); assert.equal(savedForm.value.success,true);
  const version = savedForm.value.form.version; assert.equal((await getForm()).title,edited.title);
  const conflict = response(); await admin(request('POST',{action:'save_form',form:edited,expectedVersion:'original'},cookie),conflict); assert.equal(conflict.statusCode,409);
  const formChallenge = response(); await evaluations(request('GET'),formChallenge); assert.equal(formChallenge.value.form.title,edited.title);
  const emailRow = await saveEvaluation(randomUUID(),input as any,'email-test',await getForm(version));
  Object.assign(process.env,{EVALUATION_NOTIFICATION_CHANNEL:'email',RESEND_API_KEY:'synthetic',EVALUATION_EMAIL_TO:'recipient@example.test',EVALUATION_EMAIL_FROM:'Mi Pyme <survey@example.test>'});
  let emails = 0; let reject = true;
  globalThis.fetch = async (url:any,options?:any) => {
    if (String(url) === 'https://api.resend.com/emails') {
      emails++; const body = JSON.parse(options.body); assert.deepEqual(body.to,['recipient@example.test']); assert.equal(options.headers['Idempotency-Key'],`mps-evaluation/${emailRow.id}`); assert.ok(body.text.includes(input.comment)); assert.ok(body.text.includes(edited.labels.attention));
      return new Response(JSON.stringify(reject ? {name:'validation_error'} : {id:'synthetic-resend-id'}),{status:reject ? 422 : 200});
    }
    if (String(url).startsWith('https://api.resend.com/emails/')) return new Response(JSON.stringify({last_event:'delivered'}),{status:200});
    return originalFetch(url,options);
  };
  try {
    await notify(emailRow.id); assert.equal((await getEvaluation(emailRow.id))?.notification.status,'failed'); assert.equal((await getEvaluation(emailRow.id))?.comment,input.comment);
    reject = false; await Promise.all([notify(emailRow.id),notify(emailRow.id)]); assert.equal(emails,2); assert.equal((await getEvaluation(emailRow.id))?.notification.channel,'email');
    await notify(emailRow.id); assert.equal(emails,2); await checkEmail(emailRow.id); assert.equal((await getEvaluation(emailRow.id))?.notification.status,'delivered');
    assert.ok(emailText((await getEvaluation(emailRow.id))!).includes(input.comment));
    assert.equal((await getEvaluation(id))?.form?.version,'original'); assert.equal((await getEvaluation(id))?.form?.title,DEFAULT_FORM.title);
  } finally { globalThis.fetch = originalFetch; delete process.env.EVALUATION_NOTIFICATION_CHANNEL; }
  // No record, metrics or deduplication is ever stored only in the browser.
  assert.equal((await pageRows(0)).length, 3);
  const keys = await redis<string[]>('KEYS', `${prefix()}:*`); if (keys.length) await redis('DEL', ...keys);
});
