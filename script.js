/* =========================================================
   Yoii Jewelry — Frontend
   Ganti APPS_SCRIPT_URL setelah deploy Google Apps Script
   ========================================================= */
const https://script.google.com/macros/s/AKfycbwwH08fulxm1876pV9LCAV-hm_HzqvptRquooeF2Tp47QA6-a1FBMqV6E6sPai5Avrk/exec = ""; // <-- ISI SETELAH DEPLOY (lihat README)

const FALLBACK_PRODUCTS = [
  {id:1,name:"Sunny Charm Bracelet",cat:"Bracelet",price:89000,badge:"BEST SELLER",img:"https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=700&q=80",stock:20},
  {id:2,name:"Cloudy Day Necklace",cat:"Necklace",price:109000,badge:"NEW",img:"https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=700&q=80",stock:15},
  {id:3,name:"Tiny Sparkle Ring",cat:"Ring",price:79000,badge:"CUTE!",img:"https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=700&q=80",stock:25},
  {id:4,name:"Twinkle Earrings",cat:"Earrings",price:99000,badge:"HOT",img:"https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=700&q=80",stock:18},
  {id:5,name:"Sweet Pearl Bracelet",cat:"Bracelet",price:95000,badge:"NEW",img:"https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=700&q=80",stock:12},
  {id:6,name:"Everyday Necklace",cat:"Necklace",price:119000,badge:"FAVE",img:"https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=700&q=80",stock:10},
  {id:7,name:"Soft Glow Ring",cat:"Ring",price:85000,badge:"NEW",img:"https://images.unsplash.com/photo-1603561596112-db1d2d140b8c?auto=format&fit=crop&w=700&q=80",stock:22},
  {id:8,name:"Mini Star Earrings",cat:"Earrings",price:89000,badge:"LOVE",img:"https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=700&q=80",stock:16}
];

const DEFAULT_WA = "625979228683";
let products = [];
let cart = JSON.parse(localStorage.getItem("yoii_cart") || "[]");
let waNumber = DEFAULT_WA;

const money = n => "Rp" + Number(n).toLocaleString("id-ID");
const waLink = t => `https://wa.me/${waNumber}?text=${encodeURIComponent(t)}`;

/* ---------- Status UI ---------- */
function setStatus(text, type = "") {
  const el = document.querySelector("#productStatus");
  if (!el) return;
  el.textContent = text;
  el.className = "status-badge" + (type ? " " + type : "");
}

/* ---------- Load Products ---------- */
async function loadProducts() {
  setStatus("Memuat produk…");
  if (!APPS_SCRIPT_URL) {
    products = FALLBACK_PRODUCTS;
    setStatus("Mode demo (belum hubungkan Sheet)", "err");
    renderProducts();
    return;
  }
  try {
    const res = await fetch(APPS_SCRIPT_URL + "?action=products", { cache: "no-store" });
    const data = await res.json();
    if (data.ok && Array.isArray(data.products) && data.products.length) {
      products = data.products.map(p => ({
        id: Number(p.id),
        name: p.name,
        cat: p.category || p.cat || "Other",
        price: Number(p.price),
        badge: p.badge || "",
        img: p.image_url || p.img || "",
        stock: Number(p.stock ?? 99),
        description: p.description || ""
      }));
      if (data.wa_number) waNumber = String(data.wa_number).replace(/\D/g, "");
      setStatus(`${products.length} produk aktif`, "ok");
    } else {
      throw new Error(data.error || "Data kosong");
    }
  } catch (e) {
    console.warn("Gagal load dari Sheet, pakai fallback:", e);
    products = FALLBACK_PRODUCTS;
    setStatus("Gagal load Sheet — mode offline", "err");
  }
  renderProducts();
  updateWaLinks();
}

