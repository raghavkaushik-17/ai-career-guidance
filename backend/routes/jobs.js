const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const supabase = require('../supabase');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── REAL JOB SEARCH via JSearch (RapidAPI) ──────────────────────────────────
// Sign up free at rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
// 200 free requests/month — real jobs from LinkedIn, Indeed, Glassdoor
async function fetchRealJobs(searchQuery, location = null, numResults = 10) {
  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey || apiKey === 'YOUR_JSEARCH_KEY_HERE') return null;

  const query = location ? `${searchQuery} in ${location}` : searchQuery;
  const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&num_pages=1&page=1&date_posted=month`;

  const response = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
    }
  });

  if (!response.ok) return null;
  const data = await response.json();
  if (!data.data || !data.data.length) return null;

  // Normalize JSearch response to our job format
  return data.data.slice(0, numResults).map((j, i) => ({
    id: 'real-' + (j.job_id || Date.now() + '-' + i),
    title: j.job_title || searchQuery,
    company: j.employer_name || 'Company',
    location: [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', ') || (j.job_is_remote ? 'Remote' : 'Location not specified'),
    job_type: j.job_employment_type ? j.job_employment_type.toLowerCase().replace('_', '_') : 'full_time',
    experience_level: j.job_required_experience?.required_experience_in_months
      ? (j.job_required_experience.required_experience_in_months < 24 ? 'entry'
        : j.job_required_experience.required_experience_in_months < 60 ? 'mid' : 'senior')
      : 'mid',
    salary_min: j.job_min_salary || null,
    salary_max: j.job_max_salary || null,
    salary_currency: j.job_salary_currency || 'USD',
    description: j.job_description ? j.job_description.slice(0, 400) + '...' : '',
    required_skills: j.job_required_skills || [],
    nice_to_have_skills: [],
    apply_url: j.job_apply_link || null,
    employer_logo: j.employer_logo || null,
    posted_at: j.job_posted_at_datetime_utc || new Date().toISOString(),
    is_active: true,
    isRealJob: true,
    source: j.job_publisher || 'JSearch'
  }));
}

// ─── AI FALLBACK Job Generation ───────────────────────────────────────────────
async function generateJobsWithAI(searchQuery, profile, location = null) {
  const locationInstruction = location
    ? `LOCATION: Every job MUST be in or near "${location}". Use real company names that operate there.`
    : 'Include a mix of remote and global locations.';

  const prompt = `Generate 8 realistic job listings for: "${searchQuery}"
User: ${profile?.current_position || 'Not specified'}, ${profile?.experience_years || 0} years experience.
${locationInstruction}

Respond ONLY with a valid JSON array, no markdown:
[{ "title":"","company":"","location":"","job_type":"full_time","experience_level":"mid","salary_min":60000,"salary_max":90000,"description":"","required_skills":[],"nice_to_have_skills":[] }]

