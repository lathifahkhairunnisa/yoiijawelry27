/* =========================================================
   Yoii Jewelry — Frontend (Secure)
   APPS_SCRIPT_URL diisi di sini setelah deploy.
   Password admin & nomor WA disimpan di Script Properties Apps Script.
   ========================================================= */
const APPS_SCRIPT_URL = ""; // <-- ISI URL WEB APP APPS SCRIPT DI SINI

const FALLBACK_PRODUCTS = [
  {id:1,name:"Sunny Charm Bracelet",cat:"Bracelet",price:89000,badge:"BEST SELLER",img:"https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=700&q=80",stock:20},
  {id:2,name:"Cloudy Day Necklace",cat:"Necklace",price:109000,badge:"NEW",img:"https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=700&q=80",stock:15},
  {id:3,name:"Tiny Sparkle Ring",cat:"Ring",price:79000,badge:"CUTE!",img:"https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=700&q=80",stock:25},
  {id:4,name:"Twinkle Earrings",cat:"Earrings",price:99000,badge:"HOT",img:"https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=700&q=80",stock:18}
];

let products = [];
let cart = JSON.parse(localStorage.getItem("yoii_cart") || "[]");
let waNumber = "625979228683";
let adminToken = localStorage.getItem("yoii_admin_token") || "";

const money = n => "Rp" + Number(n).toLocaleString("id-ID");
const waLink = t => `https://wa.me/${waNumber}?text=${encodeURIComponent(t)}`;

function setStatus(text, type = "") {
  const el = document.querySelector("#productStatus");
  if (!el) return;
  el.textContent = text;
  el.className = "status-badge" + (type ? " " + type : "");
}

async function api(action, body = {}, method = "POST") {
  if (!APPS_SCRIPT_URL) throw new Error("API belum dikonfigurasi");
  const url = method === "GET" ? `${APPS_SCRIPT_URL}?action=${action}&token=${encodeURIComponent(adminToken)}` : APPS_SCRIPT_URL;
  const opts = { method, headers: { "Content-Type": "text/plain" } };
  if (method === "POST") opts.body = JSON.stringify({ action, token: adminToken, ...body });
  const res = await fetch(url, opts);
  return res.json();
}

async function loadProducts() {
  setStatus("Memuat produk…");
  if (!APPS_SCRIPT_URL) {
    products = FALLBACK_PRODUCTS;
    setStatus("Mode demo (belum hubungkan Sheet)", "err");
    renderProducts();
    return;
  }
  try {
    const data = await api("products", {}, "GET");
    if (data.ok && data.products?.length) {
      products = data.products.map(p => ({
        id: Number(p.id), name: p.name, cat: p.category || p.cat || "Other",
        price: Number(p.price), badge: p.badge || "", img: p.image_url || p.img || "",
        stock: Number(p.stock ?? 99), description: p.description || ""
      }));
      if (data.wa_number) waNumber = String(data.wa_number).replace(/\D/g, "");
      setStatus(`${products.length} produk aktif`, "ok");
    } else throw new Error(data.error || "Data kosong");
  } catch (e) {
    console.warn(e);
    products = FALLBACK_PRODUCTS;
    setStatus("Gagal load Sheet — mode offline", "err");
  }
  renderProducts();
  updateWaLinks();
}

function renderProducts(list) {
  const data = list || products;
  const grid = document.querySelector("#productGrid");
  if (!grid) return;
  grid.innerHTML = data.length ? data.map(p => {
    const out = p.stock <= 0;
    return `<article class="product">
      <div class="product-img">
        <img src="${p.img}" alt="${p.name}" loading="lazy">
        ${p.badge ? `<span class="badge${out ? " out" : ""}">${out ? "HABIS" : p.badge}</span>` : ""}
      </div>
      <div class="product-info">
        <h3>${p.name}</h3><p>${p.cat}</p>
        <div class="product-bottom">
          <b>${money(p.price)}</b>
          <button class="add" onclick="addCart(${p.id})" ${out ? "disabled" : ""}>+</button>
        </div>
      </div>
    </article>`;
  }).join("") : "<p style='grid-column:1/-1;color:var(--muted)'>Belum ada produk.</p>";
}

