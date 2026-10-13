/**
 * Yoii Jewelry — Google Apps Script Backend
 * ------------------------------------------
 * Cara pakai:
 * 1. Buat Google Spreadsheet baru
 * 2. Extensions → Apps Script → paste kode ini
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy URL Web App, tempel ke script.js (APPS_SCRIPT_URL)
 */

const SHEET_PRODUCTS = "Products";
const SHEET_ORDERS = "Orders";
const SHEET_CUSTOM = "CustomRequests";
const SHEET_SETTINGS = "Settings";

function doGet(e) {
  const action = (e.parameter.action || "products").toLowerCase();
  try {
    if (action === "products") {
      return json_({ ok: true, products: getProducts_(), wa_number: getSetting_("wa_number") });
    }
    return json_({ ok: false, error: "Unknown action" });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = (data.action || "").toLowerCase();

    if (action === "order") {
      const orderId = saveOrder_(data);
      return json_({ ok: true, order_id: orderId });
    }
    if (action === "custom") {
      saveCustom_(data);
      return json_({ ok: true });
    }
    return json_({ ok: false, error: "Unknown action" });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/* ========== PRODUCTS ========== */
function getProducts_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_PRODUCTS);
  if (!sheet) {
    sheet = createProductsSheet_(ss);
  }
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const idx = name => headers.indexOf(name);

  const products = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const active = String(row[idx("active")] || "TRUE").toUpperCase();
    if (active === "FALSE" || active === "0" || active === "NO") continue;

    products.push({
      id: row[idx("id")] || i,
      name: row[idx("name")] || "",
      category: row[idx("category")] || row[idx("cat")] || "",
      price: Number(row[idx("price")]) || 0,
      badge: row[idx("badge")] || "",
      image_url: row[idx("image_url")] || row[idx("img")] || "",
      stock: Number(row[idx("stock")]) || 0,
      description: row[idx("description")] || ""
    });
  }
  return products;
}

function createProductsSheet_(ss) {
  const sheet = ss.insertSheet(SHEET_PRODUCTS);
  const headers = ["id", "name", "category", "price", "badge", "image_url", "stock", "description", "active"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");

  const samples = [
    [1, "Sunny Charm Bracelet", "Bracelet", 89000, "BEST SELLER", "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=700&q=80", 20, "Gelang charm cerah", "TRUE"],
    [2, "Cloudy Day Necklace", "Necklace", 109000, "NEW", "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=700&q=80", 15, "Kalung soft cloud", "TRUE"],
    [3, "Tiny Sparkle Ring", "Ring", 79000, "CUTE!", "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=700&q=80", 25, "Cincin mungil berkilau", "TRUE"],
    [4, "Twinkle Earrings", "Earrings", 99000, "HOT", "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=700&q=80", 18, "Anting twinkle", "TRUE"],
    [5, "Sweet Pearl Bracelet", "Bracelet", 95000, "NEW", "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=700&q=80", 12, "Gelang mutiara manis", "TRUE"],
    [6, "Everyday Necklace", "Necklace", 119000, "FAVE", "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=700&q=80", 10, "Kalung sehari-hari", "TRUE"],
    [7, "Soft Glow Ring", "Ring", 85000, "NEW", "https://images.unsplash.com/photo-1603561596112-db1d2d140b8c?auto=format&fit=crop&w=700&q=80", 22, "Cincin soft glow", "TRUE"],
    [8, "Mini Star Earrings", "Earrings", 89000, "LOVE", "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=700&q=80", 16, "Anting bintang mini", "TRUE"]
  ];
  sheet.getRange(2, 1, samples.length, headers.length).setValues(samples);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
  return sheet;
}

/* ========== ORDERS ========== */
function saveOrder_(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_ORDERS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ORDERS);
    const headers = ["order_id", "timestamp", "customer_name", "phone", "items", "total", "status", "notes"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  const orderId = "YOII-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyMMdd") + "-" +
    Math.random().toString(36).substring(2, 6).toUpperCase();

  const itemsStr = (data.items || [])
    .map(i => `${i.name} x${i.qty} (${i.price})`)
    .join(" | ");

  sheet.appendRow([
    orderId,
    new Date(),
    data.customer_name || "",
    data.phone || "",
    itemsStr,
    Number(data.total) || 0,
    "NEW",
    data.notes || ""
  ]);

  // Optional: kurangi stok
  try { decreaseStock_(data.items || []); } catch (e) { /* ignore */ }

  return orderId;
}

function decreaseStock_(items) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_PRODUCTS);
  if (!sheet) return;
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const idCol = headers.indexOf("id");
  const stockCol = headers.indexOf("stock");
  if (idCol < 0 || stockCol < 0) return;

  for (const item of items) {
    for (let r = 1; r < values.length; r++) {
      if (Number(values[r][idCol]) === Number(item.id)) {
        const current = Number(values[r][stockCol]) || 0;
        const qty = Number(item.qty) || 1;
        sheet.getRange(r + 1, stockCol + 1).setValue(Math.max(0, current - qty));
        break;
      }
    }
  }
}

/* ========== CUSTOM REQUESTS ========== */
function saveCustom_(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_CUSTOM);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_CUSTOM);
    const headers = ["timestamp", "customer_name", "phone", "description", "status"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([
    new Date(),
    data.customer_name || "",
    data.phone || "",
    data.description || "",
    "NEW"
  ]);
}

/* ========== SETTINGS ========== */
function getSetting_(key) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_SETTINGS);
    sheet.getRange(1, 1, 1, 2).setValues([["key", "value"]]).setFontWeight("bold");
    sheet.appendRow(["wa_number", "625979228683"]);
    return "625979228683";
  }
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).toLowerCase() === key.toLowerCase()) {
      return values[i][1];
    }
  }
  return "";
}

/* ========== HELPERS ========== */
function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
