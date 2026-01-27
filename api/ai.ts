import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo permitimos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  // Validamos API KEY
  if (!apiKey) {
    return res.status(500).json({
      error: 'Falta la variable de entorno OPENAI_API_KEY en Vercel'
    });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Falta el campo prompt en el body'
      });
    }

    // Llamamos a OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Eres un asistente útil.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    const data = await response.json();

    // Devolvemos la respuesta al frontend
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || 'Error interno del servidor'
    });
  }
}