function saveCart() { localStorage.setItem("yoii_cart", JSON.stringify(cart)); }
window.addCart = id => {
  const p = products.find(x => x.id === id);
  if (!p || p.stock <= 0) return;
  const found = cart.find(x => x.id === id);
  if (found) { if (found.qty >= p.stock) return alert("Stok tidak cukup"); found.qty++; }
  else cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
  saveCart(); renderCart();
};
window.removeCart = id => { cart = cart.filter(x => x.id !== id); saveCart(); renderCart(); };
function renderCart() {
  document.querySelector("#cartCount").textContent = cart.reduce((a, x) => a + x.qty, 0);
  document.querySelector("#cartItems").innerHTML = cart.length
    ? cart.map(x => `<div class="cart-item"><div><b>${x.name}</b><br><small>${money(x.price)} × ${x.qty}</small></div><button onclick="removeCart(${x.id})">Hapus</button></div>`).join("")
    : "<p style='color:var(--muted);padding:20px 0'>Keranjang masih kosong ♡</p>";
  document.querySelector("#cartTotal").textContent = money(cart.reduce((a, x) => a + x.price * x.qty, 0));
}

document.querySelector("#cartBtn").onclick = () => {
  document.querySelector("#cartPanel").classList.add("open");
  document.querySelector("#shade").classList.add("open");
};
function closeCart() {
  document.querySelector("#cartPanel").classList.remove("open");
  document.querySelector("#shade").classList.remove("open");
}
document.querySelector("#closeCart").onclick = closeCart;
document.querySelector("#shade").onclick = closeCart;

document.querySelector("#checkoutBtn").onclick = () => {
  if (!cart.length) return alert("Keranjang masih kosong.");
  closeCart();
  document.querySelector("#coTotal").textContent = money(cart.reduce((a, x) => a + x.price * x.qty, 0));
  document.querySelector("#checkoutOverlay").classList.add("open");
};

document.querySelector("#checkoutForm").onsubmit = async e => {
  e.preventDefault();
  const name = document.querySelector("#coName").value.trim();
  const phone = document.querySelector("#coPhone").value.trim();
  const notes = document.querySelector("#coNotes").value.trim();
  const total = cart.reduce((a, x) => a + x.price * x.qty, 0);
  const items = cart.map(x => ({ id: x.id, name: x.name, price: x.price, qty: x.qty }));
  let orderId = "YOII-" + Date.now().toString(36).toUpperCase();
  try {
    const data = await api("order", { customer_name: name, phone, items, total, notes });
    if (data.ok && data.order_id) orderId = data.order_id;
  } catch (err) { console.warn(err); }
  const msg = `Halo kak, saya mau pesan:\n\n*Order ID: ${orderId}*\nNama: ${name}\nWA: ${phone}\n\nItems:\n${items.map(x => `${x.name} (${x.qty}x)`).join(", ")}\n\nTotal: ${money(total)}${notes ? "\nCatatan: " + notes : ""}`;
  cart = []; saveCart(); renderCart();
  document.querySelector("#checkoutOverlay").classList.remove("open");
  document.querySelector("#checkoutForm").reset();
  window.open(waLink(msg), "_blank");
};

document.querySelector("#openCustomForm").onclick = () => document.querySelector("#customOverlay").classList.add("open");
document.querySelector("#customForm").onsubmit = async e => {
  e.preventDefault();
  const name = document.querySelector("#cuName").value.trim();
  const phone = document.querySelector("#cuPhone").value.trim();
  const desc = document.querySelector("#cuDesc").value.trim();
  try { await api("custom", { customer_name: name, phone, description: desc }); } catch (err) {}
  const msg = `Halo kak, saya mau *custom jewelry*:\n\nNama: ${name}\nWA: ${phone}\n\nRequest:\n${desc}`;
  document.querySelector("#customOverlay").classList.remove("open");
  document.querySelector("#customForm").reset();
  window.open(waLink(msg), "_blank");
};

