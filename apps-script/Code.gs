/**
 * Yoii Jewelry — Google Apps Script Backend (Secure)
 * Password admin & nomor WA disimpan di Script Properties (bukan di kode).
 *
 * Cara set Script Properties:
 * Project Settings → Script Properties → Add property
 * - ADMIN_PASSWORD = Bismillaah
 * - WA_NUMBER = 625979228683
 */

const SHEET_PRODUCTS = "Products";
const SHEET_ORDERS = "Orders";
const SHEET_CUSTOM = "CustomRequests";
const SHEET_SETTINGS = "Settings";

function getProp_(key, fallback = "") {
  return PropertiesService.getScriptProperties().getProperty(key) || fallback;
}

function doGet(e) {
  const action = (e.parameter.action || "products").toLowerCase();
  const token = e.parameter.token || "";

  try {
    if (action === "products") {
      return json_({ ok: true, products: getProducts_(), wa_number: getProp_("WA_NUMBER", "625979228683") });
    }
    if (action === "admin" && isAdmin_(token)) {
      return json_({
        ok: true,
        products: getProducts_(true),
        orders: getOrders_(),
        customs: getCustoms_(),
        settings: getSettings_()
      });
    }
    return json_({ ok: false, error: "Unauthorized or unknown action" });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || "{}");
    const action = (data.action || "").toLowerCase();
    const token = data.token || "";

    if (action === "order") {
      const orderId = saveOrder_(data);
      return json_({ ok: true, order_id: orderId });
    }
    if (action === "custom") {
      saveCustom_(data);
      return json_({ ok: true });
    }
    if (action === "login") {
      const ok = isAdmin_(data.password);
      return json_({ ok, token: ok ? generateToken_() : null });
    }

    // Admin CRUD (perlu token)
    if (!isAdmin_(token)) return json_({ ok: false, error: "Unauthorized" });

    if (action === "product_create") return json_({ ok: true, id: createProduct_(data) });
    if (action === "product_update") return json_({ ok: updateProduct_(data) });
    if (action === "product_delete") return json_({ ok: deleteProduct_(data.id) });

    if (action === "order_update") return json_({ ok: updateOrder_(data) });
    if (action === "order_delete") return json_({ ok: deleteOrder_(data.order_id) });

    if (action === "custom_update") return json_({ ok: updateCustom_(data) });
    if (action === "custom_delete") return json_({ ok: deleteCustom_(data.timestamp) });

    if (action === "settings_update") return json_({ ok: updateSettings_(data) });

    return json_({ ok: false, error: "Unknown action" });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/* ========== AUTH ========== */
function isAdmin_(input) {
  const password = getProp_("ADMIN_PASSWORD", "Bismillaah");
  if (input === password) return true;
  // simple token check (stored temporarily)
  const props = PropertiesService.getScriptProperties();
  return props.getProperty("ADMIN_TOKEN") === input;
}

function generateToken_() {
  const token = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperty("ADMIN_TOKEN", token);
  return token;
}

/* ========== PRODUCTS ========== */
function getProducts_(includeInactive = false) {
  const sheet = getOrCreateSheet_(SHEET_PRODUCTS, [
    "id", "name", "category", "price", "badge", "image_url", "stock", "description", "active"
  ], getSampleProducts_());

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const idx = name => headers.indexOf(name);

  const products = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const active = String(row[idx("active")] || "TRUE").toUpperCase();
    if (!includeInactive && (active === "FALSE" || active === "0" || active === "NO")) continue;

    products.push({
      id: row[idx("id")] || i,
      name: row[idx("name")] || "",
      category: row[idx("category")] || "",
      price: Number(row[idx("price")]) || 0,
      badge: row[idx("badge")] || "",
      image_url: row[idx("image_url")] || "",
      stock: Number(row[idx("stock")]) || 0,
      description: row[idx("description")] || "",
      active: active === "TRUE" || active === "1" || active === "YES"
    });
  }
  return products;
}

function getSampleProducts_() {
  return [
    [1, "Sunny Charm Bracelet", "Bracelet", 89000, "BEST SELLER", "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=700&q=80", 20, "Gelang charm cerah", "TRUE"],
    [2, "Cloudy Day Necklace", "Necklace", 109000, "NEW", "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=700&q=80", 15, "Kalung soft cloud", "TRUE"],
    [3, "Tiny Sparkle Ring", "Ring", 79000, "CUTE!", "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=700&q=80", 25, "Cincin mungil berkilau", "TRUE"],
    [4, "Twinkle Earrings", "Earrings", 99000, "HOT", "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=700&q=80", 18, "Anting twinkle", "TRUE"]
  ];
}

