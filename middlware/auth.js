const jwt = require('jsonwebtoken');
const User = require('../models/User');

function authMiddleware(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ message: 'Authentification requise' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token invalide' });
    }
}

function adminOnly(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
    }
    next();
}

function subscriberOnly(req, res, next) {
    if (req.user.role !== 'subscriber' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Abonnement requis' });
    }
    next();
}

module.exports = { authMiddleware, adminOnly, subscriberOnly };