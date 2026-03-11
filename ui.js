// ===================== UI / RENDER =====================

// ── GRAMMAR QUIZ ──
function renderGrammarQuiz() {
  const q = activeQuiz;
  const qi = q.questions[qCur];
  const total = q.questions.length;

  document.getElementById('modal-content').innerHTML = `
    <div class="quiz-header-modal">
      <h3>${q.icon} ${q.title}</h3>
      <p>${q.desc}</p>
    </div>
    <div class="m-progress-row">
      <div class="m-pbar-bg"><div class="m-pbar" id="mpbar" style="width:${(qCur/total)*100}%"></div></div>
      <div class="m-qnum">${qCur+1} / ${total}</div>
    </div>
    <div class="m-tag">${qi.tag}</div>
    ${qi.ctx ? `<div class="m-ctx">${qi.ctx}</div>` : ''}
    <div class="m-question" id="mq">${qi.q.replace('___', '<span class="m-blank">___</span>')}</div>
    <div class="m-trans">${qi.trans}</div>
    <div class="m-opts" id="mopts"></div>
    <div class="m-feedback" id="mfb"></div>
    <button class="m-btn" id="mnbtn" style="display:none" onclick="grammarNext()">
      ${qCur < total-1 ? 'Następne →' : 'Zobacz wyniki 🎉'}
    </button>`;

  const letters = ['A','B','C','D'];
  const optsEl = document.getElementById('mopts');
  qi.opts.forEach((o, i) => {
    const b = document.createElement('button');
    b.className = 'm-opt';
    b.innerHTML = `<span class="ol">${letters[i]}</span>${o}`;
    b.onclick = () => grammarPick(i, b);
    optsEl.appendChild(b);
  });

  qAnswered = false;
}

function grammarPick(idx, btn) {
  if (qAnswered) return;
  qAnswered = true;
  const qi = activeQuiz.questions[qCur];
  document.querySelectorAll('.m-opt').forEach(b => b.disabled = true);
  const fb = document.getElementById('mfb');

  if (idx === qi.cor) {
    btn.classList.add('correct');
    fb.className = 'm-feedback ok';
    fb.textContent = qi.exp;
    qLog.push({ ok: true });
  } else {
    btn.classList.add('wrong');
    document.getElementById('modal-inner').classList.add('shake');
    setTimeout(() => document.getElementById('modal-inner').classList.remove('shake'), 320);
    document.querySelectorAll('.m-opt')[qi.cor].classList.add('reveal');
    fb.className = 'm-feedback no';
    fb.textContent = qi.exp;
    qLog.push({ ok: false });
  }

  fb.style.display = 'block';
  document.getElementById('mnbtn').style.display = 'block';
}

function grammarNext() {
  qCur++;
  if (qCur >= activeQuiz.questions.length) {
    finishQuiz();
  } else {
    renderGrammarQuiz();
    document.getElementById('modal-inner').scrollTop = 0;
  }
}

