//below code loads required modules
require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require("cors");
app.use(cors());

// middleware
app.use(express.json());

// health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date()
  });
});

// routes
const patientRouter = require('./routes/patients');
const orderRouter = require('./routes/orders');
const testsRouter = require('./routes/tests');

app.use('/patients', patientRouter);
app.use('/orders', orderRouter);
app.use('/tests', testsRouter);

// start server
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});