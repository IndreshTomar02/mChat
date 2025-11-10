const mongoose = require('mongoose');
const MessageSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  role: { type: String, enum: ['user','assistant','system','tool'], required: true },
  text: { type: String },
  metadata: { type: Object, default: {} }
}, { timestamps: true });
module.exports = mongoose.model('Message', MessageSchema);