job_type options: full_time, part_time, contract, freelance, internship, remote
experience_level options: entry, mid, senior, lead, executive`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  });

  const raw = response.choices[0].message.content;
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  }
}

// ─── Score jobs against user skills ──────────────────────────────────────────
function scoreJobs(jobs, skillNames, expYears) {
  return jobs.map(job => {
    const required = (job.required_skills || []).map(s => s.toLowerCase());
    const niceToHave = (job.nice_to_have_skills || []).map(s => s.toLowerCase());
    const requiredMatches = required.filter(s => skillNames.includes(s)).length;
    const niceMatches = niceToHave.filter(s => skillNames.includes(s)).length;
    const requiredScore = required.length > 0 ? (requiredMatches / required.length) * 70 : 35;
    const niceScore = niceToHave.length > 0 ? (niceMatches / niceToHave.length) * 20 : 10;
    const expMap = { entry: [0,2], mid: [2,5], senior: [5,10], lead: [8,20], executive: [12,30] };
    const [minExp, maxExp] = expMap[job.experience_level] || [0, 99];
    const expScore = expYears >= minExp && expYears <= maxExp ? 10 : 0;
    const matchScore = Math.round(Math.min(100, requiredScore + niceScore + expScore));
    const missingSkills = required.filter(s => !skillNames.includes(s));
    return { ...job, matchScore, missingSkills };
  });
}

// ─── GET /api/jobs — search jobs ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { experience_level, job_type, search, location } = req.query;

  if (search && search.trim().length > 1) {
    try {
      const { data: profile } = await supabase
        .from('profiles').select('current_position, experience_years')
        .eq('id', req.user.id).single();

      // Real jobs only — no fallback
      let jobs = await fetchRealJobs(search.trim(), location || null);
      if (!jobs || jobs.length === 0) return res.json([]);

      // Apply filters
      let filtered = jobs;
      if (experience_level) filtered = filtered.filter(j => j.experience_level === experience_level);
      if (job_type) filtered = filtered.filter(j => j.job_type === job_type);

      return res.json(filtered);
    } catch (err) {
      console.error('Job search error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // Default: DB jobs
  let query = supabase.from('job_listings').select('*').eq('is_active', true).order('posted_at', { ascending: false });
  if (experience_level) query = query.eq('experience_level', experience_level);
  if (job_type) query = query.eq('job_type', job_type);
  if (search) query = query.ilike('title', '%' + search + '%');
  const { data, error } = await query.limit(50);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── GET /api/jobs/matches — personalized matches ────────────────────────────
router.get('/matches', async (req, res) => {
  const userId = req.user.id;
  const locationFilter = req.query.location || null;

  const { data: profile } = await supabase
    .from('profiles').select('current_position, target_position, experience_years, location')
    .eq('id', userId).single();

  const { data: userSkills } = await supabase
    .from('user_skills').select('skills(name)').eq('user_id', userId);

  const skillNames = (userSkills || []).map(us => us.skills.name.toLowerCase());
  const expYears = profile?.experience_years || 0;
  const targetRole = profile?.target_position || profile?.current_position || 'software engineer';
  const userLocation = locationFilter || (profile?.location ? profile.location.split(',')[0].trim() : null);

  // Real jobs only — no fallback
  let jobs = await fetchRealJobs(targetRole, userLocation, 15).catch(() => null);
  if (!jobs || jobs.length === 0) return res.json([]);

  // Score + sort
  const scored = scoreJobs(jobs, skillNames, expYears);
  scored.sort((a, b) => b.matchScore - a.matchScore);

  // Attach saved status
  const { data: savedJobs } = await supabase
    .from('saved_jobs').select('job_id, status').eq('user_id', userId);
  const savedMap = {};
  (savedJobs || []).forEach(sj => { savedMap[sj.job_id] = sj.status; });

  const result = scored.slice(0, 20).map(j => ({
    ...j, isSaved: !!savedMap[j.id], savedStatus: savedMap[j.id] || null
  }));

  res.json(result);
});

// ─── POST /api/jobs/:id/save ──────────────────────────────────────────────────
router.post('/:id/save', async (req, res) => {
  const jobId = req.params.id;

  if (jobId.startsWith('ai-') || jobId.startsWith('real-')) {
    const jobData = req.body.jobData;
    if (jobData) {
      const { id: _id, matchScore, missingSkills, isAIGenerated, isRealJob, isSaved, savedStatus, industry, employer_logo, source, salary_currency, ...cleanJob } = jobData;
      const { data: inserted, error: insertErr } = await supabase
        .from('job_listings').insert(cleanJob).select().single();
      if (insertErr) return res.status(500).json({ error: insertErr.message });
      const { data, error } = await supabase
        .from('saved_jobs')
        .upsert({ user_id: req.user.id, job_id: inserted.id }, { onConflict: 'user_id,job_id' })
        .select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ ...data, newJobId: inserted.id });
    }
    return res.json({ success: true, skipped: true });
  }

  const { data, error } = await supabase
    .from('saved_jobs')
    .upsert({ user_id: req.user.id, job_id: jobId }, { onConflict: 'user_id,job_id' })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── PATCH /api/jobs/:id/save ─────────────────────────────────────────────────
router.patch('/:id/save', async (req, res) => {
  const { status } = req.body;
  const { data, error } = await supabase
    .from('saved_jobs').update({ status })
    .eq('user_id', req.user.id).eq('job_id', req.params.id)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── DELETE /api/jobs/:id/save ────────────────────────────────────────────────
router.delete('/:id/save', async (req, res) => {
  const { error } = await supabase
    .from('saved_jobs').delete()
    .eq('user_id', req.user.id).eq('job_id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ─── GET /api/jobs/saved ──────────────────────────────────────────────────────
router.get('/saved', async (req, res) => {
  const { data, error } = await supabase
    .from('saved_jobs').select('*, job_listings(*)')
    .eq('user_id', req.user.id).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;