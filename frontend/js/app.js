// ─── CareerAI Frontend App ────────────────────────────────────────────────────
// Config — replace with your Supabase project values
const SUPABASE_URL="https://jfjkcvrqyxitqwlviajm.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmamtjdnJxeXhpdHF3bHZpYWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNDczODUsImV4cCI6MjA4ODYyMzM4NX0.TzHHkCYoqgTe8sQLbuFP9eRX6AVcjduOWeEIcvFYHWs"
// ─── SkillForge AI Frontend App ────────────────────────────────────────────────────

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── App State ────────────────────────────────────────────────────────────────
let appState = {
  user: null, profile: null, currentSession: null,
  sessions: [], allJobs: [], matchedJobs: [],
  mySkills: [], allSkills: [], currentJobTab: 'matches',
  locationFilter: 'global', jobsMap: {}, isTyping: false
};

// ─── Country Data ─────────────────────────────────────────────────────────────
const COUNTRIES = [
  { name:"Afghanistan", code:"AF", dial:"+93", states:["Kabul","Kandahar","Herat","Balkh"] },
  { name:"Argentina", code:"AR", dial:"+54", states:["Buenos Aires","Córdoba","Santa Fe","Mendoza","Tucumán"] },
  { name:"Australia", code:"AU", dial:"+61", states:["New South Wales","Victoria","Queensland","Western Australia","South Australia","Tasmania","ACT","Northern Territory"] },
  { name:"Bangladesh", code:"BD", dial:"+880", states:["Dhaka","Chittagong","Rajshahi","Khulna","Sylhet","Barisal","Rangpur","Mymensingh"] },
  { name:"Brazil", code:"BR", dial:"+55", states:["São Paulo","Rio de Janeiro","Minas Gerais","Bahia","Paraná","Rio Grande do Sul","Pernambuco","Ceará"] },
  { name:"Canada", code:"CA", dial:"+1", states:["Ontario","Quebec","British Columbia","Alberta","Manitoba","Saskatchewan","Nova Scotia","New Brunswick","Newfoundland","PEI"] },
  { name:"China", code:"CN", dial:"+86", states:["Beijing","Shanghai","Guangdong","Sichuan","Zhejiang","Jiangsu","Shandong","Henan"] },
  { name:"Egypt", code:"EG", dial:"+20", states:["Cairo","Giza","Alexandria","Dakahlia","Sharqia","Qalyubia"] },
  { name:"France", code:"FR", dial:"+33", states:["Île-de-France","Auvergne-Rhône-Alpes","Nouvelle-Aquitaine","Occitanie","Hauts-de-France","Provence-Alpes-Côte d'Azur"] },
  { name:"Germany", code:"DE", dial:"+49", states:["Bavaria","North Rhine-Westphalia","Baden-Württemberg","Lower Saxony","Hesse","Berlin","Hamburg"] },
  { name:"India", code:"IN", dial:"+91", states:["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir"] },
  { name:"Indonesia", code:"ID", dial:"+62", states:["Jakarta","East Java","West Java","Central Java","North Sumatra","South Sulawesi","Bali"] },
  { name:"Italy", code:"IT", dial:"+39", states:["Lombardy","Lazio","Campania","Sicily","Veneto","Emilia-Romagna","Piedmont","Tuscany"] },
  { name:"Japan", code:"JP", dial:"+81", states:["Tokyo","Osaka","Kanagawa","Aichi","Saitama","Chiba","Hokkaido","Fukuoka"] },
  { name:"Malaysia", code:"MY", dial:"+60", states:["Selangor","Johor","Perak","Pahang","Kedah","Sarawak","Sabah","Penang","Kuala Lumpur"] },
  { name:"Mexico", code:"MX", dial:"+52", states:["Mexico City","State of Mexico","Jalisco","Nuevo León","Veracruz","Puebla","Guanajuato","Chihuahua"] },
  { name:"Netherlands", code:"NL", dial:"+31", states:["North Holland","South Holland","Utrecht","North Brabant","Gelderland","Overijssel"] },
  { name:"Nigeria", code:"NG", dial:"+234", states:["Lagos","Kano","Rivers","Ogun","Kaduna","Anambra","Imo","Abuja FCT","Oyo","Delta"] },
  { name:"Pakistan", code:"PK", dial:"+92", states:["Punjab","Sindh","Khyber Pakhtunkhwa","Balochistan","Islamabad","Gilgit-Baltistan","Azad Kashmir"] },
  { name:"Philippines", code:"PH", dial:"+63", states:["Metro Manila","Cebu","Davao","Bulacan","Cavite","Laguna","Rizal","Pampanga"] },
  { name:"Russia", code:"RU", dial:"+7", states:["Moscow","Saint Petersburg","Novosibirsk","Yekaterinburg","Kazan","Nizhny Novgorod"] },
  { name:"Saudi Arabia", code:"SA", dial:"+966", states:["Riyadh","Makkah","Madinah","Eastern Province","Asir","Tabuk","Qassim"] },
  { name:"South Africa", code:"ZA", dial:"+27", states:["Gauteng","KwaZulu-Natal","Western Cape","Eastern Cape","Limpopo","Mpumalanga"] },
  { name:"South Korea", code:"KR", dial:"+82", states:["Seoul","Busan","Incheon","Daegu","Daejeon","Gwangju","Suwon","Gyeonggi"] },
  { name:"Spain", code:"ES", dial:"+34", states:["Madrid","Catalonia","Andalusia","Valencia","Galicia","Castile and León","Basque Country"] },
  { name:"Sri Lanka", code:"LK", dial:"+94", states:["Western","Central","Southern","Northern","Eastern","North Western","Sabaragamuwa"] },
  { name:"Turkey", code:"TR", dial:"+90", states:["Istanbul","Ankara","Izmir","Bursa","Antalya","Adana","Gaziantep","Konya"] },
  { name:"Ukraine", code:"UA", dial:"+380", states:["Kyiv","Kharkiv","Odessa","Dnipro","Donetsk","Zaporizhzhia","Lviv"] },
  { name:"United Arab Emirates", code:"AE", dial:"+971", states:["Dubai","Abu Dhabi","Sharjah","Ajman","Ras Al Khaimah","Fujairah","Umm Al Quwain"] },
  { name:"United Kingdom", code:"GB", dial:"+44", states:["England","Scotland","Wales","Northern Ireland","London","Manchester","Birmingham","Leeds"] },
  { name:"United States", code:"US", dial:"+1", states:["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming","Washington D.C."] },
  { name:"Vietnam", code:"VN", dial:"+84", states:["Hanoi","Ho Chi Minh City","Da Nang","Can Tho","Hai Phong","Bien Hoa","Hue"] }
];

function populateCountryDropdowns() {
  const countryEl = document.getElementById('signup-country');
  const dialEl = document.getElementById('signup-dialcode');
  if (!countryEl || !dialEl) return;
  const sorted = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
  sorted.forEach(c => {
    const o1 = document.createElement('option');
    o1.value = c.code; o1.textContent = c.name;
    countryEl.appendChild(o1);
    const o2 = document.createElement('option');
    o2.value = c.dial; o2.textContent = c.name + ' (' + c.dial + ')';
    dialEl.appendChild(o2);
  });
}

