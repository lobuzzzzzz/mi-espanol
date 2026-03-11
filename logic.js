// ===================== STATE =====================
// ===================== STATE =====================

let progress = JSON.parse(localStorage.getItem('mies_progress') || '{}');
// progress[quizId] = { attempts: N, bestScore: X, lastScore: X, lastDate: '...' }

function saveProgress() {
  localStorage.setItem('mies_progress', JSON.stringify(progress));
}


// ===================== QUIZ ENGINE =====================

let activeQuiz = null;
let qCur = 0, qAnswered = false, qLog = [], qHintUsed = false;

function openQuiz(id) {
  try {
    const q = [...grammarQuizzes, ...vocabQuizzes].find(x => x.id === id);
    if (!q) { console.error('openQuiz: quiz not found for id:', id); return; }
    activeQuiz = q;
    qCur = 0; qAnswered = false; qLog = [];

    document.getElementById('modal').classList.add('open');
    document.getElementById('modal-inner').scrollTop = 0;

    if (q.type === 'vocab') renderVocabQuiz();
    else if (q.type === 'typing') renderTypingQuiz();
    else renderGrammarQuiz();
  } catch(e) {
    console.error('openQuiz ERROR for id:', id, e);
    console.error('Stack:', e.stack);
  }
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  activeQuiz = null;
}

document.getElementById('modal').addEventListener('click', e => {
  if (e.target === document.getElementById('modal')) closeModal();
});


// ── FINISH ──
function finishQuiz() {
  const q = activeQuiz;
  const isVocab = q.type === 'vocab';

  let correct, total, pct;
  if (isVocab) {
    correct = qLog.filter(r => r.ok === 'correct').length;
    total = qLog.length;
  } else {
    correct = qLog.filter(r => r.ok).length;
    total = qLog.length;
  }
  pct = Math.round((correct / total) * 100);

  // Save progress
  const prev = progress[q.id];
  progress[q.id] = {
    attempts: (prev?.attempts || 0) + 1,
    bestScore: Math.max(prev?.bestScore || 0, pct),
    lastScore: pct,
    lastDate: new Date().toISOString()
  };
  saveProgress();
  updateDashStats();
  initDashboard();

  const [title, msg] = pct === 100
    ? ['¡Perfecto! 🏆', 'Bezbłędnie! Doskonały wynik.']
    : pct >= 80
    ? ['¡Muy bien! 🌟', 'Świetny wynik! Jeszcze trochę do perfekcji.']
    : pct >= 60
    ? ['¡Bien! 💪', 'Dobry wynik. Powtórz te, które sprawiły problem.']
    : ['¡Sigue! 📚', 'Nie poddawaj się — każda powtórka robi różnicę!'];

  // Wrong words for retry (vocab only)
  const isTyping = q.type === 'typing';
  const wrongItems = isVocab ? qLog.filter(r => r.ok === 'wrong' || r.ok === 'close') : qLog.map((r,i) => r.ok ? null : q.questions[i]).filter(Boolean);

  let reviewHtml = '';
  if (isVocab) {
    const close = qLog.filter(r => r.ok === 'close').length;
    const wrong = qLog.filter(r => r.ok === 'wrong').length;
    reviewHtml = `<div style="display:flex;gap:14px;margin-bottom:14px;font-size:0.8rem;font-weight:700;">
      <span style="color:var(--green)">✅ ${correct}</span>
      <span style="color:#fbbf24">🟡 ${close}</span>
      <span style="color:var(--red)">❌ ${wrong}</span>
    </div>`;
    reviewHtml += qLog.map(r => {
      const cls = r.ok === 'correct' ? 'rok' : r.ok === 'close' ? 'rcl' : 'rerr';
      const ico = r.ok === 'correct' ? '✅' : r.ok === 'close' ? '🟡' : '❌';
      const given = r.ok !== 'correct' ? `<span class="rg">wpisałeś: „${r.given}"</span>` : '';
      return `<div class="m-rrow ${cls}"><span>${ico}</span><span class="rw">${r.es}</span><span class="rt">${r.pl}</span>${given}</div>`;
    }).join('');
  } else {
    reviewHtml += qLog.map((r,i) => {
      const qi = q.questions[i];
      return `<div class="m-rrow ${r.ok?'rok':'rerr'}"><span>${r.ok?'✅':'❌'}</span><span class="rw" style="font-size:0.82rem;">${qi.q}</span></div>`;
    }).join('');
  }

  document.getElementById('modal-content').innerHTML = `
    <div class="m-results">
      <div class="m-score-big">${pct}%</div>
      <div class="m-score-label">${correct} / ${total} poprawnych</div>
      <div class="m-result-title">${title}</div>
      <div class="m-result-msg">${msg}</div>
    </div>
    <div class="m-review">${reviewHtml}</div>
    ${wrongItems.length > 0 ? `
    <button class="m-btn" onclick="retryWrong()" style="margin-bottom:10px;">
      🔁 Powtórz błędy (${wrongItems.length} ${isVocab ? 'słówek' : 'pytań'})
    </button>` : ''}
    <button class="m-btn secondary" onclick="openQuiz('${q.id}')">↺ Zacznij od nowa</button>
    <button class="m-btn secondary" onclick="closeModal()" style="margin-top:6px;">✕ Zamknij</button>`;
}

