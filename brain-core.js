const STORAGE_KEY = "lifeCityNotesV2";

const DEFAULT_FOLDERS = {
  "2026": ["January","February","March","April","May","June","July","August","September","October","November","December"]
};

let notes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentNoteId = null;
let activeMonthFilter = null;

// ✅ AUTO SAVE
let autoSaveTimer;
let syncTimer;
let lastSavedHash = "";

// ✅ YOUR GOOGLE API (ADDED)
const SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwUkI0A5-Ou3KShmBBUqemJhEeGKua48b6c6XjKCN7f_yJHW7iTitOwixtSiGdARxns/exec";

// ELEMENTS
const els = {
  folders: document.getElementById("folders"),
  notesList: document.getElementById("notesList"),
  noteCount: document.getElementById("noteCount"),
  searchBox: document.getElementById("searchBox"),
  title: document.getElementById("title"),
  department: document.getElementById("department"),
  content: document.getElementById("content"),
  todoList: document.getElementById("todoList"),
  tableBody: document.querySelector("#table tbody"),
  statusText: document.getElementById("statusText"),
  addTaskBtn: document.getElementById("addTaskBtn"),
  addRowBtn: document.getElementById("addRowBtn")
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

// ================= HELPERS =================
function monthNameFromDate(iso){
  return new Date(iso).toLocaleString("default",{month:"long"});
}

// ================= FOLDERS =================
function buildFolders(){
  els.folders.innerHTML = "";

  Object.entries(DEFAULT_FOLDERS).forEach(([year, months])=>{
    const y = document.createElement("div");
    y.textContent = year;
    y.onclick = ()=>{
      activeMonthFilter = null;
      renderNotesList();
    };
    els.folders.appendChild(y);

    months.forEach(month=>{
      const m = document.createElement("div");
      m.textContent = month;
      m.onclick = ()=>{
        activeMonthFilter = month;
        renderNotesList();
      };
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
  updateProgress();
}

// ================= TODOS =================
function appendTodoRow(text="",done=false){
  const row = document.createElement("div");
  row.className="todo-row";

  row.innerHTML=`
    <input type="checkbox" ${done?"checked":""}>
    <input class="todo-input" value="${text || ""}">
  `;

  els.todoList.appendChild(row);

  const cb = row.querySelector("input[type='checkbox']");
  applyStrikeThrough(cb);
}

function renderTodos(todos){
  els.todoList.innerHTML="";
  todos.forEach(t=>appendTodoRow(t.text,t.done));
}

// ================= TABLE =================
function appendTableRow(item="",value=""){
  const tr=document.createElement("tr");
  tr.innerHTML=`
    <td><input value="${item || ""}"></td>
    <td><input value="${value || ""}"></td>
  `;
  els.tableBody.appendChild(tr);
}

function renderTable(rows){
  els.tableBody.innerHTML="";
  rows.forEach(r=>appendTableRow(r.item,r.value));
}

// ================= COLLECT =================
function collectTodos(){
  return [...els.todoList.querySelectorAll(".todo-row")].map(row=>{
    const inputs=row.querySelectorAll("input");
    return {done:inputs[0].checked,text:inputs[1].value};
  });
}

function collectTable(){
  return [...els.tableBody.querySelectorAll("tr")].map(tr=>{
    const inputs=tr.querySelectorAll("input");
    return {item:inputs[0].value,value:inputs[1].value};
  });
}

// ================= AUTO SAVE =================
function autoSave(){
  const note = notes.find(n=>n.id===currentNoteId);
  if(!note) return;

  const data = JSON.stringify({
    title:els.title.value,
    content:els.content.value,
    todos:collectTodos(),
    table:collectTable()
  });

  if(data === lastSavedHash) return;
  lastSavedHash = data;

  note.title = els.title.value;
  note.department = els.department.value;
  note.content = els.content.value;
  note.todos = collectTodos();
  note.table = collectTable();

  persistLocal();
  renderNotesList();

  setStatus("Auto-saving...");
  debounceGoogleSync(note);
}

// ================= DEBOUNCE =================
function debounceGoogleSync(note){
  clearTimeout(syncTimer);
  syncTimer = setTimeout(()=>{
    syncToGoogle(note);
  }, 3000);
}

// ================= GOOGLE =================
async function syncToGoogle(note){
  try{
    setStatus("Syncing...");
    await fetch(SHEETS_WEB_APP_URL,{
      method:"POST",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify(note)
    });
    setStatus("Synced ✅");
  }catch{
    setStatus("Sync failed ❌",true);
  }
}

// ================= STRIKE =================
function applyStrikeThrough(cb){
  const text = cb.nextElementSibling;
  if(cb.checked){
    text.style.textDecoration="line-through";
    text.style.opacity="0.6";
  } else {
    text.style.textDecoration="none";
    text.style.opacity="1";
  }
}

// ================= PROGRESS =================
function updateProgress(){
  const todos = collectTodos();
  const total = todos.length;
  const done = todos.filter(t=>t.done).length;
  setStatus(`Progress: ${done}/${total}`);
}

// ================= LIST =================
function renderNotesList(){
  els.notesList.innerHTML="";

  let filtered = notes;

  if(activeMonthFilter){
    filtered = notes.filter(n=>{
      return monthNameFromDate(n.date) === activeMonthFilter;
    });
  }

  filtered.forEach(n=>{
    const div=document.createElement("div");
    div.innerText=n.title;
    div.onclick=()=>openNote(n.id);
    els.notesList.appendChild(div);
  });

  els.noteCount.innerText = filtered.length;
}

// ================= EVENTS =================
function triggerAutoSave(){
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(autoSave,1000);
}

els.content.addEventListener("input", triggerAutoSave);
els.title.addEventListener("input", triggerAutoSave);
els.todoList.addEventListener("input", triggerAutoSave);

els.todoList.addEventListener("change", e=>{
  if(e.target.type==="checkbox"){
    applyStrikeThrough(e.target);
    updateProgress();
    triggerAutoSave();
  }
});

els.tableBody.addEventListener("input", triggerAutoSave);

// ✅ BUTTON FIX (THIS WAS YOUR ISSUE)
if(els.addTaskBtn){
  els.addTaskBtn.addEventListener("click", ()=>{
    appendTodoRow();
    triggerAutoSave();
  });
}

if(els.addRowBtn){
  els.addRowBtn.addEventListener("click", ()=>{
    appendTableRow();
    triggerAutoSave();
  });
}

// ================= INIT =================
buildFolders();
renderNotesList();

if(notes.length){
  openNote(notes[0].id);
}else{
  createNote();
}
document.addEventListener("DOMContentLoaded", () => {

  // 🔁 RE-GET ELEMENTS AFTER DOM LOAD
  els.addTaskBtn = document.getElementById("addTaskBtn");
  els.addRowBtn = document.getElementById("addRowBtn");

  // ================= BUTTONS =================
  if(els.addTaskBtn){
    els.addTaskBtn.addEventListener("click", () => {
      console.log("Adding task...");
      appendTodoRow("", false);
      triggerAutoSave();
    });
  } else {
    console.error("addTaskBtn NOT FOUND");
  }

  if(els.addRowBtn){
    els.addRowBtn.addEventListener("click", () => {
      console.log("Adding row...");
      appendTableRow("", "");
      triggerAutoSave();
    });
  } else {
    console.error("addRowBtn NOT FOUND");
  }

  // ================= INIT =================
// ================= INIT =================
async function initApp(){

  buildFolders();

  try{
    await loadFromGoogle(); // 🔥 WAIT for cloud data
  }catch(e){
    console.error(e);
  }

  // fallback only if still empty
  if(!notes.length){
    createNote();
  }
}

// RUN
initApp();
async function loadFromGoogle(){

  const res = await fetch(SHEETS_WEB_APP_URL);
  const data = await res.json();

  if(Array.isArray(data)){
    notes = data;
  } else if(data.notes){
    notes = data.notes;
  }

  persistLocal();
  renderNotesList();

  if(notes.length){
    openNote(notes[0].id);
  }

  setStatus("Loaded from Google ✅");
}

  }catch(e){
    console.error(e);
    setStatus("Failed to load from Google ❌", true);
  }
}
function exportMemory(){

  const data = JSON.stringify({ notes }, null, 2);

  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "life-city-memory.json";

  // 🔥 THIS PART FIXES MOST BUGS
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);

  console.log("JSON Export Triggered");
  setStatus("JSON exported ✅");
}
document.getElementById("exportBtn").addEventListener("click", exportMemory);
async function loadFromGoogle(){

  try{
    const res = await fetch(SHEETS_WEB_APP_URL);
    const data = await res.json();

    notes = data;

    persistLocal();
    renderNotesList();

    if(notes.length){
      openNote(notes[0].id);
    }

    setStatus("Loaded from Google ✅");

  }catch(e){
    console.error(e);
    setStatus("Load failed ❌", true);
  }
}