function updateStates() {
  const code = document.getElementById('signup-country').value;
  const stateEl = document.getElementById('signup-state');
  const dialEl = document.getElementById('signup-dialcode');
  const country = COUNTRIES.find(c => c.code === code);
  stateEl.innerHTML = '<option value="">Select state...</option>';
  if (country) {
    if (dialEl) dialEl.value = country.dial;
    country.states.forEach(s => {
      const o = document.createElement('option');
      o.value = s; o.textContent = s;
      stateEl.appendChild(o);
    });
  }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {

  // Populate country dropdowns
  populateCountryDropdowns();

  // Auth toggles
  document.getElementById('go-signup-btn').addEventListener('click', () => {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = '';
  });
  document.getElementById('go-login-btn').addEventListener('click', () => {
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('login-form').style.display = '';
  });

  // Login
  document.getElementById('login-btn').addEventListener('click', async () => {
    const emailVal = document.getElementById('login-email').value.trim();
    const passVal = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    errEl.style.display = 'none';
    if (!emailVal || !passVal) { showError(errEl, 'Please fill in all fields.'); return; }
    const btn = document.getElementById('login-btn');
    btn.disabled = true; btn.textContent = 'Signing in...';
    const { error } = await sb.auth.signInWithPassword({ email: emailVal, password: passVal });
    if (error) { showError(errEl, error.message); btn.disabled = false; btn.textContent = 'Sign In'; }
  });

  // Signup
  document.getElementById('signup-btn').addEventListener('click', async () => {
    const fullName  = document.getElementById('signup-name').value.trim();
    const emailVal  = document.getElementById('signup-email').value.trim();
    const passVal   = document.getElementById('signup-password').value;
    const cntryCode = document.getElementById('signup-country').value;
    const stateVal  = document.getElementById('signup-state').value;
    const dialVal   = document.getElementById('signup-dialcode').value;
    const phoneRaw  = document.getElementById('signup-phone').value.trim();
    const phoneVal  = phoneRaw ? (dialVal + ' ' + phoneRaw) : '';
    const cntryEl   = document.getElementById('signup-country');
    const cntryName = cntryEl.options[cntryEl.selectedIndex]?.text || '';
    const errEl     = document.getElementById('signup-error');
    errEl.style.display = 'none';

    if (!fullName || !emailVal || !passVal) { showError(errEl, 'Please fill in name, email and password.'); return; }
    if (!cntryCode) { showError(errEl, 'Please select your country.'); return; }
    if (!stateVal)  { showError(errEl, 'Please select your state / province.'); return; }
    if (passVal.length < 8) { showError(errEl, 'Password must be at least 8 characters.'); return; }

    const btn = document.getElementById('signup-btn');
    btn.disabled = true; btn.textContent = 'Creating account...';

    const { data: sd, error: se } = await sb.auth.signUp({
      email: emailVal, password: passVal,
      options: { data: { full_name: fullName } }
    });

    if (se) { showError(errEl, se.message); btn.disabled = false; btn.textContent = 'Create Account'; return; }

    if (sd.user) {
      try {
        await api.updateProfile({
          full_name: fullName,
          location: stateVal + ', ' + cntryName,
          phone_number: phoneVal || null
        });
      } catch(e) { console.warn('Profile update failed:', e); }
      appState.user = sd.user;
      await bootApp(sd.user);
    } else {
      toast('Check your email to confirm your account.', 'info');
    }
    btn.disabled = false; btn.textContent = 'Create Account';
  });

  // Chat input
  document.getElementById('chat-input').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
  });
  document.getElementById('chat-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  });

  // Nav items
  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  // Skills page buttons
  document.getElementById('load-skills-btn')?.addEventListener('click', () => loadSkillsForJob());
  document.getElementById('analyze-btn')?.addEventListener('click', () => runGapAnalysis());

  // Job profile input - press Enter to load skills
  document.getElementById('job-profile-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') loadSkillsForJob();
  });

  // Check existing session
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    localStorage.setItem('career_session', JSON.stringify(session));
    await bootApp(session.user);
  }

  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      localStorage.setItem('career_session', JSON.stringify(session));
      bootApp(session.user);
    } else if (event === 'SIGNED_OUT') {
      localStorage.removeItem('career_session');
      showAuthScreen();
    }
  });
});

// ─── App Boot ─────────────────────────────────────────────────────────────────
async function bootApp(user) {
  appState.user = user;
  try { appState.profile = await api.getProfile(); } catch { appState.profile = null; }
  updateSidebar();
  showApp();
  loadChatSessions();
  // Update location label on jobs toggle
  const locLabel = document.getElementById('loc-label');
  if (locLabel && appState.profile?.location) {
    locLabel.textContent = appState.profile.location.split(',')[0];
  }
  // Redirect to pending page if user clicked a feature card before signing in
  if (appState.pendingPage) {
    navigateTo(appState.pendingPage);
    appState.pendingPage = null;
  }
}

function showApp() {
  const landing = document.getElementById('landing-screen');
  if (landing) landing.style.display = 'none';
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
}
function showAuthScreen() {
  const landing = document.getElementById('landing-screen');
  if (landing) landing.style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}
function showError(el, msg) { el.textContent = msg; el.style.display = 'block'; }

async function signOut() {
  await sb.auth.signOut();
  sessionStorage.removeItem('sf_jobs_state');
  appState = { user:null, profile:null, currentSession:null, sessions:[], allJobs:[], matchedJobs:[], mySkills:[], allSkills:[], currentJobTab:'all', locationFilter:'global', jobsMap:{}, isTyping:false };
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector('.nav-item[data-page="' + page + '"]')?.classList.add('active');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page)?.classList.add('active');
  if (page === 'jobs') restoreJobsState();
  if (page === 'skills') loadSkillsPage();
  if (page === 'profile') loadProfile();
  if (page === 'mentor') loadMentorPage();
}