function retryWrong() {
  const q = activeQuiz;
  if (q.type === 'vocab') {
    const wrongWords = qLog.filter(r => r.ok === 'wrong' || r.ok === 'close').map(r => q.words.find(w => w.es === r.es)).filter(Boolean);
    if (!wrongWords.length) return;
    vocabQuestions = shuffle(wrongWords);
    qCur = 0; qLog = [];
    renderVocabQuestion();
  } else {
    const wrongQs = qLog.map((r,i) => r.ok ? null : q.questions[i]).filter(Boolean);
    if (!wrongQs.length) return;
    activeQuiz = Object.assign({}, q, { questions: shuffle(wrongQs) });
    qCur = 0; qLog = [];
    if (q.type === 'typing') renderTypingQuiz();
    else renderGrammarQuiz();
  }
  document.getElementById('modal-inner').scrollTop = 0;
}

// ===================== UTILS =====================

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}


// ===================== TUTOR =====================

let tutorMode = 'translate';

function setTutorMode(mode, btn) {
  tutorMode = mode;
  document.querySelectorAll('#page-tutor .vf-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const placeholders = {
    translate: 'Wpisz słowo lub zdanie do przetłumaczenia...',
    explain: 'Wpisz temat gramatyczny (np. subjuntivo, por vs para)...',
    examples: 'Wpisz słowo lub wyrażenie...',
    chat: 'Napisz coś po hiszpańsku lub polsku...'
  };
  document.getElementById('tutor-input').placeholder = placeholders[mode];
}

async function askTutor() {
  const input = document.getElementById('tutor-input').value.trim();
  if (!input) return;

  const out = document.getElementById('tutor-output');
  out.innerHTML = '<div style="color:var(--muted);font-size:0.9rem;padding:20px 0;">⏳ Myślę...</div>';

  const prompts = {
    translate: `Jesteś pomocnym tutorem języka hiszpańskiego dla polskiego ucznia na poziomie B1. 
Przetłumacz "${input}" między polskim a hiszpańskim. 
Podaj: 1) tłumaczenie, 2) wymowę (fonetycznie), 3) przykładowe zdanie po hiszpańsku z tłumaczeniem.
Odpowiedź w języku polskim, krótka i czytelna.`,
    explain: `Jesteś pomocnym tutorem języka hiszpańskiego dla polskiego ucznia na poziomie B1.
Wytłumacz krótko i jasno temat: "${input}".
Użyj prostego języka, podaj zasadę i 2-3 przykłady z tłumaczeniem.
Odpowiedź po polsku, maksymalnie 150 słów.`,
    examples: `Jesteś pomocnym tutorem języka hiszpańskiego dla polskiego ucznia na poziomie B1.
Podaj 5 przykładowych zdań używających "${input}" po hiszpańsku.
Każde zdanie przetłumacz na polski.
Format: hiszpańskie zdanie — polskie tłumaczenie.`,
    chat: `Jesteś pomocnym tutorem języka hiszpańskiego. Uczeń jest na poziomie B1.
Odpowiedz na: "${input}"
Jeśli uczeń pisze po polsku — odpowiedz po polsku i pokaż jak to powiedzieć po hiszpańsku.
Jeśli pisze po hiszpańsku — popraw ewentualne błędy i odpowiedz po hiszpańsku z tłumaczeniem.
Bądź przyjazny i zachęcający.`
  };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompts[tutorMode] }]
      })
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || 'Błąd odpowiedzi.';

    // Format response
    const formatted = text.replace(/\n/g, '<br>');

    out.innerHTML = `
      <div style="background:var(--surface2);border:1px solid var(--border2);border-radius:16px;padding:20px;line-height:1.7;font-size:0.9rem;">
        ${formatted}
      </div>
      <div style="margin-top:10px;text-align:right;font-size:0.75rem;color:var(--muted);">✨ Claude AI</div>`;

  } catch (err) {
    out.innerHTML = `<div style="color:var(--red);padding:16px;background:rgba(240,96,96,0.08);border-radius:12px;border:1px solid rgba(240,96,96,0.2);">
      ❌ Błąd połączenia. Sprawdź internet i spróbuj ponownie.
    </div>`;
  }
}

