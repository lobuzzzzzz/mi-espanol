// ===================== UI / RENDER =====================
// ===================== RENDER CARDS =====================

function getScoreColor(pct) {
  if (!pct) return 'var(--muted)';
  return pct >= 80 ? 'var(--green)' : pct >= 60 ? '#fbbf24' : 'var(--red)';
}

function renderQuizCard(q) {
  const p = progress[q.id];
  const done = p ? p.bestScore + '%' : '—';
  const color = getScoreColor(p?.bestScore);
  return `
  <div class="quiz-card theme-${q.theme}" onclick="openQuiz('${q.id}')">
    <div class="qc-top">
      <div class="qc-icon">${q.icon}</div>
      <div class="qc-badge">${q.badge}</div>
    </div>
    <h3>${q.title}</h3>
    <p>${q.desc}</p>
    <div class="qc-footer">
      <div class="qc-score" style="color:${color}">${p ? 'Najlepszy: ' + done : 'Nie zrobiony'}</div>
      <button class="qc-btn" onclick="event.stopPropagation();openQuiz('${q.id}')">${p ? 'Powtórz' : 'Start'} →</button>
    </div>
  </div>`;
}

function renderSectionQuizzes() {
  const allQuizzes = [...grammarQuizzes, ...vocabQuizzes];
  Object.entries(quizSections).forEach(([section, ids]) => {
    const el = document.getElementById(section + '-quizzes');
    if (!el) return;
    el.innerHTML = ids.map(id => {
      const q = allQuizzes.find(x => x.id === id);
return q ? renderQuizCard(q) : '';
    }).join('');
  });
}

function renderDashboard() {
  // Stats
  const attempts = Object.values(progress).reduce((s, p) => s + p.attempts, 0);
  const scores = Object.values(progress).map(p => p.bestScore).filter(Boolean);
  const avg = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
  const today = new Date().toDateString();
  const streak = Object.values(progress).filter(p => new Date(p.lastDate).toDateString() === today).length;
  document.getElementById('stat-quizzes').textContent = attempts;
  document.getElementById('stat-correct').textContent = avg ? avg + '%' : '—';
  document.getElementById('stat-streak').textContent = streak;

  // Recent cards
  const allQ = [...grammarQuizzes, ...vocabQuizzes];
  const recent = Object.entries(progress)
    .sort((a,b) => new Date(b[1].lastDate) - new Date(a[1].lastDate))
    .slice(0, 4)
    .map(([id]) => allQ.find(q => q.id === id))
    .filter(Boolean);

  const recentEl = document.getElementById('recent-cards');
  if (recent.length > 0) {
    recentEl.innerHTML = recent.map(renderQuizCard).join('');
  } else {
    recentEl.innerHTML = '<p style="color:var(--muted);font-size:0.88rem;grid-column:1/-1;">Jeszcze nie zrobiłeś żadnego quizu. Zacznij od Gramatyki!</p>';
  }

  // Section overview cards
  const sections = [
    { id:'czasy', icon:'⏱️', label:'Czasy', count: quizSections.czasy.length },
    { id:'subjuntivo', icon:'💭', label:'Subjuntivo', count: quizSections.subjuntivo.length },
    { id:'zaimki', icon:'🎯', label:'Zaimki', count: quizSections.zaimki.length },
    { id:'inne', icon:'📌', label:'Inne', count: quizSections.inne.length },
  ];

  document.getElementById('section-cards').innerHTML = sections.map(s => {
    const sIds = quizSections[s.id];
    const done = sIds.filter(id => progress[id]).length;
    const pct = Math.round((done/sIds.length)*100);
    return `
    <div onclick="showPage('grammar');showGrammarSection('${s.id}', document.querySelectorAll('.subnav-tab')[${['czasy','subjuntivo','zaimki','inne'].indexOf(s.id)}])"
      style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px;cursor:pointer;transition:all 0.2s;"
      onmouseover="this.style.borderColor='rgba(232,184,75,0.3)'" onmouseout="this.style.borderColor='var(--border)'">
      <div style="font-size:1.8rem;margin-bottom:10px;">${s.icon}</div>
      <div style="font-weight:700;margin-bottom:4px;">${s.label}</div>
      <div style="font-size:0.78rem;color:var(--muted);margin-bottom:10px;">${s.count} quizów</div>
      <div style="height:4px;background:var(--border);border-radius:99px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:var(--gold);border-radius:99px;"></div>
      </div>
      <div style="font-size:0.75rem;color:var(--muted);margin-top:6px;">${done}/${s.count} zrobionych</div>
    </div>`;
  }).join('');
}

