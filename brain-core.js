const STORAGE_KEY = "lifeCityNotesV2";
const DEFAULT_FOLDERS = {
  "2026": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
};

let notes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentNoteId = null;
let activeMonthFilter = null;

const SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx1t26igB1Cmr5D-nSRfLxg-zWIR7S9cuN7OMpEHu7ZjBpWt39dPsBbGEIyRVJ7-NI6/exec";

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

function setStatus(message, isError = false){
  els.statusText.textContent = message;
  els.statusText.style.color = isError ? "#fca5a5" : "#94a3b8";
}

function persistLocal(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function monthNameFromDate(iso){
  return new Date(iso).toLocaleString("default", { month: "long" });
}

function yearFromDate(iso){
  return String(new Date(iso).getFullYear());
}

function buildFolders(){
  els.folders.innerHTML = "";
  Object.entries(DEFAULT_FOLDERS).forEach(([year, months]) => {
    const yearDiv = document.createElement("div");
    yearDiv.className = "folder-item folder-year";
    yearDiv.textContent = year;
    yearDiv.onclick = () => {
      activeMonthFilter = null;
      renderNotesList();
      updateFolderHighlight();
    };
    els.folders.appendChild(yearDiv);

    months.forEach(month => {
      const monthDiv = document.createElement("div");
      monthDiv.className = "folder-item folder-month";
      monthDiv.dataset.month = month;
      monthDiv.textContent = month;
      monthDiv.onclick = () => {
        activeMonthFilter = month;
        renderNotesList();
        updateFolderHighlight();
      };
      els.folders.appendChild(monthDiv);
    });
  });
  updateFolderHighlight();
}

function updateFolderHighlight(){
  document.querySelectorAll(".folder-month").forEach(el => {
    el.classList.toggle("active", el.dataset.month === activeMonthFilter);
  });
}

function createEmptyNote(){
  return {
    id: Date.now(),
    title: "New Note",
    content: "",
    date: new Date().toISOString(),
    department: "Controlled Documents",
    todos: [],
    table: []
  };
}

function getCurrentNote(){
  return notes.find(n => n.id === currentNoteId) || null;
}

function createNote(){
  const note = createEmptyNote();
  notes.unshift(note);
  currentNoteId = note.id;
  persistLocal();
  renderNotesList();
  openNote(note.id);
  setStatus("New note created.");
}

function openNote(id){
  const note = notes.find(n => n.id === id);
  if(!note) return;

  currentNoteId = id;
  els.title.value = note.title || "";
  els.department.value = note.department || "Controlled Documents";
  els.content.value = note.content || "";

  renderTodos(note.todos || []);
  renderTable(note.table || []);
  renderNotesList();
  setStatus("Note loaded.");
}

function renderTodos(todoItems){
  els.todoList.innerHTML = "";
  todoItems.forEach(todo => appendTodoRow(todo.text || "", !!todo.done));
}

function renderTable(rows){
  els.tableBody.innerHTML = "";
  rows.forEach(row => appendTableRow(row.item || "", row.value || ""));
}

function appendTodoRow(text = "", done = false){
  const row = document.createElement("div");
  row.className = "todo-row";
  row.innerHTML = `
    <input type="checkbox" ${done ? "checked" : ""}>
    <input class="todo-input" type="text" value="${escapeHtmlAttr(text)}" placeholder="Task">
  `;
  els.todoList.appendChild(row);
}

function appendTableRow(item = "", value = ""){
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input class="table-input" type="text" value="${escapeHtmlAttr(item)}" placeholder="Item"></td>
    <td><input class="table-input" type="text" value="${escapeHtmlAttr(value)}" placeholder="Value"></td>
  `;
  els.tableBody.appendChild(tr);
}

function addTodo(){
  appendTodoRow();
}

function addRow(){
  appendTableRow();
}

function collectTodos(){
  return [...els.todoList.querySelectorAll(".todo-row")].map(row => {
    const inputs = row.querySelectorAll("input");
    return { done: inputs[0].checked, text: inputs[1].value.trim() };
  }).filter(t => t.text);
}

function collectTable(){
  return [...els.tableBody.querySelectorAll("tr")].map(tr => {
    const inputs = tr.querySelectorAll("input");
    return { item: inputs[0].value.trim(), value: inputs[1].value.trim() };
  }).filter(r => r.item || r.value);
}

function saveNote(){
  const note = getCurrentNote();
  if(!note){
    setStatus("Create or open a note first.", true);
    return;
  }

  note.title = els.title.value.trim() || "Untitled Note";
  note.department = els.department.value;
  note.content = els.content.value;
  note.todos = collectTodos();
  note.table = collectTable();
  note.date = note.date || new Date().toISOString();

  persistLocal();
  renderNotesList();
  syncToGoogle(note);
}

async function syncToGoogle(note){
  if(!SHEETS_WEB_APP_URL || SHEETS_WEB_APP_URL.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE")){
    setStatus("Saved locally. Add your Google Apps Script URL in brain-core.js to enable sync.");
    return;
  }

  try{
    setStatus("Syncing to Google Sheets...");
    const response = await fetch(SHEETS_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(note)
    });

    const text = await response.text();
    if(!response.ok){
      throw new Error(text || "Sync failed");
    }
    setStatus("Saved locally and synced to Google Sheets.");
  }catch(error){
    console.error(error);
    setStatus("Saved locally, but Google Sheets sync failed.", true);
  }
}

function deleteCurrentNote(){
  if(currentNoteId === null){
    setStatus("No note selected.", true);
    return;
  }

  notes = notes.filter(n => n.id !== currentNoteId);
  persistLocal();
  currentNoteId = null;

  els.title.value = "";
  els.department.value = "Controlled Documents";
  els.content.value = "";
  els.todoList.innerHTML = "";
  els.tableBody.innerHTML = "";

  renderNotesList();
  setStatus("Note deleted.");
}

function getFilteredNotes(){
  const q = (els.searchBox.value || "").trim().toLowerCase();

  return notes.filter(note => {
    const matchesMonth = !activeMonthFilter || monthNameFromDate(note.date) === activeMonthFilter;
    const haystack = [note.title, note.content, note.department].join(" ").toLowerCase();
    const matchesSearch = !q || haystack.includes(q);
    return matchesMonth && matchesSearch;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderNotesList(){
  const filtered = getFilteredNotes();
  els.notesList.innerHTML = "";
  els.noteCount.textContent = filtered.length;

  if(filtered.length === 0){
    els.notesList.innerHTML = '<div class="note-card"><div class="note-preview">No notes found.</div></div>';
    return;
  }

  filtered.forEach(note => {
    const card = document.createElement("div");
    card.className = "note-card" + (note.id === currentNoteId ? " active" : "");
    card.onclick = () => openNote(note.id);

    const preview = (note.content || "").replace(/\s+/g, " ").slice(0, 90);
    card.innerHTML = `
      <div class="note-title">${escapeHtml(note.title || "Untitled Note")}</div>
      <div class="note-meta">${escapeHtml(note.department || "No Department")} • ${formatDate(note.date)}</div>
      <div class="note-preview">${escapeHtml(preview || "Empty note")}</div>
    `;
    els.notesList.appendChild(card);
  });
}

function exportMemory(){
  const payload = { notes };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "memory-vault.json";
  a.click();
  URL.revokeObjectURL(url);
  setStatus("JSON memory exported.");
}

function importMemory(event){
  const file = event.target.files?.[0];
  if(!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try{
      const data = JSON.parse(e.target.result);
      notes = Array.isArray(data.notes) ? data.notes : [];
      persistLocal();
      renderNotesList();

      if(notes[0]){
        openNote(notes[0].id);
      }else{
        currentNoteId = null;
      }
      setStatus("JSON memory imported.");
    }catch(error){
      console.error(error);
      setStatus("Invalid JSON file.", true);
    }
  };
  reader.readAsText(file);
}

function formatDate(iso){
  return new Date(iso).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function escapeHtml(text){
  return String(text).replace(/[&<>"]/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[ch]));
}

function escapeHtmlAttr(text){
  return escapeHtml(text).replace(/'/g, "&#39;");
}

els.searchBox.addEventListener("input", renderNotesList);

buildFolders();
renderNotesList();

if(notes.length){
  openNote(notes[0].id);
}else{
  createNote();
}
