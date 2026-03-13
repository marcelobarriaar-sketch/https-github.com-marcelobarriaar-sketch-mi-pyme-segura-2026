import { VercelRequest, VercelResponse } from '@vercel/node'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_OWNER = process.env.GITHUB_OWNER
const GITHUB_REPO = process.env.GITHUB_REPO
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main'

const FILE_PATH = 'data/site_data.json'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const newContent = req.body

    const getFile = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${GITHUB_BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
      }
    )

    const fileData = await getFile.json()

    const sha = fileData.sha

    const encodedContent = Buffer.from(JSON.stringify(newContent, null, 2)).toString('base64')

    const update = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
        body: JSON.stringify({
          message: 'Update site_data.json from admin panel',
          content: encodedContent,
          sha,
          branch: GITHUB_BRANCH,
        }),
      }
    )

    const result = await update.json()

    if (!update.ok) {
      return res.status(500).json(result)
    }

    return res.status(200).json({
      success: true,
      commit: result.commit?.sha,
    })
  } catch (err: any) {
    return res.status(500).json({
      error: err.message,
    })
  }
}