// ── TYPING GRAMMAR QUIZ ──
function renderTypingQuiz() {
  const q = activeQuiz;
  const qi = q.questions[qCur];
  const total = q.questions.length;
  document.getElementById('modal-content').innerHTML = `
    <div class="quiz-header-modal">
      <h3>${q.icon} ${q.title}</h3>
      <p>${q.desc}</p>
    </div>
    <div class="m-progress-row">
      <div class="m-pbar-bg"><div class="m-pbar" style="width:${(qCur/total)*100}%"></div></div>
      <div class="m-qnum">${qCur+1} / ${total}</div>
    </div>
    <div class="m-tag">${qi.tag}</div>
    ${qi.ctx ? '<div class="m-ctx">'+qi.ctx+'</div>' : ''}
    <div class="m-question">${qi.q.replace('___', '<span class="m-blank">___</span>')}</div>
    <div class="m-trans">${qi.trans}</div>
    <input class="m-input" id="tinput" type="text" placeholder="Wpisz forme..." autocomplete="off" autocorrect="off" spellcheck="false">
    <button class="m-hint-btn" id="thintbtn" onclick="typingHint()">Pokaz pierwsza litere</button>
    <div class="m-hint-text" id="thinttext"></div>
    <button class="m-btn" onclick="typingCheck()">Sprawdz</button>
    <div class="m-feedback" id="mfb"></div>
    <button class="m-btn" id="mnbtn" style="display:none" onclick="typingNext()">${qCur < total-1 ? 'Nastepne' : 'Wyniki'}</button>`;
  qAnswered = false; qHintUsed = false;
  const inp = document.getElementById('tinput');
  inp.focus();
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { if (!qAnswered) typingCheck(); else document.getElementById('mnbtn').click(); }
  });
}
function typingHint() {
  const qi = activeQuiz.questions[qCur];
  const hint = qi.answer[0] + qi.answer.slice(1).replace(/[^\s\/]/g, 'x');
  document.getElementById('thinttext').textContent = 'Podpowiedz: ' + hint;
  document.getElementById('thinttext').style.display = 'block';
  document.getElementById('thintbtn').disabled = true;
  qHintUsed = true;
}
function typingCheck() {
  if (qAnswered) return;
  const qi = activeQuiz.questions[qCur];
  const given = document.getElementById('tinput').value.trim();
  if (!given) return;
  qAnswered = true;
  const inp = document.getElementById('tinput');
  inp.disabled = true;
  document.getElementById('thintbtn').disabled = true;
  const result = checkAnswer(given, qi.answer);
  const fb = document.getElementById('mfb');
  if (result === 'correct') {
    inp.classList.add('correct');
    fb.className = 'm-feedback ok';
    fb.textContent = qi.exp;
    qLog.push({ ok: true });
  } else if (result === 'close') {
    inp.classList.add('close');
    fb.className = 'm-feedback close-fb';
    fb.textContent = 'Prawie! Poprawna forma: ' + qi.answer + '. ' + qi.exp;
    qLog.push({ ok: false });
  } else {
    inp.classList.add('wrong');
    document.getElementById('modal-inner').classList.add('shake');
    setTimeout(() => document.getElementById('modal-inner').classList.remove('shake'), 320);
    fb.className = 'm-feedback no';
    fb.textContent = 'Poprawna forma: ' + qi.answer + '. ' + qi.exp;
    qLog.push({ ok: false });
  }
  fb.style.display = 'block';
  document.getElementById('mnbtn').style.display = 'block';
}
function typingNext() {
  qCur++;
  if (qCur >= activeQuiz.questions.length) finishQuiz();
  else { renderTypingQuiz(); document.getElementById('modal-inner').scrollTop = 0; }
}

// ── VOCAB QUIZ (typing) ──
let vocabQuestions = [];
let vMode = 'es-pl';

function renderVocabQuiz() {
  const q = activeQuiz;
  vocabQuestions = shuffle([...q.words]);
  qCur = 0; qLog = [];
  vMode = 'es-pl';
  renderVocabQuestion();
}

function renderVocabQuestion() {
  const w = vocabQuestions[qCur];
  const total = vocabQuestions.length;

  document.getElementById('modal-content').innerHTML = `
    <div class="quiz-header-modal">
      <h3>${activeQuiz.icon} ${activeQuiz.title}</h3>
      <div style="display:flex;gap:6px;margin-top:8px;">
        <button class="m-btn secondary" style="flex:1;padding:8px;font-size:0.78rem;margin:0;${vMode==='es-pl'?'border-color:var(--gold);color:var(--gold);':''}" onclick="switchVMode('es-pl')">🇪🇸→🇵🇱</button>
        <button class="m-btn secondary" style="flex:1;padding:8px;font-size:0.78rem;margin:0;${vMode==='pl-es'?'border-color:var(--gold);color:var(--gold);':''}" onclick="switchVMode('pl-es')">🇵🇱→🇪🇸</button>
      </div>
    </div>
    <div class="m-progress-row" style="margin-top:16px;">
      <div class="m-pbar-bg"><div class="m-pbar" style="width:${(qCur/total)*100}%"></div></div>
      <div class="m-qnum">${qCur+1} / ${total}</div>
    </div>
    <div class="m-tag">${w.type === 'noun' ? '🏷️ Rzeczownik' : w.type === 'verb' ? '🔵 Czasownik' : '🟡 Przymiotnik'}</div>
    <div style="font-size:0.78rem;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">
      ${vMode === 'es-pl' ? '🇪🇸 Co znaczy to słowo?' : '🇵🇱 Jak powiedzieć po hiszpańsku?'}
    </div>
    <div class="m-question">${vMode === 'es-pl' ? w.es : w.pl}</div>
    <input class="m-input" id="vinput" type="text" placeholder="Wpisz odpowiedź..." autocomplete="off" autocorrect="off" spellcheck="false">
    <button class="m-hint-btn" id="vhintbtn" onclick="vocabHint()">💡 Pokaż pierwszą literę</button>
    <div class="m-hint-text" id="vhinttext"></div>
    <button class="m-btn" onclick="vocabCheck()">Sprawdź ✓</button>
    <div class="m-feedback" id="mfb"></div>
    <button class="m-btn" id="mnbtn" style="display:none" onclick="vocabNext()">
      ${qCur < total-1 ? 'Następne →' : 'Zobacz wyniki 🎉'}
    </button>`;

  qAnswered = false; qHintUsed = false;
  document.getElementById('vinput').focus();
  document.getElementById('vinput').addEventListener('keydown', e => {
    if (e.key === 'Enter') { if (!qAnswered) vocabCheck(); else document.getElementById('mnbtn').click(); }
  });
}

