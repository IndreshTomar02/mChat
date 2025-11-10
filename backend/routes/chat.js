// backend/routes/chat.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const Message = require('../models/Message');
const openai = require('../providers/openaiProvider');
const auth = require('../middleware/auth');

// Rate limiter (shared)
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  max: Number(process.env.RATE_LIMIT_MAX || 60),
  standardHeaders: true,
  legacyHeaders: false
});

function basicSafety(text) {
  if (!text) return false;
  if (typeof text !== 'string') return false;
  if (text.length > 2000) return false;
  const blocked = ['<script>', 'drop table', 'rm -rf', 'sudo'];
  const lower = text.toLowerCase();
  for (const b of blocked) if (lower.includes(b)) return false;
  return true;
}

// -----------------------------
// POST /api/chat/message
// non-streamed conversational call (protected by auth middleware)
// -----------------------------
router.post('/message', auth, limiter, async (req, res) => {
  const user = req.user;
  const { sessionId, input, model, temperature } = req.body;

  if (!basicSafety(input)) return res.status(400).json({ error: 'Input failed safety checks' });

  try {
    // Get (or create) session
    let session = null;
    if (sessionId) session = await Session.findById(sessionId);
    // Create user message
    const userMsg = await Message.create({ sessionId: session?._id, role: 'user', text: input });

    if (session) {
      session.messages.push(userMsg._id);
      session.lastActive = new Date();
      await session.save();
    }

    // Build history (last N messages) + system prompt if present
    const messages = [];
    if (session && session.systemPrompt) messages.push({ role: 'system', content: session.systemPrompt });

    if (session && session.messages && session.messages.length) {
      const msgs = await Message.find({ _id: { $in: session.messages } }).sort({ createdAt: 1 }).limit(20);
      msgs.forEach(m => messages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }));
    }
    messages.push({ role: 'user', content: input });

    // Call provider (non-stream)
    const providerResp = await openai.chat({ model, temperature, messages });
    const assistantText = providerResp.text || 'Sorry, no response.';
    const assistantMsg = await Message.create({ sessionId: session?._id, role: 'assistant', text: assistantText, metadata: { usage: providerResp.usage } });

    if (session) {
      session.messages.push(assistantMsg._id);
      await session.save();
    }

    return res.json({ assistant: assistantText, sessionId: session?._id, usage: providerResp.usage });
  } catch (err) {
    console.error('POST /message error:', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'provider error' });
  }
});

// -----------------------------
// GET /api/chat/stream
// SSE streaming endpoint. Accepts token via query: ?token=...&input=...&model=...&temperature=...
// -----------------------------
router.get('/stream', limiter, async (req, res) => {
  // Note: We intentionally accept token via query because EventSource in browsers
  // does not allow setting custom Authorization headers.
  const token = req.query.token;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  // Verify JWT
  let user;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    // Minimal log: do NOT log the token or sensitive info, only user id
    console.log('Stream request - JWT sub:', payload.sub);
    user = await User.findById(payload.sub).select('-passwordHash');
    if (!user) {
      console.warn('Stream token valid but user not found:', payload.sub);
      return res.status(401).json({ error: 'Invalid user' });
    }
  } catch (err) {
    console.warn('Stream JWT verify failed:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Validate input
  const input = (req.query.input || '').trim();
  if (!basicSafety(input)) return res.status(400).json({ error: 'Invalid input' });

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.write('\n');

  // heartbeat so client knows we're alive
  const hb = setInterval(() => {
    try { res.write('event: heartbeat\n'); res.write('data: {}\n\n'); } catch (e) {}
  }, 15000);

  // When the client disconnects, we should stop streams/clean up
  const onClose = () => {
    clearInterval(hb);
    try { res.end(); } catch (e) {}
    console.log('SSE client disconnected for user', user._id.toString());
  };
  req.on('close', onClose);
  req.on('end', onClose);

  // Stream using provider. openai.chat will write SSE chunks into `res`.
  try {
    console.log('Starting OpenAI stream for user', user._id.toString(), 'input length', input.length);
    await openai.chat({
      model: req.query.model || 'gpt-4o-mini',
      temperature: parseFloat(req.query.temperature) || 0.7,
      messages: [{ role: 'user', content: input }]
    }, res);
    // provider is expected to end the response with [DONE] and res.end()
  } catch (err) {
    console.error('OpenAI streaming error:', err && err.message ? err.message : err);
    try { res.write('data: [ERROR]\n\n'); } catch (e) {}
    try { res.end(); } catch (e) {}
  } finally {
    clearInterval(hb);
  }
});

module.exports = router;
