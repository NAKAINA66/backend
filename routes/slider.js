const express = require('express');
const Slider = require('../models/Slider');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// Public: slides actifs triés
router.get('/active', async (req, res) => {
    try {
        const slides = await Slider.find({ active: true }).sort({ order: 1, createdAt: -1 });
        res.json({ success: true, slides });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Admin: lister tous les slides
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const slides = await Slider.find().sort({ order: 1, createdAt: -1 });
        res.json({ success: true, slides });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Admin: créer un slide
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const slide = new Slider(req.body);
        await slide.save();
        res.status(201).json({ success: true, message: 'Slide créé', slide });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Admin: mettre à jour
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        req.body.updatedAt = Date.now();
        const slide = await Slider.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!slide) return res.status(404).json({ success: false, message: 'Slide non trouvé' });
        res.json({ success: true, message: 'Slide mis à jour', slide });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Admin: supprimer
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await Slider.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Slide supprimé' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;


