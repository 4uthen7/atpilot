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

const SPREADSHEET_ID = '18-6y_MSpZbXqiYHgpHHk-TDacfy_skm_tG6h-IxaADk';
const SHEET_NAME = '出席ログ';
const HEADERS = [
  'タイムスタンプ', '学籍番号', '日付', '時刻', 'OTP',
  'IPアドレス', 'User-Agent', 'プラットフォーム',
  '言語', '全言語', '画面解像度', 'ウィンドウサイズ',
  'ピクセル比', 'タイムゾーン', 'TZオフセット',
  'オンライン', 'Cookie有効', 'CPUコア数', 'メモリ(GB)',
  '接続種別', '下り速度', 'RTT',
  'リファラー', 'タッチ対応', 'ベンダー', 'Unix(ms)'
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sheet.getRange(1, 1, 1, HEADERS.length)
        .setFontWeight('bold')
        .setBackground('#d9ead3');
      sheet.setFrozenRows(1);
    }

    const cn = data.connection || {};
    sheet.appendRow([
      new Date(),
      data.studentId || '',
      data.date || '',
      data.time || '',
      data.otp || '',
      data.ip || '',
      data.ua || '',
      data.platform || '',
      data.language || '',
      data.languages || '',
      data.screen || '',
      data.windowSize || '',
      data.pixelRatio || '',
      data.timezone || '',
      data.tzOffset != null ? data.tzOffset : '',
      data.online != null ? data.online : '',
      data.cookieEnabled != null ? data.cookieEnabled : '',
      data.cores || '',
      data.memory || '',
      cn.type || '',
      cn.downlink || '',
      cn.rtt || '',
      data.referrer || '',
      data.touchSupport != null ? data.touchSupport : '',
      data.vendor || '',
      data.unixMs || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput('出席ログAPI is running')
    .setMimeType(ContentService.MimeType.TEXT);
}
