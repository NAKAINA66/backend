const express = require('express');
const EmployerProfile = require('../models/EmployerProfile');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// Liste des profils employeur (admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { search, sector, verified, page = 1, limit = 20 } = req.query;
        const query = {};
        if (sector) query.sector = sector;
        if (verified === 'true') query.isVerified = true;
        if (verified === 'false') query.isVerified = false;
        if (search) {
            query.$or = [
                { companyName: { $regex: search, $options: 'i' } },
                { website: { $regex: search, $options: 'i' } }
            ];
        }
        const items = await EmployerProfile.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('userId', 'email username companyName isVerified');
        const total = await EmployerProfile.countDocuments(query);
        res.json({ success: true, profiles: items, totalPages: Math.ceil(total / limit), currentPage: Number(page), total });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Mise à jour de la vérification (admin)
router.put('/:id/verify', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { isVerified } = req.body;
        const profile = await EmployerProfile.findByIdAndUpdate(
            req.params.id,
            { isVerified: !!isVerified, updatedAt: Date.now() },
            { new: true }
        );
        if (!profile) return res.status(404).json({ success: false, message: 'Profil employeur non trouvé' });
        await User.findByIdAndUpdate(profile.userId, { isVerified: !!isVerified, updatedAt: Date.now() });
        res.json({ success: true, message: 'Statut de vérification mis à jour', profile });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;