/* ---------- Render Products ---------- */
function renderProducts(list) {
  const data = list || products;
  const grid = document.querySelector("#productGrid");
  if (!grid) return;
  if (!data.length) {
    grid.innerHTML = "<p style='grid-column:1/-1;color:var(--muted)'>Belum ada produk.</p>";
    return;
  }
  grid.innerHTML = data.map(p => {
    const out = p.stock <= 0;
    return `<article class="product">
      <div class="product-img">
        <img src="${p.img}" alt="${p.name}" loading="lazy">
        ${p.badge ? `<span class="badge${out ? " out" : ""}">${out ? "HABIS" : p.badge}</span>` : (out ? `<span class="badge out">HABIS</span>` : "")}
      </div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <p>${p.cat}</p>
        <div class="product-bottom">
          <b>${money(p.price)}</b>
          <button class="add" onclick="addCart(${p.id})" ${out ? "disabled" : ""} aria-label="Tambah ${p.name}">+</button>
        </div>
      </div>
    </article>`;
  }).join("");
}

/* ---------- Cart ---------- */
function saveCart() {
  localStorage.setItem("yoii_cart", JSON.stringify(cart));
}
window.addCart = id => {
  const p = products.find(x => x.id === id);
  if (!p || p.stock <= 0) return;
  const found = cart.find(x => x.id === id);
  if (found) {
    if (found.qty >= p.stock) return alert("Stok tidak cukup");
    found.qty++;
  } else {
    cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
  }
  saveCart();
  renderCart();
};
window.removeCart = id => {
  cart = cart.filter(x => x.id !== id);
  saveCart();
  renderCart();
};
function renderCart() {
  document.querySelector("#cartCount").textContent = cart.reduce((a, x) => a + x.qty, 0);
  document.querySelector("#cartItems").innerHTML = cart.length
    ? cart.map(x => `<div class="cart-item">
        <div><b>${x.name}</b><br><small>${money(x.price)} × ${x.qty}</small></div>
        <button onclick="removeCart(${x.id})">Hapus</button>
      </div>`).join("")
    : "<p style='color:var(--muted);padding:20px 0'>Keranjang masih kosong ♡</p>";
  document.querySelector("#cartTotal").textContent = money(cart.reduce((a, x) => a + x.price * x.qty, 0));
}

/* ---------- Cart Panel ---------- */
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

/* ---------- Checkout ---------- */
document.querySelector("#checkoutBtn").onclick = () => {
  if (!cart.length) return alert("Keranjang masih kosong.");
  closeCart();
  document.querySelector("#coTotal").textContent = money(cart.reduce((a, x) => a + x.price * x.qty, 0));
  document.querySelector("#checkoutOverlay").classList.add("open");
};

document.querySelector("#checkoutForm").onsubmit = async e => {
  e.preventDefault();
  const btn = document.querySelector("#coSubmit");
  const name = document.querySelector("#coName").value.trim();
  const phone = document.querySelector("#coPhone").value.trim();
  const notes = document.querySelector("#coNotes").value.trim();
  if (!name || !phone) return;

  const total = cart.reduce((a, x) => a + x.price * x.qty, 0);
  const items = cart.map(x => ({ id: x.id, name: x.name, price: x.price, qty: x.qty }));
  const itemsText = cart.map(x => `${x.name} (${x.qty}x)`).join(", ");

  btn.disabled = true;
  btn.textContent = "Menyimpan…";

  let orderId = "YOII-" + Date.now().toString(36).toUpperCase();

  if (APPS_SCRIPT_URL) {
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "order",
          customer_name: name,
          phone,
          items,
          total,
          notes
        })
      });
      const data = await res.json();
      if (data.ok && data.order_id) orderId = data.order_id;
    } catch (err) {
      console.warn("Gagal simpan order ke Sheet:", err);
    }
  }

  const msg = `Halo kak, saya mau pesan:\n\n*Order ID: ${orderId}*\nNama: ${name}\nWA: ${phone}\n\nItems:\n${itemsText}\n\nTotal: ${money(total)}${notes ? "\nCatatan: " + notes : ""}\n\nTerima kasih ♡`;
  cart = [];
  saveCart();
  renderCart();
  document.querySelector("#checkoutOverlay").classList.remove("open");
  document.querySelector("#checkoutForm").reset();
  btn.disabled = false;
  btn.textContent = "Kirim & Chat WA";
  window.open(waLink(msg), "_blank");
};

