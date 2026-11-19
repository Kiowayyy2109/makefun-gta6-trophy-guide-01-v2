// Leonida Nights — the interactive half of the GTA VI trophy guide.
//
// Everything the tracker remembers (what is earned, counter progress,
// the spoiler setting, per-trophy reveals) lives in localStorage under
// one key; nothing ever leaves the browser. The URL carries the view
// state so screenshots and shared links can reproduce a screen:
//   ?view=guide|roadmap|missables   ?detail=<trophy id>
//   ?demo=1 (seed sample progress)  ?spoiler=off
//   ?grade=<grade>  ?q=<search text>

const KEY = 'leonida-nights-v2';

// PlayStation trophy points per grade, and the grade order used by the
// dashboard's per-grade breakdown.
const POINTS = { platinum: 300, gold: 90, silver: 30, bronze: 15 };
const GRADES = ['platinum', 'gold', 'silver', 'bronze'];

// Human-readable label for every trophy "kind" in the data file.
const KIND_LABEL = {
  platinum: 'Platinum',
  story: 'Story',
  side: 'Stranger strands',
  activity: 'Activity',
  collectible: 'Collectible',
  crime: 'Crime',
  combat: 'Combat',
  vehicle: 'Vehicle',
  money: 'Money',
  exploration: 'Exploration',
  completion: 'Completion',
  misc: 'Misc / secret',
};

// Read the URL once, then load the trophy data the whole page runs on.
const params = new URLSearchParams(location.search);
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));

// The Road to Platinum: five ordered phases. Each phase names its
// trophies, estimates the effort, and carries the warning that matters
// most while playing it.
const ROADMAP = [
  {
    title: 'Phase 1 — Story playthrough: chapters & named missions',
    effort: '≈ 15–25 hours · 11 trophies',
    warning: 'Missable discipline starts now: begin every stranger strand the moment its icon appears, attempt Catch Me If You Can while the story has you at VCIA, and engage — don\'t flee — any Rhino (tank) encounter. Sample each activity type once as the story introduces it (Master of None) and make choices instead of skipping them (Actions Speak Louder, 500).',
    ids: [2, 8, 3, 9, 10, 4, 11, 12, 5, 13, 6],
  },
  {
    title: 'Phase 2 — Strands finished, then the finale',
    effort: '≈ 4–8 hours · 7 trophies',
    warning: 'POINT OF NO RETURN: the final mission is the last guaranteed story window. Every strand final (Andy, Kenton, Billy, Randy, Tyrone) and Bret\'s unique hunt should be closed before you start it — strand givers and one-off encounters are the classic casualties of an endgame.',
    ids: [22, 23, 24, 26, 27, 29, 25, 7],
  },
  {
    title: 'Phase 3 — Open-world sweep: activities & collectibles',
    effort: '≈ 15–25 hours · 14 trophies',
    warning: 'No missables in this phase — it is pure coverage. Work district by district so exploration (52 areas), meditation spots (18), WAiNK points (100), stunts (250), drone races (14) and vehicle discoveries (100) all advance on the same drives.',
    ids: [16, 21, 46, 20, 19, 18, 17, 15, 28, 31, 30, 35, 42, 32],
  },
  {
    title: 'Phase 4 — Crime, combat & money',
    effort: '≈ 10–18 hours · 16 trophies',
    warning: 'Nothing here is missable, but the money trophies interlock: robberies earn the Marked Bills that Dime on the Dollar launders ($250,000), and that income funds all 8 garages (Little Boxes) and the $100,000 of shop spending (Treat Yo Self). Run them as one economy, not four grinds.',
    ids: [33, 34, 39, 40, 41, 43, 36, 51, 45, 37, 38, 52, 53, 54, 55, 44],
  },
  {
    title: 'Phase 5 — Cleanup: secrets, 100% & the platinum',
    effort: '≈ 5–15 hours · 6 trophies',
    warning: 'Bad Luck, I Guess is the trap for flawless players: if it never popped naturally, deliberately fail one cheap retryable challenge and then complete it. The Truth Is Out There rewards one last curious night drive. A Long Road (100%) closes when every category in the game\'s own completion tracking is full — then Vice Got a Price! pops on its own.',
    ids: [47, 48, 49, 50, 14, 1],
  },
];

