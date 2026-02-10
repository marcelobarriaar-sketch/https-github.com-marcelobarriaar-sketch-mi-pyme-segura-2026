// api/save-site-data.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const token = process.env.GITHUB_TOKEN;

  if (!owner || !repo || !token) {
    res.status(500).json({ error: 'GitHub env vars missing' });
    return;
  }

  try {
    const siteData = req.body;

    if (!siteData) {
      res.status(400).json({ error: 'Missing body' });
      return;
    }

    const filePath = 'site_data.json';
    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

    const content = Buffer.from(
      JSON.stringify(siteData, null, 2),
      'utf8'
    ).toString('base64');

    let sha;
    const getResp = await fetch(`${apiBase}?ref=${branch}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'mi-pyme-segura-sync',
        Accept: 'application/vnd.github+json',
      },
    });

    if (getResp.ok) {
      const json = await getResp.json();
      sha = json.sha;
    }

    const putResp = await fetch(apiBase, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'mi-pyme-segura-sync',
        Accept: 'application/vnd.github+json',
      },
      body: JSON.stringify({
        message: 'chore: sync site_data from admin',
        content,
        sha,
        branch,
      }),
    });

    if (!putResp.ok) {
      const text = await putResp.text();
      console.error('GitHub error:', text);
      res.status(500).json({ error: 'GitHub upload failed', detail: text });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unexpected error' });
  }
}
