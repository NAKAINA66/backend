const express = require('express');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        Object.assign(user, req.body);
        user.updatedAt = Date.now();
        
        await user.save();
        
        res.json({ success: true, message: 'Profil mis à jour', user: user.getProfile() });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

// ============== ADMIN ENDPOINTS ==============
// Liste des utilisateurs (admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { userType, search, page = 1, limit = 20 } = req.query;
        const query = {};
        if (userType) query.userType = userType;
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { companyName: { $regex: search, $options: 'i' } }
            ];
        }
        const list = await User.find(query).sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit).select('-password');
        const total = await User.countDocuments(query);
        res.json({ success: true, users: list, totalPages: Math.ceil(total / limit), currentPage: Number(page), total });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Mise à jour par admin (rôle/statut)
router.put('/:id/admin', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const allowed = ['userType', 'isActive', 'isVerified'];
        const update = {};
        allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
        update.updatedAt = Date.now();
        const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        res.json({ success: true, message: 'Utilisateur mis à jour', user });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Suppression par admin
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Utilisateur supprimé' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

