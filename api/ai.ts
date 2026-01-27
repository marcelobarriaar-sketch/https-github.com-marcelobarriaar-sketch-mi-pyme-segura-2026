import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo permitimos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'Falta la variable de entorno OPENAI_API_KEY en Vercel'
    });
  }

  try {
    const { messages, productsText, projectsText } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Falta el campo messages (array de mensajes del chat)'
      });
    }

    // Contexto que le vamos a dar a la IA
    const systemPrompt = `
Eres el asistente experto en CCTV y seguridad de la empresa "Mi Pyme Segura",
ubicada en el sur de Chile. Tu trabajo es:

- Hacer preguntas claras al cliente para entender:
  - tipo de negocio (casa, pyme, galpón, hospital, parcela, etc.)
  - riesgos principales (robos, control de personal, monitoreo de accesos, vehículos, etc.)
  - si necesita audio, visión nocturna, color-vu, disuasión por luz/sirena, etc.
  - si el lugar tiene internet estable o requiere soluciones con energía solar/enlaces.

- Recomendar cámaras y soluciones SOLO basadas en la información de productos y proyectos
  que te entrega el sistema en este contexto.

- Si no tienes suficiente información de catálogo, debes decirlo explícitamente
  y proponer una recomendación general, pero siempre pidiendo más datos.

- Siempre habla en español chileno, cercano pero profesional.

Catálogo de productos disponible (texto libre, puede venir vacío):
${productsText || 'Sin catálogo detallado cargado aún.'}

Experiencia de proyectos realizados (texto libre, puede venir vacío):
${projectsText || 'Sin detalle de proyectos cargado aún.'}
    `.trim();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ]
      })
    });

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      'Por ahora no puedo responder, intenta nuevamente.';

    // Devolvemos solo el mensaje de respuesta para que sea fácil usarlo en el frontend
    return res.status(200).json({ reply });
  } catch (err: any) {
    console.error('Error en /api/ai:', err);
    return res.status(500).json({
      error: err.message || 'Error interno del servidor'
    });
  }
}