/* ---------- Custom Form ---------- */
document.querySelector("#openCustomForm").onclick = () => {
  document.querySelector("#customOverlay").classList.add("open");
};
document.querySelector("#customForm").onsubmit = async e => {
  e.preventDefault();
  const btn = document.querySelector("#cuSubmit");
  const name = document.querySelector("#cuName").value.trim();
  const phone = document.querySelector("#cuPhone").value.trim();
  const desc = document.querySelector("#cuDesc").value.trim();
  if (!name || !phone || !desc) return;

  btn.disabled = true;
  btn.textContent = "Mengirim…";

  if (APPS_SCRIPT_URL) {
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "custom",
          customer_name: name,
          phone,
          description: desc
        })
      });
    } catch (err) {
      console.warn("Gagal simpan custom:", err);
    }
  }

  const msg = `Halo kak, saya mau *custom jewelry*:\n\nNama: ${name}\nWA: ${phone}\n\nRequest:\n${desc}\n\nTerima kasih ♡`;
  document.querySelector("#customOverlay").classList.remove("open");
  document.querySelector("#customForm").reset();
  btn.disabled = false;
  btn.textContent = "Kirim Request";
  window.open(waLink(msg), "_blank");
};

/* ---------- Search ---------- */
const searchOverlay = document.querySelector("#searchOverlay");
document.querySelector("#searchBtn").onclick = () => {
  searchOverlay.classList.add("open");
  setTimeout(() => document.querySelector("#searchInput").focus(), 100);
};
document.querySelector("#searchInput").oninput = e => {
  const q = e.target.value.toLowerCase().trim();
  const box = document.querySelector("#searchResults");
  if (!q) { box.innerHTML = ""; return; }
  const hits = products.filter(p =>
    p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q)
  );
  box.innerHTML = hits.length
    ? hits.map(p => `<div class="search-result" onclick="addCart(${p.id});searchOverlay.classList.remove('open')">
        <span><b>${p.name}</b><br><small>${p.cat} · ${money(p.price)}</small></span>
        <span>+</span>
      </div>`).join("")
    : "<p style='color:var(--muted);padding:8px 0'>Tidak ditemukan</p>";
};

/* ---------- Filters ---------- */
document.querySelectorAll("[data-filter]").forEach(b => {
  b.onclick = () => {
    document.querySelectorAll("[data-filter]").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    const f = b.dataset.filter;
    renderProducts(f === "all" ? products : products.filter(p => p.cat === f));
    document.querySelector("#products").scrollIntoView({ behavior: "smooth" });
  };
});

/* ---------- Slider ---------- */
const slides = [...document.querySelectorAll(".slide")];
const dots = document.querySelector(".dots");
let current = 0, timer;
slides.forEach((_, i) => {
  const b = document.createElement("button");
  b.onclick = () => show(i);
  dots.appendChild(b);
});
function show(i) {
  slides[current].classList.remove("active");
  dots.children[current].classList.remove("active");
  current = (i + slides.length) % slides.length;
  slides[current].classList.add("active");
  dots.children[current].classList.add("active");
  clearInterval(timer);
  timer = setInterval(() => show(current + 1), 4500);
}
document.querySelector(".next").onclick = () => show(current + 1);
document.querySelector(".prev").onclick = () => show(current - 1);
show(0);

/* ---------- Mobile Menu ---------- */
document.querySelector(".menu-btn").onclick = () =>
  document.querySelector(".nav").classList.toggle("open");
document.querySelectorAll(".nav a").forEach(a =>
  a.onclick = () => document.querySelector(".nav").classList.remove("open")
);

