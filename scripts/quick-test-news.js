/**
 * QUICK TEST - Test l'endpoint /api/news directement
 */

const http = require('http');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  🧪 TEST RAPIDE API NEWS                                  ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

function testNewsAPI() {
    return new Promise((resolve) => {
        console.log('Appel: GET http://localhost:3000/api/news\n');

        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/news',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }, (res) => {
            let data = '';

            res.on('data', chunk => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    
                    console.log(`📊 Status: ${res.statusCode}`);
                    console.log(`📊 Success: ${response.success}`);
                    console.log(`📊 Nombre d'actualités: ${response.news ? response.news.length : 0}`);
                    console.log(`📊 Total en DB: ${response.total || 0}\n`);

                    if (response.news && response.news.length > 0) {
                        console.log('✅ ACTUALITÉS TROUVÉES:\n');
                        response.news.slice(0, 3).forEach((news, i) => {
                            console.log(`  ${i + 1}. ${news.title}`);
                            console.log(`     - Catégorie: ${news.category}`);
                            console.log('');
                        });

                        if (response.news.length > 3) {
                            console.log(`  ... et ${response.news.length - 3} autres\n`);
                        }

                        console.log('✅ PAGE ACTUALITÉS DEVRAIT FONCTIONNER!\n');
                    } else {
                        console.log('❌ AUCUNE ACTUALITÉ TROUVÉE\n');
                        console.log('💡 Prochaines étapes:');
                        console.log('   1. Créer des actualités via:');
                        console.log('      - admin-news.html (panel admin)');
                        console.log('      - Ou exécuter: node scripts/test-news.js\n');
                    }

                    console.log('╔════════════════════════════════════════════════════════════╗');
                    console.log('║            🎯 Prochaine étape: Tester le navigateur         ║');
                    console.log('╚════════════════════════════════════════════════════════════╝\n');

                    console.log('1. Ouvrez: http://localhost:8000/actualites.html');
                    console.log('2. Les actualités doivent s\'afficher');
                    console.log('3. Si rien ne s\'affiche:');
                    console.log('   - Vérifier la Console (F12) pour les erreurs');
                    console.log('   - Vérifier Network tab pour voir l\'appel /api/news');
                    console.log('   - Vérifier que le backend répond avec success: true\n');

                } catch (e) {
                    console.error('❌ Erreur parsing JSON:', e.message);
                    console.log('Response raw:', data);
                }
                resolve();
            });
        });

        req.on('error', (err) => {
            console.error('❌ Erreur API:', err.message);
            console.log('\n💡 Vérifications:');
            console.log('   - Le backend est-il en cours d\'exécution? (npm start)');
            console.log('   - Est-ce que le serveur écoute sur port 3000?\n');
            resolve();
        });

        req.end();
    });
}

testNewsAPI();
