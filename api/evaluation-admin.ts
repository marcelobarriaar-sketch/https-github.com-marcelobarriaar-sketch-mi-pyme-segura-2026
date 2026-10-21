import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scryptSync } from 'node:crypto';
import { ITEMS, chileDate, csvCell } from '../shared/evaluation.js';
import { HttpError, secret, equal, token, rateLimit, ipKey, pageRows, metrics, getEvaluation } from '../server/evaluation-store.js';
import { headers, sameOrigin, body, fail, requireAdmin } from '../server/evaluation-http.js';
import { notify } from '../server/evaluation-notify.js';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  headers(res);
  try {
    if (req.method === 'POST') {
      sameOrigin(req); const data = body(req);
      if (data.action === 'login') {
        await rateLimit(`login:${ipKey(req)}`, 8, 900);
        const [salt, expected] = secret('EVALUATION_ADMIN_PASSWORD_HASH').split(':');
        if (!salt || !/^[a-f0-9]{128}$/.test(expected || '')) throw new HttpError(503, 'Configura el acceso protegido en el servidor.');
        if (typeof data.password !== 'string' || data.password.length > 200 || !equal(scryptSync(data.password, salt, 64).toString('hex'), expected)) throw new HttpError(401, 'Contraseña incorrecta.');
        const session = token('admin', { exp: Date.now() + 8 * 3600000 });
        res.setHeader('Set-Cookie', `mps_evaluation_session=${session}; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=28800`);
        return res.json({ success: true });
      }
      requireAdmin(req);
      if (data.action === 'logout') { res.setHeader('Set-Cookie', 'mps_evaluation_session=; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=0'); return res.json({ success: true }); }
      if (data.action === 'retry' && typeof data.id === 'string') {
        const row = await getEvaluation(data.id); if (!row) throw new HttpError(404, 'Evaluación no encontrada.');
        if (!['pending', 'failed', 'not_configured'].includes(row.notification.status)) throw new HttpError(409, 'El mensaje ya fue procesado o su entrega requiere conciliación. No se reenviará para evitar duplicados.');
        await rateLimit('admin-notify', 30, 600); await notify(data.id); return res.json({ success: true });
      }
      throw new HttpError(400, 'Acción no válida.');
    }
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET, POST'); return res.status(405).end(); }
    requireAdmin(req);
    const until = Number(req.query.until || Date.now());
    if (!Number.isFinite(until) || until < 0) throw new HttpError(400, 'Fecha de consulta no válida.');
    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', 'attachment; filename="evaluaciones-mipyme-segura.csv"');
      res.write('\uFEFF' + ['ID', 'Fecha Chile', 'Referencia', ...ITEMS.map(([,label]) => label), 'Recomendación', 'Comentario', 'Estado WhatsApp'].map(csvCell).join(';') + '\r\n');
      for (let offset = 0; ; offset += 100) {
        const rows = await pageRows(offset, 100, until);
        for (const r of rows) res.write([r.id, chileDate(r.createdAt), r.reference, ...ITEMS.map(([k]) => r.scores[k] ?? 'No aplica'), r.recommendation, r.comment, r.notification.status].map(csvCell).join(';') + '\r\n');
        if (rows.length < 100) break;
      }
      return res.end();
    }
    const offset = Number(req.query.offset || 0);
    if (!Number.isSafeInteger(offset) || offset < 0) throw new HttpError(400, 'Página no válida.');
    const [rows, summary] = await Promise.all([pageRows(offset, 50, until), metrics()]);
    return res.json({ rows, summary, until, nextOffset: rows.length === 50 ? offset + 50 : null });
  } catch (e) { if (res.headersSent) return res.destroy(); return fail(res, e); }
}