// ===================== VOCAB =====================

vocabFilter = 'all';
vocabSearch = '';

function renderVocab() {
  const tbody = document.getElementById('vocab-tbody');
  const filtered = allWords.filter(w => {
    const matchType = vocabFilter === 'all' || w.type === vocabFilter;
    const matchSearch = !vocabSearch || w.es.toLowerCase().includes(vocabSearch) || w.pl.toLowerCase().includes(vocabSearch);
    return matchType && matchSearch;
  });
  const colors = { noun: 'var(--gold)', verb: 'var(--blue)', adj: 'var(--green)', idiom: 'var(--purple)' };
  const labels = { noun: 'Rzeczownik', verb: 'Czasownik', adj: 'Przymiotnik', idiom: 'Idiom' };
  tbody.innerHTML = filtered.map(w => `
    <tr>
      <td class="es">${w.es}</td>
      <td class="pl">${w.pl}</td>
      <td><span class="cat-dot" style="background:${colors[w.type]}"></span>${labels[w.type]}</td>
    </tr>`).join('');
}

function setVocabFilter(f, btn) {
  vocabFilter = f;
  document.querySelectorAll('.vf-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderVocab();
}

function filterVocab() {
  vocabSearch = document.getElementById('vocab-search').value.toLowerCase();
  renderVocab();
}

// ===================== STATS =====================

function renderStats() {
  const allQ = [...grammarQuizzes, ...vocabQuizzes];
  const colors = { gold:'var(--gold)', blue:'var(--blue)', green:'var(--green)', purple:'var(--purple)', red:'var(--red)' };

  document.getElementById('prog-section').innerHTML = allQ.map(q => {
    const p = progress[q.id];
    const pct = p ? p.bestScore : 0;
    return `
    <div class="prog-item">
      <div class="prog-label">${q.icon} ${q.title}</div>
      <div class="prog-bar-bg"><div class="prog-bar" style="width:${pct}%;background:${colors[q.theme]}"></div></div>
      <div class="prog-val" style="color:${colors[q.theme]}">${pct ? pct+'%' : '—'}</div>
    </div>`;
  }).join('');

  const entries = Object.entries(progress).sort((a,b) => new Date(b[1].lastDate) - new Date(a[1].lastDate));
  const hist = document.getElementById('history-list');
  if (!entries.length) {
    hist.innerHTML = '<p style="color:var(--muted);font-size:0.88rem;">Jeszcze nie ukończyłeś żadnego quizu.</p>';
    return;
  }
  hist.innerHTML = entries.map(([id, p]) => {
    const q = allQ.find(x => x.id === id);
    if (!q) return '';
    const date = new Date(p.lastDate).toLocaleDateString('pl-PL', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
    const scoreColor = getScoreColor(p.lastScore);
    return `
    <div class="history-item">
      <div class="hi-icon">${q.icon}</div>
      <div class="hi-info">
        <div class="hi-title">${q.title}</div>
        <div class="hi-date">${date} · ${p.attempts} prób</div>
      </div>
      <div class="hi-score" style="color:${scoreColor}">${p.lastScore}%</div>
    </div>`;
  }).join('');
}