function updateSidebar() {
  const p = appState.profile;
  const initials = (p?.full_name || appState.user?.email || '?').split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
  document.getElementById('sidebar-avatar').textContent = initials;
  document.getElementById('sidebar-name').textContent = p?.full_name || appState.user?.email || 'User';
  document.getElementById('sidebar-role').textContent = p?.current_position || 'Set your role →';
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
async function loadChatSessions() {
  try { appState.sessions = await api.getSessions(); renderSessionsList(); }
  catch { toast('Could not load conversations', 'error'); }
}

function renderSessionsList() {
  const el = document.getElementById('chat-sessions-list');
  if (!appState.sessions.length) { el.innerHTML = '<div class="text-sm text-muted" style="padding:12px 8px">No conversations yet</div>'; return; }
  el.innerHTML = appState.sessions.map(s =>
    '<div class="chat-session-item ' + (s.id === appState.currentSession?.id ? 'active' : '') + '" onclick="openSession(\'' + s.id + '\')">' +
    '<span class="session-title">' + escHtml(s.title) + '</span>' +
    '<button class="session-delete" onclick="deleteSession(event,\'' + s.id + '\')" title="Delete">×</button></div>'
  ).join('');
}

async function openSession(id) {
  appState.currentSession = appState.sessions.find(s => s.id === id);
  renderSessionsList();
  document.getElementById('chat-welcome').style.display = 'none';
  document.getElementById('chat-messages').style.display = 'flex';
  document.getElementById('chat-messages').innerHTML = '<div class="loading-state"><div class="spinner"></div><span>Loading...</span></div>';
  try { renderMessages(await api.getMessages(id)); }
  catch { toast('Could not load messages', 'error'); }
}

function renderMessages(msgs) {
  const el = document.getElementById('chat-messages');
  if (!msgs.length) { el.innerHTML = ''; return; }
  el.innerHTML = msgs.map(m => buildMessageHTML(m.role, m.content)).join('');
  scrollToBottom();
}

function buildMessageHTML(role, content) {
  const avatar = role === 'assistant' ? '🧭' : '👤';
  const html = role === 'assistant' ? marked.parse(content) : escHtml(content).replace(/\n/g,'<br>');
  return '<div class="message ' + role + '"><div class="message-avatar">' + avatar + '</div><div class="message-content"><div class="message-bubble">' + html + '</div></div></div>';
}

function appendMessage(role, content) {
  document.getElementById('chat-messages').insertAdjacentHTML('beforeend', buildMessageHTML(role, content));
  scrollToBottom();
}

function showTyping() {
  document.getElementById('chat-messages').insertAdjacentHTML('beforeend',
    '<div class="message assistant" id="typing-msg"><div class="message-avatar">🧭</div><div class="message-content"><div class="message-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div></div></div>');
  scrollToBottom();
}
function hideTyping() { document.getElementById('typing-msg')?.remove(); }

async function createNewChat() {
  try {
    const session = await api.createSession();
    appState.sessions.unshift(session);
    appState.currentSession = session;
    renderSessionsList();
    document.getElementById('chat-welcome').style.display = 'none';
    document.getElementById('chat-messages').style.display = 'flex';
    document.getElementById('chat-messages').innerHTML = '';
    document.getElementById('chat-input').focus();
  } catch { toast('Could not create conversation', 'error'); }
}

async function sendChatMessage() {
  if (appState.isTyping) return;
  const input = document.getElementById('chat-input');
  const content = input.value.trim();
  if (!content) return;
  if (!appState.currentSession) { await createNewChat(); if (!appState.currentSession) return; }
  input.value = ''; input.style.height = 'auto';
  appendMessage('user', content);
  appState.isTyping = true;
  document.getElementById('chat-send-btn').disabled = true;
  showTyping();
  try {
    const res = await api.sendMessage(appState.currentSession.id, content);
    hideTyping();
    await typeMessage(res.content);
    appState.sessions = await api.getSessions(); renderSessionsList();
  } catch { hideTyping(); appendMessage('assistant', '⚠️ Sorry, encountered an error. Please try again.'); }
  finally { appState.isTyping = false; document.getElementById('chat-send-btn').disabled = false; }
}

async function typeMessage(fullContent) {
  const el = document.getElementById('chat-messages');

  // Create the message bubble first (empty)
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message assistant';
  msgDiv.innerHTML =
    '<div class="message-avatar">🧭</div>' +
    '<div class="message-content"><div class="message-bubble" id="typing-bubble"></div></div>';
  el.appendChild(msgDiv);
  scrollToBottom();

  const bubble = document.getElementById('typing-bubble');

  // Split into words and render progressively
  const words = fullContent.split(' ');
  let rendered = '';
  const batchSize = 3; // render 3 words at a time for speed

  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize).join(' ');
    rendered += (rendered ? ' ' : '') + batch;
    bubble.innerHTML = marked.parse(rendered);
    scrollToBottom();
    await new Promise(r => setTimeout(r, 18)); // ~18ms per batch = fast but visible
  }

  // Final render to make sure markdown is perfect
  bubble.innerHTML = marked.parse(fullContent);
  bubble.removeAttribute('id');
  scrollToBottom();
}

function sendPrompt(text) { createNewChat().then(() => { document.getElementById('chat-input').value = text; sendChatMessage(); }); }

async function deleteSession(e, id) {
  e.stopPropagation();
  try {
    await api.deleteSession(id);
    appState.sessions = appState.sessions.filter(s => s.id !== id);
    if (appState.currentSession?.id === id) {
      appState.currentSession = null;
      document.getElementById('chat-messages').style.display = 'none';
      document.getElementById('chat-welcome').style.display = 'flex';
    }
    renderSessionsList();
  } catch { toast('Could not delete', 'error'); }
}

function scrollToBottom() { const el = document.getElementById('chat-messages'); el.scrollTop = el.scrollHeight; }

// ─── Jobs ─────────────────────────────────────────────────────────────────────
function showJobsEmptyState() {
  document.getElementById('jobs-grid').innerHTML =
    '<div class="empty-state">' +
    '<div class="empty-state-icon">🔍</div>' +
    '<div class="empty-state-title">Search for jobs</div>' +
    '<p class="text-sm text-muted">Enter a job title, role, or skill above and hit Search to find real job listings.</p>' +
    '</div>';
}

async function loadJobs() {
  const isLocal = appState.locationFilter === 'local';
  const userLoc = appState.profile?.location ? appState.profile.location.split(',')[0].trim() : null;
  const loadingMsg = isLocal && userLoc ? 'Finding jobs near ' + userLoc + '...' : 'Finding your matches...';
  document.getElementById('jobs-grid').innerHTML = '<div class="loading-state"><div class="spinner"></div><span>' + loadingMsg + '</span></div>';
  try {
    const params = {};
    if (isLocal && userLoc) {
      params.location = userLoc;
    }
    appState.matchedJobs = await api.getMatchedJobs(params);
    appState.allJobs = appState.matchedJobs;
    renderJobs();
  } catch(err) {
    toast(err.message || 'Could not load jobs', 'error');
    document.getElementById('jobs-grid').innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Could not load jobs</div><p class="text-sm text-muted">' + (err.message||'Please try again') + '</p></div>';
  }
}

async function searchJobs() {
  const search = document.getElementById('job-search').value.trim();
  if (!search) { renderJobs(); return; }
  document.getElementById('jobs-grid').innerHTML = '<div class="loading-state"><div class="spinner"></div><span>Searching for "' + search + '"...</span></div>';
  try {
    const params = { search };
    const level = document.getElementById('job-level-filter').value;
    const type = document.getElementById('job-type-filter').value;
    if (level) params.experience_level = level;
    if (type) params.job_type = type;
    if (appState.locationFilter === 'local' && appState.profile?.location) {
      params.location = appState.profile.location.split(',')[0].trim();
    } else if (appState.locationFilter === 'custom' && appState.customLocation) {
      params.location = appState.customLocation;
    }
    const results = await api.getJobs(params);
    appState.allJobs = results;
    appState.currentJobTab = 'all';
    document.querySelectorAll('.jobs-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.jobs-tab')[0].classList.add('active');
    renderJobsData(results);
    saveJobsState();
  } catch(err) { toast(err.message || 'Search failed', 'error'); }
}

