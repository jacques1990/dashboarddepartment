<script>
document.addEventListener('DOMContentLoaded', async function(){
  const KEY = 'lifeCity.slideshow.v1';
  const JSON_PATH = '.procurement/procurement.json'; // same folder as index.html

  const wrap = document.getElementById('ssWrap');
  if (!wrap) return;

  // Add two small buttons to your existing toolbar
  const toolbar = document.getElementById('ssWrap').previousElementSibling?.previousElementSibling || document.querySelector('#slideshow .panel-tools');
  (function injectButtons(){
    const bar = document.querySelector('#slideshow > div:first-of-type');
    if(!bar) return;
    const dl = document.createElement('button');
    dl.className = 'btn btn-amber'; dl.textContent = 'Download JSON'; dl.id='ssExport';
    const imp = document.createElement('button');
    imp.className = 'btn btn-muted'; imp.textContent = 'Import JSON'; imp.id='ssImportBtn';
    const file = document.createElement('input');
    file.type='file'; file.accept='.json'; file.style.display='none'; file.id='ssImportFile';
    bar.appendChild(dl); bar.appendChild(imp); bar.appendChild(file);
  })();

  const dots = document.getElementById('ssDots');
  const addUrl = document.getElementById('ssAddUrl');
  const addBtn = document.getElementById('ssAddBtn');
  const clearBtn = document.getElementById('ssClearBtn');
  const prevBtn = document.getElementById('ssPrev');
  const nextBtn = document.getElementById('ssNext');
  const exportBtn = document.getElementById('ssExport');
  const importBtn = document.getElementById('ssImportBtn');
  const importFile = document.getElementById('ssImportFile');

  function loadLS(){ try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }catch{ return []; } }
  function saveLS(arr){ localStorage.setItem(KEY, JSON.stringify(arr)); }

  async function loadJSON(){
    try{
      const res = await fetch(JSON_PATH, {cache:'no-store'});
      if (!res.ok) throw new Error('no json');
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }catch{}
    return null;
  }

  // 1) Try JSON file; 2) fallback to localStorage; 3) fallback to demo
  let slides = (await loadJSON()) || loadLS();
  if (!Array.isArray(slides) || slides.length===0){
    slides = [
      {"src":"https://placehold.co/1600x900/png?text=Life+City+Slide+1","alt":"Slide 1"},
      {"src":"https://placehold.co/1600x900/png?text=Life+City+Slide+2","alt":"Slide 2"},
      {"src":"https://placehold.co/1600x900/png?text=Life+City+Slide+3","alt":"Slide 3"}
    ];
    saveLS(slides);
  }

  let i = 0, timer;

  function render(){
    wrap.querySelectorAll('img').forEach(n => n.remove());
    slides.forEach((s, idx) => {
      const img = document.createElement('img');
      img.src = typeof s === 'string' ? s : s.src;
      img.alt = (typeof s==='object' && s.alt) ? s.alt : ('Slide '+(idx+1));
      img.decoding = 'async'; img.loading='lazy';
      img.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .45s";
      if (idx === i) img.onload = () => img.style.opacity = 1;
      wrap.appendChild(img);
    });
    dots.innerHTML = '';
    slides.forEach((_, idx)=>{
      const d = document.createElement('button');
      d.title = 'Go to ' + (idx+1);
      d.style.cssText = "width:8px;height:8px;border-radius:999px;border:1px solid #94a3b8;background:"+(idx===i?"#94a3b8":"transparent");
      d.addEventListener('click', ()=>{ i = idx; show(i,true); });
      dots.appendChild(d);
    });
  }

  function show(n, pause){
    i = (n + slides.length) % slides.length;
    wrap.querySelectorAll('img').forEach((img, idx)=>{ img.style.opacity = (idx === i) ? 1 : 0; });
    Array.from(dots.children).forEach((d, idx)=>{ d.style.background = (idx===i) ? "#94a3b8" : "transparent"; });
    if (pause) restartAuto(true);
  }
  const next=()=>show(i+1);
  const prev=()=>show(i-1);
  function restartAuto(pauseOnly){ clearInterval(timer); if (!pauseOnly) timer = setInterval(next, 4000); }

  // add / clear
  addBtn.addEventListener('click', ()=>{
    const url = (addUrl.value||'').trim(); if (!url) return;
    slides.push({src:url, alt:''}); saveLS(slides); addUrl.value=''; render(); show(slides.length-1,true);
  });
  clearBtn.addEventListener('click', ()=>{
    if (confirm('Clear all slides?')){ slides=[]; saveLS(slides); render(); }
  });

  // export / import
  exportBtn.addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(slides, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url; a.download='slideshow.json'; a.click(); URL.revokeObjectURL(url);
  });
  importBtn.addEventListener('click', ()=>importFile.click());
  importFile.addEventListener('change', async ()=>{
    const f=importFile.files[0]; if(!f) return;
    try{
      const data = JSON.parse(await f.text());
      if(!Array.isArray(data)) throw new Error('Invalid JSON (expect array)');
      slides = data; saveLS(slides); render(); show(0,true);
    }catch(e){ alert('Import failed: '+e.message); }
    importFile.value='';
  });

  // UX
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);
  wrap.addEventListener('mouseenter', ()=>restartAuto(true));
  wrap.addEventListener('mouseleave', ()=>restartAuto(false));
  let touchX=null;
  wrap.addEventListener('touchstart', e=>{ touchX = e.touches[0].clientX; }, {passive:true});
  wrap.addEventListener('touchend', e=>{
    if (touchX==null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) (dx<0?next:prev)();
    touchX=null;
  }, {passive:true});

  render(); restartAuto(false);
});
</script>
