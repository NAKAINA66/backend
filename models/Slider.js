const mongoose = require('mongoose');

const sliderSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    buttonText: { type: String },
    buttonLink: { type: String },
    backgroundColor: { type: String, default: 'linear-gradient(135deg, #002664 0%, #ffd700 100%)' },
    order: { type: Number, default: 1 },
    active: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

sliderSchema.index({ active: 1, order: 1 });

module.exports = mongoose.model('Slider', sliderSchema);


