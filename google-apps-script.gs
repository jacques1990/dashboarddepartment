function doPost(e) {
  if (!e || !e.postData) {
    return ContentService.createTextOutput("No data");
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = JSON.parse(e.postData.contents);

  const id = String(data.id);
  const department = data.department || "General";
  const dateObj = new Date(data.date || new Date());
  const month = dateObj.toLocaleString("default", { month: "long" });

  const safeDepartment = department.replace(/[\\/:?*\[\]]/g, "-");
  const sheetName = `${safeDepartment}_${month}`;

  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(["ID","Title","Department","Content","Todos","Table","Date"]);
  }

  const values = [
    id,
    data.title || "",
    department,
    data.content || "",
    JSON.stringify(data.todos || []),
    JSON.stringify(data.table || []),
    data.date || new Date().toISOString()
  ];

  const lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1).getValues().flat();
    const rowIndex = ids.findIndex(r => String(r) === id);

    if (rowIndex !== -1) {
      sheet.getRange(rowIndex + 2, 1, 1, values.length).setValues([values]);
      return ContentService.createTextOutput("UPDATED");
    }
  }

  sheet.appendRow(values);
  return ContentService.createTextOutput("CREATED");
}

function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  let allNotes = [];

  sheets.forEach(sheet => {
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return;

    const rows = data.slice(1);
    const notes = rows.map(r => ({
      id: r[0],
      title: r[1],
      department: r[2],
      content: r[3],
      todos: safeParse(r[4], []),
      table: safeParse(r[5], []),
      date: r[6]
    }));

    allNotes = allNotes.concat(notes);
  });

  return ContentService
    .createTextOutput(JSON.stringify(allNotes))
    .setMimeType(ContentService.MimeType.JSON);
}

function safeParse(value, fallback) {
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch (e) {
    return fallback;
  }
}
