const express = require('express');
const Contact = require('../models/Contact');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const nodemailer = require('nodemailer');
const router = express.Router();

// Create contact message
router.post('/', async (req, res) => {
    try {
        const contact = new Contact(req.body);
        await contact.save();
        // Notification email (best-effort)
        try {
            if (process.env.MAIL_HOST) {
                const transporter = nodemailer.createTransport({
                    host: process.env.MAIL_HOST,
                    port: Number(process.env.MAIL_PORT) || 587,
                    secure: false,
                    auth: process.env.MAIL_USER && process.env.MAIL_PASS ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS } : undefined
                });
                await transporter.sendMail({
                    from: process.env.MAIL_FROM || 'no-reply@khadamona.td',
                    to: process.env.MAIL_TO || 'admin@khadamona.td',
                    subject: `Nouveau message de contact: ${contact.subject}`,
                    text: `${contact.fullName} (${contact.email})\n\n${contact.message}`
                });
            }
        } catch (e) {}

        res.status(201).json({ 
            success: true, 
            message: 'Message envoyé avec succès', 
            contact 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all messages (admin)
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const messages = await Contact.find().sort({ createdAt: -1 });
        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Mettre à jour le statut/réponse d'un message (admin)
router.put('/:id/reply', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status, response } = req.body;
        const contact = await Contact.findById(req.params.id);
        if (!contact) {
            return res.status(404).json({ success: false, message: 'Message non trouvé' });
        }
        if (status) contact.status = status;
        if (response) {
            contact.response = response;
            contact.respondedBy = req.user.email;
            contact.respondedAt = new Date();
        }
        await contact.save();
        res.json({ success: true, message: 'Message mis à jour', contact });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

