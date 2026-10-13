# Yoii Jewelry — Ready to Deploy

Website toko aksesoris + database **Google Sheets** (gratis) via **Apps Script**.

---

## Isi Paket

```
yoii-jewelry-ready/
├── index.html          ← Halaman utama
├── style.css
├── script.js           ← Frontend (ganti APPS_SCRIPT_URL di sini)
├── CNAME               ← Domain custom (opsional)
├── apps-script/
│   └── Code.gs         ← Backend Google Apps Script
└── README.md           ← File ini
```

---

## Langkah Setup (sekali saja)

### 1. Buat Google Spreadsheet

1. Buka [https://sheets.google.com](https://sheets.google.com) → **Blank spreadsheet**
2. Rename jadi `Yoii Jewelry Database` (bebas)
3. Biarkan tab pertama apa adanya (nanti otomatis dibuat)

### 2. Pasang Apps Script

1. Di Spreadsheet → menu **Extensions → Apps Script**
2. Hapus kode default, lalu **copy-paste seluruh isi** file `apps-script/Code.gs`
3. Klik **Save** (ikon disket), kasih nama project misalnya `Yoii Jewelry API`
4. Klik **Deploy → New deployment**
5. Jenis: **Web app**
   - Description: `v1`
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Klik **Deploy**
7. Izinkan permission Google (pilih akun → Advanced → Go to … → Allow)
8. **Copy URL** yang muncul (bentuknya `https://script.google.com/macros/s/XXXX/exec`)

### 3. Hubungkan ke Website

1. Buka file `script.js`
2. Cari baris paling atas:

```js
const APPS_SCRIPT_URL = ""; // <-- ISI SETELAH DEPLOY
```

3. Paste URL Web App kamu:

```js
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/XXXX/exec";
```

4. Simpan.

### 4. Deploy ke GitHub Pages

1. Buat repo baru di GitHub (misal `yoii-jewelry`)
2. Upload semua file di folder ini (kecuali folder `apps-script` boleh ikut, tidak masalah)
3. Settings → Pages → Source: **Deploy from a branch** → branch `main` / `master` → folder `/ (root)`
4. Tunggu 1–2 menit, website hidup.

Kalau pakai custom domain, isi file `CNAME` sesuai domainmu.

---

## Cara Mengelola Data

Setelah pertama kali website dibuka (atau hit API), Apps Script otomatis membuat 4 tab:

| Tab | Fungsi |
|-----|--------|
| **Products** | Katalog produk |
| **Orders** | Semua pesanan dari checkout |
| **CustomRequests** | Request custom dari form |
| **Settings** | Nomor WA, dll |

### Edit Produk

Buka tab **Products**. Kolom:

| Kolom | Contoh | Keterangan |
|-------|--------|------------|
| id | 1 | Angka unik |
| name | Sunny Charm Bracelet | Nama produk |
| category | Bracelet | Bracelet / Necklace / Ring / Earrings |
| price | 89000 | Harga (angka saja) |
| badge | BEST SELLER | Label kecil (opsional) |
| image_url | https://... | Link gambar |
| stock | 20 | Stok (0 = tampil HABIS) |
| description | ... | Deskripsi (opsional) |
| active | TRUE | FALSE = disembunyikan |

Simpan saja, website otomatis ambil data terbaru (refresh browser).

### Lihat Pesanan

Tab **Orders** akan terisi otomatis setiap ada checkout. Kolom status default `NEW` — kamu bisa ubah manual jadi `PAID`, `SHIPPED`, dll.

### Nomor WhatsApp

Tab **Settings** → baris `wa_number` → isi nomor dengan format internasional tanpa `+` (contoh: `625979228683`).

---

## Fitur yang Aktif

- Produk dinamis dari Google Sheet
- Keranjang tersimpan di browser (localStorage)
- Checkout → simpan order ke Sheet + buka WhatsApp
- Form Custom Order → simpan ke Sheet + buka WhatsApp
- Filter kategori + search
- Multi bahasa ID / EN
- Stok (produk habis tidak bisa dibeli)
- Fallback offline (kalau Sheet belum dihubungkan, pakai data demo)

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Status "Gagal load Sheet" | Pastikan URL Web App benar & deployment "Anyone" |
| CORS / blocked | Deploy ulang Apps Script, pastikan "Who has access: Anyone" |
| Order tidak masuk | Buka tab Orders, cek permission Apps Script sudah diizinkan |
| Produk kosong | Isi tab Products, pastikan kolom `active` = TRUE |
| Mau update kode Apps Script | Edit → Save → Deploy → **Manage deployments** → Edit → New version → Deploy |

---

## Catatan

- Gratis selamanya (kuota Google Apps Script sangat longgar untuk toko kecil).
- Tidak perlu database berbayar / Vercel / Netlify Functions.
- Owner cukup buka Google Sheet untuk kelola produk & lihat order.

Selamat jualan! ✦