function initDashboard() {
  renderDashboard();
}

function updateDashStats() {
  renderDashboard();
}

initDashboard();
renderVocab();


// ===================== NAV & SECTIONS =====================

let currentGrammarSection = 'czasy';

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  const tabs = ['dashboard','grammar','vocab','wyrazenia','stats','tutor'];
  tabs.forEach((t,i) => {
    if (t === id) document.querySelectorAll('.nav-tab')[i].classList.add('active');
  });
  // Show/hide grammar submenu
  const subnav = document.getElementById('grammar-subnav');
  subnav.classList.toggle('visible', id === 'grammar');
  const czasyNav = document.getElementById('czasy-subnav');
  if (czasyNav) czasyNav.classList.toggle('visible', id === 'grammar');
  if (id === 'stats') renderStats();
  if (id === 'vocab') renderVocab();
  if (id === 'dashboard') renderDashboard();
}

function showGrammarSection(section, btn) {
  currentGrammarSection = section;
  document.querySelectorAll('.subpage').forEach(p => p.classList.remove('active'));
  document.getElementById('grammar-' + section).classList.add('active');
  document.querySelectorAll('.subnav-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  // Show/hide czasy subnav
  const czasyNav = document.getElementById('czasy-subnav');
  czasyNav.classList.toggle('visible', section === 'czasy');
  // Force-render quizzes for this section
  const allQuizzes = [...grammarQuizzes, ...vocabQuizzes];
  const ids = quizSections[section] || [];
  const el = document.getElementById(section + '-quizzes');
  if (el) {
    el.innerHTML = ids.map(id => {
      const q = allQuizzes.find(x => x.id === id);
return q ? renderQuizCard(q) : '';
    }).join('');
  }
}

function showCzasSection(section, btn) {
  document.querySelectorAll('.czas-section').forEach(p => p.classList.remove('active'));
  document.getElementById('czas-' + section).classList.add('active');
  document.querySelectorAll('.subnav2-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  // Always re-render quizzes
  const allQuizzes = [...grammarQuizzes, ...vocabQuizzes];
  const ids = quizSections[section] || [];
  const el = document.getElementById(section + '-quizzes');
  if (el) {
    el.innerHTML = ids.map(id => {
      const q = allQuizzes.find(x => x.id === id);
return q ? renderQuizCard(q) : '';
    }).join('');
  }
}

function toggleTheory(id) {
  const body = document.getElementById(id);
  const arrow = document.getElementById(id + '-arrow');
  body.classList.toggle('hidden');
  arrow.textContent = body.classList.contains('hidden') ? '▶' : '▼';
}


// ===== FISZKI =====
const STORAGE_KEY = 'mies_fiszki_v2';

function loadFiszkiState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } 
  catch(e) { return {}; }
}

function saveFiszkiState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fiszkiState)); } catch(e) {}
}

let fiszkiState = loadFiszkiState();
let currentFiszkiCat = 'all';

// ===== DECK MODE =====
let deckQueue = [];
let deckIndex = 0;
let deckSession = { znam:0, nieznam:0, powtorz:0 };

function initFiszki() {
  fiszkiState = loadFiszkiState();
  renderFiszki();
}

