import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import { ITEMS, type Evaluation, type EvaluationInput } from '../shared/evaluation.js';
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export function secret(name: string, min = 1) { const v = process.env[name]; if (!v || v.length < min) throw new HttpError(503, 'El servicio está pendiente de configuración. Inténtalo más tarde.'); return v; }
export const prefix = () => process.env.EVALUATION_NAMESPACE || 'mps:evaluations:v1';
export async function redis<T = any>(...command: (string | number)[]): Promise<T> {
  const response = await fetch(process.env.UPSTASH_REDIS_REST_URL || secret('KV_REST_API_URL'), { method: 'POST', headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN || secret('KV_REST_API_TOKEN')}`, 'Content-Type': 'application/json' }, body: JSON.stringify(command), signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new HttpError(503, 'No pudimos acceder al registro. Conserva tus respuestas y reintenta.');
  const body = await response.json();
  if (body.error) throw new HttpError(503, 'No pudimos acceder al registro. Conserva tus respuestas y reintenta.');
  return body.result as T;
}
export const sign = (s: string) => createHmac('sha256', secret('EVALUATION_SESSION_SECRET', 32)).update(s).digest('base64url');
export const equal = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
export function token(kind: string, payload: object) { const v = Buffer.from(JSON.stringify({ kind, ...payload })).toString('base64url'); return `${v}.${sign(v)}`; }
export function verify(raw: string, kind: string) {
  try { const [v, signature, extra] = raw.split('.'); if (extra || !signature || !equal(sign(v), signature)) return null; const p = JSON.parse(Buffer.from(v, 'base64url').toString()); return p.kind === kind && p.exp > Date.now() ? p : null; } catch { return null; }
}
export async function rateLimit(key: string, limit: number, seconds: number) {
  const count = await redis<number>('EVAL', "local n=redis.call('INCR',KEYS[1]);if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end;return n", 1, `${prefix()}:limit:${key}`, seconds);
  if (count > limit) throw new HttpError(429, 'Demasiados intentos. Espera unos minutos y vuelve a intentar.');
}
export function ipKey(req: any) {
  const ip = process.env.VERCEL ? String(req.headers['x-vercel-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim() : String(req.socket?.remoteAddress || 'local');
  return sign(ip).slice(0, 32);
}
function decodeEvaluation(raw: string): Evaluation {
  const row = JSON.parse(raw);
  for (const [key] of ITEMS) if (row.scores[key] === 'na' || (key !== 'overall' && row.scores[key] == null)) row.scores[key] = null;
  return row;
}
export async function getEvaluation(id: string): Promise<Evaluation | null> {
  const raw = await redis<string | null>('HGET', `${prefix()}:records`, id); return raw ? decodeEvaluation(raw) : null;
}
export async function saveEvaluation(id: string, input: EvaluationInput, fingerprint: string, form?: Evaluation['form']) {
  const now = new Date().toISOString();
  const row: Evaluation = { ...input, ...(form ? { form } : {}), id, createdAt: now, notification: { status: 'pending', updatedAt: now } };
  // One atomic durable operation: deduplication, record, chronological index, metrics and outbox.
  const script = `local old=redis.call('HGET',KEYS[1],ARGV[1]);if old then return old end
local duplicate=redis.call('GET',KEYS[5]);if duplicate then return redis.call('HGET',KEYS[1],duplicate) end
redis.call('HSET',KEYS[1],ARGV[1],ARGV[2]);redis.call('ZADD',KEYS[2],ARGV[3],ARGV[1]);redis.call('SADD',KEYS[3],ARGV[1]);redis.call('SET',KEYS[5],ARGV[1],'EX',120)
redis.call('HINCRBY',KEYS[4],'total',1);local r=cjson.decode(ARGV[2]);for k,v in pairs(r.scores) do if type(v)=='number' then redis.call('HINCRBY',KEYS[4],k..':sum',v);redis.call('HINCRBY',KEYS[4],k..':count',1) end end;redis.call('HINCRBY',KEYS[4],'recommend:'..r.recommendation,1);return ARGV[2]`;
  return decodeEvaluation(await redis<string>('EVAL', script, 5, `${prefix()}:records`, `${prefix()}:index`, `${prefix()}:outbox`, `${prefix()}:metrics`, `${prefix()}:duplicate:${fingerprint}`, id, JSON.stringify({ ...row, scores: Object.fromEntries(ITEMS.map(([k]) => [k, row.scores[k] === null ? 'na' : row.scores[k]])) }), Date.now()));
}
export async function claimNotification(id: string, channel = 'whatsapp') {
  const attempt = randomUUID();
  const result = await redis<string | null>('EVAL', `local s=redis.call('HGET',KEYS[1],ARGV[1]);if not s then return nil end;local r=cjson.decode(s);local st=r.notification.status;if st~='pending' and st~='failed' and st~='not_configured' then return nil end;r.notification={status='sending',attempt=ARGV[2],updatedAt=ARGV[3],channel=ARGV[4]};local v=cjson.encode(r);redis.call('HSET',KEYS[1],ARGV[1],v);return v`, 1, `${prefix()}:records`, id, attempt, new Date().toISOString(), channel);
  return result ? decodeEvaluation(result) : null;
}
export async function setNotification(id: string, attempt: string, status: string, messageId = '', errorCode = '') {
  return redis('EVAL', `local s=redis.call('HGET',KEYS[1],ARGV[1]);if not s then return 0 end;local r=cjson.decode(s);if r.notification.attempt~=ARGV[2] then return 0 end
local rank={sending=0,unknown=0,accepted=1,sent=2,failed=2.5,delivered=3,read=4};local current=r.notification.status;local next=ARGV[3];if (rank[current] or 0)>(rank[next] or 0) then return 0 end
r.notification.status=next;r.notification.updatedAt=ARGV[4];if ARGV[5]~='' then r.notification.messageId=ARGV[5] end;r.notification.errorCode=ARGV[6];redis.call('HSET',KEYS[1],ARGV[1],cjson.encode(r));if next~='pending' and next~='sending' then redis.call('SREM',KEYS[2],ARGV[1]) end;return 1`, 2, `${prefix()}:records`, `${prefix()}:outbox`, id, attempt, status, new Date().toISOString(), messageId, errorCode);
}
export async function pageRows(offset: number, size = 50, until = Date.now()): Promise<Evaluation[]> {
  const ids = await redis<string[]>('ZREVRANGEBYSCORE', `${prefix()}:index`, until, '-inf', 'LIMIT', offset, size);
  if (!ids.length) return [];
  const rows = await redis<string[]>('HMGET', `${prefix()}:records`, ...ids); return rows.filter(Boolean).map(decodeEvaluation);
}
export async function metrics() {
  const raw = await redis<string[]>('HGETALL', `${prefix()}:metrics`); const m = Object.fromEntries(Array.from({ length: raw.length / 2 }, (_, i) => [raw[i * 2], Number(raw[i * 2 + 1])]));
  return { total: m.total || 0, averages: Object.fromEntries(ITEMS.map(([k]) => [k, m[`${k}:count`] ? m[`${k}:sum`] / m[`${k}:count`] : null])), recommendation: Object.fromEntries(['Sí', 'Tal vez', 'No'].map(k => [k, m[`recommend:${k}`] || 0])) };
}
