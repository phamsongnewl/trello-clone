require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');

const sequelize = require('./config/database');
// Import models to ensure they are registered with Sequelize before sync
require('./models/index');

const apiRouter = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ── API routes ───────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ── Database connection & server startup ─────────────────────────────────────
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: false, force: false });
    console.log('Database connected successfully');

    app.listen(PORT, () => {
      console.log(`Backend listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  }
})();
