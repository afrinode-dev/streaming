const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    filename: {
        type: String,
        required: true
    },
    thumbnail: String,
    category: {
        type: String,
        enum: ['action', 'comedy', 'drama', 'sci-fi', 'horror', 'documentary', 'other'],
        default: 'other'
    },
    duration: Number, // en secondes
    size: Number, // en octets
    views: {
        type: Number,
        default: 0
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    isFeatured: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Video', videoSchema);