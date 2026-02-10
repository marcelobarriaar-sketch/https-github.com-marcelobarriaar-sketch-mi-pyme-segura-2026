import type { VercelRequest, VercelResponse } from '@vercel/node';

type GitHubGetResponse = { sha: string };

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = env('GITHUB_TOKEN');
    const owner = env('GITHUB_OWNER');
    const repo = env('GITHUB_REPO');
    const branch = process.env.GITHUB_BRANCH || 'main';
    const path = process.env.SITE_DATA_PATH || 'site_data.json';

    const incoming = req.body ?? {};

    // Seguridad: nunca guardes token desde frontend
    if (incoming?.githubSettings?.token) incoming.githubSettings.token = '';

    const contentStr = JSON.stringify(incoming, null, 2);
    const contentB64 = Buffer.from(contentStr, 'utf8').toString('base64');

    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;

    // 1) Obtener sha actual del archivo si existe
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

    // 2) Crear/actualizar archivo
    const putResp = await fetch(apiBase, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'chore: update site_data.json from admin',
        content: contentB64,
        branch,
        ...(sha ? { sha } : {}),
      }),
    });

    const putJson = await putResp.json();
    if (!putResp.ok) {
      return res.status(500).json({ error: 'GitHub PUT failed', details: putJson });
    }

    return res.status(200).json({ ok: true, commit: putJson?.commit?.sha });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Unknown error' });
  }
}
