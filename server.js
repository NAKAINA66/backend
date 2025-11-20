require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Connexion à MongoDB
const connectDB = require('./config/database');

// ✅ PAS DE HELMET ICI (donc pas de CSP)

// CORS
app.use(cors({
  origin: [
    'http://localhost:4000',
    'http://127.0.0.1:4000',
    process.env.CORS_ORIGIN || 'http://localhost:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Limitation des requêtes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard.'
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Parsing des body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ SERVIR LE FRONTEND
app.use(express.static(path.join(__dirname, '../')));

// ✅ ROUTES API (DOIVENT ÊTRE AVANT LA ROUTE *)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/news', require('./routes/news'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/employers', require('./routes/employers'));
app.use('/api/geography', require('./routes/geography'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/slider', require('./routes/slider'));
app.use('/api/uploads', require('./routes/uploads'));

// 404 API
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route API non trouvée' });
});

// ✅ SERVIR index.html À LA RACINE (seulement pour la racine)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// ✅ ROUTING FRONTEND (doit être APRES les routes API)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Erreur serveur' : err.message
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 4000; // ✅ Corrigé : 4000 au lieu de 3001

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
  });
}).catch((error) => {
  console.error('❌ Échec de connexion à la base de données:', error);
  process.exit(1);
});

module.exports = app;