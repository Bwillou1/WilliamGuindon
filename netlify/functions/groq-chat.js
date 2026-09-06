const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const MAX_BODY_BYTES = 32 * 1024;
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 7000;

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': 'https://williamguindon.me',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Méthode non autorisée.' }) };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { statusCode: 503, headers, body: JSON.stringify({ error: 'Le service IA n’est pas configuré.' }) };
  }
  if (!event.body || Buffer.byteLength(event.body, 'utf8') > MAX_BODY_BYTES) {
    return { statusCode: 413, headers, body: JSON.stringify({ error: 'Requête trop volumineuse.' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (error) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON invalide.' }) };
  }

  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  if (!messages.length || messages.length > MAX_MESSAGES) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Messages invalides.' }) };
  }

  const safeMessages = messages
    .filter((message) => message && ['user', 'assistant'].includes(message.role))
    .map((message) => ({ role: message.role, content: String(message.content || '').slice(0, MAX_MESSAGE_CHARS) }))
    .filter((message) => message.content.trim());

  if (!safeMessages.length) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Aucun message exploitable.' }) };
  }

  try {
    const groqResponse = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_MODEL,
        temperature: 0.2,
        max_tokens: 700,
        messages: [
          {
            role: 'system',
            content: 'Tu es l’assistant du site officiel de William Guindon et du dossier SEM-26-003. Réponds en français, de façon concise, factuelle et prudente. Base-toi uniquement sur le contexte public fourni et indique clairement quand une information manque. Ne demande ni ne révèle de secret, de clé API ou de donnée personnelle inutile.'
          },
          ...safeMessages
        ]
      })
    });
    const result = await groqResponse.json();
    if (!groqResponse.ok) {
      console.error('Groq API error:', groqResponse.status, result?.error?.message || 'unknown');
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Groq n’a pas pu traiter la demande.' }) };
    }
    const answer = result?.choices?.[0]?.message?.content;
    if (!answer) return { statusCode: 502, headers, body: JSON.stringify({ error: 'Réponse IA vide.' }) };
    return { statusCode: 200, headers, body: JSON.stringify({ answer }) };
  } catch (error) {
    console.error('Groq request failed:', error.message);
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Service IA temporairement indisponible.' }) };
  }
};