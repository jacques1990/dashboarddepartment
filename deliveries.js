/* Deliveries Tracker — standalone script
   Requires the following HTML IDs to exist:
   d_name, d_store, d_trackingNo, d_trackingUrl, d_eta, d_status, d_notes,
   d_save, d_clear, d_export, d_import, d_importFile, d_share, d_quickUrl, d_parse,
   d_table (optional), d_tbody
*/
(function DeliveriesTracker(){
  const KEY='lifeCity.deliveries.v1';
  const JSON_PATH='deliveries.json'; // set to null to disable JSON bootstrap
  const $=(s,r=document)=>r.querySelector(s);

  const el={
    name:$('#d_name'), store:$('#d_store'),
    trackingNo:$('#d_trackingNo'), trackingUrl:$('#d_trackingUrl'),
    eta:$('#d_eta'), status:$('#d_status'), notes:$('#d_notes'),
    save:$('#d_save'), clear:$('#d_clear'),
    exportBtn:$('#d_export'), importBtn:$('#d_import'), importFile:$('#d_importFile'),
    share:$('#d_share'), quickUrl:$('#d_quickUrl'), parse:$('#d_parse'),
    tbody:$('#d_tbody')
  };

  function loadLS(){ try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }catch{ return []; } }
  function saveLS(list){ localStorage.setItem(KEY, JSON.stringify(list)); }
  const esc=s=>String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function rowHTML(d,i){
    return `<tr data-i="${i}">
      <td><strong>${esc(d.name)}</strong><div class="small">${esc(d.store)}</div></td>
      <td><div>${esc(d.trackingNo||'—')}</div><div class="small">${
        d.trackingUrl?`<a class="link" href="${esc(d.trackingUrl)}" target="_blank" rel="noopener">Open</a>`:''}</div></td>
      <td>${d.eta?new Date(d.eta).toLocaleDateString():'—'}</td>
      <td><span class="badge">${esc(d.status||'Ordered')}</span></td>
      <td>${esc(d.notes||'')}</td>
      <td style="white-space:nowrap">
        <button class="btn-amber" data-act="edit" style="padding:6px 10px">Edit</button>
        <button class="btn btn-muted" data-act="del" style="padding:6px 10px;background:#ef4444">Delete</button>
      </td>
    </tr>`;
  }

  function render(){
    const data = loadLS();
    el.tbody.innerHTML = data.length ? data.map(rowHTML).join('')
      : `<tr class="empty"><td colspan="6" class="empty">No deliveries yet.</td></tr>`;
  }

  function currentForm(){
    return {
      name:(el.name.value||'').trim(),
      store:(el.store.value||'').trim(),
      trackingNo:(el.trackingNo.value||'').trim(),
      trackingUrl:(el.trackingUrl.value||'').trim(),
      eta:el.eta.value || null,
      status:el.status.value,
      notes:(el.notes.value||'').trim(),
      createdAt: Date.now()
    };
  }

  function clearForm(){
    el.name.value = el.store.value = el.trackingNo.value = el.trackingUrl.value = el.notes.value = '';
    el.eta.value = ''; el.status.value = 'Ordered';
    el.save.dataset.editing = '';
  }

  // Events
  el.save?.addEventListener('click', ()=>{
    const d = currentForm();
    if (!d.name && !d.trackingNo && !d.trackingUrl){
      alert('Add at least a name, tracking number or link.'); return;
    }
    const list = loadLS();
    const idx = el.save.dataset.editing ? Number(el.save.dataset.editing) : -1;
    if (idx >= 0){ list[idx] = { ...list[idx], ...d }; }
    else { list.unshift(d); }
    saveLS(list); render(); clearForm();
  });

  el.clear?.addEventListener('click', clearForm);

  el.tbody?.addEventListener('click', (ev)=>{
    const btn = ev.target.closest('button'); if (!btn) return;
    const tr = ev.target.closest('tr'); const i = Number(tr?.dataset?.i ?? -1);
    if (i < 0) return;
    const list = loadLS();
    if (btn.dataset.act === 'edit'){
      const d = list[i];
      el.name.value = d.name||''; el.store.value = d.store||'';
      el.trackingNo.value = d.trackingNo||''; el.trackingUrl.value = d.trackingUrl||'';
      el.eta.value = d.eta||''; el.status.value = d.status||'Ordered';
      el.notes.value = d.notes||'';
      el.save.dataset.editing = String(i);
      if (location.hash !== '#deliveries') location.hash = '#deliveries';
      window.scrollTo({top:0, behavior:'smooth'});
    } else if (btn.dataset.act === 'del'){
      if (confirm('Delete this entry?')){ list.splice(i,1); saveLS(list); render(); }
    }
  });

  // Export / Import
  el.exportBtn?.addEventListener('click', ()=>{
    const data = loadLS();
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'deliveries.json'; a.click();
    URL.revokeObjectURL(url);
  });

  el.importBtn?.addEventListener('click', ()=> el.importFile?.click());
  el.importFile?.addEventListener('change', async ()=>{
    const f = el.importFile.files[0]; if (!f) return;
    try{
      const data = JSON.parse(await f.text());
      if (!Array.isArray(data)) throw new Error('Invalid file (expect an array)');
      saveLS(data); render();
    }catch(e){ alert('Could not import: ' + e.message); }
    el.importFile.value='';
  });

  // Share via URL once
  el.share?.addEventListener('click', ()=>{
    const d = currentForm();
    if(!d.name && !d.trackingUrl && !d.trackingNo){
      alert('Fill something to share (name, tracking no or URL).'); return;
    }
    const payload = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(d)))));
    const share = location.origin + location.pathname + '?add=' + payload + '#deliveries';
    navigator.clipboard.writeText(share).then(()=>alert('Share link copied!'));
  });

  // Quick parse of common carrier URLs
  function parseCarrier(u){
    try{
      const url = new URL(u);
      const h = url.hostname;
      if(/ups\.com$/.test(h)){
        const tn = url.searchParams.get('tracknum') || url.pathname.split('/').pop();
        return {carrier:'UPS', trackingNo: tn};
      }
      if(/fedex\.com$/.test(h)){
        const tn = url.searchParams.get('trknbr') || url.pathname.split('/').pop();
        return {carrier:'FedEx', trackingNo: tn};
      }
      if(/dhl\./.test(h)){
        const tn = url.searchParams.get('tracking-id') || url.pathname.split('/').pop();
        return {carrier:'DHL', trackingNo: tn};
      }
      if(/canadapost-postescanada\.ca$/.test(h)){
        const tn = url.searchParams.get('track') || url.pathname.split('/').pop();
        return {carrier:'Canada Post', trackingNo: tn};
      }
      if(/purolator\.com$/.test(h)){
        const tn = url.searchParams.get('pin') || url.pathname.split('/').pop();
        return {carrier:'Purolator', trackingNo: tn};
      }
      if(/usps\.com$/.test(h)){
        const tn = url.searchParams.get('tLabels') || url.pathname.split('/').pop();
        return {carrier:'USPS', trackingNo: tn};
      }
      return {carrier:'', trackingNo:''};
    }catch{ return {carrier:'', trackingNo:''}; }
  }

  el.parse?.addEventListener('click', ()=>{
    const u = (el.quickUrl.value||'').trim();
    if(!u){ alert('Paste a tracking page URL first.'); return; }
    const {carrier, trackingNo} = parseCarrier(u);
    if (carrier) el.store.value = carrier;
    if (trackingNo) el.trackingNo.value = trackingNo;
    el.trackingUrl.value = u;
  });

  // Bootstrap from deliveries.json (optional), then ensure LS is set
  async function loadFromJSON(){
    if (!JSON_PATH) return null;
    try{
      const res = await fetch(JSON_PATH, {cache:'no-store'});
      if (!res.ok) throw 0;
      const data = await res.json();
      return Array.isArray(data) ? data : null;
    }catch{ return null; }
  }

  async function init(){
    // One-time add from ?add=
    const qs = new URLSearchParams(location.search);
    const enc = qs.get('add');
    if (enc){
      try{
        const json = decodeURIComponent(escape(atob(decodeURIComponent(enc))));
        const d = JSON.parse(json);
        const list = loadLS(); list.unshift(d); saveLS(list);
        history.replaceState({}, document.title, location.pathname + '#deliveries');
      }catch{}
    }

    let data = await loadFromJSON();
    if (!data){
      data = loadLS();
    } else {
      // Seed LS with file contents (only if LS empty)
      const existing = loadLS();
      if (!existing || existing.length === 0) saveLS(data);
    }

    render();
  }

  init();
})(); 
