const STORAGE_KEY = "lifeCityNotesClean";
let notes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentNote = null;

const API_URL = "PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE";

// ================= FOLDERS =================
const folders = {
  "2026": ["March", "February", "January"]
};

const folderDiv = document.getElementById("folders");

for (let year in folders){
  const y = document.createElement("div");
  y.innerText = year;
  y.className = "folder";
  folderDiv.appendChild(y);

  folders[year].forEach(month=>{
    const m = document.createElement("div");
    m.innerText = "  " + month;
    m.className = "folder";
    m.onclick = ()=>filterByMonth(month);
    folderDiv.appendChild(m);
  });
}

// ================= CREATE NOTE =================
function createNote(){
  const note = {
    id: Date.now(),
    title: "New Note",
    content: "",
    department: "Finance",
    date: new Date().toISOString()
  };

  notes.push(note);
  currentNote = note;

  saveLocal();
  renderNotesList();
  loadNote(note);
}

// ================= INSERT TODO =================
function insertTodo(){
  const editor = document.getElementById("editor");

  const div = document.createElement("div");
  div.className = "todo";

  div.innerHTML = `
    <input type="checkbox">
    <span contenteditable="true">Task</span>
  `;

  editor.appendChild(div);
}

// ================= INSERT TABLE =================
function insertTable(){
  const editor = document.getElementById("editor");

  const table = document.createElement("table");

  table.innerHTML = `
    <tr>
      <th contenteditable="true">Item</th>
      <th contenteditable="true">Value</th>
    </tr>
    <tr>
      <td contenteditable="true"></td>
      <td contenteditable="true"></td>
    </tr>
  `;

  editor.appendChild(table);
}

// ================= SAVE =================
function saveNote(){
  if(!currentNote){
    createNote();
  }

  currentNote.title = document.getElementById("title").value;
  currentNote.department = document.getElementById("department").value;
  currentNote.content = document.getElementById("editor").innerHTML;

  saveLocal();
  renderNotesList();
  syncToGoogle(currentNote);
}

// ================= LOAD =================
function loadNote(note){
  currentNote = note;

  document.getElementById("title").value = note.title;
  document.getElementById("department").value = note.department;
  document.getElementById("editor").innerHTML = note.content || "";
}

// ================= RENDER =================
function renderNotesList(){
  const list = document.getElementById("notesList");
  list.innerHTML = "";

  notes.forEach(n=>{
    const div = document.createElement("div");
    div.className = "note-item";
    div.innerText = n.title;
    div.onclick = ()=>loadNote(n);
    list.appendChild(div);
  });
}

// ================= FILTER =================
function filterByMonth(month){
  const list = document.getElementById("notesList");
  list.innerHTML = "";

  notes.forEach(n=>{
    if(new Date(n.date).toLocaleString('default',{month:'long'}) === month){
      const div = document.createElement("div");
      div.className = "note-item";
      div.innerText = n.title;
      div.onclick = ()=>loadNote(n);
      list.appendChild(div);
    }
  });
}

// ================= STORAGE =================
function saveLocal(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// ================= GOOGLE SYNC =================
function syncToGoogle(note){
  if(API_URL.includes("PASTE")) return;

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(note),
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    }
  });
}

// ================= INIT =================
renderNotesList();

if(notes.length > 0){
  loadNote(notes[0]);
} else {
  createNote();
}
