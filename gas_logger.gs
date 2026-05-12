/**
 * 出席オートパイロット ログ記録用 Google Apps Script
 *
 * 【セットアップ手順】
 * 1. Google スプレッドシートを新規作成
 * 2. 拡張機能 → Apps Script を開く
 * 3. このコードを貼り付けて保存
 * 4. デプロイ → 新しいデプロイ → ウェブアプリ
 *    - 実行ユーザー: 自分
 *    - アクセス: 全員
 * 5. 表示されたURLをコピーして index.html の LOG_GAS_URL に設定
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('出席ログ');

    // シートがなければ作成＋ヘッダー追加
    if (!sheet) {
      sheet = ss.insertSheet('出席ログ');
      sheet.appendRow(['タイムスタンプ', '学籍番号', '日付', '時刻', 'OTP', 'UA']);
      sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date(),
      data.studentId || '',
      data.date || '',
      data.time || '',
      data.otp || '',
      data.ua || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GETでのテスト用
function doGet(e) {
  return ContentService
    .createTextOutput('出席ログAPI is running')
    .setMimeType(ContentService.MimeType.TEXT);
}
