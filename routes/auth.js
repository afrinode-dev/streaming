const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

// Inscription
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Nom d\'utilisateur ou email déjà utilisé' });
        }
        
        // Créer un nouvel utilisateur
        const user = new User({ username, email, password });
        await user.save();
        
        // Générer un token JWT
        const token = jwt.sign(
            { _id: user._id, username: user.username, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );
        
        res.status(201).json({ token, user: { id: user._id, username: user.username, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Connexion
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Vérifier si l'utilisateur existe
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }
        
        // Vérifier le mot de passe
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }
        
        // Mettre à jour la dernière connexion
        user.lastLogin = new Date();
        await user.save();
        
        // Générer un token JWT
        const token = jwt.sign(
            { _id: user._id, username: user.username, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );
        
        res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Vérification du token
router.get('/verify', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Non autorisé' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded._id);
        
        if (!user) {
            return res.status(401).json({ message: 'Non autorisé' });
        }
        
        res.json({ user: { id: user._id, username: user.username, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(401).json({ message: 'Non autorisé' });
    }
});

module.exports = router;