function showVocabTab(tab, btn) {
  document.getElementById('vocab-slownik').style.display = tab === 'slownik' ? '' : 'none';
  document.getElementById('vocab-fiszki').style.display = tab === 'fiszki' ? '' : 'none';
  document.querySelectorAll('.vocab-subtab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (tab === 'fiszki') { fiszkiState = loadFiszkiState(); renderFiszki(); }
}

function setFiszkiCat(cat, btn) {
  currentFiszkiCat = cat;
  document.querySelectorAll('.vf-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderFiszki();
}

function renderFiszki() {
  const all = currentFiszkiCat === 'all' ? fiszki : fiszki.filter(f => f.cat === currentFiszkiCat);
  const known   = all.filter(f => fiszkiState[f.id] === 'znam').length;
  const unknown = all.filter(f => fiszkiState[f.id] === 'nieznam').length;
  const repeat  = all.filter(f => fiszkiState[f.id] === 'powtorz').length;
  const unseen  = all.length - known - unknown - repeat;

  document.getElementById('fiszki-stats-bar').innerHTML = `
    <div class="fiszki-stat">📊 Wszystkich: <strong>${all.length}</strong></div>
    <div class="fiszki-stat" style="border-color:#4ade8055;">✅ Znam: <strong style="color:#4ade80">${known}</strong></div>
    <div class="fiszki-stat" style="border-color:#f8717155;">❌ Nie znam: <strong style="color:#f87171">${unknown}</strong></div>
    <div class="fiszki-stat" style="border-color:var(--gold)55;">🔄 Powtórz: <strong style="color:var(--gold)">${repeat}</strong></div>
    <div class="fiszki-stat">⬜ Nowe: <strong>${unseen}</strong></div>
  `;

  document.getElementById('fiszki-container').innerHTML = all.map(f => {
    const st = fiszkiState[f.id] || '';
    const dot = st === 'znam' ? '#4ade80' : st === 'nieznam' ? '#f87171' : st === 'powtorz' ? 'var(--gold)' : 'var(--border)';
    return `<div class="fiszka-card ${st==='znam'?'known':st==='nieznam'?'unknown':''}" id="fc-${f.id}">
      <div class="fiszka-front" onclick="toggleFiszka('${f.id}')">
        <div><span class="fiszka-status-dot" style="background:${dot}"></span><span class="fiszka-word">🇵🇱 ${f.pl}</span></div>
        <div style="display:flex;align-items:center;gap:10px;"><span class="fiszka-cat">${f.emoji} ${f.cat}</span><span style="color:var(--muted);" id="fa-${f.id}">▼</span></div>
      </div>
      <div class="fiszka-back" id="fb-${f.id}">
        <div class="fiszka-translation">🇪🇸 ${f.es}</div>
        <div class="fiszka-ejemplo">${f.ejemplo}</div>
        <div class="fiszka-ejemplo-pl">— 🇵🇱 ${f.ejemplo_pl}</div>
        <div class="fiszka-tip">${f.tip}</div>
        <div class="fiszka-btns">
          <button class="fiszka-btn znam" onclick="markList('${f.id}','znam')">✅ Znam</button>
          <button class="fiszka-btn powtorz" onclick="markList('${f.id}','powtorz')">🔄 Powtórz</button>
          <button class="fiszka-btn nieznam" onclick="markList('${f.id}','nieznam')">❌ Nie znam</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function toggleFiszka(id) {
  const back = document.getElementById('fb-' + id);
  const arrow = document.getElementById('fa-' + id);
  const open = back.classList.toggle('open');
  arrow.textContent = open ? '▲' : '▼';
}

function markList(id, status) {
  fiszkiState[id] = status;
  saveFiszkiState();
  renderFiszki();
  // Keep card open after marking
  setTimeout(() => {
    const b = document.getElementById('fb-'+id);
    const a = document.getElementById('fa-'+id);
    if(b){ b.classList.add('open'); a.textContent='▲'; }
  }, 30);
}

function buildQueue(filter) {
  const source = currentFiszkiCat === 'all' ? fiszki : fiszki.filter(f => f.cat === currentFiszkiCat);
  let q;
  if (filter === 'nieznam') q = source.filter(f => fiszkiState[f.id] === 'nieznam');
  else if (filter === 'powtorz') q = source.filter(f => fiszkiState[f.id] === 'powtorz');
  else if (filter === 'nowe') q = source.filter(f => !fiszkiState[f.id]);
  else q = [...source];
  // Shuffle
  for (let i = q.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [q[i],q[j]] = [q[j],q[i]];
  }
  return q;
}

function startDeckMode(filter) {
  fiszkiState = loadFiszkiState(); // always fresh state
  deckQueue = buildQueue(filter);
  if (deckQueue.length === 0) {
    const labels = { nieznam:'oznaczonych jako Nie znam', powtorz:'oznaczonych jako Powtórz', nowe:'nowych' };
    alert('Brak kart ' + (labels[filter]||'') + ' 🎉');
    return;
  }
  deckIndex = 0;
  deckSession = { znam:0, nieznam:0, powtorz:0 };
  showDeckScreen();
  showDeckCard();
}

function showDeckScreen() {
  document.getElementById('deck-mode').style.display = 'block';
  document.getElementById('list-mode').style.display = 'none';
  document.getElementById('deck-finished').style.display = 'none';
  document.getElementById('deck-card').style.display = 'block';
  document.getElementById('deck-btns').style.display = 'none';
  document.getElementById('deck-card').classList.remove('flipped');
}

function showDeckCard() {
  if (deckIndex >= deckQueue.length) { showDeckFinished(); return; }
  const f = deckQueue[deckIndex];
  document.getElementById('deck-cat').textContent = f.emoji + ' ' + f.cat;
  document.getElementById('deck-cat-back').textContent = f.emoji + ' ' + f.cat;
  document.getElementById('deck-word').textContent = '🇵🇱 ' + f.pl;
  document.getElementById('deck-ejemplo-pl').textContent = f.ejemplo_pl;
  document.getElementById('deck-translation').textContent = '🇪🇸 ' + f.es;
  document.getElementById('deck-ejemplo').textContent = f.ejemplo;
  document.getElementById('deck-tip').textContent = f.tip;
  document.getElementById('deck-card').classList.remove('flipped');
  document.getElementById('deck-btns').style.display = 'none';
  const total = deckQueue.length;
  document.getElementById('deck-progress').textContent = (deckIndex+1) + ' / ' + total;
  document.getElementById('deck-bar').style.width = ((deckIndex/total)*100) + '%';
}

function flipDeckCard() {
  const card = document.getElementById('deck-card');
  const flipped = card.classList.toggle('flipped');
  document.getElementById('deck-btns').style.display = flipped ? 'block' : 'none';
}

function deckMark(status) {
  if (deckIndex >= deckQueue.length) return;
  const f = deckQueue[deckIndex];
  fiszkiState[f.id] = status;
  deckSession[status]++;
  saveFiszkiState();
  deckIndex++;
  showDeckCard();
}

function showDeckFinished() {
  document.getElementById('deck-card').style.display = 'none';
  document.getElementById('deck-btns').style.display = 'none';
  document.getElementById('deck-finished').style.display = 'block';
  document.getElementById('deck-bar').style.width = '100%';
  document.getElementById('deck-progress').textContent = 'Gotowe!';
  // Count from FULL current state
  fiszkiState = loadFiszkiState();
  const source = currentFiszkiCat === 'all' ? fiszki : fiszki.filter(f => f.cat === currentFiszkiCat);
  const known   = source.filter(f => fiszkiState[f.id]==='znam').length;
  const unknown = source.filter(f => fiszkiState[f.id]==='nieznam').length;
  const repeat  = source.filter(f => fiszkiState[f.id]==='powtorz').length;
  document.getElementById('deck-result').innerHTML =
    '<div style="margin-bottom:12px;">Sesja: ✅ <strong style="color:#4ade80">+' + deckSession.znam + '</strong> &nbsp; 🔄 <strong style="color:var(--gold)">+' + deckSession.powtorz + '</strong> &nbsp; ❌ <strong style="color:#f87171">+' + deckSession.nieznam + '</strong></div>' +
    '<div style="font-size:0.85rem;color:var(--muted);">Łącznie: ✅ ' + known + ' &nbsp; 🔄 ' + repeat + ' &nbsp; ❌ ' + unknown + ' &nbsp; ⬜ ' + (source.length-known-unknown-repeat) + '</div>';
}

function restartDeck(filter) {
  fiszkiState = loadFiszkiState();
  deckQueue = buildQueue(filter);
  if (deckQueue.length === 0) {
    const labels = { nieznam:'oznaczonych jako Nie znam', powtorz:'oznaczonych jako Powtórz' };
    alert('Brak kart ' + (labels[filter]||'') + ' 🎉');
    return;
  }
  deckIndex = 0;
  deckSession = { znam:0, nieznam:0, powtorz:0 };
  showDeckScreen();
  showDeckCard();
}

function exitDeckMode() {
  document.getElementById('deck-mode').style.display = 'none';
  document.getElementById('list-mode').style.display = 'block';
  document.getElementById('deck-card').classList.remove('flipped');
  document.getElementById('deck-finished').style.display = 'none';
  document.getElementById('deck-card').style.display = 'block';
  document.getElementById('deck-btns').style.display = 'none';
  fiszkiState = loadFiszkiState();
  renderFiszki();
}

function resumeDeck() {
  // legacy - just start fresh
  startDeckMode('all');
}

// ===== FISZKI EXPORT / IMPORT =====
function exportFiszki() {
  const data = JSON.stringify(fiszkiState, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mies_fiszki_postep.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importFiszki(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      fiszkiState = { ...fiszkiState, ...data };
      saveFiszkiState();
      renderFiszki();
      const status = document.getElementById('import-status');
      status.style.display = 'inline';
      setTimeout(() => status.style.display = 'none', 3000);
    } catch(err) {
      alert('Błąd wczytywania pliku — upewnij się że to właściwy plik postępu.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ===================== INIT =====================

renderSectionQuizzes();
renderDashboard();
renderVocab();


// Alias for backward compatibility
const startQuiz = openQuiz;
