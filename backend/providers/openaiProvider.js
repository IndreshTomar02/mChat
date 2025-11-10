/**
 * Real OpenAI Streaming Provider
 * Supports both standard and streaming responses.
 */

const axios = require('axios');
const { PassThrough } = require('stream');

const OPENAI_KEY = process.env.OPENAI_API_KEY;

async function chat(request, res = null) {
  if (!OPENAI_KEY) throw new Error('Missing OPENAI_API_KEY');

  const url = 'https://api.openai.com/v1/chat/completions';
  const payload = {
    model: request.model || 'gpt-4o-mini',
    messages: request.messages.map(m => ({ role: m.role, content: m.content })),
    temperature: request.temperature ?? 0.7,
    stream: Boolean(res), // stream if response object is passed
  };

  if (res) {
    // 🟢 STREAM MODE
    const response = await axios({
      url,
      method: 'POST',
      data: payload,
      responseType: 'stream',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    // forward stream chunks to client as SSE
    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(line => line.trim());
      for (const line of lines) {
        const msg = line.replace(/^data: /, '');
        if (msg === '[DONE]') {
          res.write('data: [DONE]\n\n');
          return;
        }
        try {
          const json = JSON.parse(msg);
          const token = json.choices?.[0]?.delta?.content;
          if (token) res.write(`data: ${token}\n\n`);
        } catch {
          // ignore malformed chunk
        }
      }
    });

    response.data.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });

    response.data.on('error', (err) => {
      console.error('Stream error from OpenAI:', err);
      res.write('data: [ERROR]\n\n');
      res.end();
    });

    return;
  } else {
    // 🟢 NORMAL MODE
    const resp = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    const text = resp.data.choices.map(c => c.message?.content || '').join('\n');
    return { text, usage: resp.data.usage || null };
  }
}

module.exports = { chat };
