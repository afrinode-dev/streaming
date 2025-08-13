const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const { authMiddleware, subscriberOnly, adminOnly } = require('../middleware/auth');

// Configuration de Multer pour l'upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /mp4|mov|avi|mkv/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Seules les vidéos sont autorisées'));
        }
    }
});

// Upload de vidéo (admin seulement)
router.post('/upload', authMiddleware, adminOnly, upload.single('video'), async (req, res) => {
    try {
        const { title, description, category } = req.body;
        
        const video = new Video({
            title,
            description,
            filename: req.file.filename,
            category,
            size: req.file.size,
            uploadedBy: req.user._id
        });
        
        await video.save();
        res.status(201).json(video);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de l\'upload' });
    }
});

// Lister les vidéos (abonnés seulement)
router.get('/', authMiddleware, subscriberOnly, async (req, res) => {
    try {
        const videos = await Video.find().sort({ uploadedAt: -1 });
        res.json(videos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Recherche de vidéos
router.get('/search', authMiddleware, subscriberOnly, async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ message: 'Requête de recherche vide' });
        }
        
        const videos = await Video.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        });
        
        res.json(videos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Détails d'une vidéo
router.get('/:id', authMiddleware, subscriberOnly, async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) {
            return res.status(404).json({ message: 'Vidéo non trouvée' });
        }
        
        res.json(video);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;