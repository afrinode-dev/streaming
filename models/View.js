const mongoose = require('mongoose');

const viewSchema = new mongoose.Schema({
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    viewedAt: {
        type: Date,
        default: Date.now
    },
    duration: Number // en secondes
});

module.exports = mongoose.model('View', viewSchema);