// The earning window for each missable trophy, keyed by trophy id.
const WINDOWS = {
  22: 'While Andy\'s strand is being offered during the campaign',
  23: 'While Kenton\'s strand is being offered during the campaign',
  24: 'While Billy\'s strand is being offered during the campaign',
  26: 'While Randy\'s strand is being offered during the campaign',
  27: 'While Tyrone\'s strand is being offered during the campaign',
  29: 'During Bret\'s hunt — one unique animal, one chance',
  37: 'Around the VCIA Takedown story window at the airport',
  38: 'During the scripted Rhino (tank) encounter',
  48: 'The whole playthrough — choices are finite, start at hour one',
  49: 'Any fail → retry pair; missable only by playing flawlessly',
};

// ---- tracker state -------------------------------------------------
// Shape: { earned: {id: true}, progress: {id: n}, spoiler: bool,
//          revealed: {id: true} }

function blankState() {
  return { earned: {}, progress: {}, spoiler: true, revealed: {} };
}

function loadState() {
  // Saved state wins when it exists and parses.
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...blankState(), ...JSON.parse(raw) };
  } catch {
    // Corrupted storage is not worth dying over — start fresh.
  }
  const s = blankState();
  // Demo mode seeds a believable mid-playthrough snapshot, but only
  // when there is no saved state to respect.
  if (params.get('demo') === '1') {
    for (const id of [2, 3, 8, 16, 21, 44]) s.earned[id] = true;
    Object.assign(s.progress, {
      15: 86, 17: 19, 25: 5, 31: 37, 35: 64, 48: 212, 52: 97500,
    });
  }
  return s;
}

let state = loadState();
if (params.get('spoiler') === 'off') state.spoiler = false;

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

// Small state accessors used all over the renderers.
const isEarned = (t) => !!state.earned[t.id];
const prog = (t) => Math.min(state.progress[t.id] || 0, t.count || 0);

// ---- shared element handles ----------------------------------------

const $ = (id) => document.getElementById(id);
const listEl = $('list');
const detailEl = $('detail');

// Which trophy the detail panel shows, and which top-level view is up.
let selectedId = Number(params.get('detail')) || null;
let view = ['guide', 'roadmap', 'missables'].includes(params.get('view'))
  ? params.get('view')
  : 'guide';

// ---- spoiler protection ---------------------------------------------
// A trophy is protected while spoilers are on, it is unearned and not
// yet revealed, and it is either flagged hidden or a story trophy.

function isProtected(t) {
  return (
    state.spoiler &&
    !isEarned(t) &&
    !state.revealed[t.id] &&
    (t.hidden || t.kind === 'story')
  );
}

const shownName = (t) => (isProtected(t) ? '▒▒▒▒▒▒▒▒▒▒' : t.name);
const shownDesc = (t) =>
  isProtected(t)
    ? 'Spoiler-protected — earn it, or reveal it in the detail panel.'
    : t.description;

// ---- dashboard header -----------------------------------------------

function renderDash() {
  const earned = trophies.filter(isEarned);

  // Headline numbers: percent, count, points, and the big bar.
  $('overall-pct').textContent =
    `${Math.round((earned.length / trophies.length) * 100)}%`;
  $('overall-count').textContent =
    `${earned.length} of ${trophies.length} earned`;
  $('overall-points').textContent =
    `${earned.reduce((s, t) => s + POINTS[t.grade], 0)} trophy points`;
  $('overall-bar').style.width =
    `${(earned.length / trophies.length) * 100}%`;

  // One mini stat block (label, counts, points, bar) per grade.
  $('grade-stats').replaceChildren(
    ...GRADES.map((g) => {
      const all = trophies.filter((t) => t.grade === g);
      const got = all.filter(isEarned);
      const div = document.createElement('div');
      div.className = 'grade-stat';
      div.innerHTML = `<div class="gs-top"><span><span class="dot ${g}"></span>${g[0].toUpperCase() + g.slice(1)}</span><span>${got.length} / ${all.length} · ${got.reduce((s, t) => s + POINTS[t.grade], 0)} pts</span></div>`;
      const bar = document.createElement('div');
      bar.className = 'bar';
      const fill = document.createElement('div');
      fill.className = 'bar-fill';
      fill.style.width = `${all.length ? (got.length / all.length) * 100 : 0}%`;
      bar.append(fill);
      div.append(bar);
      return div;
    }),
  );

  // The missables tab badge counts what is still at risk.
  const left = trophies.filter((t) => t.missable && !isEarned(t)).length;
  $('missable-badge').textContent = `${left} left`;
}

