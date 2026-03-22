const STORAGE_KEY = "lifeCityNotesV2";

const SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwp7qJUoaO0BsMVjAPsB-JuCYNrDuOJ3LcywZrIJUBatmbS08_B1cIwHNcfvHyjc9di/exec";

// ================= FOLDERS =================
const DEFAULT_FOLDERS = {
  "2026": [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ]
};

let notes = [];
let currentNoteId = null;
let activeMonthFilter = null;
let autoSaveTimer = null;

let els = {};

// ================= INIT =================
document.addEventListener("DOMContentLoaded", async () => {
  bindElements();
  bindEvents();
  await initApp();
});

// ================= INIT APP =================
async function initApp(){

  buildFolders();

  // 🔥 load from google first
  try{
    await loadFromGoogle(true);
  }catch(e){
    console.error(e);
  }

  // fallback local
  if(!notes.length){
    const local = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    notes = local;
  }

  if(!notes.length){
    createNote();
  }

  renderNotesList();

  if(notes[0]){
    openNote(notes[0].id);
  }
}

// ================= ELEMENTS =================
function bindElements(){
  els = {
    folders: document.getElementById("folders"),
    notesList: document.getElementById("notesList"),
    title: document.getElementById("title"),
    department: document.getElementById("department"),
    content: document.getElementById("content"),
    todoList: document.getElementById("todoList"),
    tableBody: document.getElementById("tableBody"),
    statusText: document.getElementById("statusText"),
    addTaskBtn: document.getElementById("addTaskBtn"),
    addRowBtn: document.getElementById("addRowBtn"),
    deleteBtn: document.getElementById("deleteBtn"),
    newNoteBtn: document.getElementById("newNoteBtn")
  };
}

// ================= EVENTS =================
function bindEvents(){

  els.title.oninput = triggerAutoSave;
  els.department.onchange = triggerAutoSave;
  els.content.oninput = triggerAutoSave;

  els.addTaskBtn.onclick = () => {
    appendTodoRow();
    triggerAutoSave();
  };

  els.addRowBtn.onclick = () => {
    appendTableRow();
    triggerAutoSave();
  };

  els.deleteBtn.onclick = deleteNote;
  els.newNoteBtn.onclick = createNote;

  els.todoList.addEventListener("change", (e)=>{
    if(e.target.type==="checkbox"){
      applyStrikeThrough(e.target);
      triggerAutoSave();
    }
  });

  els.todoList.addEventListener("input", triggerAutoSave);
  els.tableBody.addEventListener("input", triggerAutoSave);
}

// ================= FOLDERS =================
function buildFolders(){

  if(!els.folders) return;

  els.folders.innerHTML = "";

  Object.entries(DEFAULT_FOLDERS).forEach(([year, months]) => {

    const yearDiv = document.createElement("div");
    yearDiv.innerText = year;
    yearDiv.className = "folder-item";
    els.folders.appendChild(yearDiv);

    months.forEach(month => {

      const m = document.createElement("div");
      m.innerText = month;
      m.className = "folder-item";

      m.onclick = () => {
        activeMonthFilter = month;
        renderNotesList();
      };

      els.folders.appendChild(m);
    });
  });
}

// ================= GOOGLE LOAD =================
async function loadFromGoogle(initial=false){

  try{
    const res = await fetch(SHEETS_WEB_APP_URL + "?t=" + Date.now());
    const data = await res.json();

    if(!Array.isArray(data)) return;

    const currentId = currentNoteId;

    notes = data.sort((a,b)=> new Date(b.date)-new Date(a.date));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    renderNotesList();

    if(initial){
      const found = notes.find(n=>n.id==currentId);
      if(found) openNote(found.id);
      else if(notes[0]) openNote(notes[0].id);
    }

    setStatus("Synced 🌐");

  }catch(e){
    console.error(e);
    setStatus("Sync failed ❌");
  }
}

// ================= AUTO SYNC =================
setInterval(()=>{
  loadFromGoogle(false);
},10000);

// ================= SAVE =================
function triggerAutoSave(){
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(()=>autoSave(),800);
}

