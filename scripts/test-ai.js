const fetch = global.fetch || require('node-fetch');

(async () => {
  try {
    const url = 'http://localhost:3000/api/ai/message';
  const payload = { message: "Bonjour, pouvez-vous m aider à trouver un emploi dans N'Djamena ?" };

    console.log('Appel POST', url);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (data && data.conversationId) {
      const histUrl = `http://localhost:3000/api/ai/history/${data.conversationId}`;
      console.log('\nRécupération de l\'historique:', histUrl);
      const h = await fetch(histUrl);
      const hd = await h.json();
      console.log('History:', JSON.stringify(hd, null, 2));
    }

    process.exit(0);
  } catch (e) {
    console.error('Test AI failed:', e.message);
    process.exit(1);
  }
})();
