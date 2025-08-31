/* ========= DATA MODEL (stable mapping) =========
   Using objects ensures links/icons stay with the right card when filtering/sorting.
*/
const DEPARTMENTS = [
  { num: "1.",  name: "Diplomacy",                         url: "https://onedrive.live.com/?id=A0E5D4FE7220C501%21seee7328e7e9c4f578275995dc4435cac&cid=a0e5d4fe7220c501&ithint=folder&migratedtospo=true", icon: "https://api.iconify.design/tabler/handshake.svg?color=white", color: "#22c55e" },
  { num: "02.", name: "Business",                          url: "https://1drv.ms/f/c/a0e5d4fe7220c501/EnbvFoCubAFAmG6BycYyoAgB8aFRAQe_PJnIV5DTEX4uQw?e=ZX6e9p", icon: "https://api.iconify.design/tabler/briefcase.svg?color=white", color: "#38bdf8" },
  { num: "03.", name: "Major Projects",                    url: "https://1drv.ms/f/c/a0e5d4fe7220c501/Egy4JTjVZB9Hj_fHV7WZI7wBS8gHOM4JCibmCIxUNXg3JA?e=PXsh3L", icon: "https://api.iconify.design/tabler/building-skyscraper.svg?color=white", color: "#f59e0b" },
  { num: "04.", name: "Controlled Documents",              url: "https://1drv.ms/f/c/a0e5d4fe7220c501/EvDHgj4UV-1AuWKV5zz3rvcBIHtiG880gsP5yLSF6WYIrg?e=I78DJN", icon: "https://api.iconify.design/tabler/files.svg?color=white", color: "#60a5fa" },
  { num: "05.", name: "Anju Wifey",                        url: "https://1drv.ms/f/c/a0e5d4fe7220c501/Eg2wbt5jdbVLiHPI_-9b_2ABm5oBWIrC-y2yBd8qFfgj-Q?e=GxQpNJ", icon: "https://api.iconify.design/tabler/heart.svg?color=white", color: "#0284c7" },
  { num: "06.", name: "Health, Fitness & Emergency",       url: "https://1drv.ms/f/c/a0e5d4fe7220c501/Evxve7efbGNMrqOTk-cOXwEB5deNiFdZgW2bwfcWUtQkAw?e=uIugW5", icon: "https://api.iconify.design/tabler/medical-cross.svg?color=white", color: "#fbbf24" },
  { num: "07.", name: "Benefits, Insurance & Taxation",    url: "https://1drv.ms/f/c/a0e5d4fe7220c501/EiQBxfpY5CFFhIAu2bJuBKkBsJTsWqyxd-drZ0H848l7dQ?e=lhg9Bz", icon: "https://api.iconify.design/tabler/receipt-2.svg?color=white", color: "#94a3b8" },
  { num: "08.", name: "Family Safety & Intelligence",      url: "https://1drv.ms/f/c/a0e5d4fe7220c501/ElHiLq5_CmhFi65PdCNgBhoBkdCbO6dydhFUjYg0wpXLSw?e=3QAUr8", icon: "https://api.iconify.design/tabler/shield-lock.svg?color=white", color: "#f59e0b" },
  { num: "09.", name: "Security",                          url: "https://1drv.ms/f/c/a0e5d4fe7220c501/Evlz2w0hdHZEkhvu6pp49tsB5XxNFS_Cm5Py1mj-ZGna4Q?e=PVLdIf", icon: "https://api.iconify.design/tabler/lock.svg?color=white", color: "#10b981" },
  { num: "10.", name: "Law",                               url: "https://1drv.ms/f/c/a0e5d4fe7220c501/EnoSW_PPcdJMqcJdueYl_bIBHCqPEGWH-E2Hv8hTdLOsww?e=Yhq7uh", icon: "https://api.iconify.design/tabler/scale.svg?color=white", color: "#ef4444" },
  { num: "11.", name: "Asset Management & Properties",     url: "https://1drv.ms/f/c/a0e5d4fe7220c501/EvjRP4Cp5vdOtjuDduOTnY4BqqdZS89xlRNOW6EksgKTyg?e=sQNZcc", icon: "https://api.iconify.design/tabler/home.svg?color=white", color: "#3b82f6" },
  { num: "12.", name: "Finance",                           url: "https://jacques1990.github.io/dashboarddepartment/finance.html", icon: "https://api.iconify.design/tabler/currency-dollar.svg?color=white", color: "#22c55e" },
  { num: "13.", name: "Social Committee & Family",         url: "https://1drv.ms/f/c/a0e5d4fe7220c501/EjVdjKqejkZNnmslISEuyrYBu0yYvSBauQMOjDForXt1rQ?e=dSEbTf", icon: "https://api.iconify.design/tabler/users.svg?color=white", color: "#06b6d4" },
  { num: "14.", name: "Dreams & Exploration",              url: "https://1drv.ms/f/c/a0e5d4fe7220c501/EgnvLw10WE5HiKn43P__UgEBI99utn3D4olx_VIDnOGWIA?e=jFXhvQ", icon: "https://api.iconify.design/tabler/rocket.svg?color=white", color: "#f97316" },
  { num: "15.", name: "Philanthropy",                      url: "https://1drv.ms/f/c/a0e5d4fe7220c501/Ek3hIqqFIn9IidmwCDErKfUBtgyu0F-yXs54_yhINHe11w?e=1ylM7D", icon: "https://api.iconify.design/tabler/heart-handshake.svg?color=white", color: "#f43f5e" },
  { num: "16.", name: "Art, Film, Music & Culture",        url: "https://jacques1990.github.io/dashboarddepartment/movies.html", icon: "https://api.iconify.design/tabler/palette.svg?color=white", color: "#8b5cf6" },
  { num: "17.", name: "Food",                              url: "https://1drv.ms/f/c/a0e5d4fe7220c501/EtJyo9UnN3RHhmIEw0j-CxcBJRD3EOF8gIWunZUUvFgkBQ?e=Q2v5aD", icon: "https://api.iconify.design/tabler/utensils.svg?color=white", color: "#fb7185" },
  { num: "18.", name: "Immigration",                       url: "https://1drv.ms/f/c/a0e5d4fe7220c501/ErCNHmpsf0tFo9KeXBwLcU0BJRR3SBGYFD9gnxKsOmURdA?e=6arJ12", icon: "https://api.iconify.design/tabler/id.svg?color=white", color: "#0ea5e9" },
  { num: "19.", name: "Procurement Department",            url: "https://jacques1990.github.io/dashboarddepartment/procurementdepartment.html", icon: "https://api.iconify.design/tabler/shopping-cart.svg?color=white", color: "#16a34a" },
  { num: "20.", name: "Daily Logs & Planner",              url: "https://jacques1990.github.io/dashboarddepartment/logs.html", icon: "https://api.iconify.design/tabler/calendar.svg?color=white", color: "#f59e0b" },
  { num: "21.", name: "Automobile & Transportation",       url: "https://1drv.ms/f/c/a0e5d4fe7220c501/Emh3awOG_65ApeiaLUO9dwoBDd1o1Padh8Kjrs2LyXanRw?e=ih2Cd1", icon: "https://api.iconify.design/tabler/car.svg?color=white", color: "#60a5fa" },
  { num: "22.", name: "Science Division",                  url: "https://1drv.ms/f/c/a0e5d4fe7220c501/Et_-gWUjPp1BmRtPUKWHMRYBYv5sHZidyXS2A4d84IzXqg?e=FNehho", icon: "https://api.iconify.design/tabler/flask-2.svg?color=white", color: "#06b6d4" },
  { num: "23.", name: "Employment Resources",              url: "https://jacques1990.github.io/dashboarddepartment/employmentsources.html", icon: "https://api.iconify.design/tabler/toolbox.svg?color=white", color: "#64748b" },
  { num: "24.", name: "Archives & Museum",                 url: "https://1drv.ms/f/c/a0e5d4fe7220c501/Eg22sU1wlKxClu1md6813G8BfrnP7r5jBhXEvpEKuQ4Q2Q?e=7m5gSa", icon: "https://api.iconify.design/tabler/building-bank.svg?color=white", color: "#ea580c" },
  { num: "25.", name: "Housing & Urban Development",       url: "https://1drv.ms/f/c/a0e5d4fe7220c501/EsqJC4IoPSBDipGf1-XTCwEBQNACPzKcYYnJC8CwXaL3ww?e=jKaHvq", icon: "https://api.iconify.design/tabler/building.svg?color=white", color: "#22c55e" },
  { num: "26.", name: "Communications",                    url: "https://onedrive.live.com/?id=A0E5D4FE7220C501%21s5b8f60feb29940248fd4ed74dfb39f93&cid=a0e5d4fe7220c501&ithint=folder&migratedtospo=true", icon: "https://api.iconify.design/tabler/messages.svg?color=white", color: "#f97316" },
  { num: "27.", name: "Utilities",                         url: "https://1drv.ms/f/c/a0e5d4fe7220c501/EgSt-q_XwQdDtkQtojctRqYB3cqlca5DcT6EbyNg3ZrbWg?e=jdK6Wa", icon: "https://api.iconify.design/tabler/plug.svg?color=white", color: "#0891b2" },
  { num: "28.", name: "Public Works",                      url: "https://1drv.ms/f/c/a0e5d4fe7220c501/Ehw5-wSQ0ntBnlBic-3yCS0B6IJkX3MAxFBT4fD-9D6OXQ?e=caLC7n", icon: "https://api.iconify.design/tabler/tools.svg?color=white", color: "#475569" },
  { num: "29.", name: "Environmental & Sustainability",    url: "https://1drv.ms/f/c/a0e5d4fe7220c501/EjNKI1nMXIFFrezPFGAD5hEBfb_GREXd5LK9odSWAGg9yQ?e=zLqRy3", icon: "https://api.iconify.design/tabler/leaf.svg?color=white", color: "#84cc16" }
];

