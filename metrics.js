const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
router.get('/ping', (req,res)=> res.json({ ok: true, ts: Date.now() }));
module.exports = router;
