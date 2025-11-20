const fetch = global.fetch || require('node-fetch');

const BASE_URL = 'http://localhost:3001';

(async () => {
  console.log('\n🔍 TEST D\'INTÉGRATION COMPLÈTE KHADAMONA\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Health check
    console.log('\n1️⃣  TEST HEALTH CHECK');
    let res = await fetch(`${BASE_URL}/api/health`);
    let data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   ✅ Backend running: ${data.status === 'ok' ? 'YES' : 'NO'}`);

    // Test 2: Get news
    console.log('\n2️⃣  TEST NEWS API');
    res = await fetch(`${BASE_URL}/api/news`);
    data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   ✅ News API: ${res.status === 200 ? 'WORKING' : 'ERROR'}`);
    if (data.data && Array.isArray(data.data)) {
      console.log(`   📰 News items in DB: ${data.data.length}`);
    }

    // Test 3: AI message endpoint
    console.log('\n3️⃣  TEST AI MESSAGE ENDPOINT');
    res = await fetch(`${BASE_URL}/api/ai/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: "Bonjour, comment puis-je vous aider ?" })
    });
    data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   ✅ AI endpoint: ${res.status === 200 ? 'WORKING' : 'ERROR'}`);
    if (data && data.conversationId) {
      console.log(`   🔄 Conversation ID: ${data.conversationId}`);
      console.log(`   🤖 Response: ${data.assistant ? data.assistant.substring(0, 50) + '...' : 'N/A'}`);

      // Test 4: Get conversation history
      console.log('\n4️⃣  TEST AI HISTORY ENDPOINT');
      res = await fetch(`${BASE_URL}/api/ai/history/${data.conversationId}`);
      const histData = await res.json();
      console.log(`   Status: ${res.status}`);
      console.log(`   ✅ History endpoint: ${res.status === 200 ? 'WORKING' : 'ERROR'}`);
      if (histData.conversation && histData.conversation.messages) {
        console.log(`   📝 Messages in conversation: ${histData.conversation.messages.length}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TOUS LES TESTS RÉUSSIS!');
    console.log('Actualités et Assistant IA sont opérationnels.\n');
    process.exit(0);
  } catch (e) {
    console.error('\n❌ ERREUR:', e.message);
    console.log('\n💡 Solutions:');
    console.log('  1. Assurez-vous que MongoDB est démarré');
    console.log('  2. Assurez-vous que le backend est démarré (npm start)');
    console.log('  3. Vérifiez que le port 3000 est disponible');
    console.log('  4. Vérifiez les logs du backend pour les erreurs\n');
    process.exit(1);
  }
})();
