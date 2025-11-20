const express = require('express');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { authMiddleware, employerMiddleware, adminMiddleware } = require('../middleware/auth');
const EmployerProfile = require('../models/EmployerProfile');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Get all jobs (public)
router.get('/', async (req, res) => {
    try {
        const { sector, province, prefecture, contractType, search, page = 1, limit = 20, sort = 'createdAt' } = req.query;
        
        const query = { isPublished: true, status: 'active' };
        
        if (sector) query.sector = sector;
        if (province) query.province = province;
        if (prefecture) query.prefecture = prefecture;
        if (contractType) query.contractType = contractType;
        
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { employerName: { $regex: search, $options: 'i' } }
            ];
        }
        
        const sortBy = sort === 'end' ? { applicationEnd: 1 } : { createdAt: -1 };
        const jobs = await Job.find(query)
            .sort(sortBy)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('employerId', 'companyName email');
        
        const total = await Job.countDocuments(query);
        
        res.json({
            success: true,
            jobs,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
            total
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single job
router.get('/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('employerId', 'companyName companyDescription website email');
        
        if (!job) {
            return res.status(404).json({ success: false, message: 'Offre non trouvée' });
        }
        
        // Increment views
        job.views += 1;
        await job.save();
        
        res.json({ success: true, job });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create job (any authenticated user)
router.post(
    '/',
    authMiddleware,
    employerMiddleware,
    [
        body('title').notEmpty(),
        body('description').isLength({ min: 20 }),
        body('sector').notEmpty(),
        body('contractType').isIn(['CDI', 'CDD', 'Stage', 'Freelance', 'Temporaire']),
        body('province').notEmpty(),
        body('prefecture').notEmpty(),
        body('openPositions').isInt({ min: 1 }),
        body('applicationStart').isISO8601(),
        body('applicationEnd').isISO8601()
    ],
    async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        // Build a safe employerName even for non-employers
        const employerName = (
            (req.user && req.user.companyName) ||
            ([req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ').trim()) ||
            req.user?.email ||
            'Utilisateur'
        );

        // Ensure employer profile exists and is verified
        let employerProfileId = req.user.employerProfile;
        if (!employerProfileId) {
            const created = await EmployerProfile.create({
                userId: req.user._id,
                companyName: req.user.companyName || employerName,
                sector: req.user.sector,
                website: req.user.website,
                isVerified: true
            });
            employerProfileId = created._id;
            req.user.employerProfile = created._id;
            req.user.isVerified = true;
            await req.user.save();
        } else {
            await EmployerProfile.findByIdAndUpdate(employerProfileId, { isVerified: true, updatedAt: Date.now() });
            if (!req.user.isVerified) {
                req.user.isVerified = true;
                await req.user.save();
            }
        }

        const job = new Job({
            ...req.body,
            employerId: req.user._id,
            employerProfileId,
            employerName
        });
        
        await job.save();
        
        res.status(201).json({ success: true, message: 'Offre créée', job });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update job
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        
        if (!job) {
            return res.status(404).json({ success: false, message: 'Offre non trouvée' });
        }
        
        if (job.employerId.toString() !== req.user._id.toString() && req.user.userType !== 'admin') {
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        }
        
        Object.assign(job, req.body);
        job.updatedAt = Date.now();
        await job.save();
        
        res.json({ success: true, message: 'Offre mise à jour', job });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete job
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        
        if (!job) {
            return res.status(404).json({ success: false, message: 'Offre non trouvée' });
        }
        
        if (job.employerId.toString() !== req.user._id.toString() && req.user.userType !== 'admin') {
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        }
        
        await Job.findByIdAndDelete(req.params.id);
        
        res.json({ success: true, message: 'Offre supprimée' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get employer jobs
router.get('/employer/my-jobs', authMiddleware, async (req, res) => {
    try {
        const jobs = await Job.find({ employerId: req.user._id })
            .sort({ createdAt: -1 });
        
        res.json({ success: true, jobs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

