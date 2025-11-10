const jwt = require('jsonwebtoken');
const User = require('../models/User');
module.exports = async function(req,res,next){
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({ error: 'Missing token' });
  const parts = auth.split(' ');
  if(parts.length !== 2) return res.status(401).json({ error: 'Invalid token' });
  try{
    const payload = jwt.verify(parts[1], process.env.JWT_SECRET || 'secret');
    const user = await User.findById(payload.sub).select('-passwordHash');
    if(!user) return res.status(401).json({ error: 'Invalid token' });
    req.user = user;
    next();
  }catch(err){ console.error(err); return res.status(401).json({ error: 'Invalid token' }); }
}