/* Search */
const searchOverlay = document.querySelector("#searchOverlay");
document.querySelector("#searchBtn").onclick = () => { searchOverlay.classList.add("open"); setTimeout(() => document.querySelector("#searchInput").focus(), 100); };
document.querySelector("#searchInput").oninput = e => {
  const q = e.target.value.toLowerCase().trim();
  const box = document.querySelector("#searchResults");
  if (!q) { box.innerHTML = ""; return; }
  const hits = products.filter(p => p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q));
  box.innerHTML = hits.map(p => `<div class="search-result" onclick="addCart(${p.id});searchOverlay.classList.remove('open')"><span><b>${p.name}</b><br><small>${p.cat} · ${money(p.price)}</small></span><span>+</span></div>`).join("") || "<p style='color:var(--muted)'>Tidak ditemukan</p>";
};

document.querySelectorAll("[data-filter]").forEach(b => {
  b.onclick = () => {
    document.querySelectorAll("[data-filter]").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    const f = b.dataset.filter;
    renderProducts(f === "all" ? products : products.filter(p => p.cat === f));
  };
});

/* Slider */
const slides = [...document.querySelectorAll(".slide")];
const dots = document.querySelector(".dots");
let current = 0, timer;
slides.forEach((_, i) => { const b = document.createElement("button"); b.onclick = () => show(i); dots.appendChild(b); });
function show(i) {
  slides[current].classList.remove("active"); dots.children[current].classList.remove("active");
  current = (i + slides.length) % slides.length;
  slides[current].classList.add("active"); dots.children[current].classList.add("active");
  clearInterval(timer); timer = setInterval(() => show(current + 1), 4500);
}
document.querySelector(".next").onclick = () => show(current + 1);
document.querySelector(".prev").onclick = () => show(current - 1);
show(0);

document.querySelector(".menu-btn").onclick = () => document.querySelector(".nav").classList.toggle("open");
document.querySelectorAll(".nav a").forEach(a => a.onclick = () => document.querySelector(".nav").classList.remove("open"));
document.querySelectorAll("[data-close]").forEach(btn => btn.onclick = () => document.getElementById(btn.dataset.close).classList.remove("open"));
document.querySelectorAll(".overlay").forEach(ov => ov.addEventListener("click", e => { if (e.target === ov) ov.classList.remove("open"); }));

function updateWaLinks() {
  document.querySelector("#waFloat").href = waLink("Halo kak, aku mau tanya soal Yoii Jewelry ♡");
}

/* ========== ADMIN ========== */
document.querySelector("#adminBtn").onclick = e => {
  e.preventDefault();
  if (adminToken) openAdminPanel();
  else document.querySelector("#adminLoginOverlay").classList.add("open");
};

document.querySelector("#adminLoginForm").onsubmit = async e => {
  e.preventDefault();
  const pass = document.querySelector("#adminPass").value;
  try {
    const data = await api("login", { password: pass });
    if (data.ok && data.token) {
      adminToken = data.token;
      localStorage.setItem("yoii_admin_token", adminToken);
      document.querySelector("#adminLoginOverlay").classList.remove("open");
      openAdminPanel();
    } else alert("Password salah");
  } catch (err) { alert("Gagal login. Pastikan API sudah dikonfigurasi."); }
};

async function openAdminPanel() {
  document.querySelector("#adminPanelOverlay").classList.add("open");
  await loadAdminData();
  renderAdminTab("products");
}

let adminData = { products: [], orders: [], customs: [], settings: {} };
async function loadAdminData() {
  try {
    const data = await api("admin", {}, "GET");
    if (data.ok) adminData = data;
  } catch (e) { console.warn(e); }
}

document.querySelectorAll(".admin-tabs .tab").forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll(".admin-tabs .tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    renderAdminTab(tab.dataset.tab);
  };
});

function renderAdminTab(tab) {
  const box = document.querySelector("#adminContent");
  if (tab === "products") box.innerHTML = renderProductsAdmin();
  if (tab === "orders") box.innerHTML = renderOrdersAdmin();
  if (tab === "customs") box.innerHTML = renderCustomsAdmin();
  if (tab === "settings") box.innerHTML = renderSettingsAdmin();
}

