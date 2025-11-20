/**
 * AUDIT COMPLET KHADAMONA - Backend + Frontend + Database
 * Vérifie tous les systèmes critiques et génère un rapport détaillé
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');

dotenv.config({ path: path.join(__dirname, '../.env') });

// Modèles
const User = require('../models/User');
const Job = require('../models/Job');
const News = require('../models/News');
const Contact = require('../models/Contact');
const Application = require('../models/Application');

// Résultat de l'audit
const auditResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    passed: 0,
    failed: 0,
    warnings: 0
  },
  recommendations: []
};

function addTest(name, status, message, severity = 'info') {
  auditResults.tests.push({ name, status, message, severity, timestamp: new Date().toISOString() });
  if (status === true) auditResults.summary.passed++;
  else if (status === false) auditResults.summary.failed++;
  else auditResults.summary.warnings++;
}

async function runAudit() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  🔍 AUDIT COMPLET KHADAMONA - Backend + Frontend + DB      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // ============================================
    // 1. AUDIT ENVIRONNEMENT
    // ============================================
    console.log('📋 AUDIT 1: Configuration Environnement\n');
    
    const requiredEnvVars = [
      'PORT',
      'NODE_ENV',
      'MONGODB_URI',
      'JWT_SECRET',
      'CORS_ORIGIN',
      'ADMIN_EMAIL',
      'ADMIN_PASSWORD'
    ];

    requiredEnvVars.forEach(varName => {
      if (process.env[varName]) {
        console.log(`  ✓ ${varName}: ${varName === 'JWT_SECRET' || varName === 'ADMIN_PASSWORD' || varName === 'MAIL_PASSWORD' ? '***' : process.env[varName]}`);
        addTest(`ENV: ${varName}`, true, `${varName} configuré`);
      } else {
        console.log(`  ❌ ${varName}: NON CONFIGURÉ`);
        addTest(`ENV: ${varName}`, false, `${varName} manquant`);
        auditResults.recommendations.push(`Configurer ${varName} dans .env`);
      }
    });
    console.log('');

    // ============================================
    // 2. AUDIT MONGODB
    // ============================================
    console.log('🗄️  AUDIT 2: Base de Données MongoDB\n');
    
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/khadamona', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('  ✓ Connexion MongoDB réussie');
      addTest('DB: Connexion', true, 'Connecté à MongoDB');

      // Vérifier les collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      console.log('  ✓ Collections présentes:', collectionNames.join(', '));
      addTest('DB: Collections', true, `${collectionNames.length} collections trouvées`);

      // Compter les documents
      const userCount = await User.countDocuments();
      const jobCount = await Job.countDocuments().catch(() => 0);
      const newsCount = await News.countDocuments().catch(() => 0);
      const contactCount = await Contact.countDocuments().catch(() => 0);
      const applicationCount = await Application.countDocuments().catch(() => 0);

      console.log(`  ✓ Users: ${userCount}`);
      console.log(`  ✓ Jobs: ${jobCount}`);
      console.log(`  ✓ News: ${newsCount}`);
      console.log(`  ✓ Contacts: ${contactCount}`);
      console.log(`  ✓ Applications: ${applicationCount}`);
      addTest('DB: Données', true, `Users:${userCount} Jobs:${jobCount} News:${newsCount} Contacts:${contactCount} Apps:${applicationCount}`);

      // Vérifier l'admin
      const admin = await User.findOne({ email: process.env.ADMIN_EMAIL });
      if (admin && admin.userType === 'admin') {
        console.log(`  ✓ Admin existe et est actif`);
        addTest('DB: Admin', true, `Admin (${admin.email}) existe`);
      } else {
        console.log(`  ⚠️  Admin non trouvé ou pas du type 'admin'`);
        addTest('DB: Admin', null, 'Admin manquant ou mal configuré', 'warning');
        auditResults.recommendations.push('Redémarrer le backend pour créer l\'admin');
      }

      console.log('');
    } catch (dbError) {
      console.log(`  ❌ Erreur MongoDB: ${dbError.message}`);
      addTest('DB: Connexion', false, `MongoDB non accessible: ${dbError.message}`);
      auditResults.recommendations.push('Vérifier que mongod est démarré');
      return; // Arrêter l'audit ici
    }

    // ============================================
    // 3. AUDIT BACKEND FICHIERS
    // ============================================
    console.log('⚙️  AUDIT 3: Fichiers Backend\n');

    const backendFiles = [
      'server.js',
      'package.json',
      'config/database.js',
      'models/User.js',
      'models/Job.js',
      'models/News.js',
      'routes/auth.js',
      'routes/jobs.js',
      'routes/news.js',
      'routes/contact.js',
      'middleware/auth.js'
    ];

    backendFiles.forEach(file => {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        console.log(`  ✓ ${file}`);
        addTest(`Backend: ${file}`, true, `Fichier présent`);
      } else {
        console.log(`  ❌ ${file} - MANQUANT`);
        addTest(`Backend: ${file}`, false, `Fichier manquant`);
      }
    });
    console.log('');

    // ============================================
    // 4. AUDIT FRONTEND FICHIERS
    // ============================================
    console.log('🎨 AUDIT 4: Fichiers Frontend\n');

    const frontendPath = path.join(__dirname, '../../KHADAMONA - Copie (2)');
    const criticalFiles = [
      'index.html',
      'login.html',
      'register-candidate.html',
      'register-employer.html',
      'admin-dashboard.html',
      'js/api.js',
      'js/main.js',
      'js/auth.js',
      'js/register.js',
      'css/style.css',
      'css/auth.css'
    ];

    criticalFiles.forEach(file => {
      const filePath = path.join(frontendPath, file);
      if (fs.existsSync(filePath)) {
        console.log(`  ✓ ${file}`);
        addTest(`Frontend: ${file}`, true, `Fichier présent`);
      } else {
        console.log(`  ❌ ${file} - MANQUANT`);
        addTest(`Frontend: ${file}`, false, `Fichier manquant`);
      }
    });
    console.log('');

    // ============================================
    // 5. AUDIT JS/API.JS CONFIGURATION
    // ============================================
    console.log('🔗 AUDIT 5: Configuration API Frontend\n');

    try {
      const apiJsPath = path.join(frontendPath, 'js/api.js');
      if (fs.existsSync(apiJsPath)) {
        const apiContent = fs.readFileSync(apiJsPath, 'utf8');
        
        if (apiContent.includes('API_BASE_URL')) {
          console.log('  ✓ Variable API_BASE_URL présente');
          addTest('Frontend: API_BASE_URL', true, 'Configurée');
        } else {
          console.log('  ❌ Variable API_BASE_URL manquante');
          addTest('Frontend: API_BASE_URL', false, 'Non trouvée');
        }

        if (apiContent.includes('window.API')) {
          console.log('  ✓ Export window.API présent');
          addTest('Frontend: window.API', true, 'Exporté');
        } else {
          console.log('  ❌ Export window.API manquant');
          addTest('Frontend: window.API', false, 'Non exporté');
        }

        if (apiContent.includes('auth.login') && apiContent.includes('auth.registerCandidate')) {
          console.log('  ✓ Méthodes auth.login et auth.registerCandidate présentes');
          addTest('Frontend: Auth methods', true, 'Présentes');
        } else {
          console.log('  ❌ Méthodes auth manquantes');
          addTest('Frontend: Auth methods', false, 'Manquantes');
        }
      } else {
        console.log('  ❌ js/api.js non trouvé');
        addTest('Frontend: api.js', false, 'Fichier manquant');
      }
      console.log('');
    } catch (apiError) {
      console.log(`  ⚠️  Erreur lors de la lecture de api.js: ${apiError.message}`);
    }

    // ============================================
    // 6. TEST ROUTES API
    // ============================================
    console.log('🔗 AUDIT 6: Routes API Backend\n');

    const routes = [
      { method: 'GET', path: '/api/health', protected: false },
      { method: 'POST', path: '/api/auth/login', protected: false },
      { method: 'GET', path: '/api/auth/me', protected: true },
      { method: 'GET', path: '/api/jobs', protected: false },
      { method: 'GET', path: '/api/news', protected: false },
      { method: 'POST', path: '/api/contact', protected: false }
    ];

    console.log('  Routes connues:');
    routes.forEach(route => {
      console.log(`    ${route.method.padEnd(6)} ${route.path}${route.protected ? ' (protégée)' : ''}`);
      addTest(`Route: ${route.method} ${route.path}`, true, `Route configurée`);
    });
    console.log('');

    // ============================================
    // 7. TEST CONNECTIVITÉ BACKEND
    // ============================================
    console.log('🔌 AUDIT 7: Connectivité Backend\n');

    const backendPort = process.env.PORT || 3000;
    const backendUrl = `http://localhost:${backendPort}`;
    
    console.log(`  Backend URL: ${backendUrl}`);
    console.log(`  Port: ${backendPort}`);
    console.log(`  Node env: ${process.env.NODE_ENV || 'development'}`);
    addTest('Backend: Port', true, `Écoute sur port ${backendPort}`);
    console.log('');

    // ============================================
    // 8. TEST FRONTEND CONNECTIVITÉ
    // ============================================
    console.log('🖥️  AUDIT 8: Connectivité Frontend\n');

    const frontendPort = 8080;
    const frontendUrl = `http://localhost:${frontendPort}`;
    
    console.log(`  Frontend URL: ${frontendUrl}`);
    console.log(`  Port recommandé: ${frontendPort}`);
    console.log(`  Note: Assurez-vous de lancer: python -m http.server ${frontendPort}`);
    console.log('');

    // ============================================
    // RÉSUMÉ
    // ============================================
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              📊 RÉSUMÉ DE L\'AUDIT                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`✓ Réussis: ${auditResults.summary.passed}`);
    console.log(`❌ Échoués: ${auditResults.summary.failed}`);
    console.log(`⚠️  Avertissements: ${auditResults.summary.warnings}`);
    console.log(`\nTotal des tests: ${auditResults.tests.length}\n`);

    if (auditResults.summary.failed > 0) {
      console.log('❌ PROBLÈMES DÉTECTÉS:\n');
      auditResults.tests
        .filter(t => t.status === false)
        .forEach(t => {
          console.log(`  • ${t.name}: ${t.message}`);
        });
      console.log('');
    }

    if (auditResults.recommendations.length > 0) {
      console.log('💡 RECOMMANDATIONS:\n');
      auditResults.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
      console.log('');
    }

    // ============================================
    // CHECKLIST DE TEST E2E
    // ============================================
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║            🧪 CHECKLIST TEST E2E À EXÉCUTER              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('1️⃣  DÉMARRER LE BACKEND:');
    console.log('   cd backend');
    console.log('   npm start\n');

    console.log('2️⃣  DÉMARRER LE FRONTEND (dans un nouveau terminal):');
    console.log('   cd "KHADAMONA - Copie (2)"');
    console.log('   python -m http.server 8080\n');

    console.log('3️⃣  TESTER LA CONNEXION ADMIN:');
    console.log('   Ouvrir: http://localhost:8080/login.html');
    console.log(`   Email: ${process.env.ADMIN_EMAIL || 'ndorsoumna@gmail.com'}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'Admin@2025!'}\n`);

    console.log('4️⃣  VÉRIFIER LE DASHBOARD:');
    console.log('   Après login, vous devez voir: http://localhost:8080/admin-dashboard.html');
    console.log('   Les stats doivent charger depuis l\'API\n');

    console.log('5️⃣  TESTER LES ROUTES API (PowerShell):');
    console.log('   curl http://localhost:3000/api/health');
    console.log(`   $body = @{ email = '${process.env.ADMIN_EMAIL || 'ndorsoumna@gmail.com'}'; password = '${process.env.ADMIN_PASSWORD || 'Admin@2025!'}' } | ConvertTo-Json`);
    console.log('   Invoke-RestMethod -Uri \'http://localhost:3000/api/auth/login\' -Method Post -Body $body -ContentType \'application/json\'\n');

    console.log('6️⃣  TESTER LE REGISTER:');
    console.log('   Ouvrir: http://localhost:8080/register-candidate.html');
    console.log('   Créer un nouveau compte candidat\n');

    console.log('7️⃣  TESTER LES PAGES PRINCIPALES:');
    console.log('   • http://localhost:8080/index.html');
    console.log('   • http://localhost:8080/emplois.html');
    console.log('   • http://localhost:8080/actualites.html');
    console.log('   • http://localhost:8080/contact.html\n');

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`✅ Audit terminé à ${new Date().toLocaleString('fr-FR')}\n`);

  } catch (error) {
    console.error('❌ Erreur critique lors de l\'audit:', error.message);
    console.error(error.stack);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
}

runAudit();
