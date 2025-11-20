const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    userType: {
        type: String,
        enum: ['candidat', 'employeur', 'admin'],
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    
    // Informations personnelles (Candidat)
    firstName: { type: String },
    lastName: { type: String },
    phone: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    
    // Localisation
    province: { type: String },
    prefecture: { type: String },
    subPrefecture: { type: String },
    address: { type: String },
    
    // Informations professionnelles (Candidat)
    educationLevel: { type: String },
    experience: { type: String },
    skills: [String],
    documents: {
        cv: { type: String },
        photo: { type: String },
        identityDoc: { type: String }
    },
    
    // Informations entreprise (Employeur)
    companyName: { type: String },
    companyType: { type: String },
    registrationNumber: { type: String },
    taxNumber: { type: String },
    sector: { type: String },
    employeeCount: { type: String },
    companyDescription: { type: String },
    website: { type: String },
    companyDocuments: {
        registrationDocument: { type: String },
        taxDocument: { type: String },
        logo: { type: String },
        otherDocuments: [String]
    },
    contactName: { type: String },
    contactPosition: { type: String },
    employerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'EmployerProfile' },
    
    // Statut et vérification
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    
    // Newsletter
    newsletter: { type: Boolean, default: false },
    
    // Password reset
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    
    // Dates
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Get user profile data
userSchema.methods.getProfile = function() {
    const profile = this.toObject();
    delete profile.password;
    return profile;
};

module.exports = mongoose.model('User', userSchema);

