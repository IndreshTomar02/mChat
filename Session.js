const mongoose = require('mongoose');
const SessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String },
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  systemPrompt: { type: String, default: '' },
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true });
SessionSchema.index({ lastActive: 1 }, { expireAfterSeconds: Number(process.env.SESSION_TTL_SECONDS || 604800) });
module.exports = mongoose.model('Session', SessionSchema);
