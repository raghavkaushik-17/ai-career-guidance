const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// GET /api/profile - get current user's profile
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/profile - update profile
router.patch('/', async (req, res) => {
  const allowed = [
    'full_name', 'avatar_url', 'current_position', 'target_position', 'phone_number',
    'experience_years', 'education_level', 'location', 'bio',
    'linkedin_url', 'github_url'
  ];

  const updates = {};
  allowed.forEach(field => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;