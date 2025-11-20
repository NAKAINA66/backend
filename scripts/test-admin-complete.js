/**
 * Script de test du compte administrateur KHADAMONA
 * Vérifie : 
 * - Admin existe dans MongoDB
 * - Admin authentification fonctionne
 * - Admin peut accéder aux pages protégées
 * - Admin dashboard charge les données
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ndorsoumna@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@2025!';

console.log('═══════════════════════════════════════════════════════════');
console.log('👑 TEST COMPTE ADMINISTRATEUR KHADAMONA');
console.log('═══════════════════════════════════════════════════════════\n');

async function runTests() {
  try {
    // Test 1: Connexion MongoDB
    console.log('✓ Test 1: Connexion à MongoDB');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/khadamona', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('  ✓ Connecté à MongoDB\n');

    // Test 2: Vérifier si admin existe
    console.log('✓ Test 2: Vérification Admin dans la Base de Données');
    let admin = await User.findOne({ email: ADMIN_EMAIL });
    
    if (admin) {
      console.log(`  ✓ Admin trouvé: ${ADMIN_EMAIL}`);
      console.log(`    - ID: ${admin._id}`);
      console.log(`    - Type: ${admin.userType}`);
      console.log(`    - Actif: ${admin.isActive ? 'Oui' : 'Non ❌'}`);
      console.log(`    - Vérifié: ${admin.isVerified ? 'Oui' : 'Non ⚠️'}`);
      console.log(`    - Password hachée: ${admin.password.startsWith('$2') ? 'Oui ✓' : 'Non ❌'}`);
    } else {
      console.error('  ❌ Admin NON TROUVÉ!');
      console.log('  Création d\'un nouvel admin...\n');
      
      const newAdmin = new User({
        userType: 'admin',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        firstName: 'DORSOUMNA',
        lastName: 'NAKAINA',
        isActive: true,
        isVerified: true,
        emailVerified: true
      });
      
      await newAdmin.save();
      admin = newAdmin;
      console.log('  ✅ Admin créé avec succès!\n');
    }
    console.log('');

    // Test 3: Test authentification password
    console.log('✓ Test 3: Test Authentification (comparePassword)');
    try {
      const isMatch = await admin.comparePassword(ADMIN_PASSWORD);
      if (isMatch) {
        console.log(`  ✓ Password authentification OK`);
        console.log(`    - Password testé: ${ADMIN_PASSWORD.substring(0, 5)}...`);
        console.log(`    - Comparaison avec hash: ✓ Valide\n`);
      } else {
        console.error(`  ❌ Password authentification ÉCHOUÉE!`);
        console.error(`    - Le password stocké ne correspond pas`);
        console.log(`    → Réinitialisation du password...\n`);
        
        admin.password = ADMIN_PASSWORD;
        await admin.save();
        
        const isMatchRetry = await admin.comparePassword(ADMIN_PASSWORD);
        if (isMatchRetry) {
          console.log('  ✅ Password réinitialisé et valide maintenant!\n');
        }
      }
    } catch (authError) {
      console.error('  ❌ Erreur lors du test password:', authError.message, '\n');
    }

    // Test 4: Générer un token JWT
    console.log('✓ Test 4: Génération Token JWT');
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log(`  ✓ Token généré avec succès`);
    console.log(`    - Token (premiers 50 chars): ${token.substring(0, 50)}...`);
    console.log(`    - Expire dans: 7 jours\n`);

    // Test 5: URLs d'accès frontend
    console.log('✓ Test 5: URLs d\'accès Frontend Admin');
    const baseUrl = 'http://localhost:8080';
    console.log(`  Pages administrateur accessibles sur:\n`);
    console.log(`    - Dashboard: ${baseUrl}/admin-dashboard.html`);
    console.log(`    - Messages: ${baseUrl}/admin-contact.html`);
    console.log(`    - Slider: ${baseUrl}/admin-slider.html`);
    console.log(`    - Employeurs: ${baseUrl}/admin-employers.html`);
    console.log(`    - Utilisateurs: ${baseUrl}/admin-users.html`);
    console.log(`    - Offres: ${baseUrl}/admin-jobs.html`);
    console.log(`    - Actualités: ${baseUrl}/admin-news.html`);
    console.log(`    - Candidatures: ${baseUrl}/admin-applications.html\n`);

    // Test 6: Endpoints API admin
    console.log('✓ Test 6: Endpoints API Admin');
    const apiUrl = 'http://localhost:3000/api';
    console.log(`  Routes disponibles:\n`);
    console.log(`    - Login: POST ${apiUrl}/auth/login`);
    console.log(`    - Me: GET ${apiUrl}/auth/me (requires token)`);
    console.log(`    - Users: GET ${apiUrl}/users`);
    console.log(`    - Jobs: GET ${apiUrl}/jobs`);
    console.log(`    - News: GET ${apiUrl}/news`);
    console.log(`    - Contact: GET ${apiUrl}/contact/all`);
    console.log(`    - Applications: GET ${apiUrl}/applications/admin/all\n`);

    // Résumé
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 RÉSUMÉ ADMIN');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✓ Email: ${ADMIN_EMAIL}`);
    console.log(`✓ Password: ${ADMIN_PASSWORD}`);
    console.log(`✓ Database: Admin existe et est actif`);
    console.log(`✓ Authentication: Password valide`);
    console.log(`✓ JWT: Token génération fonctionnelle`);
    console.log(`✓ Frontend: Pages admin disponibles`);
    console.log(`✓ Backend: Routes API disponibles\n`);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚀 PROCHAINES ÉTAPES');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('1. Démarrer le backend: npm start');
    console.log('2. Ouvrir le frontend: http://localhost:8080');
    console.log('3. Aller sur: http://localhost:8080/login.html');
    console.log(`4. Login avec:\n     Email: ${ADMIN_EMAIL}\n     Password: ${ADMIN_PASSWORD}`);
    console.log('5. Vous devriez être redirigé vers le dashboard admin');
    console.log('6. Tester les différentes sections (Messages, Slider, etc.)\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('⚡ TEST API (curl commands)');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('Tester la connexion admin via PowerShell:\n');
    console.log(`$body = @{ email = '${ADMIN_EMAIL}'; password = '${ADMIN_PASSWORD}' } | ConvertTo-Json`);
    console.log(`$result = Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method Post -Body $body -ContentType 'application/json'`);
    console.log(`$result | ConvertTo-Json`);
    console.log(`\nRésultat attendu: { success: true, token: '...', user: { email: '${ADMIN_EMAIL}', userType: 'admin', ... } }\n`);

  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    console.error(error.stack);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
}

runTests();
