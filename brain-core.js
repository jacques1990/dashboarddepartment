const STORAGE_KEY = "lifeCityNotesV2";
const DEFAULT_FOLDERS = {
  "2026": ["January","February","March","April","May","June","July","August","September","October","November","December"]
};

const SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwUkI0A5-Ou3KShmBBUqemJhEeGKua48b6c6XjKCN7f_yJHW7iTitOwixtSiGdARxns/exec";

let notes = [];
let currentNoteId = null;
let activeMonthFilter = null;
let autoSaveTimer = null;
let syncTimer = null;
let lastSavedHash = "";

let els = {};

document.addEventListener("DOMContentLoaded", () => {
  bindElements();
  bindEvents();
  initApp();
});

function bindElements(){
  els = {
    folders: document.getElementById("folders"),
    notesList: document.getElementById("notesList"),
    noteCount: document.getElementById("noteCount"),
    searchBox: document.getElementById("searchBox"),
    title: document.getElementById("title"),
    department: document.getElementById("department"),
    content: document.getElementById("content"),
    todoList: document.getElementById("todoList"),
    tableBody: document.getElementById("tableBody"),
    statusText: document.getElementById("statusText"),
    addTaskBtn: document.getElementById("addTaskBtn"),
    addRowBtn: document.getElementById("addRowBtn"),
    exportBtn: document.getElementById("exportBtn"),
    newNoteBtn: document.getElementById("newNoteBtn"),
    saveBtn: document.getElementById("saveBtn")
  };
}

function bindEvents(){
  els.searchBox?.addEventListener("input", renderNotesList);
  els.title?.addEventListener("input", triggerAutoSave);
  els.department?.addEventListener("change", triggerAutoSave);
  els.content?.addEventListener("input", triggerAutoSave);
  els.todoList?.addEventListener("input", triggerAutoSave);
  els.tableBody?.addEventListener("input", triggerAutoSave);

  els.todoList?.addEventListener("change", (e) => {
    if (e.target && e.target.type === "checkbox") {
      applyStrikeThrough(e.target);
      updateProgress();
      triggerAutoSave();
    }
  });

  els.addTaskBtn?.addEventListener("click", () => {
    appendTodoRow("", false);
    updateProgress();
    triggerAutoSave();
  });

  els.addRowBtn?.addEventListener("click", () => {
    appendTableRow("", "");
    triggerAutoSave();
  });

  els.exportBtn?.addEventListener("click", exportMemory);
  els.newNoteBtn?.addEventListener("click", createNote);
  els.saveBtn?.addEventListener("click", () => autoSave(true));
}

async function initApp(){
  buildFolders();

  try {
    const localNotes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    if (Array.isArray(localNotes) && localNotes.length) {
      notes = localNotes;
      renderNotesList();
      if (notes[0]) openNote(notes[0].id, false);
    }
  } catch (e) {
    console.error("Local load failed", e);
  }

  await loadFromGoogle();

  if (!notes.length) {
    createNote();
  }
}

function setStatus(msg, isError = false){
  if (!els.statusText) return;
  els.statusText.textContent = msg;
  els.statusText.style.color = isError ? "#fca5a5" : "#94a3b8";
}

