// ─── SkillForge AI Frontend API Client ────────────────────────────────────────────
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001/api'
  : 'https://skillforge-ai-3v5l.onrender.com';

function getToken() {
  try {
    // Supabase stores session under its own key too - check both
    const direct = JSON.parse(localStorage.getItem('career_session') || 'null');
    if (direct?.access_token) return direct.access_token;

    // Supabase v2 also stores under sb-<project>-auth-token
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('auth-token')) {
        const val = JSON.parse(localStorage.getItem(key) || 'null');
        if (val?.access_token) return val.access_token;
      }
    }
    return null;
  } catch { return null; }
}

async function apiFetch(path, options = {}) {
  const token = getToken();

  if (!token) {
    console.error('No auth token found for request:', path);
    throw new Error('Not authenticated. Please sign in again.');
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });
  } catch (networkErr) {
    console.error('Network error - is the backend running on port 3001?', networkErr);
    throw new Error('Cannot reach server. Make sure backend is running (npm run dev).');
  }

  const data = await res.json();
  if (!res.ok) {
    console.error('API error:', res.status, data);
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

const api = {
  // Profile
  getProfile: () => apiFetch('/profile'),
  updateProfile: (body) => apiFetch('/profile', { method: 'PATCH', body: JSON.stringify(body) }),

  // Chat
  getSessions: () => apiFetch('/chat/sessions'),
  createSession: (body = {}) => apiFetch('/chat/sessions', { method: 'POST', body: JSON.stringify(body) }),
  getMessages: (sessionId) => apiFetch(`/chat/sessions/${sessionId}/messages`),
  sendMessage: (sessionId, content) => apiFetch(`/chat/sessions/${sessionId}/message`, { method: 'POST', body: JSON.stringify({ content }) }),
  deleteSession: (sessionId) => apiFetch(`/chat/sessions/${sessionId}`, { method: 'DELETE' }),

  // Jobs
  getJobs: (params = {}) => apiFetch('/jobs?' + new URLSearchParams(params)),
  getMatchedJobs: (params = {}) => apiFetch('/jobs/matches?' + new URLSearchParams(params)),
  getSavedJobs: () => apiFetch('/jobs/saved'),
  saveJob: (jobId, jobData) => apiFetch('/jobs/' + jobId + '/save', { method: 'POST', body: JSON.stringify({ jobData }) }),
  unsaveJob: (jobId) => apiFetch('/jobs/' + jobId + '/save', { method: 'DELETE' }),
  updateJobStatus: (jobId, status) => apiFetch(`/jobs/${jobId}/save`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Skills
  getAllSkills: () => apiFetch('/skills'),
  getMySkills: () => apiFetch('/skills/mine'),
  addSkill: (body) => apiFetch('/skills/mine', { method: 'POST', body: JSON.stringify(body) }),
  removeSkill: (skillId) => apiFetch(`/skills/mine/${skillId}`, { method: 'DELETE' }),
  getSkillsForJob: (job) => apiFetch('/skills/for-job?' + new URLSearchParams({ job })),
  analyzeGap: (target_position) => apiFetch('/skills/gap-analysis', { method: 'POST', body: JSON.stringify({ target_position }) }),
  analyzeGapWithSkills: (target_position, selected_skills) => apiFetch('/skills/gap-analysis', { method: 'POST', body: JSON.stringify({ target_position, selected_skills }) }),
  getPastAnalyses: () => apiFetch('/skills/gap-analyses'),
  deleteAnalysis: (id) => apiFetch('/skills/gap-analyses/' + id, { method: 'DELETE' }),

  // Mentor
  getMentorSession: () => apiFetch('/mentor/session'),
  createMentorOrder: () => apiFetch('/mentor/order', { method: 'POST' }),
  verifyMentorPayment: (data) => apiFetch('/mentor/verify', { method: 'POST', body: JSON.stringify(data) }),
  getMentorSessions: () => apiFetch('/mentor/sessions'),
};

window.api = api;