// ---- trophy cards -----------------------------------------------------

function fmt(n) {
  return n.toLocaleString('en-US');
}

// The little pill row under a trophy name: grade, kind, and any of
// hidden / missable / progress that apply.
function chipsFor(t) {
  const chips = [
    `<span class="chip grade-${t.grade}">${t.grade}</span>`,
    `<span class="chip">${KIND_LABEL[t.kind] || t.kind}</span>`,
  ];
  if (t.hidden) chips.push('<span class="chip warn">hidden</span>');
  if (t.missable) chips.push('<span class="chip warn">⚠ missable</span>');
  if (t.count) {
    chips.push(`<span class="chip">${fmt(prog(t))} / ${fmt(t.count)}</span>`);
  }
  return chips.join('');
}

// Build one list card: earn checkbox, name/description button, chips,
// an optional progress counter, and the "Guide →" opener.
function cardFor(t, opts = {}) {
  const li = document.createElement('li');

  const card = document.createElement('div');
  card.className =
    'card' +
    (isEarned(t) ? ' is-earned' : '') +
    (selectedId === t.id ? ' is-selected' : '') +
    (isProtected(t) ? ' spoilered' : '');

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.className = 'earn-box';
  box.checked = isEarned(t);
  box.setAttribute('aria-label', `Mark ${t.name} as earned`);
  box.addEventListener('change', () => {
    setEarned(t, box.checked);
  });
  box.addEventListener('click', (e) => e.stopPropagation());

  const mid = document.createElement('div');
  const nameBtn = document.createElement('button');
  nameBtn.type = 'button';
  nameBtn.className = 'name-btn';
  nameBtn.innerHTML = `<span class="tname"></span><span class="tdesc"></span>`;
  nameBtn.querySelector('.tname').textContent = t.name;
  nameBtn.querySelector('.tdesc').textContent = t.description;
  nameBtn.addEventListener('click', () => select(t.id));
  mid.append(nameBtn);

  const meta = document.createElement('div');
  meta.className = 'tmeta';
  meta.innerHTML = chipsFor(t);
  mid.append(meta);

  // Callers (the missables view) can bolt on an extra chip row.
  if (opts.extra) {
    const ex = document.createElement('div');
    ex.className = 'tmeta';
    ex.innerHTML = opts.extra;
    mid.append(ex);
  }

  if (t.count) mid.append(counterFor(t));

  const go = document.createElement('button');
  go.type = 'button';
  go.className = 'open-btn';
  go.textContent = 'Guide →';
  go.setAttribute('aria-label', `Open guide for ${t.name}`);
  go.addEventListener('click', () => select(t.id));

  card.append(box, mid, go);
  li.append(card);
  return li;
}

// The − / value / + stepper plus progress bar for counted trophies.
// Big targets step by 500 so the buttons stay useful.
function counterFor(t) {
  const wrap = document.createElement('div');
  wrap.className = 'counter';

  const bar = document.createElement('div');
  bar.className = 'bar';
  const fill = document.createElement('div');
  fill.className = 'bar-fill';
  fill.style.width = `${t.count ? (prog(t) / t.count) * 100 : 0}%`;
  bar.append(fill);

  const minus = document.createElement('button');
  minus.type = 'button';
  minus.textContent = '−';
  minus.setAttribute('aria-label', `Decrease progress for ${t.name}`);

  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.max = String(t.count);
  input.value = String(prog(t));
  input.setAttribute('aria-label', `Progress for ${t.name}, target ${t.count}`);

  const plus = document.createElement('button');
  plus.type = 'button';
  plus.textContent = '+';
  plus.setAttribute('aria-label', `Increase progress for ${t.name}`);

  const of = document.createElement('span');
  of.textContent = `/ ${fmt(t.count)}`;

  const step = t.count >= 10000 ? 500 : 1;
  minus.addEventListener('click', () => setProgress(t, prog(t) - step));
  plus.addEventListener('click', () => setProgress(t, prog(t) + step));
  input.addEventListener('change', () =>
    setProgress(t, Number(input.value) || 0),
  );

  wrap.append(bar, minus, input, plus, of);
  return wrap;
}

// ---- state mutations: each saves, then re-renders everything ---------

function setEarned(t, on) {
  if (on) state.earned[t.id] = true;
  else delete state.earned[t.id];
  save();
  renderAll();
}

