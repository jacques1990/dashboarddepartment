const STORAGE_KEY = "lifeCityNotesV2";

const DEFAULT_FOLDERS = {
  "2026": ["January","February","March","April","May","June","July","August","September","October","November","December"]
};

let notes = [];
let currentNoteId = null;
let activeMonthFilter = null;

let autoSaveTimer;
let syncTimer;
let lastSavedHash = "";

const SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwUkI0A5-Ou3KShmBBUqemJhEeGKua48b6c6XjKCN7f_yJHW7iTitOwixtSiGdARxns/exec";

// ================= ELEMENTS =================
const els = {
  folders: document.getElementById("folders"),
  notesList: document.getElementById("notesList"),
  noteCount: document.getElementById("noteCount"),
  title: document.getElementById("title"),
  department: document.getElementById("department"),
  content: document.getElementById("content"),
  todoList: document.getElementById("todoList"),
  tableBody: document.querySelector("#table tbody"),
  statusText: document.getElementById("statusText"),
  addTaskBtn: document.getElementById("addTaskBtn"),
  addRowBtn: document.getElementById("addRowBtn"),
  exportBtn: document.getElementById("exportBtn")
};

// ================= STATUS =================
function setStatus(msg, err=false){
  els.statusText.textContent = msg;
  els.statusText.style.color = err ? "#fca5a5" : "#94a3b8";
}

// ================= STORAGE =================
function persistLocal(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// ================= FOLDERS =================
function buildFolders(){
  els.folders.innerHTML = "";
  Object.entries(DEFAULT_FOLDERS).forEach(([year, months])=>{
    const y = document.createElement("div");
    y.textContent = year;
    y.onclick = ()=>{ activeMonthFilter=null; renderNotesList(); };
    els.folders.appendChild(y);

    months.forEach(month=>{
      const m = document.createElement("div");
      m.textContent = month;
      m.onclick = ()=>{ activeMonthFilter=month; renderNotesList(); };
      els.folders.appendChild(m);
    });
  });
}

// ================= CREATE =================
function createNote(){
  const note = {
    id: Date.now(),
    title: "New Note",
    content: "",
    date: new Date().toISOString(),
    department: "Controlled Documents",
    todos: [],
    table: []
  };

  notes.unshift(note);
  currentNoteId = note.id;

  persistLocal();
  renderNotesList();
  openNote(note.id);
}

// ================= OPEN =================
function openNote(id){
  const note = notes.find(n=>n.id===id);
  if(!note) return;

  currentNoteId = id;

  els.title.value = note.title || "";
  els.department.value = note.department;
  els.content.value = note.content || "";

  renderTodos(note.todos);
  renderTable(note.table);
}

// ================= TODOS =================
function appendTodoRow(text="",done=false){
  const row = document.createElement("div");
  row.innerHTML = `
    <input type="checkbox" ${done?"checked":""}>
    <input value="${text}">
  `;
  els.todoList.appendChild(row);
}

function renderTodos(todos){
  els.todoList.innerHTML="";
  todos.forEach(t=>appendTodoRow(t.text,t.done));
}

// ================= TABLE =================
function appendTableRow(item="",value=""){
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input value="${item}"></td>
    <td><input value="${value}"></td>
  `;
  els.tableBody.appendChild(tr);
}

function renderTable(rows){
  els.tableBody.innerHTML="";
  rows.forEach(r=>appendTableRow(r.item,r.value));
}

// ================= COLLECT =================
function collectTodos(){
  return [...els.todoList.children].map(row=>{
    const inputs=row.querySelectorAll("input");
    return {done:inputs[0].checked,text:inputs[1].value};
  });
}

function collectTable(){
  return [...els.tableBody.children].map(tr=>{
    const inputs=tr.querySelectorAll("input");
    return {item:inputs[0].value,value:inputs[1].value};
  });
}

// ================= SAVE =================
function autoSave(){
  const note = notes.find(n=>n.id===currentNoteId);
  if(!note) return;

  const newData = JSON.stringify({
    title:els.title.value,
    content:els.content.value
  });

  if(newData === lastSavedHash) return;
  lastSavedHash = newData;

  note.title = els.title.value;
  note.department = els.department.value;
  note.content = els.content.value;
  note.todos = collectTodos();
  note.table = collectTable();

  persistLocal();
  renderNotesList();

  debounceGoogleSync(note);
}

// ================= GOOGLE =================
function debounceGoogleSync(note){
  clearTimeout(syncTimer);
  syncTimer = setTimeout(()=>syncToGoogle(note),2000);
}

async function syncToGoogle(note){
  try{
    setStatus("Syncing...");
    await fetch(SHEETS_WEB_APP_URL,{
      method:"POST",
      headers:{"Content-Type":"text/plain"},
      body:JSON.stringify(note)
    });
    setStatus("Synced ✅");
  }catch{
    setStatus("Sync failed ❌",true);
  }
}

// ================= LOAD =================
async function loadFromGoogle(){
  try{
    const res = await fetch(SHEETS_WEB_APP_URL);
    const data = await res.json();

    notes = data || [];
    persistLocal();
    renderNotesList();

    if(notes.length) openNote(notes[0].id);

    setStatus("Loaded from Google ✅");
  }catch{
    setStatus("Load failed ❌",true);
  }
}

// ================= EVENTS =================
function triggerAutoSave(){
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(autoSave,800);
}

els.title.oninput = triggerAutoSave;
els.content.oninput = triggerAutoSave;
els.todoList.oninput = triggerAutoSave;
els.tableBody.oninput = triggerAutoSave;

els.addTaskBtn.onclick = ()=>{ appendTodoRow(); triggerAutoSave(); };
els.addRowBtn.onclick = ()=>{ appendTableRow(); triggerAutoSave(); };

els.exportBtn.onclick = ()=>{
  const blob = new Blob([JSON.stringify(notes,null,2)]);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "notes.json";
  a.click();
};

// ================= INIT =================
async function init(){
  buildFolders();
  await loadFromGoogle();

  if(!notes.length){
    notes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    if(!notes.length) createNote();
  }
}

init();