const FALLBACK_ICON = "https://api.iconify.design/tabler/folder.svg?color=white";

/* ========= Helpers ========= */
const $ = (sel, root=document)=>root.querySelector(sel);
const $$ = (sel, root=document)=>Array.from(root.querySelectorAll(sel));
const normalize = s => s.trim().toLowerCase();
function loadFavs(){ try{ return new Set(JSON.parse(localStorage.getItem('favorites')||'[]')); }catch{ return new Set(); } }
function saveFavs(set){ localStorage.setItem('favorites', JSON.stringify([...set])); }

/* ========= Ticker (note input only) ========= */
/* ========= Ticker (JSON-powered with fallbacks) ========= */
(function initTicker(){
  const FEED_URL = 'feed.json';                 // same folder as index.html
  const STORAGE_KEY = "lifeCity.tickerNotes";   // local manual notes fallback
  const track = document.getElementById('ticker-track');
  const addBtn = document.getElementById('addNoteBtn');
  const textarea = document.getElementById('newNote');
  const clearAll = document.getElementById('clearAll');

  const esc = s => String(s||'').replace(/[&<>"']/g, m => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]
  ));

  // Local notes (fallback + manual add)
  const loadNotes = () => { try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]"); }catch{return[]} };
  const saveNotes = (arr) => localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

  function renderTickerItems(items){
    if (!track) return;
    track.innerHTML = '';

    // Build a fragment from feed items
    const build = (arr) => {
      const frag = document.createDocumentFragment();
      arr.forEach(item=>{
        const text = item.text || '';
        const emoji = item.emoji ? `${item.emoji} ` : '';
        const label = [emoji + text, item.dept ? `(${item.dept})` : ''].filter(Boolean).join(' ');
        const wrap = document.createElement(item.url ? 'a' : 'div');
        wrap.className = 'ticker__item';
        if (item.url) { wrap.href = item.url; wrap.target = '_blank'; wrap.rel = 'noopener'; }
        wrap.innerHTML = `<span class="ticker__bullet"></span><span>${esc(label)}</span>`;
        frag.appendChild(wrap);
      });
      return frag;
    };

    // Duplicate so the marquee can loop seamlessly
    track.appendChild(build(items));
    track.appendChild(build(items));
  }

  async function fetchFeed(){
    try{
      const res = await fetch(FEED_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data || !Array.isArray(data.items)) throw new Error('Bad JSON shape');

      // Merge JSON feed with any local notes (optional). Comment next line to disable merge:
      const merged = [...data.items, ...loadNotes().map(t => ({ text: t }))];

      // If JSON is empty and no notes, use safe defaults
      const items = merged.length ? merged : [
        { text: "Welcome to Life City", emoji:"🏙️" },
        { text: "Add notes → they appear here", emoji:"➕" }
      ];
      renderTickerItems(items);
    }catch(err){
      // Fallback to local notes
      const notes = loadNotes();
      const items = notes.length ? notes.map(t => ({ text: t })) : [
        { text: "Ticker feed.json not found; using fallback", emoji:"ℹ️" },
        { text: "Add notes to populate ticker", emoji:"📝" }
      ];
      renderTickerItems(items);
      // console.warn('Ticker feed error:', err);
    }
  }

  // Manual add / clear (still supported)
  if (addBtn && textarea){
    addBtn.addEventListener('click', ()=>{
      const txt = (textarea.value||'').trim();
      if(!txt) return;
      const notes = loadNotes(); notes.push(txt); saveNotes(notes);
      textarea.value = ''; fetchFeed(); // re-render with merged set
    });
  }
  if (clearAll){
    clearAll.addEventListener('click', ()=>{
      saveNotes([]); fetchFeed();
    });
  }

  // Initial load + auto-refresh (every 60s)
  fetchFeed();
  setInterval(fetchFeed, 60000);
})();


