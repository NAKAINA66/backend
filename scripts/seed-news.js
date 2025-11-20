/**
 * SEED NEWS - Injecter des actualités par défaut dans la base de données
 */

const mongoose = require('mongoose');
const News = require('../models/News');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const defaultNews = [
    {
        title: 'Nouveau partenariat avec l\'Université Adam Barka d\'Abéché',
        excerpt: 'KHADAMONA signe un accord de partenariat avec l\'Université Adam Barka d\'Abéché pour faciliter l\'insertion professionnelle des étudiants.',
        content: '<p>KHADAMONA est fier d\'annoncer la signature d\'un partenariat stratégique avec l\'Université Adam Barka d\'Abéché.</p><p>Cet accord vise à renforcer l\'insertion professionnelle des étudiants tchadiens en facilitant leur accès au marché du travail.</p>',
        category: 'partenariat',
        author: 'Équipe KHADAMONA',
        publishDate: new Date('2025-10-15'),
        isPublished: true,
        isFeatured: true,
        image: 'assets/formationADAM BARKA.png'
    },
    {
        title: 'Formation en développement web : 50 places disponibles',
        excerpt: 'Une formation intensive de 3 mois en développement web sera organisée à N\'Djamena avec le soutien de KHADAMONA.',
        content: '<p>KHADAMONA lance une formation intensive en développement web destinée aux jeunes tchadiens souhaitant se reconvertir dans le secteur numérique.</p><h2>Programme de formation</h2><ul><li>HTML, CSS et JavaScript avancé</li><li>Frameworks modernes (React, Vue.js)</li><li>Développement backend avec Node.js</li></ul>',
        category: 'formation',
        author: 'Service Formation',
        publishDate: new Date('2025-11-12'),
        isPublished: true,
        isFeatured: true,
        image: 'assets/formation dev.png'
    },
    {
        title: 'Salon de l\'emploi 2025 : Plus de 100 entreprises participantes',
        excerpt: 'Le grand salon de l\'emploi KHADAMONA 2025 se tiendra les 15 et 16 décembre à N\'Djamena avec plus de 100 entreprises.',
        content: '<p>Le salon de l\'emploi KHADAMONA 2025 promet d\'être l\'événement de l\'année pour l\'emploi au Tchad.</p><p>Plus de 100 entreprises de tous secteurs seront présentes pour recruter des talents locaux.</p>',
        category: 'evenement',
        author: 'Équipe Événements',
        publishDate: new Date('2025-11-10'),
        isPublished: true,
        isFeatured: false,
        image: 'assets/Salon de l\'emploi.png'
    },
    {
        title: 'Nouvelles offres d\'emploi dans le secteur pétrolier',
        excerpt: 'Plus de 200 postes à pourvoir dans le secteur pétrolier tchadien. Opportunités pour ingénieurs et techniciens.',
        content: '<p>Le secteur pétrolier tchadien connaît un regain d\'activité avec l\'ouverture de nouveaux postes dans plusieurs entreprises du secteur.</p><h2>Postes disponibles</h2><ul><li>Ingénieurs pétroliers (50 postes)</li><li>Techniciens de maintenance (80 postes)</li></ul>',
        category: 'emploi',
        author: 'Service Recrutement',
        publishDate: new Date('2025-11-08'),
        isPublished: true,
        isFeatured: false,
        image: 'assets/secteur petrolier.png'
    },
    {
        title: 'Partenariat avec la Banque des États de l\'Afrique Centrale',
        excerpt: 'KHADAMONA signe un accord avec la BEAC pour faciliter l\'accès au crédit des entrepreneurs tchadiens.',
        content: '<p>KHADAMONA et la Banque des États de l\'Afrique Centrale (BEAC) ont signé un partenariat historique pour soutenir l\'entrepreneuriat au Tchad.</p>',
        category: 'partenariat',
        author: 'Service Partenariats',
        publishDate: new Date('2025-12-05'),
        isPublished: true,
        isFeatured: false,
        image: 'assets/partenariat BEpng.png'
    },
    {
        title: 'Formation en agriculture moderne : 100 jeunes formés',
        excerpt: 'Cent jeunes tchadiens ont terminé avec succès leur formation en agriculture moderne et techniques d\'irrigation.',
        content: '<p>Cent jeunes tchadiens ont récemment terminé leur formation en agriculture moderne, marquant une étape importante dans le développement du secteur agricole du pays.</p>',
        category: 'formation',
        author: 'Service Formation',
        publishDate: new Date('2025-08-03'),
        isPublished: true,
        isFeatured: false,
        image: 'assets/formation en agriculture.png'
    }
];

async function seedNews() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  🌱 INJECTION D\'ACTUALITÉS PAR DÉFAUT                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/khadamona', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✓ Connexion MongoDB réussie\n');

        // Supprimer les actualités existantes
        const deleteResult = await News.deleteMany({});
        console.log(`🗑️  Actualités supprimées: ${deleteResult.deletedCount}\n`);

        // Injecter les nouvelles actualités
        const created = await News.insertMany(defaultNews);
        console.log(`✅ ${created.length} actualités créées!\n`);

        created.forEach((news, index) => {
            console.log(`  ${index + 1}. ✓ ${news.title}`);
            console.log(`     Catégorie: ${news.category} | En avant-plan: ${news.isFeatured ? 'Oui' : 'Non'}`);
        });

        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║                ✅ INJECTION COMPLÉTÉE                      ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        console.log('🎯 Les actualités sont maintenant prêtes!\n');
        console.log('Testez:\n');
        console.log('1. http://localhost:3000/api/news');
        console.log('   → Doit retourner 6 actualités publiées\n');
        console.log('2. http://localhost:8000/actualites.html');
        console.log('   → Doit afficher les actualités\n');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
        process.exit(0);
    }
}

seedNews();
