const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  role: { type: String, default: 'user' },
  quota: { type: Number, default: 10000 }
}, { timestamps: true });
module.exports = mongoose.model('User', UserSchema);
