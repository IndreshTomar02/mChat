require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const MONGO = process.env.MONGODB_URI || 'mongodb://localhost:27017/nimbus_chat';
mongoose.connect(MONGO).then(async ()=>{
  const email = 'demo@local';
  const existing = await User.findOne({ email });
  if(existing) return console.log('demo user exists');
  const u = new User({ email, name: 'Demo User', passwordHash: await bcrypt.hash('password',10) });
  await u.save();
  console.log('created demo user: demo@local / password');
  process.exit(0);
}).catch(err=>console.error(err));
