const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const supabase = require('../supabase');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are SkillForge AI, an expert career guidance advisor. You help people at all career stages:
- Students and fresh graduates finding their first role
- Mid-career professionals leveling up or pivoting
- Career switchers moving into new industries

Your expertise covers:
- Career path planning and goal setting
- Skill gap analysis and learning roadmaps
- Job search strategy and resume tips
- Interview preparation
- Salary negotiation
- Industry insights

Be warm, encouraging, specific, and actionable. When you identify skill gaps, suggest concrete resources (courses, projects, certifications). Always tailor advice to the user's specific situation. Keep responses concise but thorough. Format with markdown when helpful.`;

// GET /api/chat/sessions - list user's chat sessions
router.get('/sessions', async (req, res) => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', req.user.id)
    .order('updated_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/chat/sessions - create new session
router.post('/sessions', async (req, res) => {
  const { title = 'New Conversation', session_type = 'general' } = req.body;
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ user_id: req.user.id, title, session_type })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/chat/sessions/:id/messages - get messages in session
router.get('/sessions/:id/messages', async (req, res) => {
  // Verify session belongs to user
  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (sessionError || !session) return res.status(404).json({ error: 'Session not found' });

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', req.params.id)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/chat/sessions/:id/message - send message and get AI response
router.post('/sessions/:id/message', async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Message content required' });

  const sessionId = req.params.id;

  // Verify ownership
  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', req.user.id)
    .single();

  if (sessionError || !session) return res.status(404).json({ error: 'Session not found' });

  // Get user profile for context
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, current_position, target_position, experience_years, education_level')
    .eq('id', req.user.id)
    .single();

  // Fetch existing messages for context
  const { data: history } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(20);

  // Build messages array
  const messages = (history || []).map(m => ({ role: m.role, content: m.content }));
  messages.push({ role: 'user', content });

  // Build context-enriched system prompt
  let systemPrompt = SYSTEM_PROMPT;
  if (profile) {
    systemPrompt += `\n\nUser context: Name: ${profile.full_name || 'Unknown'}, Current role: ${profile.current_position || 'Not specified'}, Target role: ${profile.target_position || 'Not specified'}, Experience: ${profile.experience_years || 0} years, Education: ${profile.education_level || 'Not specified'}.`;
  }

  try {
    // Save user message
    await supabase.from('chat_messages').insert({ session_id: sessionId, role: 'user', content });

    // Call Groq
    const aiResponse = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1000,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
    });

    const assistantContent = aiResponse.choices[0].message.content;

    // Save assistant message
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: assistantContent
    });

    // Update session timestamp & auto-title on first message
    const updates = { updated_at: new Date().toISOString() };
    if (messages.length === 1 && session.title === 'New Conversation') {
      updates.title = content.substring(0, 60) + (content.length > 60 ? '...' : '');
    }
    await supabase.from('chat_sessions').update(updates).eq('id', sessionId);

    res.json({ role: 'assistant', content: assistantContent });
  } catch (err) {
    console.error('AI error:', err);
    res.status(500).json({ error: 'AI service unavailable. Please try again.' });
  }
});

// DELETE /api/chat/sessions/:id
router.delete('/sessions/:id', async (req, res) => {
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;