function createProduct_(data) {
  const sheet = getOrCreateSheet_(SHEET_PRODUCTS);
  const id = Date.now();
  sheet.appendRow([
    id, data.name || "", data.category || "", Number(data.price) || 0,
    data.badge || "", data.image_url || "", Number(data.stock) || 0,
    data.description || "", data.active !== false ? "TRUE" : "FALSE"
  ]);
  return id;
}

function updateProduct_(data) {
  return updateRowById_(SHEET_PRODUCTS, "id", data.id, {
    name: data.name, category: data.category, price: data.price,
    badge: data.badge, image_url: data.image_url, stock: data.stock,
    description: data.description, active: data.active ? "TRUE" : "FALSE"
  });
}

function deleteProduct_(id) {
  return deleteRowById_(SHEET_PRODUCTS, "id", id);
}

/* ========== ORDERS ========== */
function getOrders_() {
  const sheet = getOrCreateSheet_(SHEET_ORDERS, [
    "order_id", "timestamp", "customer_name", "phone", "items", "total", "status", "notes"
  ]);
  return sheetToObjects_(sheet);
}

function saveOrder_(data) {
  const sheet = getOrCreateSheet_(SHEET_ORDERS);
  const orderId = "YOII-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyMMdd") + "-" +
    Math.random().toString(36).substring(2, 6).toUpperCase();

  const itemsStr = (data.items || []).map(i => `${i.name} x${i.qty}`).join(" | ");
  sheet.appendRow([
    orderId, new Date(), data.customer_name || "", data.phone || "",
    itemsStr, Number(data.total) || 0, "NEW", data.notes || ""
  ]);
  try { decreaseStock_(data.items || []); } catch (e) {}
  return orderId;
}

function updateOrder_(data) {
  return updateRowById_(SHEET_ORDERS, "order_id", data.order_id, {
    status: data.status, notes: data.notes
  });
}

function deleteOrder_(orderId) {
  return deleteRowById_(SHEET_ORDERS, "order_id", orderId);
}

/* ========== CUSTOM ========== */
function getCustoms_() {
  const sheet = getOrCreateSheet_(SHEET_CUSTOM, [
    "timestamp", "customer_name", "phone", "description", "status"
  ]);
  return sheetToObjects_(sheet);
}

function saveCustom_(data) {
  const sheet = getOrCreateSheet_(SHEET_CUSTOM);
  sheet.appendRow([new Date(), data.customer_name || "", data.phone || "", data.description || "", "NEW"]);
}

function updateCustom_(data) {
  return updateRowById_(SHEET_CUSTOM, "timestamp", data.timestamp, { status: data.status });
}

function deleteCustom_(timestamp) {
  return deleteRowById_(SHEET_CUSTOM, "timestamp", timestamp);
}

/* ========== SETTINGS ========== */
function getSettings_() {
  return {
    wa_number: getProp_("WA_NUMBER", "625979228683")
  };
}

function updateSettings_(data) {
  if (data.wa_number) {
    PropertiesService.getScriptProperties().setProperty("WA_NUMBER", String(data.wa_number).replace(/\D/g, ""));
  }
  return true;
}

/* ========== HELPERS ========== */
function getOrCreateSheet_(name, headers, sampleRows) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
      sheet.setFrozenRows(1);
      if (sampleRows) sheet.getRange(2, 1, sampleRows.length, headers.length).setValues(sampleRows);
    }
  }
  return sheet;
}

function sheetToObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(h => String(h).toLowerCase().trim());
  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function updateRowById_(sheetName, idCol, idValue, updates) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return false;
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const idIdx = headers.indexOf(idCol.toLowerCase());
  if (idIdx < 0) return false;

  for (let r = 1; r < values.length; r++) {
    if (String(values[r][idIdx]) === String(idValue)) {
      Object.keys(updates).forEach(key => {
        const col = headers.indexOf(key.toLowerCase());
        if (col >= 0) sheet.getRange(r + 1, col + 1).setValue(updates[key]);
      });
      return true;
    }
  }
  return false;
}

function deleteRowById_(sheetName, idCol, idValue) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return false;
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h).toLowerCase().trim());
  const idIdx = headers.indexOf(idCol.toLowerCase());
  if (idIdx < 0) return false;

  for (let r = values.length - 1; r >= 1; r--) {
    if (String(values[r][idIdx]) === String(idValue)) {
      sheet.deleteRow(r + 1);
      return true;
    }
  }
  return false;
}

function decreaseStock_(items) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PRODUCTS);
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
        sheet.getRange(r + 1, stockCol + 1).setValue(Math.max(0, current - (Number(item.qty) || 1)));
        break;
      }
    }
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
