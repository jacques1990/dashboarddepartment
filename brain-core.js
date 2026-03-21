const STORAGE_KEY = "lifeCityNotesV2";

const DEFAULT_FOLDERS = {
  "2026": ["January","February","March","April","May","June","July","August","September","October","November","December"]
};

let notes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentNoteId = null;
let activeMonthFilter = null;

// AUTO SAVE
let autoSaveTimer;
let syncTimer;
let lastSavedHash = "";

// GOOGLE
const SHEETS_WEB_APP_URL = "PASTE_YOUR_URL_HERE";

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
  statusText: document.getElementById("statusText")
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
    y.className = "folder-item";
    y.onclick = ()=>{
      activeMonthFilter = null;
      renderNotesList();
    };
    els.folders.appendChild(y);

    months.forEach(month=>{
      const m = document.createElement("div");
      m.textContent = month;
      m.className = "folder-item";
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

  let now = new Date();

  if(activeMonthFilter){
    const monthIndex = new Date(Date.parse(activeMonthFilter + " 1, 2026")).getMonth();
    now.setMonth(monthIndex);
  }

  const note = {
    id: Date.now(),
    title: "New Note",
    content: "",
    date: now.toISOString(),
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
    <input class="todo-input" value="${text}">
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

// ================= SAVE =================
function saveNote(){
  const note = notes.find(n=>n.id===currentNoteId);
  if(!note) return;

  note.title = els.title.value;
  note.department = els.department.value;
  note.content = els.content.value;
  note.todos = collectTodos();
  note.table = collectTable();

  persistLocal();
  renderNotesList();

  syncToGoogle(note);
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

  let filteredNotes = notes;

  if(activeMonthFilter){
    filteredNotes = notes.filter(n=>{
      const m = new Date(n.date)
        .toLocaleString("default",{month:"long"});
      return m === activeMonthFilter;
    });
  }

  filteredNotes.forEach(n=>{
    const div=document.createElement("div");
    div.className="note-item";
    div.innerText=n.title;
    div.onclick=()=>openNote(n.id);
    els.notesList.appendChild(div);
  });

  els.noteCount.innerText = filteredNotes.length;
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

// ================= INIT =================
buildFolders();
renderNotesList();

if(notes.length){
  openNote(notes[0].id);
}else{
  createNote();
}
