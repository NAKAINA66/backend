const express = require('express');
const News = require('../models/News');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Get all news (public) avec pagination et recherche
router.get('/', async (req, res) => {
    try {
        const { category, search, page = 1, limit = 20 } = req.query;

        const query = { isPublished: true };
        if (category && category !== 'all') {
            query.category = category;
        }
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
                { excerpt: { $regex: search, $options: 'i' } }
            ];
        }

        const list = await News.find(query)
            .sort({ publishDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await News.countDocuments(query);

        res.json({ success: true, news: list, totalPages: Math.ceil(total / limit), currentPage: Number(page), total });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Admin: lister toutes les news (publiées ou non)
router.get('/admin', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { category, search, page = 1, limit = 20 } = req.query;
        const query = {};
        if (category && category !== 'all') query.category = category;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
                { excerpt: { $regex: search, $options: 'i' } }
            ];
        }
        const list = await News.find(query)
            .sort({ publishDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        const total = await News.countDocuments(query);
        res.json({ success: true, news: list, totalPages: Math.ceil(total / limit), currentPage: Number(page), total });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get featured news
router.get('/featured', async (req, res) => {
    try {
        const news = await News.find({ isPublished: true, isFeatured: true })
            .sort({ publishDate: -1 })
            .limit(5);
        
        res.json({ success: true, news });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single news
router.get('/:id', async (req, res) => {
    try {
        const news = await News.findById(req.params.id);
        
        if (!news) {
            return res.status(404).json({ success: false, message: 'Actualité non trouvée' });
        }
        
        news.views += 1;
        await news.save();
        
        res.json({ success: true, news });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create news (admin only)
router.post(
    '/',
    authMiddleware,
    adminMiddleware,
    [
        body('title').notEmpty(),
        body('content').isLength({ min: 20 }),
        body('category').isIn(['emploi', 'formation', 'evenement', 'partenariat', 'general'])
    ],
    async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const news = new News(req.body);
        await news.save();
        
        res.status(201).json({ success: true, message: 'Actualité créée', news });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update news
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const news = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
        
        if (!news) {
            return res.status(404).json({ success: false, message: 'Actualité non trouvée' });
        }
        
        res.json({ success: true, message: 'Actualité mise à jour', news });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete news
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await News.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Actualité supprimée' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

