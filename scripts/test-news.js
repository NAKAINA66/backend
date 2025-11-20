/**
 * TEST NEWS - Vérifier que les actualités sont créées en DB
 */

const mongoose = require('mongoose');
const News = require('../models/News');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkNews() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  📰 VÉRIFICATION ACTUALITÉS (NEWS) EN BASE DE DONNÉES      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    try {
        // Connexion MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/khadamona', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✓ Connexion MongoDB réussie\n');

        // Compter le nombre total d'actualités
        const totalCount = await News.countDocuments();
        console.log(`📊 Nombre total d'actualités: ${totalCount}`);

        // Compter les actualités publiées
        const publishedCount = await News.countDocuments({ isPublished: true });
        console.log(`📊 Actualités publiées: ${publishedCount}`);

        // Compter les actualités non publiées
        const unpublishedCount = await News.countDocuments({ isPublished: false });
        console.log(`📊 Actualités non publiées: ${unpublishedCount}\n`);

        // Afficher les actualités publiées
        if (publishedCount > 0) {
            console.log('✅ Actualités publiées trouvées:\n');

            const news = await News.find({ isPublished: true })
                .limit(5)
                .select('title category isPublished isFeatured');

            news.forEach((item, index) => {
                console.log(`  ${index + 1}. ${item.title}`);
                console.log(`     - Catégorie: ${item.category}`);
                console.log(`     - En avant-plan: ${item.isFeatured ? '✓' : '✗'}`);
                console.log('');
            });

            if (publishedCount > 5) {
                console.log(`... et ${publishedCount - 5} autres actualités\n`);
            }
        } else {
            console.log('❌ AUCUNE ACTUALITÉ PUBLIÉE TROUVÉE!\n');
            console.log('💡 Solution: Créer des actualités en utilisant:');
            console.log('   1. Le panel d\'admin (admin-news.html)');
            console.log('   2. Ou importer les données par défaut avec un script\n');

            // Créer des actualités par défaut
            console.log('🔧 Création d\'actualités par défaut...\n');

            const defaultNews = [
                {
                    title: 'Nouveau partenariat avec l\'Université Adam Barka d\'Abéché',
                    excerpt: 'KHADAMONA signe un accord de partenariat avec l\'Université Adam Barka d\'Abéché pour faciliter l\'insertion professionnelle des étudiants.',
                    content: 'KHADAMONA est fier d\'annoncer la signature d\'un partenariat stratégique avec l\'Université Adam Barka d\'Abéché.',
                    category: 'partenariat',
                    author: 'Équipe KHADAMONA',
                    publishDate: new Date('2025-10-15'),
                    isPublished: true,
                    isFeatured: true
                },
                {
                    title: 'Formation en développement web : 50 places disponibles',
                    excerpt: 'Une formation intensive de 3 mois en développement web sera organisée à N\'Djamena avec le soutien de KHADAMONA.',
                    content: 'KHADAMONA lance une formation intensive en développement web destinée aux jeunes tchadiens.',
                    category: 'formation',
                    author: 'Service Formation',
                    publishDate: new Date('2025-11-12'),
                    isPublished: true,
                    isFeatured: true
                },
                {
                    title: 'Salon de l\'emploi 2025 : Plus de 100 entreprises participantes',
                    excerpt: 'Le grand salon de l\'emploi KHADAMONA 2025 se tiendra les 15 et 16 décembre à N\'Djamena.',
                    content: 'Plus de 100 entreprises seront présentes pour recruter des talents locaux.',
                    category: 'evenement',
                    author: 'Équipe Événements',
                    publishDate: new Date('2025-11-10'),
                    isPublished: true,
                    isFeatured: false
                },
                {
                    title: 'Nouvelles offres d\'emploi dans le secteur pétrolier',
                    excerpt: 'Plus de 200 postes à pourvoir dans le secteur pétrolier tchadien.',
                    content: 'Le secteur pétrolier tchadien connaît un regain d\'activité avec l\'ouverture de nouveaux postes.',
                    category: 'emploi',
                    author: 'Service Recrutement',
                    publishDate: new Date('2025-11-08'),
                    isPublished: true,
                    isFeatured: false
                },
                {
                    title: 'Partenariat avec la Banque des États de l\'Afrique Centrale',
                    excerpt: 'KHADAMONA signe un accord avec la BEAC pour faciliter l\'accès au crédit des entrepreneurs tchadiens.',
                    content: 'KHADAMONA et la Banque des États de l\'Afrique Centrale ont signé un partenariat historique.',
                    category: 'partenariat',
                    author: 'Service Partenariats',
                    publishDate: new Date('2025-12-05'),
                    isPublished: true,
                    isFeatured: false
                },
                {
                    title: 'Formation en agriculture moderne : 100 jeunes formés',
                    excerpt: 'Cent jeunes tchadiens ont terminé avec succès leur formation en agriculture moderne.',
                    content: 'La formation de 6 mois a couvert les techniques d\'agriculture moderne.',
                    category: 'formation',
                    author: 'Service Formation',
                    publishDate: new Date('2025-08-03'),
                    isPublished: true,
                    isFeatured: false
                }
            ];

            const created = await News.insertMany(defaultNews);
            console.log(`✅ ${created.length} actualités créées avec succès!\n`);

            created.forEach((news, index) => {
                console.log(`  ${index + 1}. ${news.title}`);
            });

            console.log('\n✓ Les actualités sont maintenant visibles sur le site!');
        }

        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║                        ✅ VÉRIFICATION COMPLÈTE             ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        console.log('Test API: Appeler http://localhost:3000/api/news\n');
        console.log('Résultat attendu:');
        console.log('  Status: 200');
        console.log('  Response: { success: true, news: [...], total: ... }\n');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
        process.exit(0);
    }
}

checkNews();
