// api/ai.ts

// Handler para la función serverless de Vercel
// Esta ruta recibe el body tal cual lo manda tu frontend
// y lo reenvía a la API de Gemini, devolviendo la respuesta.

export default async function handler(req: any, res: any) {
  // Solo permitimos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Si no hay API key en Vercel, avisamos claro
    return res.status(500).json({
      error:
        'Falta la variable de entorno GEMINI_API_KEY en Vercel. ' +
        'Configúrala en Project Settings → Environment Variables.',
    });
  }

  try {
    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-002:generateContent?key=' +
        apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Reenviamos exactamente el JSON que mandó el frontend
        body: JSON.stringify(req.body),
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      // Pasamos el error de Gemini tal cual al frontend
      return res.status(geminiResponse.status).json(data);
    }

    // Todo OK → respondemos con la data de Gemini
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error en /api/ai:', err);
    return res
      .status(500)
      .json({ error: 'Error interno al conectar con Gemini' });
  }
}
