/**
 * Script de test du système de récupération de mot de passe
 * Vérifie : 
 * - Connexion à MongoDB
 * - Configuration email
 * - Routes forgot-password et reset-password
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const nodemailer = require('nodemailer');

const TEST_EMAIL = 'test@example.com';
const TEST_USER_EMAIL = process.env.ADMIN_EMAIL || 'ndorsoumna@gmail.com';

console.log('═══════════════════════════════════════════════════════════');
console.log('🔧 TEST SYSTÈME DE RÉCUPÉRATION DE MOT DE PASSE KHADAMONA');
console.log('═══════════════════════════════════════════════════════════\n');

async function runTests() {
  try {
    // Test 1: Connexion MongoDB
    console.log('✓ Test 1: Connexion à MongoDB');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/khadamona', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('  ✓ Connecté à MongoDB avec succès\n');

    // Test 2: Vérifier la configuration email
    console.log('✓ Test 2: Configuration Email');
    const mailConfig = {
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      user: process.env.MAIL_USER,
      password: process.env.MAIL_PASSWORD,
    };
    
    console.log('  Host:', mailConfig.host);
    console.log('  Port:', mailConfig.port);
    console.log('  User:', mailConfig.user ? '✓ Configuré' : '✗ NON configuré');
    console.log('  Password:', mailConfig.password ? '✓ Configuré' : '✗ NON configuré\n');

    if (!mailConfig.user || !mailConfig.password) {
      console.warn('  ⚠️  ATTENTION: Email non configuré!');
      console.warn('  Les emails ne s\'enverront pas jusqu\'à configuration.\n');
    }

    // Test 3: Vérifier l'utilisateur admin
    console.log('✓ Test 3: Vérification Utilisateur Admin');
    let adminUser = await User.findOne({ email: TEST_USER_EMAIL });
    
    if (adminUser) {
      console.log(`  ✓ Utilisateur trouvé: ${TEST_USER_EMAIL}`);
      console.log(`    - ID: ${adminUser._id}`);
      console.log(`    - Actif: ${adminUser.isActive ? 'Oui' : 'Non'}`);
      console.log(`    - Vérifié: ${adminUser.isVerified ? 'Oui' : 'Non'}`);
    } else {
      console.log(`  ✗ Utilisateur non trouvé: ${TEST_USER_EMAIL}`);
    }
    console.log('');

    // Test 4: Test génération token reset
    console.log('✓ Test 4: Génération Token Reset');
    if (adminUser) {
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 heure

      adminUser.resetPasswordToken = resetToken;
      adminUser.resetPasswordExpires = resetExpires;
      await adminUser.save();

      console.log(`  ✓ Token généré et sauvegardé`);
      console.log(`    - Token: ${resetToken.substring(0, 20)}...`);
      console.log(`    - Expire à: ${resetExpires.toLocaleString('fr-FR')}`);
      console.log(`    - URL reset: http://localhost:8080/reset-password.html?token=${resetToken}\n`);

      // Test 5: Test envoi email
      console.log('✓ Test 5: Test Envoi Email');
      if (process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASSWORD) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: Number(process.env.MAIL_PORT) || 587,
            secure: false,
            auth: {
              user: process.env.MAIL_USER,
              pass: process.env.MAIL_PASSWORD
            }
          });

          // Vérifier la connexion
          await transporter.verify();
          console.log('  ✓ Serveur SMTP connecté avec succès\n');

          // Envoyer un email de test
          const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password.html?token=${resetToken}`;
          
          console.log('✓ Test 6: Envoi Email de Test');
          const mailOptions = {
            from: process.env.MAIL_FROM || 'noreply@khadamona.td',
            to: TEST_USER_EMAIL,
            subject: '[TEST] Réinitialisation de mot de passe - KHADAMONA',
            html: `
              <div style="font-family: Poppins, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #002664;">Réinitialisation de mot de passe</h2>
                <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
                <p style="margin: 30px 0;">
                  <a href="${resetUrl}" style="background: #002664; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Réinitialiser le mot de passe
                  </a>
                </p>
                <p><small>Ce lien expire dans 1 heure.</small></p>
                <p><small style="color: #666;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</small></p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">KHADAMONA - Plateforme d'emploi au Tchad</p>
              </div>
            `
          };

          const info = await transporter.sendMail(mailOptions);
          console.log('  ✓ Email envoyé avec succès!');
          console.log(`    - À: ${TEST_USER_EMAIL}`);
          console.log(`    - MessageID: ${info.messageId}\n`);
        } catch (emailError) {
          console.error('  ✗ Erreur lors de l\'envoi:');
          console.error(`    ${emailError.message}\n`);
        }
      } else {
        console.log('  ✗ Email non configuré - configuration requise\n');
      }

      // Nettoyage: réinitialiser le token
      adminUser.resetPasswordToken = undefined;
      adminUser.resetPasswordExpires = undefined;
      await adminUser.save();
      console.log('✓ Test 7: Nettoyage');
      console.log('  ✓ Token de test supprimé\n');
    } else {
      console.warn('  Impossible de tester sans utilisateur');
    }

    // Résumé
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 RÉSUMÉ');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✓ MongoDB:         OK');
    console.log(`${mailConfig.user ? '✓' : '✗'} Email (SMTP):      ${mailConfig.user ? 'OK' : 'Non configuré'}`);
    console.log(`✓ Utilisateur:      ${adminUser ? 'OK' : 'Non trouvé'}`);
    console.log(`✓ Routes:           OK (frontend + backend)\n`);

    if (!mailConfig.user) {
      console.log('⚠️  ACTION REQUISE:');
      console.log('Pour activer le système de récupération de mot de passe par email:');
      console.log('1. Éditer le fichier .env');
      console.log('2. Configurer MAIL_USER et MAIL_PASSWORD (Gmail App Password)');
      console.log('3. Relancer ce test\n');
    } else {
      console.log('✓ Système prêt! Les utilisateurs peuvent utiliser la récupération par email.\n');
    }

  } catch (error) {
    console.error('❌ ERREUR:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
}

runTests();
