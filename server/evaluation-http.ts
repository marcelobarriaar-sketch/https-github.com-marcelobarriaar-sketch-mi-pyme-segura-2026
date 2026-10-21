import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HttpError, secret, verify } from './evaluation-store.js';
export function headers(res: VercelResponse) { res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive'); res.setHeader('X-Content-Type-Options', 'nosniff'); }
export function sameOrigin(req: VercelRequest) {
  const origin = req.headers.origin;
  if (!origin || origin !== secret('EVALUATION_ORIGIN')) throw new HttpError(403, 'Origen no autorizado. Abre nuevamente la encuesta desde su enlace.');
}
export function body(req: VercelRequest) {
  if (!String(req.headers['content-type']).startsWith('application/json')) throw new HttpError(415, 'Formato no válido.');
  if (Number(req.headers['content-length'] || 0) > 10000) throw new HttpError(413, 'El mensaje es demasiado extenso.');
  let data; try { data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch { throw new HttpError(400, 'Revisa los datos del formulario.'); }
  if (!data || Buffer.byteLength(JSON.stringify(data)) > 10000) throw new HttpError(400, 'Revisa los datos del formulario.'); return data;
}
export function requireAdmin(req: VercelRequest) {
  const cookie = String(req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith('mps_evaluation_session='))?.split('=')[1];
  if (!cookie || !verify(cookie, 'admin')) throw new HttpError(401, 'Inicia sesión para consultar las evaluaciones.');
}
export function fail(res: VercelResponse, error: unknown) { const e = error as HttpError; return res.status(e.status || 503).json({ error: e.status ? e.message : 'No pudimos completar la operación. Conserva tus respuestas y vuelve a intentar.' }); }
