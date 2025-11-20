const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    userType: {
        type: String,
        enum: ['candidate', 'employer', 'visitor'],
        default: 'visitor'
    },
    
    // Statut
    status: {
        type: String,
        enum: ['new', 'in_progress', 'resolved', 'closed'],
        default: 'new'
    },
    
    // Réponse
    response: { type: String },
    respondedBy: { type: String },
    respondedAt: { type: Date },
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contact', contactSchema);

