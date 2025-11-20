const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const EmployerProfile = require('../models/EmployerProfile');
const router = express.Router();

// Register Candidate
router.post('/register/candidate', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('phone').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        
        const { email, password, username, ...candidateData } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email déjà utilisé' });
        }
        
        // Create user
        const user = new User({
            email,
            password,
            username,
            userType: 'candidat',
            ...candidateData
        });
        
        await user.save();
        
        // Generate token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.status(201).json({
            success: true,
            message: 'Compte créé avec succès',
            token,
            user: user.getProfile()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Register Employer
router.post('/register/employer', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('companyName').notEmpty(),
    body('province').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        
        const { email, password, username, ...employerData } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email déjà utilisé' });
        }
        
        const user = new User({
            email,
            password,
            username,
            userType: 'employeur',
            ...employerData,
            isVerified: true
        });
        
        await user.save();
        
        // Create employer profile and link to user
        const profile = new EmployerProfile({
            userId: user._id,
            companyName: employerData.companyName,
            companyType: employerData.companyType,
            registrationNumber: employerData.registrationNumber,
            taxNumber: employerData.taxNumber,
            sector: employerData.sector,
            employeeCount: employerData.employeeCount,
            companyDescription: employerData.companyDescription,
            website: employerData.website,
            contactName: employerData.contactName,
            contactPosition: employerData.contactPosition,
            isVerified: true
        });
        await profile.save();
        user.employerProfile = profile._id;
        await user.save();
        
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.status(201).json({
            success: true,
            message: 'Compte employeur créé avec succès',
            token,
            user: user.getProfile(),
            employerProfile: profile
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for email:', email);
        
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
        }
        
        const user = await User.findOne({ email });
        if (!user) console.log('Login failed: user not found for', email);
        else console.log('Login: user found', { id: user._id.toString(), email: user.email, isActive: user.isActive });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
        }
        
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
        }
        
        if (!user.isActive) {
            return res.status(401).json({ success: false, message: 'Compte désactivé' });
        }
        
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
            success: true,
            message: 'Connexion réussie',
            token,
            user: user.getProfile()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get current user
router.get('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
    try {
        res.json({ success: true, user: req.user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Forgot password - Request reset
router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Forgot password - validation error:', errors.array());
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        
        const { email } = req.body;
        console.log('🔐 Forgot password request for email:', email);
        
        const user = await User.findOne({ email });
        
        // Ne pas révéler si l'email existe ou non pour la sécurité
        if (!user) {
            console.log('   ℹ️  User not found, but returning success (security):', email);
            return res.json({ 
                success: true, 
                message: 'Si cet email existe, un lien de réinitialisation a été envoyé' 
            });
        }
        
        console.log('   ✓ User found:', { id: user._id.toString(), email: user.email });
        
        // Générer un token de réinitialisation
        const crypto = require('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = Date.now() + 3600000; // 1 heure
        
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(resetExpires);
        await user.save();
        console.log('   📧 Reset token generated:', { token: resetToken.substring(0, 20) + '...', expiresIn: '1 heure' });
        
        // Envoyer l'email (si configuré)
        try {
            if (process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASSWORD) {
                console.log('   ↗️  Attempting to send reset email via SMTP...');
                const nodemailer = require('nodemailer');
                const transporter = nodemailer.createTransport({
                    host: process.env.MAIL_HOST,
                    port: Number(process.env.MAIL_PORT) || 587,
                    secure: false,
                    auth: {
                        user: process.env.MAIL_USER,
                        pass: process.env.MAIL_PASSWORD
                    }
                });
                
                const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password.html?token=${resetToken}`;
                
                await transporter.sendMail({
                    from: process.env.MAIL_FROM || 'no-reply@khadamona.td',
                    to: email,
                    subject: 'Réinitialisation de votre mot de passe - KHADAMONA',
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
                });
                console.log('   ✅ Email sent successfully to:', email);
            } else {
                console.warn('   ⚠️  Email not configured - configure MAIL_HOST, MAIL_USER, MAIL_PASSWORD in .env');
            }
        } catch (emailError) {
            console.error('   ❌ Email send error:', emailError.message);
            // Ne pas bloquer la réponse si l'email échoue
        }
        
        res.json({ 
            success: true, 
            message: 'Si cet email existe, un lien de réinitialisation a été envoyé' 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Reset password - With token
router.post('/reset-password', [
    body('token').notEmpty(),
    body('password').isLength({ min: 6 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        
        const { token, password } = req.body;
        
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({ 
                success: false, 
                message: 'Token invalide ou expiré' 
            });
        }
        
        // Mettre à jour le mot de passe
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        
        res.json({ 
            success: true, 
            message: 'Mot de passe réinitialisé avec succès' 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Verify reset token
router.get('/verify-reset-token/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({ 
                success: false, 
                message: 'Token invalide ou expiré' 
            });
        }
        
        res.json({ success: true, message: 'Token valide' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

