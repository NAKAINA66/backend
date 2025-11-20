const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    documentType: {
        type: String,
        enum: ['cv', 'photo', 'identityDoc', 'registrationDocument', 'taxDocument', 'logo', 'other'],
        default: 'other'
    },
    userType: {
        type: String,
        enum: ['candidat', 'employeur'],
        required: false
    },
    uploadedBy: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['valid', 'invalid', 'pending'],
        default: 'pending'
    },
    validationErrors: [String],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index pour les recherches rapides
uploadSchema.index({ userId: 1 });
uploadSchema.index({ documentType: 1 });
uploadSchema.index({ createdAt: -1 });
uploadSchema.index({ status: 1 });

module.exports = mongoose.model('Upload', uploadSchema);