function persistLocal(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function monthNameFromDate(iso){
  return new Date(iso).toLocaleString("default", { month: "long" });
}

function buildFolders(){
  if (!els.folders) return;
  els.folders.innerHTML = "";

  Object.entries(DEFAULT_FOLDERS).forEach(([year, months]) => {
    const yearDiv = document.createElement("div");
    yearDiv.className = "folder-item folder-year";
    yearDiv.textContent = year;
    yearDiv.addEventListener("click", () => {
      activeMonthFilter = null;
      renderNotesList();
      updateFolderHighlight();
    });
    els.folders.appendChild(yearDiv);

    months.forEach(month => {
      const monthDiv = document.createElement("div");
      monthDiv.className = "folder-item folder-month";
      monthDiv.dataset.month = month;
      monthDiv.textContent = month;
      monthDiv.addEventListener("click", () => {
        activeMonthFilter = month;
        renderNotesList();
        updateFolderHighlight();
      });
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
  let noteDate = new Date();

  if (activeMonthFilter) {
    const monthIndex = new Date(Date.parse(activeMonthFilter + " 1, 2026")).getMonth();
    noteDate.setMonth(monthIndex);
  }

  return {
    id: Date.now(),
    title: "New Note",
    content: "",
    date: noteDate.toISOString(),
    department: "Controlled Documents",
    todos: [],
    table: []
  };
}

function getCurrentNote(){
  return notes.find(n => String(n.id) === String(currentNoteId)) || null;
}

function createNote(){
  const note = createEmptyNote();
  notes.unshift(note);
  currentNoteId = note.id;
  persistLocal();
  renderNotesList();
  openNote(note.id, false);
  setStatus("New note created.");
}

function openNote(id, updateList = true){
  const note = notes.find(n => String(n.id) === String(id));
  if (!note) return;

  currentNoteId = note.id;
  els.title.value = note.title || "";
  els.department.value = note.department || "Controlled Documents";
  els.content.value = note.content || "";

  renderTodos(note.todos || []);
  renderTable(note.table || []);
  updateProgress();

  lastSavedHash = buildNoteHash(note);

  if (updateList) renderNotesList();
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

  const checkbox = row.querySelector('input[type="checkbox"]');
  applyStrikeThrough(checkbox);
}

function appendTableRow(item = "", value = ""){
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input class="table-input" type="text" value="${escapeHtmlAttr(item)}" placeholder="Item"></td>
    <td><input class="table-input" type="text" value="${escapeHtmlAttr(value)}" placeholder="Value"></td>
  `;
  els.tableBody.appendChild(tr);
}

function collectTodos(){
  return [...els.todoList.querySelectorAll(".todo-row")]
    .map(row => {
      const inputs = row.querySelectorAll("input");
      return {
        done: !!inputs[0]?.checked,
        text: (inputs[1]?.value || "").trim()
      };
    })
    .filter(t => t.text || t.done);
}

function collectTable(){
  return [...els.tableBody.querySelectorAll("tr")]
    .map(tr => {
      const inputs = tr.querySelectorAll("input");
      return {
        item: (inputs[0]?.value || "").trim(),
        value: (inputs[1]?.value || "").trim()
      };
    })
    .filter(r => r.item || r.value);
}

function buildNoteHash(noteLike){
  return JSON.stringify({
    title: noteLike.title || "",
    department: noteLike.department || "",
    content: noteLike.content || "",
    todos: noteLike.todos || [],
    table: noteLike.table || []
  });
}

function triggerAutoSave(){
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => autoSave(false), 800);
}

function autoSave(forceSync = false){
  const note = getCurrentNote();
  if (!note) return;

  const snapshot = {
    title: els.title.value.trim() || "Untitled Note",
    department: els.department.value,
    content: els.content.value,
    todos: collectTodos(),
    table: collectTable()
  };

  const nextHash = buildNoteHash(snapshot);
  if (!forceSync && nextHash === lastSavedHash) return;

  lastSavedHash = nextHash;

  note.title = snapshot.title;
  note.department = snapshot.department;
  note.content = snapshot.content;
  note.todos = snapshot.todos;
  note.table = snapshot.table;
  note.date = note.date || new Date().toISOString();

  persistLocal();
  renderNotesList();
  updateProgress();
  setStatus(forceSync ? "Saving..." : "Auto-saving...");

  debounceGoogleSync(note, forceSync ? 0 : 2000);
}

function debounceGoogleSync(note, delayMs = 2000){
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncToGoogle(note);
  }, delayMs);
}

async function syncToGoogle(note){
  if (!SHEETS_WEB_APP_URL) {
    setStatus("No Google Apps Script URL set.", true);
    return;
  }

  try {
    setStatus("Syncing...");
    const response = await fetch(SHEETS_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(note)
    });

    const text = await response.text();
    if (!response.ok) throw new Error(text || "Sync failed");

    setStatus("Synced ✅");
  } catch (error) {
    console.error(error);
    setStatus("Sync failed ❌", true);
  }
}

async function loadFromGoogle(){
  if (!SHEETS_WEB_APP_URL) return;

  try {
    setStatus("Loading from Google...");
    const response = await fetch(SHEETS_WEB_APP_URL);
    const data = await response.json();

    const incoming = Array.isArray(data) ? data : (Array.isArray(data.notes) ? data.notes : []);

    if (incoming.length) {
      notes = incoming.map(normalizeIncomingNote).sort((a, b) => new Date(b.date) - new Date(a.date));
      persistLocal();
      renderNotesList();

      const existingCurrent = currentNoteId && notes.find(n => String(n.id) === String(currentNoteId));
      if (existingCurrent) {
        openNote(existingCurrent.id, false);
      } else if (notes[0]) {
        openNote(notes[0].id, false);
      }
    }

    setStatus("Loaded from Google ✅");
  } catch (error) {
    console.error(error);
    setStatus("Load failed ❌", true);
  }
}

function normalizeIncomingNote(row){
  return {
    id: row.id,
    title: row.title || "Untitled Note",
    department: row.department || "Controlled Documents",
    content: row.content || "",
    todos: Array.isArray(row.todos) ? row.todos : [],
    table: Array.isArray(row.table) ? row.table : [],
    date: row.date || new Date().toISOString()
  };
}

function getFilteredNotes(){
  const query = (els.searchBox.value || "").trim().toLowerCase();

  return notes
    .filter(note => {
      const matchesMonth = !activeMonthFilter || monthNameFromDate(note.date) === activeMonthFilter;
      const haystack = [note.title, note.content, note.department].join(" ").toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      return matchesMonth && matchesSearch;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderNotesList(){
  const filtered = getFilteredNotes();
  els.notesList.innerHTML = "";
  if (els.noteCount) els.noteCount.textContent = filtered.length;

  if (!filtered.length) {
    els.notesList.innerHTML = '<div class="note-card"><div class="note-preview">No notes found.</div></div>';
    return;
  }

  filtered.forEach(note => {
    const card = document.createElement("div");
    card.className = "note-card" + (String(note.id) === String(currentNoteId) ? " active" : "");
    card.addEventListener("click", () => openNote(note.id));

    const preview = (note.content || "").replace(/\s+/g, " ").slice(0, 90);

    card.innerHTML = `
      <div class="note-title">${escapeHtml(note.title || "Untitled Note")}</div>
      <div class="note-meta">${escapeHtml(note.department || "No Department")} • ${formatDate(note.date)}</div>
      <div class="note-preview">${escapeHtml(preview || "Empty note")}</div>
    `;

    els.notesList.appendChild(card);
  });
}

function applyStrikeThrough(checkbox){
  const textInput = checkbox?.nextElementSibling;
  if (!textInput) return;

  if (checkbox.checked) {
    textInput.style.textDecoration = "line-through";
    textInput.style.opacity = "0.6";
  } else {
    textInput.style.textDecoration = "none";
    textInput.style.opacity = "1";
  }
}

function updateProgress(){
  const todos = collectTodos();
  const total = todos.length;
  const done = todos.filter(t => t.done).length;
  setStatus(`Progress: ${done}/${total}`);
}

function exportMemory(){
  try {
    const data = JSON.stringify({ notes }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "life-city-memory.json";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStatus("JSON exported ✅");
  } catch (error) {
    console.error(error);
    setStatus("Export failed ❌", true);
  }
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