function switchJobTab(tab, el) {
  appState.currentJobTab = tab;
  document.querySelectorAll('.jobs-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('job-search').value = '';
  renderJobs();
}

function renderJobsData(jobs) {
  const grid = document.getElementById('jobs-grid');
  if (!jobs || jobs.length === 0) {
    const search = document.getElementById('job-search')?.value.trim();
    grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">No jobs found</div><p class="text-sm text-muted">' +
      (search ? 'No real listings found for "' + search + '". Try a different title or location.' : 'No jobs to show.') +
      '</p></div>';
    return;
  }
  if (!jobs || !jobs.length) { grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">No jobs found</div><p class="text-sm text-muted">Try a different search term</p></div>'; return; }
  // Store jobs in map for later lookup when saving
  jobs.forEach(job => { if (job.id) appState.jobsMap[job.id] = job; });
  grid.innerHTML = jobs.map(job => buildJobCard(job)).join('');
}

async function renderJobs() {
  let jobs;
  if (appState.currentJobTab === 'saved') {
    try { const saved = await api.getSavedJobs(); jobs = saved.filter(s => s.job_listings).map(s => ({ ...s.job_listings, isSaved: true, savedStatus: s.status })); }
    catch { jobs = []; }
  } else jobs = appState.allJobs;
  const level = document.getElementById('job-level-filter').value;
  const type = document.getElementById('job-type-filter').value;
  if (level) jobs = jobs.filter(j => j.experience_level === level);
  if (type) jobs = jobs.filter(j => j.job_type === type);
  renderJobsData(jobs);
}

function buildJobCard(job) {
  const score = job.matchScore;
  let badgeClass = '', badgeText = '';
  if (score !== undefined && score !== null) {
    badgeClass = score >= 70 ? 'match-high' : score >= 40 ? 'match-mid' : 'match-low';
    badgeText = score + '% match';
  }
  const currency = job.salary_currency || 'USD';
  const sym = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
  const salaryText = job.salary_min
    ? sym + (job.salary_min/1000).toFixed(0) + 'k – ' + sym + (job.salary_max/1000).toFixed(0) + 'k'
    : '';
  const required = (job.required_skills || []).slice(0, 4);
  const missing = (job.missingSkills || []).map(m => m.toLowerCase());
  const isReal = job.isRealJob;
  const applyLink = job.apply_link || job.apply_url || null;
  const postedDate = job.posted_at ? new Date(job.posted_at).toLocaleDateString('en-US', {month:'short', day:'numeric'}) : '';

  return '<div class="job-card">' +
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px">' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        (job.employer_logo ? '<img src="' + job.employer_logo + '" style="width:32px;height:32px;object-fit:contain;border-radius:6px;background:#fff;padding:2px" onerror="this.style.display=\'none\'">' : '') +
        '<div>' +
          '<div class="job-company">' + escHtml(job.company) + '</div>' +
          (postedDate ? '<div style="font-size:11px;color:var(--text3)">' + postedDate + '</div>' : '') +
        '</div>' +
      '</div>' +
      (badgeText ? '<span class="job-match-badge ' + badgeClass + '" style="flex-shrink:0">' + badgeText + '</span>' : '') +
    '</div>' +
    '<div class="job-title">' + escHtml(job.title) + '</div>' +
    '<div class="job-meta">' +
      (job.experience_level ? '<span class="job-tag">' + job.experience_level + '</span>' : '') +
      (job.job_type ? '<span class="job-tag">' + job.job_type.replace('_',' ') + '</span>' : '') +
      (job.location ? '<span class="job-tag">📍 ' + escHtml(job.location) + '</span>' : '') +
    '</div>' +
    (required.length ? '<div class="job-skills">' + required.map(s => '<span class="skill-chip ' + (missing.includes(s.toLowerCase()) ? 'missing' : '') + '">' + escHtml(s) + '</span>').join('') + '</div>' : '') +
    (salaryText ? '<div class="job-salary">' + salaryText + '/yr</div>' : '') +
    '<div class="job-actions">' +
      '<button class="btn btn-primary btn-sm" onclick="askAboutJob(\'' + escHtml(job.title) + '\',\'' + escHtml(job.company) + '\')">Ask AI</button>' +
      (!job.isSaved
        ? '<button class="btn btn-ghost btn-sm" onclick="saveJob(\'' + job.id + '\',this)">🔖 Save</button>'
        : appState.currentJobTab === 'saved'
          ? '<button class="btn btn-danger btn-sm" onclick="unsaveJob(\'' + job.id + '\',this)">🗑 Remove</button>'
          : '<button class="btn btn-ghost btn-sm" onclick="unsaveJob(\'' + job.id + '\',this)">✅ Saved</button>'
      ) +
      (applyLink ? '<a href="' + applyLink + '" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">Apply →</a>' : '') +
    '</div></div>';
}

async function saveJob(id, btn) {
  try {
    const jobData = appState.jobsMap[id] || null;
    const result = await api.saveJob(id, jobData);
    // If AI job got a new real ID, update the button
    const realId = result?.newJobId || id;
    btn.textContent = '✅ Saved';
    btn.onclick = () => unsaveJob(realId, btn);
    toast('Job saved!', 'success');
  } catch { toast('Could not save job', 'error'); }
}
async function unsaveJob(id, btn) {
  try {
    await api.unsaveJob(id);
    toast('Job removed from saved', 'info');
    if (appState.currentJobTab === 'saved') {
      // Remove card from DOM instantly
      const card = btn.closest('.job-card');
      if (card) {
        card.style.transition = 'opacity 0.3s, transform 0.3s';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
        setTimeout(() => { card.remove(); }, 300);
      }
    } else {
      btn.textContent = '🔖 Save';
      btn.onclick = () => saveJob(id, btn);
    }
  } catch { toast('Could not remove job', 'error'); }
}
function filterJobs() { renderJobs(); }

// ─── LOCATION AUTOCOMPLETE (Nominatim / OpenStreetMap — free, no key) ─────────
let _locDebounce = null;

async function locationAutocomplete(query) {
  const suggestions = document.getElementById('location-suggestions');
  if (!query || query.length < 2) {
    suggestions.style.display = 'none';
    return;
  }
  clearTimeout(_locDebounce);
  _locDebounce = setTimeout(async () => {
    try {
      const res = await fetch(
        'https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&featuretype=city&q=' +
        encodeURIComponent(query),
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const places = data.filter(d => ['city','town','village','municipality','county','state','country'].includes(d.type) || d.addresstype === 'city');
      suggestions.innerHTML = '';
      if (!places.length) {
        suggestions.innerHTML = '<div style="padding:10px 14px;font-size:13px;color:var(--text3)">No such location found</div>';
        suggestions.style.display = '';
        return;
      }
      places.forEach(p => {
        const label = p.display_name.split(',').slice(0,3).join(', ');
        const city = p.address?.city || p.address?.town || p.address?.village || p.address?.county || p.name;
        const country = p.address?.country || '';
        const shortLabel = [city, country].filter(Boolean).join(', ');
        const div = document.createElement('div');
        div.style.cssText = 'padding:9px 14px;font-size:13px;cursor:pointer;border-bottom:1px solid var(--border);color:var(--text);transition:background 0.15s';
        div.innerHTML = '<div style="font-weight:500">' + shortLabel + '</div><div style="font-size:11px;color:var(--text3);margin-top:1px">' + label + '</div>';
        div.onmouseenter = () => div.style.background = 'var(--bg3)';
        div.onmouseleave = () => div.style.background = '';
        div.onclick = () => selectLocation(shortLabel, city);
        suggestions.appendChild(div);
      });
      suggestions.style.display = '';
    } catch(e) {
      suggestions.innerHTML = '<div style="padding:10px 14px;font-size:13px;color:var(--text3)">Could not fetch locations</div>';
      suggestions.style.display = '';
    }
  }, 350);
}

function selectLocation(displayName, cityName) {
  document.getElementById('custom-location-input').value = displayName;
  document.getElementById('location-suggestions').style.display = 'none';
  appState.locationFilter = 'custom';
  appState.customLocation = cityName || displayName;
  const searchVal = document.getElementById('job-search')?.value.trim();
  if (searchVal) searchJobs();
  else showJobsEmptyState();
}

// Close suggestions on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('#location-autocomplete-wrap')) {
    const s = document.getElementById('location-suggestions');
    if (s) s.style.display = 'none';
  }
});

function handleLocationDropdown(sel) {
  const val = sel.value;
  const wrap = document.getElementById('location-autocomplete-wrap');
  if (val === 'custom') {
    wrap.style.display = '';
    document.getElementById('custom-location-input').focus();
  } else {
    wrap.style.display = 'none';
    document.getElementById('custom-location-input').value = '';
    document.getElementById('location-suggestions').style.display = 'none';
    appState.locationFilter = val;
    appState.customLocation = null;
    const searchVal = document.getElementById('job-search')?.value.trim();
    if (searchVal) searchJobs();
  
    else showJobsEmptyState();
  }
}

