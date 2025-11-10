require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const metricsRoutes = require('./routes/metrics');

const app = express();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '256kb' }));
app.use(morgan('dev'));

// connect mongo
const MONGO = process.env.MONGODB_URI || 'mongodb://localhost:27017/nimbus_chat';
mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connect error', err));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/metrics', metricsRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log('Server listening on', PORT));