function switchVMode(m) {
  vMode = m;
  renderVocabQuestion();
}

function vocabHint() {
  const w = vocabQuestions[qCur];
  const correct = vMode === 'es-pl' ? w.pl : w.es;
  const hint = correct[0] + correct.slice(1).replace(/[^\s\/]/g, '•');
  document.getElementById('vhinttext').textContent = `Podpowiedź: ${hint}`;
  document.getElementById('vhinttext').style.display = 'block';
  document.getElementById('vhintbtn').disabled = true;
  qHintUsed = true;
}

function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s\/]/g,'').trim();
}

function levenshtein(a,b) {
  const m=a.length,n=b.length;
  const dp=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i===0?j:j===0?i:0));
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++) dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[m][n];
}

function checkAnswer(given, correct) {
  const g = normalize(given);
  const variants = correct.split('/').map(v => normalize(v.trim()));
  if (variants.some(v => g === v)) return 'correct';
  if (variants.some(v => levenshtein(g,v) <= 2 && g.length >= 3)) return 'close';
  return 'wrong';
}

function vocabCheck() {
  if (qAnswered) return;
  const w = vocabQuestions[qCur];
  const correct = vMode === 'es-pl' ? w.pl : w.es;
  const given = document.getElementById('vinput').value.trim();
  if (!given) return;

  qAnswered = true;
  const inp = document.getElementById('vinput');
  inp.disabled = true;
  document.getElementById('vhintbtn').disabled = true;

  const result = checkAnswer(given, correct);
  const fb = document.getElementById('mfb');

  if (result === 'correct') {
    inp.classList.add('correct');
    fb.className = 'm-feedback ok';
    fb.textContent = `✅ Dobrze! ${w.es} = ${w.pl}`;
    qLog.push({ ok: 'correct', es: w.es, pl: w.pl, given });
  } else if (result === 'close') {
    inp.classList.add('close');
    fb.className = 'm-feedback close-fb';
    fb.textContent = `🟡 Prawie! Poprawna odpowiedź: ${correct}`;
    qLog.push({ ok: 'close', es: w.es, pl: w.pl, given });
  } else {
    inp.classList.add('wrong');
    document.getElementById('modal-inner').classList.add('shake');
    setTimeout(() => document.getElementById('modal-inner').classList.remove('shake'), 320);
    fb.className = 'm-feedback no';
    fb.textContent = `❌ Błąd. Poprawna odpowiedź: ${correct}`;
    qLog.push({ ok: 'wrong', es: w.es, pl: w.pl, given });
  }

  fb.style.display = 'block';
  document.getElementById('mnbtn').style.display = 'block';
}

function vocabNext() {
  qCur++;
  if (qCur >= vocabQuestions.length) finishQuiz();
  else { renderVocabQuestion(); document.getElementById('modal-inner').scrollTop = 0; }
}


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