function applyCustomLocation() {
  const val = document.getElementById('custom-location-input').value.trim();
  if (!val) return;
  selectLocation(val, val);
}

function resetJobSearch() {
  document.getElementById('job-search').value = '';
  document.getElementById('location-dropdown').value = 'global';
  document.getElementById('location-autocomplete-wrap').style.display = 'none';
  document.getElementById('custom-location-input').value = '';
  document.getElementById('location-suggestions').style.display = 'none';
  document.getElementById('job-level-filter').value = '';
  document.getElementById('job-type-filter').value = '';
  appState.locationFilter = 'global';
  appState.customLocation = null;
  appState.allJobs = [];
  appState.matchedJobs = [];
  appState.currentJobTab = 'all';
  document.querySelectorAll('.jobs-tab').forEach((t,i) => t.classList.toggle('active', i===0));
  sessionStorage.removeItem('sf_jobs_state');
  showJobsEmptyState();
}

function saveJobsState() {
  try {
    sessionStorage.setItem('sf_jobs_state', JSON.stringify({
      search: document.getElementById('job-search')?.value || '',
      locationFilter: appState.locationFilter,
      customLocation: appState.customLocation || null,
      level: document.getElementById('job-level-filter')?.value || '',
      type: document.getElementById('job-type-filter')?.value || '',
      allJobs: appState.allJobs,
      matchedJobs: appState.matchedJobs,
      currentJobTab: appState.currentJobTab
    }));
  } catch(e) {}
}

function restoreJobsState() {
  try {
    const saved = sessionStorage.getItem('sf_jobs_state');
    if (!saved) { showJobsEmptyState(); return; }
    const s = JSON.parse(saved);
    if (s.search) document.getElementById('job-search').value = s.search;
    if (s.level) document.getElementById('job-level-filter').value = s.level;
    if (s.type) document.getElementById('job-type-filter').value = s.type;
    appState.locationFilter = s.locationFilter || 'global';
    appState.customLocation = s.customLocation || null;
    appState.allJobs = s.allJobs || [];
    appState.matchedJobs = s.matchedJobs || [];
    appState.currentJobTab = s.currentJobTab || 'matches';
    // Restore dropdown
    const dd = document.getElementById('location-dropdown');
    if (dd) dd.value = appState.locationFilter === 'custom' ? 'custom' : appState.locationFilter;
    if (appState.locationFilter === 'custom' && appState.customLocation) {
      const wrap = document.getElementById('location-autocomplete-wrap');
      if (wrap) { wrap.style.display = ''; document.getElementById('custom-location-input').value = appState.customLocation; }
    }
    // Restore active tab
    document.querySelectorAll('.jobs-tab').forEach(t => {
      t.classList.toggle('active', t.textContent.toLowerCase().includes(appState.currentJobTab === 'matches' ? 'best' : appState.currentJobTab));
    });
    if (appState.allJobs.length > 0 || appState.matchedJobs.length > 0) renderJobs();
    else showJobsEmptyState();
  } catch(e) { showJobsEmptyState(); }
}

// Legacy stub so old references don't break
function setLocationFilter(mode) { appState.locationFilter = mode; }
function askAboutJob(title, company) {
  navigateTo('chat');
  setTimeout(async () => { await createNewChat(); document.getElementById('chat-input').value = 'I\'m interested in the "' + title + '" role at ' + company + '. Can you help me understand what I need to succeed and how to prepare my application?'; sendChatMessage(); }, 100);
}

// ─── Skills ───────────────────────────────────────────────────────────────────
async function loadSkillsPage() {
  loadPastAnalyses();
  const s2 = document.getElementById('step2-card');
  if (s2) s2.style.display = 'none';
  const jp = document.getElementById('job-profile-input');
  if (jp) jp.value = '';
  const ar = document.getElementById('analysis-result');
  if (ar) ar.innerHTML = '';
}

