const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Informations candidat
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    birthDate: { type: Date, required: true },
    education: { type: String, required: true },
    
    // Localisation
    province: { type: String, required: true },
    prefecture: { type: String, required: true },
    subPrefecture: { type: String },
    
    // Contact
    phone: { type: String, required: true },
    email: { type: String, required: true },
    
    // Documents
    documents: [String],
    
    // Message
    message: { type: String },
    
    // Statut
    status: {
        type: String,
        enum: ['pending', 'reviewing', 'shortlisted', 'rejected', 'accepted'],
        default: 'pending'
    },
    
    // Notes
    notes: { type: String },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Index
applicationSchema.index({ jobId: 1, candidateId: 1 });
applicationSchema.index({ candidateId: 1 });
applicationSchema.index({ status: 1 });

module.exports = mongoose.model('Application', applicationSchema);

