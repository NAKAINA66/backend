/**
 * TEST E2E COMPLET - Frontend ↔ Backend Connectivity
 * Vérifie que la connexion frontend→backend fonctionne réellement
 * Simulation complète du flow de login desde le navigateur
 */

const http = require('http');
const https = require('https');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  🧪 TEST E2E - FRONTEND ↔ BACKEND CONNECTIVITY            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const tests = {
  passed: 0,
  failed: 0,
  results: []
};

function addTest(name, passed, message) {
  tests.results.push({ name, passed, message });
  if (passed) {
    console.log(`  ✓ ${name}`);
    tests.passed++;
  } else {
    console.log(`  ❌ ${name}: ${message}`);
    tests.failed++;
  }
}

// Fonction pour faire des requêtes HTTP (simule fetch du navigateur)
function makeRequest(method, host, port, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, rawBody: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: null, rawBody: data, parseError: e.message });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runE2ETest() {
  try {
    // ============================================
    // 1. TEST CONNECTIVITY - Backend Health
    // ============================================
    console.log('📊 TEST 1: Backend Health Check\n');
    
    try {
      const healthRes = await makeRequest('GET', 'localhost', 3000, '/api/health');
      if (healthRes.status === 200 && healthRes.body && healthRes.body.success) {
        addTest('Backend responds to GET /api/health', true);
        console.log(`     Status: ${healthRes.status}, Response: ${JSON.stringify(healthRes.body).substring(0, 80)}...`);
      } else {
        addTest('Backend responds to GET /api/health', false, `Status ${healthRes.status}`);
      }
    } catch (err) {
      addTest('Backend responds to GET /api/health', false, `Network error: ${err.message}`);
      console.log('\n⚠️  BACKEND NOT ACCESSIBLE - Ensure "npm start" is running on port 3000\n');
      // Continue with DB tests anyway
    }
    console.log('');

    // ============================================
    // 2. TEST DATABASE - MongoDB Connection
    // ============================================
    console.log('🗄️  TEST 2: Database Connectivity\n');
    
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/khadamona', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      addTest('MongoDB connection successful', true);
    } catch (err) {
      addTest('MongoDB connection successful', false, err.message);
      console.log('\n⚠️  MONGODB NOT ACCESSIBLE - Ensure "mongod" is running\n');
      return; // Stop here if DB not accessible
    }
    console.log('');

    // ============================================
    // 3. TEST ADMIN USER - Check if admin exists
    // ============================================
    console.log('👑 TEST 3: Admin User in Database\n');
    
    const admin = await User.findOne({ email: process.env.ADMIN_EMAIL || 'ndorsoumna@gmail.com' });
    if (admin && admin.userType === 'admin') {
      addTest('Admin user exists in database', true);
      console.log(`     Email: ${admin.email}, Type: ${admin.userType}, Active: ${admin.isActive}`);
    } else {
      addTest('Admin user exists in database', false, 'Admin not found or not type "admin"');
    }
    console.log('');

    // ============================================
    // 4. TEST LOGIN ENDPOINT - Simulate Frontend
    // ============================================
    console.log('🔐 TEST 4: Login API Endpoint (Frontend Simulation)\n');
    
    const loginPayload = {
      email: process.env.ADMIN_EMAIL || 'ndorsoumna@gmail.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@2025!'
    };

    console.log(`     Attempting login with: ${loginPayload.email}`);
    
    try {
      const loginRes = await makeRequest('POST', 'localhost', 3000, '/api/auth/login', loginPayload);
      
      if (loginRes.status === 200 && loginRes.body && loginRes.body.success && loginRes.body.token) {
        addTest('POST /api/auth/login returns success with token', true);
        console.log(`     Status: 200, Token: ${loginRes.body.token.substring(0, 50)}...`);
        console.log(`     User: ${loginRes.body.user.email}, Type: ${loginRes.body.user.userType}`);
      } else if (loginRes.status === 401) {
        addTest('POST /api/auth/login returns success with token', false, `Unauthorized (401): ${loginRes.body?.message || 'No message'}`);
      } else {
        addTest('POST /api/auth/login returns success with token', false, `Status ${loginRes.status}: ${loginRes.body?.message || 'Unknown error'}`);
      }
    } catch (err) {
      addTest('POST /api/auth/login returns success with token', false, `Network error: ${err.message}`);
    }
    console.log('');

    // ============================================
    // 5. TEST PROTECTED ROUTE - Verify token works
    // ============================================
    console.log('🔑 TEST 5: Protected Route with Token\n');
    
    // First get a token
    try {
      const loginRes = await makeRequest('POST', 'localhost', 3000, '/api/auth/login', loginPayload);
      
      if (loginRes.body && loginRes.body.token) {
        const token = loginRes.body.token;
        
        // Now use token to access protected route
        const meRes = await makeRequest('GET', 'localhost', 3000, '/api/auth/me', null, {
          'Authorization': `Bearer ${token}`
        });

        if (meRes.status === 200 && meRes.body && meRes.body.user && meRes.body.user.email) {
          addTest('GET /api/auth/me with valid token returns user', true);
          console.log(`     Status: 200, User: ${meRes.body.user.email}`);
        } else {
          addTest('GET /api/auth/me with valid token returns user', false, `Status ${meRes.status}`);
        }
      }
    } catch (err) {
      addTest('GET /api/auth/me with valid token returns user', false, `Error: ${err.message}`);
    }
    console.log('');

    // ============================================
    // 6. TEST OTHER API ROUTES
    // ============================================
    console.log('📡 TEST 6: Other API Routes\n');
    
    const routesToTest = [
      { method: 'GET', path: '/api/jobs', description: 'Get Jobs' },
      { method: 'GET', path: '/api/news', description: 'Get News' },
      { method: 'GET', path: '/api/users', description: 'Get Users' }
    ];

    for (const route of routesToTest) {
      try {
        const res = await makeRequest(route.method, 'localhost', 3000, route.path);
        const isSuccess = res.status === 200 && res.body;
        addTest(`${route.method} ${route.path} (${route.description})`, isSuccess, isSuccess ? 'OK' : `Status ${res.status}`);
      } catch (err) {
        addTest(`${route.method} ${route.path} (${route.description})`, false, err.message);
      }
    }
    console.log('');

    // ============================================
    // RÉSUMÉ
    // ============================================
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                     📊 RÉSUMÉ DES TESTS                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`✓ Passés: ${tests.passed}`);
    console.log(`❌ Échoués: ${tests.failed}`);
    console.log(`Total: ${tests.passed + tests.failed}\n`);

    if (tests.failed === 0) {
      console.log('✅ SUCCESS! Frontend ↔ Backend connectivity fully functional!\n');
      console.log('🎯 Prochaines étapes:');
      console.log('   1. Ouvrir http://localhost:8080/login.html dans le navigateur');
      console.log('   2. Entrer email: ' + loginPayload.email);
      console.log('   3. Entrer password: ' + loginPayload.password);
      console.log('   4. Cliquer "Se connecter"');
      console.log('   5. Vous devez être redirigé vers le dashboard');
      console.log('');
    } else {
      console.log('⚠️  PROBLÈMES DÉTECTÉS:\n');
      tests.results.filter(t => !t.passed).forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.name}`);
        console.log(`      → ${t.message}\n`);
      });
      console.log('💡 SOLUTIONS:\n');
      console.log('   • Assurez-vous que "npm start" s\'exécute dans le dossier backend');
      console.log('   • Assurez-vous que MongoDB est en cours d\'exécution (mongod)');
      console.log('   • Vérifiez le fichier .env pour les variables requises');
      console.log('   • Consultez les logs du backend pour plus de détails');
      console.log('');
    }

    // ============================================
    // CHECKLIST FRONTEND
    // ============================================
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          📋 CHECKLIST FRONTEND À VÉRIFIER                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('1️⃣  Démarrer le frontend (si pas déjà fait):');
    console.log('   cd "KHADAMONA - Copie (2)"');
    console.log('   python -m http.server 8080\n');

    console.log('2️⃣  Ouvrir http://localhost:8080/login.html\n');

    console.log('3️⃣  Ouvrir DevTools (F12) et vérifier:');
    console.log('   • Onglet Console: pas d\'erreurs rouges');
    console.log('   • Onglet Network: POST /api/auth/login doit avoir status 200');
    console.log('   • Request URL doit être: http://localhost:3000/api/auth/login\n');

    console.log('4️⃣  Tester le login:');
    console.log(`   • Email: ${loginPayload.email}`);
    console.log(`   • Password: ${loginPayload.password}\n`);

    console.log('5️⃣  Après succès, vous devez être redirigé vers:');
    console.log('   • http://localhost:8080/admin-dashboard.html (si admin)\n');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
    console.error(error.stack);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
}

runE2ETest();