function renderProductsAdmin() {
  const rows = (adminData.products || []).map(p => `
    <tr>
      <td>${p.id}</td><td>${p.name}</td><td>${p.category}</td><td>${money(p.price)}</td><td>${p.stock}</td>
      <td><button onclick="editProduct(${p.id})">Edit</button><button onclick="delProduct(${p.id})">Hapus</button></td>
    </tr>`).join("");
  return `
    <div class="admin-form">
      <strong>Tambah Produk</strong>
      <input id="pName" placeholder="Nama">
      <input id="pCat" placeholder="Kategori (Bracelet/Necklace/Ring/Earrings)">
      <input id="pPrice" type="number" placeholder="Harga">
      <input id="pStock" type="number" placeholder="Stok">
      <input id="pImg" placeholder="URL Gambar">
      <input id="pBadge" placeholder="Badge (opsional)">
      <button class="btn primary" onclick="createProduct()">Tambah</button>
    </div>
    <table class="admin-table"><thead><tr><th>ID</th><th>Nama</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Aksi</th></tr></thead><tbody>${rows}</tbody></table>`;
}

window.createProduct = async () => {
  const payload = {
    name: document.querySelector("#pName").value,
    category: document.querySelector("#pCat").value,
    price: document.querySelector("#pPrice").value,
    stock: document.querySelector("#pStock").value,
    image_url: document.querySelector("#pImg").value,
    badge: document.querySelector("#pBadge").value
  };
  await api("product_create", payload);
  await loadAdminData(); renderAdminTab("products"); loadProducts();
};

window.delProduct = async id => {
  if (!confirm("Hapus produk?")) return;
  await api("product_delete", { id });
  await loadAdminData(); renderAdminTab("products"); loadProducts();
};

window.editProduct = id => {
  const p = adminData.products.find(x => x.id == id);
  if (!p) return;
  const name = prompt("Nama", p.name);
  const price = prompt("Harga", p.price);
  const stock = prompt("Stok", p.stock);
  if (name === null) return;
  api("product_update", { id, name, price, stock, category: p.category, image_url: p.image_url, badge: p.badge, active: true })
    .then(() => { loadAdminData().then(() => renderAdminTab("products")); loadProducts(); });
};

function renderOrdersAdmin() {
  const rows = (adminData.orders || []).map(o => `
    <tr>
      <td>${o.order_id}</td><td>${o.customer_name}</td><td>${o.phone}</td><td>${money(o.total)}</td><td>${o.status}</td>
      <td><button onclick="updateOrderStatus('${o.order_id}')">Status</button><button onclick="delOrder('${o.order_id}')">Hapus</button></td>
    </tr>`).join("");
  return `<table class="admin-table"><thead><tr><th>Order ID</th><th>Nama</th><th>WA</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${rows}</tbody></table>`;
}

window.updateOrderStatus = async order_id => {
  const status = prompt("Status baru (NEW / PAID / SHIPPED / DONE)", "PAID");
  if (!status) return;
  await api("order_update", { order_id, status });
  await loadAdminData(); renderAdminTab("orders");
};
window.delOrder = async order_id => {
  if (!confirm("Hapus order?")) return;
  await api("order_delete", { order_id });
  await loadAdminData(); renderAdminTab("orders");
};

function renderCustomsAdmin() {
  const rows = (adminData.customs || []).map(c => `
    <tr>
      <td>${c.customer_name}</td><td>${c.phone}</td><td>${(c.description || "").slice(0, 40)}...</td><td>${c.status}</td>
      <td><button onclick="updateCustomStatus('${c.timestamp}')">Status</button></td>
    </tr>`).join("");
  return `<table class="admin-table"><thead><tr><th>Nama</th><th>WA</th><th>Deskripsi</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${rows}</tbody></table>`;
}

window.updateCustomStatus = async timestamp => {
  const status = prompt("Status baru", "DONE");
  if (!status) return;
  await api("custom_update", { timestamp, status });
  await loadAdminData(); renderAdminTab("customs");
};

function renderSettingsAdmin() {
  return `
    <div class="admin-form">
      <label>Nomor WhatsApp</label>
      <input id="setWa" value="${adminData.settings?.wa_number || ""}">
      <button class="btn primary" onclick="saveSettings()">Simpan</button>
    </div>
    <p style="font-size:13px;color:var(--muted)">Password admin disimpan di Script Properties Apps Script (key: ADMIN_PASSWORD).</p>`;
}

window.saveSettings = async () => {
  await api("settings_update", { wa_number: document.querySelector("#setWa").value });
  alert("Tersimpan");
  await loadAdminData();
};

/* Init */
renderCart();
loadProducts();
updateWaLinks();
