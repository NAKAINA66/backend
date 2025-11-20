const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    employerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    employerProfileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmployerProfile'
    },
    employerName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    sector: { type: String, required: true },
    contractType: {
        type: String,
        enum: ['CDI', 'CDD', 'Stage', 'Freelance', 'Temporaire'],
        required: true
    },
    province: { type: String, required: true },
    prefecture: { type: String, required: true },
    subPrefecture: { type: String },
    address: { type: String },
    
    // Détails du poste
    openPositions: { type: Number, required: true, min: 1 },
    salary: { type: String },
    educationLevel: { type: String },
    experienceRequired: { type: String },
    
    // Documents
    documents: [String],
    
    // Dates
    applicationStart: { type: Date, required: true },
    applicationEnd: { type: Date, required: true },
    
    // Statut
    status: {
        type: String,
        enum: ['active', 'paused', 'closed'],
        default: 'active'
    },
    isPublished: { type: Boolean, default: false },
    
    // Statistiques
    views: { type: Number, default: 0 },
    applicationsCount: { type: Number, default: 0 },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Index pour les recherches
jobSchema.index({ employerId: 1 });
jobSchema.index({ sector: 1 });
jobSchema.index({ province: 1, prefecture: 1 });
jobSchema.index({ applicationEnd: 1 });
jobSchema.index({ status: 1, isPublished: 1 });

module.exports = mongoose.model('Job', jobSchema);


