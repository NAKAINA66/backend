const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    excerpt: { type: String },
    
    category: {
        type: String,
        enum: ['emploi', 'formation', 'evenement', 'partenariat', 'general'],
        required: true
    },
    
    image: { type: String },
    
    // Auteur
    author: { type: String, default: 'Équipe KHADAMONA' },
    
    // Dates
    publishDate: { type: Date, default: Date.now },
    expirationDate: { type: Date },
    
    // Statut
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    
    // Statistiques
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

newsSchema.index({ category: 1, isPublished: 1 });
newsSchema.index({ publishDate: -1 });
newsSchema.index({ isFeatured: 1 });

module.exports = mongoose.model('News', newsSchema);

