const Promise = require('aigle');
const { google } = require('googleapis');

const GoogleAuth = require('./google_auth');
const Sheet = require('./sheet');

// New google sheets v4
const sheets = google.sheets('v4');
Promise.promisifyAll(sheets.spreadsheets);

class I18nextSpreadsheet {
  constructor({ credentials, spreadsheetId, localesPath, localesDone, newline }) {
    this.credentials = credentials;
    this.spreadsheetId = spreadsheetId;
    this.localesPath = localesPath;
    this.localesDone = localesDone;
    this.newline = newline;
    this.sheets = [];
  }

  async start() {
    await this.authorize();
    await this.getSheets();
    await this.getSheetsHeadersAndRows();
    await this.convertSheetsRowsToLocalesMap();
    await this.writeSheetsLocalesMapToFiles();
  }

  async authorize() {
    const googleAuth = new GoogleAuth(this.credentials);
    this.auth = await googleAuth.authorize();
  }

  async getSheets() {
    const { auth, spreadsheetId, localesPath, newline, localesDone } = this;

    const resp = await sheets.spreadsheets.getAsync({
      auth,
      spreadsheetId,
    });

    const lsd = (localesDone)?localesDone.split(','):null;

    for (let sheetInfo of resp.data.sheets) {
      this.sheets.push(
        new Sheet({ sheetInfo, auth, spreadsheetId, localesPath, newline, localesDone })
      );
    }
  }

  async getSheetsHeadersAndRows() {
    await Promise.resolve(this.sheets).map(sheet => sheet.getHeadersAndRows());
  }

  async convertSheetsRowsToLocalesMap() {
    await Promise.resolve(this.sheets).map(sheet =>
      sheet.convertRowsToLocalesMap()
    );
  }

  async writeSheetsLocalesMapToFiles() {
    await Promise.resolve(this.sheets).map(sheet =>
      sheet.writeLocalesMapToFiles()
    );
  }
}

module.exports = I18nextSpreadsheet;
