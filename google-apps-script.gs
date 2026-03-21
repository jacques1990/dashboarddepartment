function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.id || "",
      data.title || "",
      data.content || "",
      data.date || "",
      data.department || "",
      JSON.stringify(data.todos || []),
      JSON.stringify(data.table || [])
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, message: "Synced" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
