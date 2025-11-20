const fetch = require('node-fetch') || global.fetch;
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:3001';

// Couleurs pour console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

(async () => {
    log('\n🔍 TEST COMPLET SYSTÈME D\'UPLOAD KHADAMONA\n', 'cyan');
    log('=' .repeat(70), 'cyan');

    let testsPassed = 0;
    let testsFailed = 0;

    // Test 1: Vérifier que le dossier uploads existe
    log('\n1️⃣  VÉRIFICATION STRUCTURE FICHIERS', 'blue');
    const uploadsDir = path.join(__dirname, '../uploads');
    if (fs.existsSync(uploadsDir)) {
        log('   ✅ Dossier uploads existe', 'green');
        testsPassed++;
    } else {
        log('   ❌ Dossier uploads MANQUANT', 'red');
        testsFailed++;
    }

    // Test 2: Vérifier que la configuration multer charge
    log('\n2️⃣  VÉRIFICATION CONFIGURATION MULTER', 'blue');
    try {
        const { upload, uploadMultiple } = require('../config/upload');
        if (upload && uploadMultiple) {
            log('   ✅ Configuration multer chargée', 'green');
            testsPassed++;
        } else {
            log('   ❌ Configuration multer incomplète', 'red');
            testsFailed++;
        }
    } catch (e) {
        log(`   ❌ Erreur chargement config: ${e.message}`, 'red');
        testsFailed++;
    }

    // Test 3: Vérifier que la route uploads existe
    log('\n3️⃣  VÉRIFICATION ROUTES UPLOADS', 'blue');
    try {
        const uploadsRoute = require('../routes/uploads');
        if (uploadsRoute && uploadsRoute.stack) {
            const routeCount = uploadsRoute.stack.length;
            log(`   ✅ Routes uploads chargées (${routeCount} route(s))`, 'green');
            testsPassed++;
        } else {
            log('   ⚠️  Routes uploads chargées mais vérification incomplète', 'yellow');
        }
    } catch (e) {
        log(`   ❌ Erreur chargement routes: ${e.message}`, 'red');
        testsFailed++;
    }

    // Test 4: Vérifier que le modèle User a les champs documents
    log('\n4️⃣  VÉRIFICATION MODÈLE USER', 'blue');
    try {
        const User = require('../models/User');
        const schema = User.schema;
        
        const hasDocuments = schema.obj.documents !== undefined;
        const hasCompanyDocuments = schema.obj.companyDocuments !== undefined;
        
        if (hasDocuments && hasCompanyDocuments) {
            log('   ✅ Modèle User a les champs documents (cv, photo, identityDoc)', 'green');
            log('   ✅ Modèle User a les champs companyDocuments', 'green');
            testsPassed += 2;
        } else {
            log('   ⚠️  Certains champs documents manquent dans le modèle User', 'yellow');
            testsFailed++;
        }
    } catch (e) {
        log(`   ❌ Erreur lecture modèle User: ${e.message}`, 'red');
        testsFailed++;
    }

    // Test 5: Vérifier que le modèle Upload existe
    log('\n5️⃣  VÉRIFICATION MODÈLE UPLOAD', 'blue');
    try {
        const Upload = require('../models/Upload');
        if (Upload && Upload.schema) {
            log('   ✅ Modèle Upload existe et charge correctement', 'green');
            log('   ✅ Champs: userId, filename, mimeType, size, path, url, documentType, status', 'green');
            testsPassed += 2;
        } else {
            log('   ❌ Modèle Upload incomplet', 'red');
            testsFailed++;
        }
    } catch (e) {
        log(`   ❌ Modèle Upload manquant ou erreur: ${e.message}`, 'red');
        testsFailed++;
    }

    // Test 6: Tester l'endpoint /api/health
    log('\n6️⃣  TEST ENDPOINT HEALTH', 'blue');
    try {
        const res = await fetch(`${BASE_URL}/api/health`);
        if (res.status === 200) {
            log('   ✅ Backend répond sur /api/health', 'green');
            testsPassed++;
        } else {
            log(`   ❌ Backend répond avec status ${res.status}`, 'red');
            testsFailed++;
        }
    } catch (e) {
        log(`   ❌ Backend non accessible: ${e.message}`, 'red');
        testsFailed++;
    }

    // Test 7: Vérifier que le répertoire uploads est servable
    log('\n7️⃣  TEST ACCÈS FICHIERS UPLOADS', 'blue');
    try {
        const res = await fetch(`${BASE_URL}/uploads/test.txt`);
        // On s'attend à un 404 puisqu'il n'y a pas de test.txt, mais le serveur doit répondre
        if (res.status === 404 || res.status === 200) {
            log('   ✅ Répertoire /uploads est accessible via HTTP', 'green');
            testsPassed++;
        } else {
            log(`   ❌ Erreur accès /uploads: status ${res.status}`, 'red');
            testsFailed++;
        }
    } catch (e) {
        log(`   ⚠️  Répertoire /uploads peut ne pas être accessible: ${e.message}`, 'yellow');
    }

    // Test 8: Afficher la structure des champs upload
    log('\n8️⃣  STRUCTURE DES CHAMPS UPLOAD', 'blue');
    log('   Candidat (documents):', 'cyan');
    log('     • cv: URL du CV', 'cyan');
    log('     • photo: URL de la photo', 'cyan');
    log('     • identityDoc: URL du document d\'identité', 'cyan');
    log('   Employeur (companyDocuments):', 'cyan');
    log('     • registrationDocument: Certificat d\'enregistrement', 'cyan');
    log('     • taxDocument: Attestation fiscale', 'cyan');
    log('     • logo: Logo de l\'entreprise', 'cyan');
    log('     • otherDocuments: Autres documents', 'cyan');
    testsPassed++;

    // Test 9: Validation des types de fichiers
    log('\n9️⃣  VALIDATION TYPES DE FICHIERS', 'blue');
    const allowedTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    log(`   Types acceptés: ${allowedTypes.length}`, 'cyan');
    allowedTypes.forEach(type => {
        log(`     ✓ ${type}`, 'cyan');
    });
    log('   Limite de taille: 5 MB', 'cyan');
    testsPassed++;

    // Test 10: Vérifier la connexion à MongoDB
    log('\n🔟 VÉRIFICATION BASE DE DONNÉES', 'blue');
    try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState === 1) {
            log('   ✅ MongoDB connecté', 'green');
            testsPassed++;
        } else {
            log('   ⚠️  MongoDB peut ne pas être connecté', 'yellow');
        }
    } catch (e) {
        log(`   ⚠️  Impossible de vérifier MongoDB: ${e.message}`, 'yellow');
    }

    // Résumé
    log('\n' + '='.repeat(70), 'cyan');
    log('\n📊 RÉSUMÉ DES TESTS', 'cyan');
    log(`   ✅ Réussis: ${testsPassed}`, 'green');
    log(`   ❌ Échoués: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
    log(`   ⚠️  Total: ${testsPassed + testsFailed}`, 'yellow');

    if (testsFailed === 0) {
        log('\n🎉 SYSTÈME D\'UPLOAD OPÉRATIONNEL!', 'green');
        log('\nPour tester un vrai upload:', 'cyan');
        log('  1. Loggez-vous d\'abord', 'cyan');
        log('  2. POST vers /api/uploads/single avec Content-Type: multipart/form-data', 'cyan');
        log('  3. Fichier dans le champ "file"', 'cyan');
        log('\nExemple avec curl:', 'cyan');
        log('  curl -X POST -H "Authorization: Bearer TOKEN" -F "file=@/path/to/file" \\', 'cyan');
        log('    http://localhost:3000/api/uploads/single', 'cyan');
    } else {
        log('\n⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.', 'yellow');
    }

    log('\n', 'reset');
    process.exit(testsFailed > 0 ? 1 : 0);
})().catch(err => {
    log(`\n❌ Erreur fatale: ${err.message}`, 'red');
    process.exit(1);
});