async function loadSkillsForJob() {
  const jobEl = document.getElementById('job-profile-input');
  const job = jobEl ? jobEl.value.trim() : '';
  if (!job) { toast('Please enter a job profile first', 'error'); return; }
  const btn = document.getElementById('load-skills-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Loading...'; }
  try {
    const skills = await api.getSkillsForJob(job);
    renderJobSkillsCheckboxes(skills);
    const card = document.getElementById('step2-card');
    if (card) { card.style.display = ''; card.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  } catch(err) {
    toast(err.message || 'Could not load skills', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Load Skills'; }
  }
}

function renderJobSkillsCheckboxes(skills) {
  const container = document.getElementById('job-skills-container');
  if (!container) return;
  const categories = [
    { label: '🔧 Technical Skills', items: skills.technical || [] },
    { label: '🛠️ Tools & Platforms', items: skills.tools || [] },
    { label: '🤝 Soft Skills', items: skills.soft || [] }
  ];
  container.innerHTML = categories.map(cat => {
    if (!cat.items.length) return '';
    return '<div class="skill-category-title">' + cat.label + '</div>' +
      '<div class="skill-checkbox-grid">' +
      cat.items.map(skill =>
        '<label class="skill-checkbox-item">' +
        '<input type="checkbox" value="' + escHtml(skill) + '">' +
        '<span class="skill-checkbox-name">' + escHtml(skill) + '</span>' +
        '<select class="skill-level-select" onclick="event.stopPropagation()">' +
        '<option value="beginner">Beginner</option>' +
        '<option value="intermediate" selected>Intermediate</option>' +
        '<option value="advanced">Advanced</option>' +
        '<option value="expert">Expert</option>' +
        '</select></label>'
      ).join('') + '</div>';
  }).join('');

  container.querySelectorAll('.skill-checkbox-item').forEach(label => {
    label.addEventListener('click', function(e) {
      if (e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION') return;
      const cb = this.querySelector('input[type="checkbox"]');
      cb.checked = !cb.checked;
      this.classList.toggle('selected', cb.checked);
    });
  });
}

function toggleSkillItem(label) {
  const cb = label.querySelector('input[type="checkbox"]');
  if (!cb) return;
  cb.checked = !cb.checked;
  label.classList.toggle('selected', cb.checked);
}

function getSelectedSkills() {
  const selected = [];
  document.querySelectorAll('.skill-checkbox-item').forEach(item => {
    const cb = item.querySelector('input[type="checkbox"]');
    const lvl = item.querySelector('.skill-level-select');
    if (cb && cb.checked) selected.push({ name: cb.value, proficiency: lvl ? lvl.value : 'intermediate' });
  });
  return selected;
}

async function addSkill() {}
async function removeSkill(skillId) {}

async function runGapAnalysis() {
  const jobEl = document.getElementById('job-profile-input');
  const job = jobEl ? jobEl.value.trim() : '';
  if (!job) { toast('Please enter a job profile first', 'error'); return; }
  const selectedSkills = getSelectedSkills();
  if (!selectedSkills.length) { toast('Please select at least one skill you have', 'error'); return; }
  const btn = document.getElementById('analyze-btn');
  const resultEl = document.getElementById('analysis-result');
  if (btn) { btn.disabled = true; btn.textContent = 'Analyzing...'; }
  if (resultEl) {
    resultEl.innerHTML = '<div class="loading-state"><div class="spinner"></div><span>Analyzing skill gap for ' + escHtml(job) + '...</span></div>';
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  try {
    const a = await api.analyzeGapWithSkills(job, selectedSkills);
    renderAnalysis(a, job);
    loadPastAnalyses();
  } catch(err) {
    toast(err.message || 'Analysis failed. Please try again.', 'error');
    if (resultEl) resultEl.innerHTML = '';
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🔍 Analyze My Skill Gap'; }
  }
}

async function loadPastAnalyses() {
  try {
    const analyses = await api.getPastAnalyses();
    const el = document.getElementById('past-analyses');
    if (!el) return;
    if (!analyses || !analyses.length) { el.innerHTML = ''; return; }
    let html = '<div class="text-xs text-muted" style="margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em">Past Analyses</div>';
    analyses.slice(0, 3).forEach(a => {
      const color = a.match_score >= 70 ? 'var(--green)' : a.match_score >= 40 ? 'var(--amber)' : 'var(--red)';
      const safeRole = escHtml(a.target_position).replace(/'/g, '&#39;');
      html += '<div style="padding:8px 12px;background:var(--bg3);border-radius:8px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;gap:8px">';
      html += '<span class="text-sm" style="cursor:pointer;flex:1" onclick="rerunAnalysis(\'' + safeRole + '\')">' + escHtml(a.target_position) + '</span>';
      html += '<span class="text-xs" style="color:' + color + ';flex-shrink:0">' + a.match_score + '%</span>';
      html += '<button onclick="deleteAnalysis(\'' + a.id + '\')" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:14px;padding:2px 4px;flex-shrink:0" title="Delete">🗑</button>';
      html += '</div>';
    });
    el.innerHTML = html;
  } catch(e) { console.warn('Could not load past analyses', e); }
}

function rerunAnalysis(role) {
  const el = document.getElementById('job-profile-input');
  if (el) { el.value = role; loadSkillsForJob(); }
}


function renderAnalysis(a, role) {
  const deg = Math.round((a.match_score / 100) * 360);
  const sc = a.match_score >= 70 ? 'var(--green)' : a.match_score >= 40 ? 'var(--amber)' : 'var(--red)';

  const missingHTML = (a.missing_skills || []).map(s => {
    const priority = (s.priority || '').replace('_', ' ');
    return '<div class="missing-skill-item">' +
      '<div class="missing-skill-name">' + escHtml(s.skill) +
      (priority ? '<span class="priority-badge priority-' + s.priority + '">' + priority + '</span>' : '') +
      '</div>' +
      '<div class="missing-skill-reason">' + escHtml(s.reason || '') + '</div>' +
      '<div class="missing-skill-resources">' + (s.resources || []).map(r => {
      const url = resourceToUrl(r);
      return url
        ? '<a class="resource-link" href="' + url + '" target="_blank" rel="noopener">' + escHtml(r) + ' ↗</a>'
        : '<span class="resource-link">' + escHtml(r) + '</span>';
    }).join('') + '</div>' +
      '</div>';
  }).join('');

  const recsHTML = (a.recommendations || []).map(r =>
    '<div class="rec-item"><div class="rec-title">' + escHtml(r.title) +
    (r.timeframe ? '<span class="rec-timeframe">⏱ ' + escHtml(r.timeframe) + '</span>' : '') +
    '</div><div class="rec-desc">' + escHtml(r.description || '') + '</div></div>'
  ).join('');

  const strengthsHTML = (a.strengths || []).map(s =>
    '<span class="strength-item">✓ ' + escHtml(s) + '</span>'
  ).join('');

  document.getElementById('analysis-result').innerHTML =
    '<div class="analysis-result">' +
      '<div class="analysis-header">' +
        '<div class="score-ring-wrap">' +
          '<div class="score-ring" style="background:conic-gradient(' + sc + ' ' + deg + 'deg,var(--bg3) 0deg)">' +
            '<span class="score-value" style="color:' + sc + '">' + a.match_score + '%</span>' +
          '</div>' +
          '<span class="text-xs text-muted">Match score</span>' +
        '</div>' +
        '<div>' +
          '<h3 style="font-family:var(--font-display);font-size:18px;margin-bottom:8px">Analysis: ' + escHtml(role) + '</h3>' +
          '<p class="text-sm" style="color:var(--text2);line-height:1.7">' + escHtml(a.summary || '') + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="analysis-body">' +
        (strengthsHTML ? '<div class="analysis-section"><div class="analysis-section-title">✅ Your Strengths</div><div class="strength-list">' + strengthsHTML + '</div></div>' : '') +
        (missingHTML ? '<div class="analysis-section"><div class="analysis-section-title">🎯 Skills to Develop</div>' + missingHTML + '</div>' : '') +
        (recsHTML ? '<div class="analysis-section"><div class="analysis-section-title">📋 Action Plan</div>' + recsHTML + '</div>' : '') +
        (a.roadmap ? '<div class="analysis-section"><div class="analysis-section-title">🗺️ Learning Roadmap</div><p class="text-sm" style="color:var(--text2);line-height:1.8">' + escHtml(a.roadmap) + '</p></div>' : '') +
      '</div>' +
    '</div>';
}

// ─── Profile ──────────────────────────────────────────────────────────────────
async function loadProfile() {
  try { appState.profile = await api.getProfile(); } catch { return; }
  const p = appState.profile;
  document.getElementById('p-name').value = p.full_name || '';
  document.getElementById('p-location').value = p.location || '';
  document.getElementById('p-current-role').value = p.current_position || '';
  document.getElementById('p-target-role').value = p.target_position || '';
  document.getElementById('p-experience').value = p.experience_years || '';
  document.getElementById('p-education').value = p.education_level || '';
  document.getElementById('p-bio').value = p.bio || '';
  document.getElementById('p-linkedin').value = p.linkedin_url || '';
  document.getElementById('p-github').value = p.github_url || '';
  const initials = (p.full_name||'?').split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
  document.getElementById('profile-avatar-big').textContent = initials;
  document.getElementById('profile-display-name').textContent = p.full_name || '—';
  document.getElementById('profile-display-role').textContent = p.current_position || 'No role set';
  loadProfileTransactions();
}

async function saveProfile() {
  const btn = document.getElementById('save-profile-btn');
  btn.disabled = true; btn.textContent = 'Saving...';
  try {
    appState.profile = await api.updateProfile({
      full_name: document.getElementById('p-name').value,
      location: document.getElementById('p-location').value,
      current_position: document.getElementById('p-current-role').value,
      target_position: document.getElementById('p-target-role').value,
      experience_years: parseInt(document.getElementById('p-experience').value) || 0,
      education_level: document.getElementById('p-education').value,
      bio: document.getElementById('p-bio').value,
      linkedin_url: document.getElementById('p-linkedin').value,
      github_url: document.getElementById('p-github').value
    });
    updateSidebar(); loadProfile(); toast('Profile saved!', 'success');
  } catch { toast('Could not save profile', 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Save Profile'; }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toast(message, type='info') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = message;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
function escHtml(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Expose functions globally for inline onclick handlers ────────────────────
window.navigateTo = navigateTo;
window.signOut = signOut;
window.createNewChat = createNewChat;
window.sendPrompt = sendPrompt;
window.sendChatMessage = sendChatMessage;
window.searchJobs = searchJobs;
window.switchJobTab = switchJobTab;
window.filterJobs = filterJobs;
window.setLocationFilter = setLocationFilter;
window.handleLocationDropdown = handleLocationDropdown;
window.applyCustomLocation = applyCustomLocation;
window.locationAutocomplete = locationAutocomplete;
window.selectLocation = selectLocation;
window.resetJobSearch = resetJobSearch;
window.saveJob = saveJob;
window.unsaveJob = unsaveJob;
window.askAboutJob = askAboutJob;
window.openSession = openSession;
window.deleteSession = deleteSession;
window.addSkill = addSkill;
window.removeSkill = removeSkill;
window.loadSkillsForJob = loadSkillsForJob;
window.runGapAnalysis = runGapAnalysis;
window.toggleSkillItem = toggleSkillItem;
window.updateStates = updateStates;
window.saveProfile = saveProfile;
window.rerunAnalysis = rerunAnalysis;
window.renderAnalysis = renderAnalysis;

// ─── MENTOR ───────────────────────────────────────────────────────────────────
async function loadMentorPage() {
  const bookedEl = document.getElementById('mentor-booked');
  const bookingEl = document.getElementById('mentor-booking');
  if (bookedEl) bookedEl.style.display = 'none';
  if (bookingEl) bookingEl.style.display = '';

  // Try to check if already paid — silently ignore any errors
  try {
    const session = await api.getMentorSession();
    if (session && session.status === 'paid') {
      if (bookedEl) bookedEl.style.display = '';
      if (bookingEl) bookingEl.style.display = 'none';
      const d = document.getElementById('mentor-session-details');
      if (d) d.innerHTML =
        '<div class="mentor-session-row"><span class="mentor-session-label">Status</span><span class="mentor-session-value" style="color:var(--green)">✅ Confirmed</span></div>' +
        '<div class="mentor-session-row"><span class="mentor-session-label">Amount Paid</span><span class="mentor-session-value">₹' + session.amount + '</span></div>' +
        '<div class="mentor-session-row"><span class="mentor-session-label">Payment ID</span><span class="mentor-session-value" style="font-size:11px">' + session.payment_id + '</span></div>' +
        '<div class="mentor-session-row"><span class="mentor-session-label">Booked On</span><span class="mentor-session-value">' + new Date(session.created_at).toLocaleDateString() + '</span></div>';
    }
  } catch(e) { /* show booking form — already done above */ }
}

async function startMentorPayment() {
  const goal = document.getElementById('mentor-goal').value;
  const time = document.getElementById('mentor-time').value;
  const notes = document.getElementById('mentor-notes').value;

  if (!goal) { toast('Please select a goal first', 'error'); return; }

  const btn = document.getElementById('mentor-pay-btn');
  btn.disabled = true; btn.textContent = 'Processing...';

  try {
    const order = await api.createMentorOrder();

    // Check if Razorpay is available and keys are set
    const rzpKey = 'RAZORPAY_KEY_ID_HERE'; // ← Replace with your rzp_live_ key
    if (!window.Razorpay || rzpKey === 'RAZORPAY_KEY_ID_HERE') {
      // Demo mode — simulate payment success
      await simulateMentorPayment(order, { goal, time, notes });
      return;
    }

    const options = {
      key: rzpKey,
      amount: order.amount,
      currency: order.currency,
      name: 'SkillForge AI Mentorship',
      description: '1-on-1 Career Mentorship Session',
      order_id: order.orderId,
      prefill: {
        name: appState.profile?.full_name || '',
        email: appState.user?.email || ''
      },
      theme: { color: '#7c3aed' },
      handler: async function(response) {
        try {
          await api.verifyMentorPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            preferences: { goal, time, notes }
          });
          toast('🎉 Session booked! A mentor will contact you within 24 hours.', 'success');
          loadMentorPage();
        } catch(err) {
          toast('Payment verification failed. Please contact support.', 'error');
          btn.disabled = false; btn.textContent = '💳 Book Session — ₹500';
        }
      },
      modal: {
        ondismiss: function() {
          btn.disabled = false;
          btn.textContent = '💳 Book Session — ₹500';
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
    // Reset button after portal opens
    btn.disabled = false;
    btn.textContent = '💳 Book Session — ₹500';

  } catch(err) {
    toast(err.message || 'Could not initiate payment', 'error');
    btn.disabled = false;
    btn.textContent = '💳 Book Session — ₹500';
  }
}

async function simulateMentorPayment(order, preferences) {
  const btn = document.getElementById('mentor-pay-btn');

  // Show demo payment modal
  const overlay = document.createElement('div');
  overlay.id = 'demo-payment-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center';
  overlay.innerHTML =
    '<div style="background:var(--bg2);border-radius:16px;padding:32px;max-width:380px;width:90%;text-align:center">' +
    '<div style="font-size:40px;margin-bottom:12px">🔐</div>' +
    '<h3 style="font-family:var(--font-display);margin-bottom:8px">Demo Payment</h3>' +
    '<p class="text-sm text-muted" style="margin-bottom:20px;line-height:1.6">Razorpay is in test mode. Click below to simulate a successful payment and see the full booking flow.</p>' +
    '<div style="background:var(--bg3);border-radius:10px;padding:16px;margin-bottom:20px;text-align:left">' +
    '<div style="font-size:13px;color:var(--text3);margin-bottom:4px">Amount</div>' +
    '<div style="font-size:24px;font-weight:700;color:var(--accent)">₹500</div>' +
    '</div>' +
    '<button id="demo-pay-confirm" class="btn btn-primary btn-full" style="margin-bottom:10px">✅ Simulate Successful Payment</button>' +
    '<button id="demo-pay-cancel" class="btn btn-ghost btn-full">Cancel</button>' +
    '</div>';

  document.body.appendChild(overlay);

  document.getElementById('demo-pay-cancel').onclick = () => {
    overlay.remove();
    btn.disabled = false;
    btn.textContent = '💳 Book Session — ₹500';
  };

  document.getElementById('demo-pay-confirm').onclick = async () => {
    document.getElementById('demo-pay-confirm').textContent = 'Booking...';
    document.getElementById('demo-pay-confirm').disabled = true;
    try {
      // Call verify with demo data
      await api.verifyMentorPayment({
        razorpay_order_id: order.orderId,
        razorpay_payment_id: 'demo_pay_' + Date.now(),
        razorpay_signature: 'demo_signature',
        preferences,
        demo: true
      });
      overlay.remove();
      toast('🎉 Session booked! A mentor will contact you within 24 hours.', 'success');
      loadMentorPage();
    } catch(err) {
      overlay.remove();
      toast('Booking failed: ' + err.message, 'error');
      btn.disabled = false;
      btn.textContent = '💳 Book Session — ₹500';
    }
  };
}

window.loadMentorPage = loadMentorPage;
window.startMentorPayment = startMentorPayment;
window.simulateMentorPayment = simulateMentorPayment;

// ─── PROFILE TRANSACTIONS ─────────────────────────────────────────────────────
async function loadProfileTransactions() {
  try {
    const sessions = await api.getMentorSessions();
    const txEl = document.getElementById('profile-transactions');
    const sessionEl = document.getElementById('profile-mentor-session');
    const detailsEl = document.getElementById('profile-mentor-details');

    if (!sessions || !sessions.length) {
      if (txEl) txEl.innerHTML = '<div class="text-sm text-muted" style="padding:8px 0">No transactions yet. <button class="btn btn-ghost btn-sm" onclick="navigateTo(\'mentor\')">Book a session →</button></div>';
      return;
    }

    // Show active session card
    const active = sessions.find(s => s.status === 'paid');
    if (active && sessionEl && detailsEl) {
      sessionEl.style.display = '';
      detailsEl.innerHTML =
        '<div class="mentor-session-row"><span class="mentor-session-label">Status</span><span class="mentor-session-value" style="color:var(--green)">✅ Confirmed</span></div>' +
        '<div class="mentor-session-row"><span class="mentor-session-label">Amount</span><span class="mentor-session-value">₹' + active.amount + '</span></div>' +
        '<div class="mentor-session-row"><span class="mentor-session-label">Booked</span><span class="mentor-session-value">' + new Date(active.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) + '</span></div>' +
        (active.preferences?.goal ? '<div class="mentor-session-row"><span class="mentor-session-label">Goal</span><span class="mentor-session-value">' + escHtml(active.preferences.goal.replace('_',' ')) + '</span></div>' : '') +
        (active.preferences?.time ? '<div class="mentor-session-row"><span class="mentor-session-label">Preferred Time</span><span class="mentor-session-value">' + escHtml(active.preferences.time) + '</span></div>' : '');
    }

    // Transaction history table
    if (txEl) {
      txEl.innerHTML =
        '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
        '<thead><tr style="border-bottom:1px solid var(--border)">' +
        '<th style="text-align:left;padding:8px 0;color:var(--text3);font-weight:600">Date</th>' +
        '<th style="text-align:left;padding:8px 0;color:var(--text3);font-weight:600">Description</th>' +
        '<th style="text-align:left;padding:8px 0;color:var(--text3);font-weight:600">Status</th>' +
        '<th style="text-align:right;padding:8px 0;color:var(--text3);font-weight:600">Amount</th>' +
        '</tr></thead><tbody>' +
        sessions.map(s => {
          const statusColor = s.status === 'paid' ? 'var(--green)' : 'var(--amber)';
          const date = new Date(s.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
          const payId = s.payment_id ? s.payment_id.substring(0, 18) + '...' : '—';
          return '<tr style="border-bottom:1px solid var(--border)">' +
            '<td style="padding:10px 0;color:var(--text2)">' + date + '</td>' +
            '<td style="padding:10px 0"><div style="font-weight:500">1-on-1 Mentorship</div><div style="font-size:11px;color:var(--text3)">' + payId + '</div></td>' +
            '<td style="padding:10px 0"><span style="color:' + statusColor + ';font-weight:600;text-transform:capitalize">' + s.status + '</span></td>' +
            '<td style="padding:10px 0;text-align:right;font-weight:700">₹' + s.amount + '</td>' +
            '</tr>';
        }).join('') +
        '</tbody></table>';
    }
  } catch(e) {
    console.warn('Could not load transactions:', e.message);
  }
}

function showMentorBookingForm() {
  document.getElementById('mentor-booked').style.display = 'none';
  document.getElementById('mentor-booking').style.display = '';
}

window.loadProfileTransactions = loadProfileTransactions;
window.showMentorBookingForm = showMentorBookingForm;

// ─── RESOURCE URL MAPPER ─────────────────────────────────────────────────────
function resourceToUrl(resource) {
  const r = resource.toLowerCase();
  // If it's already a URL
  if (r.startsWith('http')) return resource;
  // Map common resource names to real URLs
  const map = {
    'coursera': 'https://www.coursera.org/search?query=' + encodeURIComponent(resource),
    'udemy': 'https://www.udemy.com/courses/search/?q=' + encodeURIComponent(resource),
    'youtube': 'https://www.youtube.com/results?search_query=' + encodeURIComponent(resource),
    'freecodecamp': 'https://www.freecodecamp.org',
    'freeCodecamp': 'https://www.freecodecamp.org',
    'free code camp': 'https://www.freecodecamp.org',
    'mdn': 'https://developer.mozilla.org',
    'mdn web docs': 'https://developer.mozilla.org',
    'w3schools': 'https://www.w3schools.com',
    'stackoverflow': 'https://stackoverflow.com/search?q=' + encodeURIComponent(resource),
    'stack overflow': 'https://stackoverflow.com/search?q=' + encodeURIComponent(resource),
    'github': 'https://github.com/search?q=' + encodeURIComponent(resource),
    'leetcode': 'https://leetcode.com',
    'hackerrank': 'https://www.hackerrank.com',
    'pluralsight': 'https://www.pluralsight.com/search?q=' + encodeURIComponent(resource),
    'linkedin learning': 'https://www.linkedin.com/learning/search?keywords=' + encodeURIComponent(resource),
    'edx': 'https://www.edx.org/search?q=' + encodeURIComponent(resource),
    'khan academy': 'https://www.khanacademy.org',
    'khanacademy': 'https://www.khanacademy.org',
    'aws': 'https://aws.amazon.com/training/',
    'google developers': 'https://developers.google.com',
    'microsoft learn': 'https://learn.microsoft.com',
    'docker docs': 'https://docs.docker.com',
    'kubernetes docs': 'https://kubernetes.io/docs/',
    'react docs': 'https://react.dev',
    'official documentation': null,
    'book': null,
  };
  for (const [key, url] of Object.entries(map)) {
    if (r.includes(key)) return url;
  }
  // Generic fallback — Google search
  return 'https://www.google.com/search?q=' + encodeURIComponent(resource);
}

// ─── DELETE ANALYSIS ─────────────────────────────────────────────────────────
async function deleteAnalysis(id) {
  try {
    await api.deleteAnalysis(id);
    toast('Analysis deleted', 'success');
    loadPastAnalyses();
  } catch(e) {
    toast('Could not delete analysis', 'error');
  }
}

window.resourceToUrl = resourceToUrl;
window.deleteAnalysis = deleteAnalysis;

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function showLandingAuth(mode) {
  // If already signed in, go straight to dashboard
  if (appState.user) {
    document.getElementById('landing-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    return;
  }
  const landing = document.getElementById('landing-screen');
  if (landing) landing.style.display = 'none';
  showAuthScreen();
  if (mode === 'signup') {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'flex';
  } else {
    document.getElementById('login-form').style.display = 'flex';
    document.getElementById('signup-form').style.display = 'none';
  }
}

function toggleLandingMenu() {
  document.getElementById('land-mobile-menu').classList.toggle('open');
}

window.showLandingAuth = showLandingAuth;
window.toggleLandingMenu = toggleLandingMenu;

function goToLanding() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('landing-screen').style.display = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.goToLanding = goToLanding;

// ─── LANDING FEATURE CLICK ────────────────────────────────────────────────────
function openFeature(page) {
  if (appState.user) {
    // Already signed in — go straight to dashboard page
    document.getElementById('landing-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    navigateTo(page);
  } else {
    // Not signed in — show sign in, then redirect to page after login
    appState.pendingPage = page;
    showLandingAuth('login');
  }
}
window.openFeature = openFeature;

function goToLandingFromAuth() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('landing-screen').style.display = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function confirmSignOut() {
  const modal = document.getElementById('signout-modal');
  modal.style.display = 'flex';
}

function closeSignOutModal() {
  document.getElementById('signout-modal').style.display = 'none';
}

// Close modal on backdrop click
document.addEventListener('click', (e) => {
  const modal = document.getElementById('signout-modal');
  if (e.target === modal) closeSignOutModal();
});

window.goToLandingFromAuth = goToLandingFromAuth;
window.confirmSignOut = confirmSignOut;
window.closeSignOutModal = closeSignOutModal;

// ─── CHAT SIDEBAR TOGGLE ─────────────────────────────────────────────────────
function toggleChatSidebar() {
  const sidebar = document.querySelector('.chat-sidebar');
  const btn = document.getElementById('chat-sidebar-toggle-btn');
  if (!sidebar) return;
  const isOpen = sidebar.classList.toggle('open');
  if (btn) btn.textContent = isOpen ? '✕' : '☰';
}
window.toggleChatSidebar = toggleChatSidebar;