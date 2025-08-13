const router = require('express').Router();
const Video = require('../models/Video');
const User = require('../models/User');
const { authMiddleware, subscriberOnly } = require('../middleware/auth');

// Ajouter/retirer des favoris
router.post('/:videoId', authMiddleware, subscriberOnly, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const video = await Video.findById(req.params.videoId);
        
        if (!video) {
            return res.status(404).json({ message: 'Vidéo non trouvée' });
        }
        
        const index = user.favorites.indexOf(video._id);
        if (index === -1) {
            // Ajouter aux favoris
            user.favorites.push(video._id);
            await user.save();
            res.json({ message: 'Vidéo ajoutée aux favoris', action: 'added' });
        } else {
            // Retirer des favoris
            user.favorites.splice(index, 1);
            await user.save();
            res.json({ message: 'Vidéo retirée des favoris', action: 'removed' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Lister les favoris
router.get('/', authMiddleware, subscriberOnly, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('favorites');
        res.json(user.favorites);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;