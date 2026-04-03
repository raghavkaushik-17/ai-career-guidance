const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const supabase = require('../supabase');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// GET /api/skills - all available skills
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('category')
    .order('name');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/skills/mine - user's skills
router.get('/mine', async (req, res) => {
  const { data, error } = await supabase
    .from('user_skills')
    .select('*, skills(*)')
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/skills/mine - add a skill
router.post('/mine', async (req, res) => {
  const { skill_id, proficiency, years_experience } = req.body;
  if (!skill_id) return res.status(400).json({ error: 'skill_id required' });

  const { data, error } = await supabase
    .from('user_skills')
    .upsert({ user_id: req.user.id, skill_id, proficiency, years_experience }, { onConflict: 'user_id,skill_id' })
    .select('*, skills(*)')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/skills/mine/:skillId - remove a skill
router.delete('/mine/:skillId', async (req, res) => {
  const { error } = await supabase
    .from('user_skills')
    .delete()
    .eq('user_id', req.user.id)
    .eq('skill_id', req.params.skillId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// POST /api/skills/gap-analysis - AI-powered skill gap analysis
router.post('/gap-analysis', async (req, res) => {
  // Set a 55s timeout so we respond before Render kills the request
  req.setTimeout(55000);
  res.setTimeout(55000);
  const { target_position, selected_skills } = req.body;
  if (!target_position) return res.status(400).json({ error: 'target_position required' });

  const userId = req.user.id;

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_position, experience_years, education_level')
    .eq('id', userId)
    .single();

  // Use selected_skills from frontend checkboxes if provided, else fall back to DB
  let currentSkills = [];
  if (selected_skills && selected_skills.length > 0) {
    currentSkills = selected_skills.map(s => ({
      name: s.name,
      category: s.category || 'general',
      proficiency: s.proficiency || s.level || 'intermediate'
    }));
  } else {
    const { data: userSkills } = await supabase
      .from('user_skills')
      .select('skills(name, category), proficiency')
      .eq('user_id', userId);
    currentSkills = (userSkills || []).map(us => ({
      name: us.skills.name,
      category: us.skills.category,
      proficiency: us.proficiency || 'intermediate'
    }));
  }

  const skillsList = currentSkills.length > 0
    ? currentSkills.map(s => s.name + ' (' + s.proficiency + ')').join(', ')
    : 'None provided';

  const prompt =
    'You are a career development expert speaking directly to the person. They want to become a ' + target_position + '.\n\n' +
    'Their profile:\n' +
    '- Current role: ' + (profile?.current_position || 'Not specified') + '\n' +
    '- Experience: ' + (profile?.experience_years || 0) + ' years\n' +
    '- Education: ' + (profile?.education_level || 'Not specified') + '\n' +
    '- Skills they already have: ' + skillsList + '\n\n' +
    'Task: Analyze how ready they are for the ' + target_position + ' role. Write everything in second person — use "you", "your", "you have", "you need" instead of "the user" or "they".\n' +
    'The match_score MUST be calculated based on what % of required skills for ' + target_position + ' they already have.\n' +
    'If skillsList has relevant skills, match_score should be 40-90. Only give 0-10 if they have NO relevant skills at all.\n\n' +
   'Respond ONLY with valid JSON.\n' +
'Do NOT write text before or after JSON.\n' +
'All string values MUST be wrapped in double quotes.\n' +
'No markdown, no backticks.\n' +
'{\n' +
'  "match_score": <integer 0-100>,\n' +
'  "summary": "<2-3 sentences about readiness>",\n' +
'  "missing_skills": [{"skill": "<name>", "priority": "critical|important|nice_to_have", "reason": "<why needed>", "resources": ["<resource>"]}],\n' +
'  "strengths": ["<strength>"],\n' +
'  "recommendations": [{"title": "<action>", "description": "<steps>", "timeframe": "<duration>"}],\n' +
'  "roadmap": "<3-6 month learning path>"\n' +
'}';

  const attemptAnalysis = async (attempt = 1) => {
    try {
      return await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_completion_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      });
    } catch(e) {
      if (attempt < 2) { await new Promise(r => setTimeout(r, 1000)); return attemptAnalysis(attempt + 1); }
      throw e;
    }
  };

  try {
    const response = await attemptAnalysis();

    const rawText = response.choices[0].message.content;
let analysis;

try {
  analysis = JSON.parse(rawText);
} catch {
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let cleaned = jsonMatch[0];

      // Fix unquoted summary (common issue)
      cleaned = cleaned.replace(
        /"summary":\s*([^",\n]+)(?=,)/,
        (m, p1) => `"summary": "${p1.trim()}"`
      );

      analysis = JSON.parse(cleaned);
    } else {
      throw new Error("No JSON found");
    }
  } catch (e) {
    console.error("JSON parse fallback failed:", rawText);
    analysis = {
      summary: rawText,
      match_score: 50,
      missing_skills: [],
      recommendations: []
    };
  }
}

    // Ensure match_score is a number
    analysis.match_score = parseInt(analysis.match_score) || 50;

    // Save to DB
    const { data: saved, error: saveError } = await supabase
      .from('skill_gap_analyses')
      .insert({
        user_id: userId,
        target_position,
        current_skills: currentSkills.map(s => s.name),
        missing_skills: analysis.missing_skills || [],
        recommendations: analysis.recommendations || [],
        match_score: analysis.match_score,
        ai_summary: analysis.summary
      })
      .select()
      .single();

    if (saveError) console.error('Save error:', saveError);
    res.json({ ...analysis, id: saved?.id });
  } catch (err) {
    const msg = err?.error?.message || err?.message || String(err);
    console.error('Skill gap analysis error:', msg);
    // Return specific message for rate limit
    if (msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('429')) {
      return res.status(429).json({ error: 'AI is busy right now. Please wait a few seconds and try again.' });
    }
    res.status(500).json({ error: 'Analysis failed: ' + msg });
  }
});

// GET /api/skills/gap-analyses - user's past analyses
router.get('/gap-analyses', async (req, res) => {
  const { data, error } = await supabase
    .from('skill_gap_analyses')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/skills/gap-analyses/:id
router.delete('/gap-analyses/:id', async (req, res) => {
  const { error } = await supabase
    .from('skill_gap_analyses')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});


// GET /api/skills/for-job?job=Software Engineer
// Returns skills relevant to a job profile using AI
router.get('/for-job', async (req, res) => {
  const { job } = req.query;
  if (!job) return res.status(400).json({ error: 'job query required' });

  const prompt = `List the most important skills for a "${job}" role.
Respond ONLY with valid JSON, no markdown, no backticks:
{
  "technical": ["skill1", "skill2", "skill3", "skill4", "skill5", "skill6", "skill7", "skill8"],
  "soft": ["skill1", "skill2", "skill3", "skill4"],
  "tools": ["tool1", "tool2", "tool3", "tool4"]
}
Include 6-10 technical skills, 3-5 soft skills, 3-6 tools/platforms specific to this role.`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_completion_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });
    const raw = response.choices[0].message.content;
    let skills;
    try { skills = JSON.parse(raw); }
    catch { const m = raw.match(/\{[\s\S]*\}/); skills = m ? JSON.parse(m[0]) : { technical: [], soft: [], tools: [] }; }
    res.json(skills);
  } catch (err) {
    const msg = err?.error?.message || err?.message || String(err);
    console.error('Skills for job error:', msg);
    if (msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('429')) {
      return res.status(429).json({ error: 'AI is busy. Please wait a moment and try again.' });
    }
    res.status(500).json({ error: 'Could not fetch skills: ' + msg });
  }
});

module.exports = router;