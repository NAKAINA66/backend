const express = require('express');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const nodemailer = require('nodemailer');
const router = express.Router();

// Apply to job
router.post('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.userType !== 'candidat') {
            return res.status(403).json({ success: false, message: 'Accès candidat requis' });
        }
        
        const { jobId } = req.body;
        
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Offre non trouvée' });
        }
        
        // Check if already applied
        const existingApplication = await Application.findOne({
            jobId,
            candidateId: req.user._id
        });
        
        if (existingApplication) {
            return res.status(400).json({ success: false, message: 'Vous avez déjà postulé à cette offre' });
        }
        
        const application = new Application({
            ...req.body,
            jobId,
            candidateId: req.user._id
        });
        
        await application.save();
        
        // Increment applications count
        job.applicationsCount += 1;
        await job.save();
        // Notification email (best-effort)
        try {
            if (process.env.MAIL_HOST) {
                const transporter = nodemailer.createTransport({
                    host: process.env.MAIL_HOST,
                    port: Number(process.env.MAIL_PORT) || 587,
                    secure: false,
                    auth: process.env.MAIL_USER && process.env.MAIL_PASS ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS } : undefined
                });
                // Récupérer l'email de l'employeur depuis le User
                const employer = await User.findById(job.employerId).select('email');
                const employerEmail = employer?.email || process.env.MAIL_TO || 'admin@khadamona.td';
                
                await transporter.sendMail({
                    from: process.env.MAIL_FROM || 'no-reply@khadamona.td',
                    to: employerEmail,
                    subject: `Nouvelle candidature pour: ${job.title}`,
                    text: `${req.user.firstName || ''} ${req.user.lastName || ''} a postulé à l'offre ${job.title}.`
                });
            }
        } catch (e) {
            // ne bloque pas la réponse si email échoue
        }

        res.status(201).json({ success: true, message: 'Candidature envoyée', application });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get my applications (candidate)
router.get('/my-applications', authMiddleware, async (req, res) => {
    try {
        const applications = await Application.find({ candidateId: req.user._id })
            .populate('jobId')
            .sort({ createdAt: -1 });
        
        res.json({ success: true, applications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get job applications (employer)
router.get('/job/:jobId', authMiddleware, async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        
        if (!job) {
            return res.status(404).json({ success: false, message: 'Offre non trouvée' });
        }
        
        if (job.employerId.toString() !== req.user._id.toString() && req.user.userType !== 'admin') {
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        }
        
        const applications = await Application.find({ jobId: req.params.jobId })
            .populate('candidateId', 'firstName lastName email phone')
            .sort({ createdAt: -1 });
        
        res.json({ success: true, applications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update application status
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ success: false, message: 'Candidature non trouvée' });
        }
        
        const job = await Job.findById(application.jobId);
        if (job.employerId.toString() !== req.user._id.toString() && req.user.userType !== 'admin') {
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        }
        
        application.status = req.body.status;
        application.notes = req.body.notes;
        application.updatedAt = Date.now();
        
        await application.save();
        
        res.json({ success: true, message: 'Statut mis à jour', application });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Admin: lister toutes les candidatures avec filtres
router.get('/admin/all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status, jobId, candidateEmail, page = 1, limit = 20 } = req.query;
        const query = {};
        if (status) query.status = status;
        if (jobId) query.jobId = jobId;
        if (candidateEmail) query.email = { $regex: candidateEmail, $options: 'i' };
        const list = await Application.find(query).populate('jobId').populate('candidateId', 'firstName lastName email').sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit);
        const total = await Application.countDocuments(query);
        res.json({ success: true, applications: list, totalPages: Math.ceil(total / limit), currentPage: Number(page), total });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Admin: récupérer une candidature par id
router.get('/admin/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const app = await Application.findById(req.params.id).populate('jobId').populate('candidateId', 'firstName lastName email phone');
        if (!app) return res.status(404).json({ success: false, message: 'Candidature non trouvée' });
        res.json({ success: true, application: app });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;

