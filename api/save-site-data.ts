import type { VercelRequest, VercelResponse } from '@vercel/node';

type GitHubGetResponse = { sha: string };
function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function readJsonBody(req: VercelRequest) {
  // Vercel Node fn: a veces req.body viene vacío dependiendo del Content-Type.
  // Leemos crudo y parseamos.
  const chunks: Buffer[] = [];
  for await (const chunk of req as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) throw new Error('Empty body');
  return JSON.parse(raw);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = env('GITHUB_TOKEN');
    const owner = env('GITHUB_OWNER');
    const repo = env('GITHUB_REPO');
    const branch = process.env.GITHUB_BRANCH || 'main';

    const data = await readJsonBody(req);

    // Ajusta si tu app espera otra ruta; por tus RAW, está en la raíz del repo.
    const path = 'site_data.json';

    const jsonText = JSON.stringify(data, null, 2) + '\n';
    const contentB64 = Buffer.from(jsonText, 'utf8').toString('base64');

    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    // 1) Obtener sha si existe (para actualizar)
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

    // 2) PUT (crear o actualizar)
    const putResp = await fetch(apiBase, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `chore: update ${path} from admin`,
        content: contentB64,
        branch,
        ...(sha ? { sha } : {}),
      }),
    });

    const putJson = await putResp.json();
    if (!putResp.ok) {
      return res.status(500).json({ error: 'GitHub PUT failed', details: putJson });
    }

    return res.status(200).json({
      ok: true,
      path,
      commit: putJson?.commit?.sha,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Unknown error' });
  }
}
