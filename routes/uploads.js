const express = require('express');
const path = require('path');
const { upload, uploadMultiple } = require('../config/upload');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// Upload d'un fichier (image/document)
router.post('/single', authMiddleware, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Aucun fichier reçu' });
    }

    const fileUrl = `/uploads/${path.basename(req.file.path)}`;
    res.status(201).json({ success: true, file: { name: req.file.originalname, url: fileUrl, mime: req.file.mimetype, size: req.file.size } });
});

// Upload de plusieurs fichiers
router.post('/multiple', authMiddleware, (req, res, next) => {
    uploadMultiple(req, res, function(err) {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        const files = (req.files || []).map(f => ({
            name: f.originalname,
            url: `/uploads/${path.basename(f.path)}`,
            mime: f.mimetype,
            size: f.size
        }));
        res.status(201).json({ success: true, files });
    });
});

module.exports = router;


