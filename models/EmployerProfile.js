const mongoose = require('mongoose');

const employerProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    companyName: { type: String, required: true },
    companyType: { type: String },
    registrationNumber: { type: String },
    taxNumber: { type: String },
    sector: { type: String },
    employeeCount: { type: String },
    companyDescription: { type: String },
    website: { type: String },
    documents: {
        registrationDocument: { type: String },
        taxDocument: { type: String },
        logo: { type: String },
        otherDocuments: [String]
    },
    contactName: { type: String },
    contactPosition: { type: String },
    isVerified: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

employerProfileSchema.index({ sector: 1 });

module.exports = mongoose.model('EmployerProfile', employerProfileSchema);


