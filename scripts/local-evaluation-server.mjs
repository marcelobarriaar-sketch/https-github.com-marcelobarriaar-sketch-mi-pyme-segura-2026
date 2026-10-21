// Development/test adapter only. Production uses Vercel Functions, never this server.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { randomBytes, scryptSync } from 'node:crypto';
import { build } from 'esbuild';
Object.assign(process.env, JSON.parse(readFileSync('../test-env-private.json', 'utf8')));
process.env.EVALUATION_ADMIN_PASSWORD_HASH = 'synthetic:' + scryptSync('synthetic-test-password', 'synthetic', 64).toString('hex');
await build({ entryPoints: ['api/evaluations.ts', 'api/evaluation-admin.ts', 'api/evaluation-whatsapp.ts'], outdir: '../local-api', bundle: true, platform: 'node', format: 'esm', outExtension: { '.js': '.mjs' } });
const handlers = Object.fromEntries(await Promise.all(['evaluations','evaluation-admin','evaluation-whatsapp'].map(async name => [name, (await import(`../../local-api/${name}.mjs`)).default])));
createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3000');
  res.status = value => { res.statusCode = value; return res; }; res.json = value => { res.setHeader('Content-Type','application/json'); res.end(JSON.stringify(value)); }; res.send = value => res.end(value);
  try {
    const name = url.pathname.split('/api/')[1];
    if (handlers[name]) {
      req.query = Object.fromEntries(url.searchParams); if (name !== 'evaluation-whatsapp') { let raw = ''; for await (const c of req) raw += c; req.body = raw ? JSON.parse(raw) : null; }
      return await handlers[name](req,res);
    }
    const path = /^\/evaluacion(?:-resultados)?\/?$/.test(url.pathname) ? 'evaluation.html' : url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const file = resolve('dist',path); if (!file.startsWith(resolve('dist') + '/') || !existsSync(file) || !statSync(file).isFile()) { res.statusCode=404; return res.end('Not Found'); }
    const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'};res.setHeader('Content-Type',types[extname(file)] || 'application/octet-stream'); if(path==='evaluation.html')res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');res.end(readFileSync(file));
  } catch { res.statusCode=500; res.end('Local test adapter error'); }
}).listen(3000, '127.0.0.1', () => console.log('Adaptador local de prueba listo: http://localhost:3000/evaluacion (Redis temporal, WhatsApp desactivado)'));
