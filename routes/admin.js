const router = require('express').Router();
const User = require('../models/User');
const Video = require('../models/Video');
const View = require('../models/View');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Statistiques
router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalVideos = await Video.countDocuments();
        const totalViews = await View.countDocuments();
        const totalSubscribers = await User.countDocuments({ role: 'subscriber' });
        
        // Vues par jour (7 derniers jours)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const viewsPerDay = await View.aggregate([
            { $match: { viewedAt: { $gte: sevenDaysAgo } } },
            { $group: { 
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$viewedAt" } },
                count: { $sum: 1 }
            }},
            { $sort: { _id: 1 } },
            { $project: { date: "$_id", views: "$count", _id: 0 } }
        ]);
        
        res.json({
            totalUsers,
            totalVideos,
            totalViews,
            totalSubscribers,
            viewsPerDay
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Gestion des utilisateurs
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
    try {
        const users = await User.find({}, 'username email role createdAt');
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

router.put('/users/:id/role', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

router.delete('/users/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Gestion des vidéos
router.get('/videos', authMiddleware, adminOnly, async (req, res) => {
    try {
        const videos = await Video.find({}, 'title category uploadedAt views');
        res.json(videos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

router.delete('/videos/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const video = await Video.findByIdAndDelete(req.params.id);
        if (!video) {
            return res.status(404).json({ message: 'Vidéo non trouvée' });
        }
        
        // Supprimer le fichier vidéo
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '../../uploads', video.filename);
        
        fs.unlink(filePath, (err) => {
            if (err) console.error('Erreur lors de la suppression du fichier:', err);
        });
        
        res.json({ message: 'Vidéo supprimée avec succès' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;