function setProgress(t, n) {
  const v = Math.max(0, Math.min(t.count, Math.floor(n)));
  state.progress[t.id] = v;
  // Reaching the target is the same as earning the trophy.
  if (v >= t.count) state.earned[t.id] = true;
  save();
  renderAll();
}

// ---- filters and the checklist ----------------------------------------

// Populate the kind dropdown from whatever kinds the data actually
// uses, then seed every filter control from the URL parameters.
const kindSel = $('f-kind');
for (const k of [...new Set(trophies.map((t) => t.kind))]) {
  const o = document.createElement('option');
  o.value = k;
  o.textContent = KIND_LABEL[k] || k;
  kindSel.append(o);
}
if (params.get('grade')) $('f-grade').value = params.get('grade');
if (params.get('hidden')) $('f-hidden').value = params.get('hidden');
if (params.get('kind')) kindSel.value = params.get('kind');
if (params.get('missable')) $('f-missable').value = params.get('missable');
if (params.get('q')) $('f-search').value = params.get('q');
$('f-spoiler').checked = state.spoiler;

// Snapshot the current filter controls into a plain object.
function currentFilters() {
  return {
    q: $('f-search').value.trim().toLowerCase(),
    grade: $('f-grade').value,
    kind: kindSel.value,
    status: $('f-status').value,
    missable: $('f-missable').value,
    hidden: $('f-hidden').value,
  };
}

function renderList() {
  const f = currentFilters();
  const shown = trophies.filter((t) => {
    if (f.grade !== 'all' && t.grade !== f.grade) return false;
    if (f.kind !== 'all' && t.kind !== f.kind) return false;
    if (f.status === 'earned' && !isEarned(t)) return false;
    if (f.status === 'unearned' && isEarned(t)) return false;
    if (f.missable === 'yes' && !t.missable) return false;
    if (f.missable === 'no' && t.missable) return false;
    if (f.hidden === 'yes' && !t.hidden) return false;
    if (f.hidden === 'no' && t.hidden) return false;
    if (f.q && !`${t.name} ${t.description} ${t.kind}`.toLowerCase().includes(f.q))
      return false;
    return true;
  });

  listEl.replaceChildren(...shown.map((t) => cardFor(t)));
  $('empty').hidden = shown.length > 0;
  $('result-count').textContent =
    `Showing ${shown.length} of ${trophies.length} trophies · ${trophies.filter(isEarned).length} earned overall`;
}

// ---- detail panel -------------------------------------------------------

