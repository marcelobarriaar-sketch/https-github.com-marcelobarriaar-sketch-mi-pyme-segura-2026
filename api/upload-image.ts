import type { VercelRequest, VercelResponse } from '@vercel/node';

function sanitize(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { dataUrl, filenameHint = 'image', folder = 'public/images/uploads' } = req.body || {};

    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      return res.status(400).json({ error: 'Invalid dataUrl' });
    }

    const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: 'Bad base64 format' });
    }

    const mime = match[1];
    const base64 = match[2];
    const buffer = Buffer.from(base64, 'base64');

    const ext =
      mime === 'image/png' ? 'png' :
      mime === 'image/webp' ? 'webp' :
      mime === 'image/gif' ? 'gif' :
      'jpg';

    const ts = Date.now();
    const safeHint = sanitize(filenameHint) || 'image';
    const filename = `${ts}-${safeHint}.${ext}`;
    const path = `${folder}/${filename}`;

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';

    if (!token || !owner || !repo) {
      return res.status(500).json({
        error: 'Missing GitHub env vars (GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO)'
      });
    }

    const repoFull = `${owner}/${repo}`;
    const ghUrl = `https://api.github.com/repos/${repoFull}/contents/${path}`;

    const ghRes = await fetch(ghUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `upload image ${filename}`,
        content: buffer.toString('base64'),
        branch
      })
    });

    if (!ghRes.ok) {
      const t = await ghRes.text();
      return res.status(500).json({ error: t });
    }

    const publicUrl = `https://raw.githubusercontent.com/${repoFull}/${branch}/${path}`;

    return res.status(200).json({
      ok: true,
      path,
      url: publicUrl
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Unknown error' });
  }
}
