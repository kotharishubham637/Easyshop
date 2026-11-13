require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json({ limit: '100kb' }));

// PRESENTATION TIER - static web UI
app.use(express.static(path.join(__dirname, '../public')));

// APPLICATION TIER - REST API
app.use('/api', routes);
app.use('/api', notFound);

app.use(errorHandler);

module.exports = app;