/* ========= Departments Grid ========= */
(function initGrid(){
  const grid = $('#grid');
  const search = $('#search');
  const sortSel = $('#sort');
  const globalSearch = $('#globalSearch');

  function render(list){
    const favs = loadFavs();
    const fav = list.filter(d => favs.has(d.name));
    const rest = list.filter(d => !favs.has(d.name));
    const ordered = [...fav, ...rest];

    grid.innerHTML = '';
    ordered.forEach(d => {
      const card = document.createElement('a');
      card.className = 'card';
      if (d.url) { card.href = d.url; card.target = '_blank'; card.rel = 'noopener'; }
      else { card.href = '#'; card.addEventListener('click', e=>e.preventDefault()); card.title = 'No link configured'; }

      const star = document.createElement('span');
      star.className = 'star' + (favs.has(d.name) ? ' active' : '');
      star.title = favs.has(d.name) ? 'Unpin' : 'Pin to top';
      star.textContent = '★';
      star.addEventListener('click', (ev)=>{
        ev.preventDefault(); ev.stopPropagation();
        const s = loadFavs();
        if (s.has(d.name)) s.delete(d.name); else s.add(d.name);
        saveFavs(s); render(getFilteredSorted());
      });

      const iconWrap = document.createElement('div');
      iconWrap.className = 'icon-badge';
      iconWrap.style.background = d.color || '#334155';
      const img = document.createElement('img');
      img.src = d.icon || FALLBACK_ICON; img.alt = d.name + ' icon';
      img.onerror = ()=>{ img.src = FALLBACK_ICON; img.onerror = null; };
      iconWrap.appendChild(img);

      card.innerHTML = `
        <div class="card-top">
          <div class="icon-slot"></div>
          <div>
            <div class="card-num">${d.num}</div>
            <div class="card-name">${d.name}</div>
            <div class="card-meta">${d.url ? 'Open in OneDrive' : 'No link configured'}</div>
            <div class="pills">
              <span class="pill">Dept</span><span class="pill">Life City</span>
            </div>
          </div>
        </div>`;
      card.querySelector('.icon-slot').replaceWith(iconWrap);
      card.querySelector('.card-top').appendChild(star);

      grid.appendChild(card);
    });
  }

  function getFilteredSorted(){
    const q = normalize(search.value || '');
    let list = DEPARTMENTS.filter(d => d.name.toLowerCase().includes(q));
    if (sortSel.value === 'alpha'){
      list = [...list].sort((a,b)=>a.name.localeCompare(b.name));
    } // else keep natural number order by defined array sequence
    return list;
  }

  search.addEventListener('input', ()=>render(getFilteredSorted()));
  sortSel.addEventListener('change', ()=>render(getFilteredSorted()));
  globalSearch.addEventListener('input', e => { search.value = e.target.value; render(getFilteredSorted()); });

  render(DEPARTMENTS);
})();

/* ========= Sidebar Toggle (hamburger) ========= */
(function initSidebarToggle(){
  // Create the button if it's not in the HTML yet
  let btn = document.getElementById('menuToggle');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'menuToggle';
    btn.className = 'menu-toggle';
    btn.setAttribute('aria-label','Toggle menu');
    document.body.appendChild(btn);
  }

  btn.addEventListener('click', ()=>{
    const open = document.body.classList.toggle('sidebar-open');
    btn.setAttribute('aria-expanded', String(open));
  });

  // Close when tapping the dimmed backdrop
  document.addEventListener('click', (e)=>{
    if (document.body.classList.contains('sidebar-open') && e.target === document.body){
      document.body.classList.remove('sidebar-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  }, {passive:true});

  // Close on ESC
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape' && document.body.classList.contains('sidebar-open')){
      document.body.classList.remove('sidebar-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();
