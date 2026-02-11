import type { VercelRequest, VercelResponse } from '@vercel/node';

type GitHubGetResponse = { sha: string };

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Parser multipart minimalista para:
 * - 1 archivo: field "file"
 * - 1 texto: field "targetPath"
 */
function parseMultipart(body: Buffer, contentType: string) {
  const match = contentType.match(/boundary=(.+)$/);
  if (!match) throw new Error('Missing multipart boundary');
  const boundary = `--${match[1]}`;

  const bodyStr = body.toString('binary'); // conservar bytes
  const parts = bodyStr.split(boundary).slice(1, -1);

  let targetPath = '';
  let fileBuf: Buffer | null = null;
  let fileName = 'upload.bin';
  let mimeType = 'application/octet-stream';

  for (const part of parts) {
    const cleaned = part.replace(/^\r\n/, '').replace(/\r\n$/, '');
    const idx = cleaned.indexOf('\r\n\r\n');
    if (idx === -1) continue;

    const headerBlock = cleaned.slice(0, idx);
    const dataBlockBinary = cleaned.slice(idx + 4);

    const nameMatch = headerBlock.match(/name="([^"]+)"/);
    const fieldName = nameMatch?.[1] || '';

    if (fieldName === 'targetPath') {
      targetPath = Buffer.from(dataBlockBinary, 'binary').toString('utf8').trim();
      continue;
    }

    if (fieldName === 'file') {
      const fnMatch = headerBlock.match(/filename="([^"]*)"/);
      if (fnMatch?.[1]) fileName = fnMatch[1];

      const ctMatch = headerBlock.match(/Content-Type:\s*([^\r\n]+)/i);
      if (ctMatch?.[1]) mimeType = ctMatch[1].trim().toLowerCase();

      fileBuf = Buffer.from(dataBlockBinary, 'binary');
      continue;
    }
  }

  if (!targetPath) throw new Error('Missing targetPath');
  if (!fileBuf) throw new Error('Missing file');

  return { targetPath, fileBuf, fileName, mimeType };
}

function assertSafeTargetPath(p: string) {
  const normalized = p.replace(/\\/g, '/').replace(/^\/+/, '');

  if (!normalized.startsWith('public/images/')) {
    throw new Error('Invalid targetPath (must start with public/images/)');
  }
  if (normalized.includes('..')) throw new Error('Invalid targetPath (path traversal)');
  if (normalized.length > 240) throw new Error('Invalid targetPath (too long)');

  const lower = normalized.toLowerCase();
  const okExt = ['.jpg', '.jpeg', '.png', '.webp'].some((ext) => lower.endsWith(ext));
  if (!okExt) throw new Error('Invalid targetPath extension (allowed: .jpg, .png, .webp)');

  return normalized;
}

function assertImageMime(mimeType: string) {
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (!allowed.has(mimeType)) {
    throw new Error(`Invalid file type: ${mimeType} (allowed: jpeg/png/webp)`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = env('GITHUB_TOKEN');
    const owner = env('GITHUB_OWNER');
    const repo = env('GITHUB_REPO');
    const branch = process.env.GITHUB_BRANCH || 'main';

    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Expected multipart/form-data' });
    }

    const raw = await readRawBody(req);

    const maxBytes = Number(process.env.UPLOAD_MAX_BYTES || 2_000_000);
    if (raw.length > maxBytes) {
      return res.status(413).json({ error: 'File too large', maxBytes });
    }

    const { targetPath, fileBuf, mimeType } = parseMultipart(raw, contentType);

    assertImageMime(mimeType);
    const safePath = assertSafeTargetPath(targetPath);

    // Convertimos a base64 para GitHub Contents API
    const contentB64 = fileBuf.toString('base64');

    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(
      safePath
    )}`;

    // 1) obtener sha si existe
    const getResp = await fetch(`${apiBase}?ref=${branch}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    let sha: string | undefined;
    if (getResp.ok) {
      const j = (await getResp.json()) as GitHubGetResponse;
      sha = j.sha;
    } else if (getResp.status !== 404) {
      const errText = await getResp.text();
      return res.status(500).json({ error: 'GitHub GET failed', details: errText });
    }

    // 2) subir/actualizar
    const putResp = await fetch(apiBase, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `chore: upload ${safePath}`,
        content: contentB64,
        branch,
        ...(sha ? { sha } : {}),
      }),
    });

    const putJson = await putResp.json();
    if (!putResp.ok) {
      return res.status(500).json({ error: 'GitHub PUT failed', details: putJson });
    }

    const publicUrl = '/' + safePath.replace(/^public\//, '');

    return res.status(200).json({
      ok: true,
      publicUrl,
      commit: putJson?.commit?.sha,
      path: safePath,
      mimeType,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Unknown error' });
  }
}
