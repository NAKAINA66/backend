#!/usr/bin/env node
/**
 * Script de diagnostic pour les problèmes d'authentification
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function diagnose() {
    log('\n📋 DIAGNOSTIC COMPLET - SYSTÈME D\'AUTHENTIFICATION', 'blue');
    log('=' .repeat(60), 'blue');

    try {
        // 1. Vérifier JWT_SECRET
        log('\n1️⃣  VÉRIFICATION JWT_SECRET', 'cyan');
        if (process.env.JWT_SECRET) {
            log(`   ✅ JWT_SECRET défini: ${process.env.JWT_SECRET.substring(0, 20)}...`, 'green');
        } else {
            log('   ⚠️  JWT_SECRET NON DÉFINI (problème potentiel)', 'yellow');
        }

        // 2. Connexion MongoDB
        log('\n2️⃣  CONNEXION MONGODB', 'cyan');
        try {
            const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/khadamona';
            log(`   URI: ${mongoUri}`);
            await mongoose.connect(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            log('   ✅ MongoDB connecté', 'green');
        } catch (err) {
            log(`   ❌ Erreur MongoDB: ${err.message}`, 'red');
            throw err;
        }

        // 3. Vérifier l'administrateur
        log('\n3️⃣  VÉRIFICATION ADMINISTRATEUR', 'cyan');
        const adminEmail = 'ndorsoumna@gmail.com';
        const admin = await User.findOne({ email: adminEmail });

        if (!admin) {
            log(`   ❌ Administrateur ${adminEmail} NON TROUVÉ`, 'red');
            log('   🔧 Création de l\'administrateur...', 'yellow');
            
            const newAdmin = new User({
                userType: 'admin',
                email: adminEmail,
                password: 'Admin@2025!',
                firstName: 'DORSOUMNA',
                lastName: 'NAKAINA',
                isActive: true,
                isVerified: true,
                emailVerified: true
            });
            await newAdmin.save();
            log('   ✅ Administrateur créé', 'green');
        } else {
            log(`   ✅ Administrateur trouvé`, 'green');
            log(`      - Type: ${admin.userType}`);
            log(`      - Actif: ${admin.isActive}`);
            log(`      - Vérifié: ${admin.isVerified}`);
            log(`      - Email vérifié: ${admin.emailVerified}`);
        }

        // 4. Tester la comparaison de mot de passe
        log('\n4️⃣  TEST COMPARAISON MOT DE PASSE', 'cyan');
        const testPassword = 'Admin@2025!';
        const adminFromDB = await User.findOne({ email: adminEmail });
        
        const passwordMatch = await adminFromDB.comparePassword(testPassword);
        if (passwordMatch) {
            log(`   ✅ Mot de passe correct`, 'green');
        } else {
            log(`   ❌ Mot de passe incorrect`, 'red');
            log('   Réinitialisation du mot de passe...', 'yellow');
            adminFromDB.password = testPassword;
            await adminFromDB.save();
            log('   ✅ Mot de passe réinitialisé', 'green');
        }

        // 5. Vérifier la structure User
        log('\n5️⃣  STRUCTURE MODÈLE USER', 'cyan');
        const userSchemaFields = Object.keys(adminFromDB.toObject());
        log(`   Champs trouvés: ${userSchemaFields.length}`, 'green');
        const criticalFields = ['email', 'password', 'userType', 'isActive', 'isVerified'];
        for (const field of criticalFields) {
            const hasField = userSchemaFields.includes(field);
            log(`   ${hasField ? '✅' : '❌'} ${field}`, hasField ? 'green' : 'red');
        }

        // 6. Test de hashage bcrypt
        log('\n6️⃣  TEST HASHAGE BCRYPT', 'cyan');
        const testHash = await bcrypt.hash('TestPassword123', 10);
        const testCompare = await bcrypt.compare('TestPassword123', testHash);
        if (testCompare) {
            log('   ✅ Bcrypt fonctionne correctement', 'green');
        } else {
            log('   ❌ Problème avec bcrypt', 'red');
        }

        // 7. Vérifier tous les utilisateurs
        log('\n7️⃣  TOUS LES UTILISATEURS', 'cyan');
        const allUsers = await User.find();
        log(`   Total: ${allUsers.length} utilisateurs`, 'green');
        
        for (const user of allUsers) {
            log(`   - ${user.email} (${user.userType}) - Actif: ${user.isActive}`, 'blue');
        }

        // 8. Test JWT
        log('\n8️⃣  TEST JWT', 'cyan');
        try {
            const jwt = require('jsonwebtoken');
            const testPayload = { userId: adminFromDB._id };
            const testToken = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '7d' });
            log('   ✅ JWT token généré avec succès', 'green');
            log(`      ${testToken.substring(0, 30)}...`, 'blue');
            
            const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
            log('   ✅ JWT token vérifié avec succès', 'green');
            log(`      UserId: ${decoded.userId}`, 'blue');
        } catch (err) {
            log(`   ❌ Erreur JWT: ${err.message}`, 'red');
        }

        log('\n' + '='.repeat(60), 'blue');
        log('✅ DIAGNOSTIC TERMINÉ - AUCUN PROBLÈME DÉTECTÉ', 'green');
        log('=' .repeat(60), 'blue');

    } catch (error) {
        log(`\n❌ ERREUR DIAGNOSTIC: ${error.message}`, 'red');
        log('=' .repeat(60), 'blue');
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

diagnose();