/* ---------- Close overlays ---------- */
document.querySelectorAll("[data-close]").forEach(btn => {
  btn.onclick = () => document.getElementById(btn.dataset.close).classList.remove("open");
});
document.querySelectorAll(".overlay").forEach(ov => {
  ov.addEventListener("click", e => { if (e.target === ov) ov.classList.remove("open"); });
});

/* ---------- i18n ---------- */
const translations = {
  en: {
    home: "Home", collection: "Collection", promo: "Promo", custom: "Custom", about: "About",
    eyebrow: "ACCESSORIES FOR YOUR EVERYDAY SPARKLE ✦",
    heroTitle: "Little details,<br><em>big sparkle.</em>",
    heroText: "Sweet accessories made to brighten your day. Pick your favorite or customize it your way.",
    shopNow: "Shop Now", makeCustom: "Make It Custom",
    cute: "Cute Design", customizable: "Customizable", gift: "Gift Ready",
    discover: "DISCOVER YOUR FAVORITES", pick: "Pick your sparkle ✦", seeAll: "See All →",
    best: "Best sellers",
    promoTitle: "More sparkle,<br>more happy.",
    promoText: "Discover special offers and sweet surprises for your order.",
    grab: "Grab the Deal",
    customTitle: "Your idea, your jewelry ♡",
    customText: "Want a special color, name, or detail? Tell us your idea and let's make it happen.",
    chatCustom: "Request Custom",
    aboutTitle: "Small accessories,<br>happy little moments.",
    aboutText: "Yoii Jewelry brings playful, minimal accessories into your everyday style, because tiny details can make a day feel special.",
    searchTitle: "Search accessories", yourCart: "Your cart", checkout: "Checkout"
  },
  id: {
    home: "Home", collection: "Koleksi", promo: "Promo", custom: "Custom", about: "About",
    eyebrow: "AKSESORI UNTUK SPARKLE SETIAP HARI ✦",
    heroTitle: "Detail kecil,<br><em>sparkle besar.</em>",
    heroText: "Aksesori manis untuk bikin harimu lebih berwarna. Pilih koleksi favoritmu atau custom sesuai gayamu.",
    shopNow: "Belanja Sekarang", makeCustom: "Buat Custom",
    cute: "Desain Gemas", customizable: "Bisa Custom", gift: "Siap Jadi Kado",
    discover: "TEMUKAN FAVORITMU", pick: "Pilih sparkle-mu ✦", seeAll: "Lihat Semua →",
    best: "Paling disukai",
    promoTitle: "Makin sparkle,<br>makin happy.",
    promoText: "Temukan promo pilihan dan hadiah manis untuk pesananmu.",
    grab: "Ambil Promonya",
    customTitle: "Idemu, jewelry-mu ♡",
    customText: "Mau warna, nama, atau detail khusus? Ceritakan idemu dan kami bantu wujudkan.",
    chatCustom: "Ajukan Custom",
    aboutTitle: "Aksesori kecil,<br>momen bahagia.",
    aboutText: "Yoii Jewelry hadir untuk menemani gaya sehari-hari lewat aksesori yang playful, minimal, dan mudah dipadukan. Karena detail kecil juga bisa bikin hari terasa spesial.",
    searchTitle: "Cari aksesori", yourCart: "Keranjangmu", checkout: "Checkout"
  }
};
document.querySelector("#lang").onchange = e => {
  const t = translations[e.target.value];
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.innerHTML = t[el.dataset.i18n] || el.innerHTML;
  });
  document.documentElement.lang = e.target.value;
};

/* ---------- WA Links ---------- */
function updateWaLinks() {
  const defaultText = "Halo kak, aku mau tanya soal Yoii Jewelry ♡";
  document.querySelector("#waFloat").href = waLink(defaultText);
}
updateWaLinks();

/* ---------- Init ---------- */
renderCart();
loadProducts();
