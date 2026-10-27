const PAGE_SIZE = 30;
const $ = (sel) => document.querySelector(sel);

const state = {
  items: [],
  sources: [],
  topic: 'all',
  query: '',
  hidden: new Set(load('hiddenSources', [])),
  saved: new Map(load('saved', []).map((i) => [i.link, i])),
  shown: PAGE_SIZE,
};

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function store(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.round((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'just now';
  const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [name, secs] of units) {
    const n = Math.floor(s / secs);
    if (n >= 1) return `${n} ${name}${n > 1 ? 's' : ''} ago`;
  }
  return '';
}

function filtered() {
  const q = state.query.toLowerCase();
  const pool = state.topic === 'saved' ? [...state.saved.values()] : state.items;
  return pool.filter((item) => {
    if (state.topic !== 'saved') {
      if (state.hidden.has(item.source)) return false;
      if (state.topic !== 'all' && !item.topics.includes(state.topic)) return false;
    }
    if (q && !`${item.title} ${item.summary} ${item.source} ${item.categories.join(' ')}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderCard(item) {
  const node = $('#card-tpl').content.cloneNode(true);
  const card = node.querySelector('.card');
  const thumb = card.querySelector('.thumb');
  const img = thumb.querySelector('img');
  thumb.href = item.link;
  thumb.dataset.label = item.source;
  if (item.image) {
    img.src = item.image;
    img.onerror = () => thumb.classList.add('empty');
  } else {
    thumb.classList.add('empty');
  }
  card.querySelector('.source').textContent = item.source;
  const topics = card.querySelector('.topics');
  for (const t of item.topics) {
    const span = document.createElement('span');
    span.className = `topic ${t}`;
    span.textContent = t;
    topics.append(span);
  }
  const link = card.querySelector('h2 a');
  link.href = item.link;
  link.textContent = item.title;
  card.querySelector('.summary').textContent = item.summary;
  const time = card.querySelector('time');
  if (item.date) {
    time.dateTime = item.date;
    time.textContent = timeAgo(item.date);
    time.title = new Date(item.date).toLocaleString();
  }
  const save = card.querySelector('.save');
  const sync = () => {
    const on = state.saved.has(item.link);
    save.classList.toggle('on', on);
    save.textContent = on ? '★' : '☆';
    save.setAttribute('aria-label', on ? 'Remove from treasure' : 'Save to treasure');
  };
  save.onclick = () => {
    if (state.saved.has(item.link)) state.saved.delete(item.link);
    else state.saved.set(item.link, item);
    store('saved', [...state.saved.values()]);
    if (state.topic === 'saved') render();
    else sync();
  };
  sync();
  return node;
}

function render() {
  const list = filtered();
  const grid = $('#grid');
  grid.replaceChildren(...list.slice(0, state.shown).map(renderCard));
  $('#more').hidden = list.length <= state.shown;
  if (list.length === 0) {
    $('#status').textContent = state.topic === 'saved' ? 'No treasure yet — tap ☆ on any article to stash it.' : 'No articles match. Try a different search or turn on more sources.';
  } else {
    $('#status').textContent = '';
  }
}

function renderSources() {
  const box = $('#sources');
  box.replaceChildren(
    ...state.sources.map((s) => {
      const btn = document.createElement('button');
      btn.className = `chip${s.ok ? '' : ' down'}`;
      btn.setAttribute('aria-pressed', String(!state.hidden.has(s.name)));
      btn.title = s.ok ? 'Click to toggle' : `Unavailable: ${s.error}`;
      btn.innerHTML = '<span class="dot"></span><span class="name"></span><span class="n"></span>';
      btn.querySelector('.name').textContent = s.name;
      btn.querySelector('.n').textContent = s.ok ? s.count : '—';
      btn.onclick = () => {
        if (state.hidden.has(s.name)) state.hidden.delete(s.name);
        else state.hidden.add(s.name);
        store('hiddenSources', [...state.hidden]);
        btn.setAttribute('aria-pressed', String(!state.hidden.has(s.name)));
        state.shown = PAGE_SIZE;
        render();
      };
      return btn;
    })
  );
  const up = state.sources.filter((s) => s.ok).length;
  $('#source-count').textContent = `(${up}/${state.sources.length} online)`;
}

async function init() {
  try {
    const res = await fetch('news.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.items = data.items;
    state.sources = data.sources;
    $('#updated').textContent = `Updated ${timeAgo(data.updated)}`;
    $('#updated').title = new Date(data.updated).toLocaleString();
    renderSources();
    render();
  } catch (err) {
    $('#status').textContent = `Rough seas — couldn't load news (${err.message}). Try again in a moment.`;
  }
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.onclick = () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === tab));
    state.topic = tab.dataset.topic;
    state.shown = PAGE_SIZE;
    render();
  };
});

let debounce;
$('#q').addEventListener('input', (e) => {
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    state.query = e.target.value.trim();
    state.shown = PAGE_SIZE;
    render();
  }, 120);
});

document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== $('#q')) {
    e.preventDefault();
    $('#q').focus();
  }
});

$('#more').onclick = () => {
  state.shown += PAGE_SIZE;
  render();
};

init();
