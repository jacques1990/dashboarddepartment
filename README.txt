LIFE CITY GOOGLE SYNC NOTES

Files included:
- neon-notes.html
- galaxy-style.css
- brain-core.js
- memory-vault.json
- google-apps-script.gs

SETUP
1. Put all files in the same folder.
2. Open neon-notes.html in your browser.
3. In Google Sheets, create columns:
   ID | Title | Content | Date | Department | Todos | Table
4. Open Extensions > Apps Script in that sheet.
5. Paste the contents of google-apps-script.gs into Apps Script.
6. Deploy as Web App:
   - Execute as: Me
   - Who has access: Anyone
7. Copy the Web App URL.
8. Open brain-core.js and replace:
   PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE
   with your real Web App URL.
9. Save a note. It will save locally and sync to Google Sheets.

NOTES
- LocalStorage is the live memory inside the browser.
- memory-vault.json is your backup/export file.
- Current sync mode appends a new row on each save.