function select(id) {
  selectedId = id;
  renderList();
  renderDetail();
  detailEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function renderDetail() {
  const t = byId.get(selectedId);

  // Nothing selected yet: leave the invitation text in place.
  if (!t) {
    detailEl.innerHTML =
      '<p class="detail-hint">Select a trophy to read its full guide — official description, strategy, missable window, tips and sources.</p>';
    return;
  }

  const prot = isProtected(t);
  detailEl.replaceChildren();

  const h = document.createElement('h3');
  h.textContent = prot ? '▒▒▒▒▒▒▒▒▒▒' : t.name;
  const meta = document.createElement('div');
  meta.className = 'tmeta';
  meta.innerHTML = chipsFor(t);
  detailEl.append(h, meta);

  // Helper for the labelled paragraphs that make up most of the panel.
  const add = (label, text) => {
    const p = document.createElement('p');
    p.innerHTML = `<span class="dlabel"></span><span class="dbody"></span>`;
    p.querySelector('.dlabel').textContent = label;
    p.querySelector('.dbody').textContent = text;
    detailEl.append(p);
  };

  add(
    'Official description — ',
    prot ? 'Spoiler-protected until earned or revealed.' : t.description,
  );

  if (t.missable) {
    add('⚠ Missable — ', `${t.missableNote} Window: ${WINDOWS[t.id] || 'See note.'}`);
  }

  if (prot) {
    // Protected trophies get a reveal button instead of their content.
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'reveal-btn';
    b.textContent = 'Reveal spoilers for this trophy';
    b.addEventListener('click', () => {
      state.revealed[t.id] = true;
      save();
      renderAll();
    });
    detailEl.append(b);
  } else {
    add('Guide — ', t.guide);

    const tp = document.createElement('p');
    tp.innerHTML = '<span class="dlabel">Tips — </span>';
    const ul = document.createElement('ul');
    ul.className = 'tips';
    for (const tip of t.tips) {
      const li = document.createElement('li');
      li.textContent = tip;
      ul.append(li);
    }
    tp.append(ul);
    detailEl.append(tp);

    const sp = document.createElement('p');
    sp.innerHTML = '<span class="dlabel">Sources — </span>';
    const sul = document.createElement('ul');
    sul.className = 'srcs';
    for (const s of t.sources) {
      const li = document.createElement('li');
      li.textContent = s;
      sul.append(li);
    }
    sp.append(sul);
    detailEl.append(sp);
  }

  if (t.count) detailEl.append(counterFor(t));

  const eb = document.createElement('button');
  eb.type = 'button';
  eb.className = 'earn-btn';
  eb.textContent = isEarned(t) ? '✓ Earned — tap to unmark' : 'Mark as earned';
  eb.addEventListener('click', () => setEarned(t, !isEarned(t)));
  detailEl.append(eb);
}

// ---- roadmap and missables views ----------------------------------------

function renderRoadmap() {
  const wrap = $('roadmap');
  wrap.replaceChildren(
    ...ROADMAP.map((phase, i) => {
      const sec = document.createElement('section');
      sec.className = 'phase';

      const got = phase.ids.filter((id) => state.earned[id]).length;
      const h = document.createElement('h3');
      h.textContent = phase.title;
      const eff = document.createElement('p');
      eff.className = 'effort';
      eff.textContent = `${phase.effort} · ${got}/${phase.ids.length} earned in this phase`;
      const warn = document.createElement('p');
      warn.className = 'phase-warn';
      warn.textContent = phase.warning;
      sec.append(h, eff, warn);

      // Each trophy in the phase becomes a chip; clicking one jumps
      // back to the guide view with that trophy selected.
      for (const id of phase.ids) {
        const t = byId.get(id);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'phase-chip' + (isEarned(t) ? ' done' : '');
        b.textContent = `${isEarned(t) ? '✓ ' : ''}${shownName(t)} (${t.grade})`;
        b.addEventListener('click', () => {
          setView('guide');
          select(id);
        });
        sec.append(b);
      }

      sec.dataset.phase = String(i + 1);
      return sec;
    }),
  );
}

function renderMissables() {
  // Every missable trophy as a full card, with its window as a chip.
  $('missable-list').replaceChildren(
    ...trophies
      .filter((t) => t.missable)
      .map((t) =>
        cardFor(t, {
          extra: `<span class="chip warn">Window: ${WINDOWS[t.id] || ''}</span>`,
        }),
      ),
  );
}

// ---- view switching -------------------------------------------------------

function setView(v) {
  view = v;
  for (const b of document.querySelectorAll('.tab')) {
    const on = b.dataset.view === v;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-pressed', String(on));
  }
  $('view-guide').hidden = v !== 'guide';
  $('view-roadmap').hidden = v !== 'roadmap';
  $('view-missables').hidden = v !== 'missables';
}

for (const b of document.querySelectorAll('.tab')) {
  b.addEventListener('click', () => setView(b.dataset.view));
}

// ---- control wiring ---------------------------------------------------------

for (const id of ['f-search', 'f-grade', 'f-kind', 'f-status', 'f-missable', 'f-hidden']) {
  $(id).addEventListener('input', renderList);
}

$('f-spoiler').addEventListener('change', (e) => {
  state.spoiler = e.target.checked;
  save();
  renderAll();
});

// Export: download the whole tracker state as one JSON file.
$('export-btn').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(
    new Blob(
      [JSON.stringify({ app: 'leonida-nights', version: 2, ...state }, null, 2)],
      { type: 'application/json' },
    ),
  );
  a.download = 'leonida-nights-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

// Import: read an export back in, tolerating missing fields.
$('import-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    state = {
      ...blankState(),
      earned: data.earned || {},
      progress: data.progress || {},
      spoiler: data.spoiler !== false,
      revealed: data.revealed || {},
    };
    $('f-spoiler').checked = state.spoiler;
    save();
    renderAll();
  } catch {
    alert('That file is not a valid Leonida Nights progress export.');
  }
});

// Reset: wipe back to a blank tracker, after a confirmation.
$('reset-btn').addEventListener('click', () => {
  if (!confirm('Reset all earned trophies and counters?')) return;
  state = blankState();
  $('f-spoiler').checked = true;
  save();
  renderAll();
});

// ---- first paint --------------------------------------------------------------

function renderAll() {
  renderDash();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

renderAll();
setView(view);
if (selectedId && byId.has(selectedId)) renderDetail();
