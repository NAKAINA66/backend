const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ success: false, message: 'Accès non autorisé' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'Utilisateur non trouvé' });
        }
        
        if (!user.isActive) {
            return res.status(401).json({ success: false, message: 'Compte désactivé' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Token invalide' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ success: false, message: 'Accès admin requis' });
    }
    next();
};

const employerMiddleware = (req, res, next) => {
    if (req.user.userType !== 'employeur' && req.user.userType !== 'admin') {
        return res.status(403).json({ success: false, message: 'Accès employeur requis' });
    }
    next();
};

module.exports = { authMiddleware, adminMiddleware, employerMiddleware };