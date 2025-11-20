const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');

// Helper: call OpenAI (if API key provided). Uses global fetch if available.
async function callOpenAI(messages) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  // Build request payload for Chat Completions
  const payload = {
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    messages,
    max_tokens: 700,
    temperature: 0.7
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${txt}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || null;
  return content;
}

// POST /api/ai/message
// body: { conversationId?, userId?, message }
router.post('/message', async (req, res) => {
  try {
    const { conversationId, userId, message } = req.body;
    if (!message || typeof message !== 'string') return res.status(400).json({ success: false, message: 'message required' });

    let conv = null;
    if (conversationId) conv = await Conversation.findById(conversationId);
    if (!conv) {
      conv = new Conversation({ userId: userId || undefined, messages: [] });
    }

    // push user message
    conv.messages.push({ role: 'user', text: message });
    await conv.save();

    // Prepare messages for LLM: include last N messages to keep context
    const recent = conv.messages.slice(-12).map(m => ({ role: m.role, content: m.text }));
    // Add optional system prompt
    const systemPrompt = process.env.KHADAMONA_SYSTEM_PROMPT || 'You are KHADAMONA, an assistant for a Chad-based recruitment platform. Be polite and concise. Answer in French when the user uses French.';
    const messagesForLLM = [{ role: 'system', content: systemPrompt }, ...recent];

    let assistantText = null;
    try {
      const openaiResp = await callOpenAI(messagesForLLM);
      if (openaiResp) assistantText = openaiResp.trim();
    } catch (e) {
      console.error('OpenAI call failed:', e.message);
    }

    if (!assistantText) {
      // fallback canned response
      assistantText = process.env.KHADAMONA_FALLBACK_REPLY || "Bonjour, je suis l'assistant KHADAMONA. Je peux aider avec la recherche d'emploi, l'inscription ou les actualités. Dites-moi en quoi je peux vous aider aujourd'hui.";
    }

    conv.messages.push({ role: 'assistant', text: assistantText });
    await conv.save();

    res.json({ success: true, assistant: assistantText, conversationId: conv._id });
  } catch (err) {
    console.error('AI /message error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur AI', error: err.message });
  }
});

// GET /api/ai/history/:conversationId
router.get('/history/:conversationId', async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.conversationId);
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation non trouvée' });
    res.json({ success: true, conversation: conv });
  } catch (err) {
    console.error('AI /history error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
});

// GET /api/ai/history/user/:userId
router.get('/history/user/:userId', async (req, res) => {
  try {
    const convs = await Conversation.find({ userId: req.params.userId }).sort({ updatedAt: -1 }).limit(20);
    res.json({ success: true, conversations: convs });
  } catch (err) {
    console.error('AI /history/user error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
});

module.exports = router;