function autoSave(){

  const note = notes.find(n=>n.id==currentNoteId);
  if(!note) return;

  note.title = els.title.value;
  note.department = els.department.value;
  note.content = els.content.value;
  note.todos = collectTodos();
  note.table = collectTable();
  note.date = new Date().toISOString();

  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  renderNotesList();

  syncToGoogle(note);
}

// ================= GOOGLE SAVE =================
async function syncToGoogle(note){

  try{
    await fetch(SHEETS_WEB_APP_URL,{
      method:"POST",
      headers:{"Content-Type":"text/plain"},
      body: JSON.stringify(note)
    });

    setStatus("Saved ✅");

  }catch(e){
    console.error(e);
    setStatus("Save failed ❌");
  }
}

// ================= DELETE =================
function deleteNote(){

  const note = notes.find(n=>n.id==currentNoteId);
  if(!note) return;

  if(!confirm("Delete note?")) return;

  notes = notes.filter(n=>n.id!=note.id);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));

  fetch(SHEETS_WEB_APP_URL,{
    method:"POST",
    headers:{"Content-Type":"text/plain"},
    body: JSON.stringify({action:"DELETE",id:note.id})
  });

  if(notes[0]) openNote(notes[0].id);
  renderNotesList();
}

// ================= CREATE =================
function createNote(){

  let noteDate = new Date();

  if(activeMonthFilter){
    const index = new Date(Date.parse(activeMonthFilter+" 1, 2026")).getMonth();
    noteDate.setMonth(index);
  }

  const note = {
    id: Date.now(),
    title:"New Note",
    content:"",
    department:"General",
    todos:[],
    table:[],
    date: noteDate.toISOString()
  };

  notes.unshift(note);
  currentNoteId = note.id;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  renderNotesList();
  openNote(note.id);
}

// ================= OPEN =================
function openNote(id){

  const note = notes.find(n=>n.id==id);
  if(!note) return;

  currentNoteId = id;

  els.title.value = note.title || "";
  els.department.value = note.department || "";
  els.content.value = note.content || "";

  renderTodos(note.todos||[]);
  renderTable(note.table||[]);
}

// ================= FILTER =================
function renderNotesList(){

  els.notesList.innerHTML="";

  let filtered = notes;

  if(activeMonthFilter){
    filtered = notes.filter(n=>{
      const m = new Date(n.date).toLocaleString("default",{month:"long"});
      return m === activeMonthFilter;
    });
  }

  filtered.forEach(n=>{
    const div=document.createElement("div");
    div.innerText=n.title;
    div.onclick=()=>openNote(n.id);
    els.notesList.appendChild(div);
  });
}

// ================= TODO =================
function appendTodoRow(text="",done=false){
  const div=document.createElement("div");
  div.innerHTML=`<input type="checkbox" ${done?"checked":""}><input value="${text}">`;
  els.todoList.appendChild(div);
}

function collectTodos(){
  return [...els.todoList.children].map(r=>{
    const i=r.querySelectorAll("input");
    return {done:i[0].checked,text:i[1].value};
  });
}

function renderTodos(arr){
  els.todoList.innerHTML="";
  arr.forEach(t=>appendTodoRow(t.text,t.done));
}

// ================= TABLE =================
function appendTableRow(a="",b=""){
  const tr=document.createElement("tr");
  tr.innerHTML=`<td><input value="${a}"></td><td><input value="${b}"></td>`;
  els.tableBody.appendChild(tr);
}

function collectTable(){
  return [...els.tableBody.children].map(r=>{
    const i=r.querySelectorAll("input");
    return {item:i[0].value,value:i[1].value};
  });
}

function renderTable(arr){
  els.tableBody.innerHTML="";
  arr.forEach(r=>appendTableRow(r.item,r.value));
}

// ================= UI =================
function applyStrikeThrough(cb){
  const input=cb.nextElementSibling;
  input.style.textDecoration=cb.checked?"line-through":"none";
}

function setStatus(msg){
  if(els.statusText) els.statusText.innerText=msg;
}
