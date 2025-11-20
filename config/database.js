const mongoose = require('mongoose');

// Configuration de la base de données
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://ndorsoumna_db_user:lw7XtdNt7w62sN7I@cluster0.wtpnm1i.mongodb.net/khadamona';
        
        const conn = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // Options recommandées pour MongoDB Atlas
            retryWrites: true,
            w: 'majority'
        });

        console.log(`✅ MongoDB Atlas connecté: ${conn.connection.host}`);
        console.log(`📊 Base de données: ${conn.connection.name}`);
        
    } catch (error) {
        console.error('❌ Erreur de connexion MongoDB Atlas:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;