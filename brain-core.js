const STORAGE_KEY = "notesV3";

let notes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentNote = null;

// 🔗 PUT YOUR GOOGLE SCRIPT URL HERE
const API_URL = "PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE";

// =======================
// CREATE NEW NOTE
// =======================

function createNote(){
  const note = {
    id: Date.now(),
    title: "New Note",
    content: "",
    department: "General",
    date: new Date().toISOString()
  };

  notes.push(note);
  currentNote = note;
  saveLocal();
  loadNote(note);
}

// =======================
// INSERT TODO
// =======================

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

// =======================
// INSERT TABLE
// =======================

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

// =======================
// SAVE NOTE
// =======================

function saveNote(){
  if(!currentNote){
    createNote();
  }

  currentNote.title = document.getElementById("title").value;

  currentNote.department = document.getElementById("department").value;

  // 🔥 IMPORTANT FIX
  currentNote.content = document.getElementById("editor").innerHTML;

  saveLocal();

  syncToGoogle(currentNote);

  console.log("Saved:", currentNote);
}

// =======================
// LOAD NOTE
// =======================

function loadNote(note){
  currentNote = note;

  document.getElementById("title").value = note.title;

  document.getElementById("department").value = note.department;

  // 🔥 IMPORTANT FIX
  document.getElementById("editor").innerHTML = note.content || "";
}

// =======================
// LOCAL STORAGE
// =======================

function saveLocal(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// =======================
// GOOGLE SYNC
// =======================

function syncToGoogle(note){

  if(API_URL.includes("PASTE")){
    console.log("No API URL set");
    return;
  }

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(note),
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    }
  })
  .then(res => res.text())
  .then(data => console.log("Synced:", data))
  .catch(err => console.error("Sync failed:", err));
}

// =======================
// INIT
// =======================

if(notes.length > 0){
  loadNote(notes[0]);
} else {
  createNote();
}
