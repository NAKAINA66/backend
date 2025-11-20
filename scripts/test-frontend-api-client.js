/**
 * TEST FRONTEND API CLIENT - Vérification de la logique API côté frontend
 * Simule les appels API que le navigateur va faire depuis le code frontend
 */

const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     🌐 TEST FRONTEND API CLIENT LOGIC                      ║');
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

// ============================================
// 1. VERIFY FRONTEND FILES EXIST
// ============================================
console.log('📁 TEST 1: Frontend Files Exist\n');

const frontendRoot = path.join(__dirname, '../../KHADAMONA - Copie (2)');
const filesToCheck = [
  'js/api.js',
  'js/main.js',
  'js/auth.js',
  'js/register.js',
  'login.html',
  'register-candidate.html',
  'register-employer.html'
];

filesToCheck.forEach(file => {
  const fullPath = path.join(frontendRoot, file);
  const exists = fs.existsSync(fullPath);
  addTest(`File exists: ${file}`, exists, exists ? 'OK' : `Not found at ${fullPath}`);
});
console.log('');

// ============================================
// 2. VERIFY API.JS STRUCTURE
// ============================================
console.log('🔧 TEST 2: API Client (js/api.js) Structure\n');

try {
  const apiFilePath = path.join(frontendRoot, 'js/api.js');
  const apiCode = fs.readFileSync(apiFilePath, 'utf8');

  // Check for required patterns
  const checks = [
    { pattern: /API_BASE_URL/i, name: 'API_BASE_URL variable defined' },
    { pattern: /window\.API\s*=/i, name: 'window.API object exported' },
    { pattern: /\.auth\s*:\s*\{/i, name: 'auth module defined' },
    { pattern: /\.jobs\s*:\s*\{/i, name: 'jobs module defined' },
    { pattern: /\.news\s*:\s*\{/i, name: 'news module defined' },
    { pattern: /login\s*:\s*function|login\s*\(|login\s*:/i, name: 'auth.login function exists' },
    { pattern: /registerCandidate|registerEmployer/i, name: 'auth.register functions exist' },
    { pattern: /forgotPassword|resetPassword/i, name: 'password recovery functions exist' },
    { pattern: /Bearer.*token/i, name: 'Authorization Bearer token handling' }
  ];

  checks.forEach(check => {
    const found = check.pattern.test(apiCode);
    addTest(check.name, found, found ? 'OK' : 'Pattern not found');
  });

} catch (err) {
  addTest('API.js file readable', false, err.message);
}
console.log('');

// ============================================
// 3. VERIFY API_BASE_URL LOGIC
// ============================================
console.log('🔗 TEST 3: API_BASE_URL Resolution Logic\n');

try {
  const apiFilePath = path.join(frontendRoot, 'js/api.js');
  const apiCode = fs.readFileSync(apiFilePath, 'utf8');

  // Extract API_BASE_URL assignment
  const baseUrlMatch = apiCode.match(/API_BASE_URL\s*=\s*[^;]+;/s);
  
  if (baseUrlMatch) {
    const baseUrlLogic = baseUrlMatch[0];
    console.log('   Found API_BASE_URL assignment:');
    console.log('   ' + baseUrlLogic.substring(0, 120) + '...\n');

    // Check if it prefers http://hostname:3000
    if (/3000/.test(baseUrlLogic) && /localhost.*3000|hostname.*3000/i.test(baseUrlLogic)) {
      addTest('API_BASE_URL uses port 3000 (backend port)', true);
    } else {
      addTest('API_BASE_URL uses port 3000 (backend port)', false, 'Port 3000 not found in logic');
    }

    // Check if it has fallback
    if (/localhost|fallback|default/i.test(baseUrlLogic)) {
      addTest('API_BASE_URL has fallback logic', true);
    } else {
      addTest('API_BASE_URL has fallback logic', false, 'No fallback found');
    }
  } else {
    addTest('API_BASE_URL defined in api.js', false, 'Cannot find API_BASE_URL assignment');
  }

} catch (err) {
  addTest('API_BASE_URL logic verification', false, err.message);
}
console.log('');

// ============================================
// 4. VERIFY MAIN.JS STRUCTURE
// ============================================
console.log('⚙️  TEST 4: Main.js Initialization\n');

try {
  const mainFilePath = path.join(frontendRoot, 'js/main.js');
  const mainCode = fs.readFileSync(mainFilePath, 'utf8');

  // Check for required functions
  const mainChecks = [
    { pattern: /initializeNavigation|initialize.*nav|setupNav/i, name: 'Navigation initialization' },
    { pattern: /initializeAI|initialize.*AI|setupAI|KHADAMONA/i, name: 'AI assistant initialization' },
    { pattern: /generateAI|generateResponse|processMessage/i, name: 'AI response generation' },
    { pattern: /document\.ready|DOMContentLoaded|addEventListener/i, name: 'DOM ready handler' }
  ];

  mainChecks.forEach(check => {
    const found = check.pattern.test(mainCode);
    addTest(`main.js: ${check.name}`, found, found ? 'OK' : 'Not found');
  });

  // Check for obvious syntax errors
  const hasSyntaxError = /[{}[\]]\s*[{}[\]]|unexpected.*token|return.*{|function\s*\(/i.test(mainCode);
  addTest('main.js has no obvious syntax errors', !hasSyntaxError, !hasSyntaxError ? 'OK' : 'Potential syntax issues found');

} catch (err) {
  addTest('Main.js readable and valid', false, err.message);
}
console.log('');

// ============================================
// 5. VERIFY AUTH.JS (LOGIN HANDLER)
// ============================================
console.log('🔐 TEST 5: Auth.js (Login Handler)\n');

try {
  const authFilePath = path.join(frontendRoot, 'js/auth.js');
  const authCode = fs.readFileSync(authFilePath, 'utf8');

  // Check for login handler
  const authChecks = [
    { pattern: /handleLogin|login.*handler|submit.*login/i, name: 'Login handler function' },
    { pattern: /window\.API\.auth\.login|api\.auth\.login|auth\.login/i, name: 'Calls API login' },
    { pattern: /localStorage|sessionStorage|cookie/i, name: 'Token storage logic' },
    { pattern: /redirect|window\.location|navigate|dashboard/i, name: 'Redirect after login' },
    { pattern: /userType|user\.type|role/i, name: 'User type handling' }
  ];

  authChecks.forEach(check => {
    const found = check.pattern.test(authCode);
    addTest(`auth.js: ${check.name}`, found, found ? 'OK' : 'Not found');
  });

} catch (err) {
  addTest('Auth.js login handler', false, err.message);
}
console.log('');

// ============================================
// 6. VERIFY REGISTER.JS (REGISTRATION)
// ============================================
console.log('📝 TEST 6: Register.js (Registration Handler)\n');

try {
  const registerFilePath = path.join(frontendRoot, 'js/register.js');
  const registerCode = fs.readFileSync(registerFilePath, 'utf8');

  // Check for registration handler
  const registerChecks = [
    { pattern: /handleCandidate|registration.*handler|register.*submit/i, name: 'Registration handler' },
    { pattern: /window\.API\.auth\.registerCandidate|api\.auth\.register/i, name: 'Calls API register' },
    { pattern: /upload|file|document|cv|photo/i, name: 'File upload logic' },
    { pattern: /province|prefecture|location|geography/i, name: 'Location field handling' },
    { pattern: /dateOfBirth|date.*birth|age/i, name: 'Date of birth handling' }
  ];

  registerChecks.forEach(check => {
    const found = check.pattern.test(registerCode);
    addTest(`register.js: ${check.name}`, found, found ? 'OK' : 'Not found');
  });

} catch (err) {
  addTest('Register.js structure', false, err.message);
}
console.log('');

// ============================================
// 7. VERIFY HTML LOGIN PAGE STRUCTURE
// ============================================
console.log('📄 TEST 7: login.html Structure\n');

try {
  const loginHtmlPath = path.join(frontendRoot, 'login.html');
  const loginHtml = fs.readFileSync(loginHtmlPath, 'utf8');

  const htmlChecks = [
    { pattern: /<form/i, name: 'Form element exists' },
    { pattern: /type=.email/i, name: 'Email input field' },
    { pattern: /type=.password/i, name: 'Password input field' },
    { pattern: /type=.submit|button/i, name: 'Submit button' },
    { pattern: /<script[^>]*api\.js/i, name: 'Includes api.js script' },
    { pattern: /<script[^>]*main\.js/i, name: 'Includes main.js script' },
    { pattern: /<script[^>]*auth\.js/i, name: 'Includes auth.js script' }
  ];

  htmlChecks.forEach(check => {
    const found = check.pattern.test(loginHtml);
    addTest(`login.html: ${check.name}`, found, found ? 'OK' : 'Not found');
  });

} catch (err) {
  addTest('login.html readable', false, err.message);
}
console.log('');

// ============================================
// 8. VERIFY CORRECT SCRIPT ORDER IN HTML
// ============================================
console.log('📋 TEST 8: Script Loading Order\n');

try {
  const loginHtmlPath = path.join(frontendRoot, 'login.html');
  const loginHtml = fs.readFileSync(loginHtmlPath, 'utf8');

  const apiIndex = loginHtml.indexOf('api.js');
  const mainIndex = loginHtml.indexOf('main.js');
  const authIndex = loginHtml.indexOf('auth.js');

  if (apiIndex > -1 && mainIndex > -1 && authIndex > -1) {
    if (apiIndex < mainIndex && mainIndex < authIndex) {
      addTest('Script loading order (api.js → main.js → auth.js)', true);
    } else {
      addTest('Script loading order (api.js → main.js → auth.js)', false, 
        `Order: api=${apiIndex}, main=${mainIndex}, auth=${authIndex}`);
    }
  } else {
    addTest('Script loading order (api.js → main.js → auth.js)', false, 'Not all scripts found');
  }

} catch (err) {
  addTest('Script order verification', false, err.message);
}
console.log('');

// ============================================
// RÉSUMÉ
// ============================================
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                 📊 RÉSUMÉ ANALYSE FRONTEND                 ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log(`✓ Passés: ${tests.passed}`);
console.log(`❌ Échoués: ${tests.failed}`);
console.log(`Total: ${tests.passed + tests.failed}\n`);

if (tests.failed === 0) {
  console.log('✅ SUCCESS! Frontend API client structure is correct!\n');
  console.log('🎯 Prochaines étapes:');
  console.log('   1. Exécuter: npm start (dans le dossier backend)');
  console.log('   2. Exécuter: python -m http.server 8080 (dans KHADAMONA - Copie (2))');
  console.log('   3. Exécuter: node scripts/test-e2e-connectivity.js');
  console.log('   4. Ouvrir http://localhost:8080/login.html dans le navigateur');
  console.log('');
} else {
  console.log('⚠️  PROBLÈMES DÉTECTÉS DANS LE FRONTEND:\n');
  tests.results.filter(t => !t.passed).forEach((t, i) => {
    console.log(`   ${i + 1}. ${t.name}`);
    console.log(`      → ${t.message}\n`);
  });
  console.log('💡 SOLUTIONS:\n');
  console.log('   • Vérifiez que tous les fichiers JS existent');
  console.log('   • Vérifiez l\'ordre des scripts dans les fichiers HTML');
  console.log('   • Vérifiez qu\'il n\'y a pas d\'erreurs de syntaxe JavaScript');
  console.log('   • Consultez la console du navigateur (F12) pour les erreurs');
  console.log('');
}

process.exit(tests.failed > 0 ? 1 : 0);
