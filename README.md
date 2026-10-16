# Yoii Jewelry — Versi Aman + Panel Admin

## Perbaikan yang dilakukan
- Website sebelumnya rusak karena syntax error di `script.js` (URL ditulis salah).
- Password admin & nomor WA **tidak disimpan di file website** (aman untuk GitHub Pages).
- Disimpan di **Script Properties** Apps Script.
- Panel Admin lengkap dengan CRUD (Create, Read, Update, Delete).
- Tombol **Admin** di header.
- Halaman panduan untuk pengunjung.

## Langkah Setup

### 1. Deploy Apps Script
1. Buka Google Spreadsheet baru.
2. Extensions → Apps Script.
3. Paste seluruh isi file `apps-script/Code.gs`.
4. Save.
5. Deploy → New deployment → Web app
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy URL Web App.

### 2. Set Script Properties (PENTING)
Di Apps Script:
1. Klik ikon **Project Settings** (gerigi).
2. Scroll ke **Script Properties** → **Add script property**.
3. Tambahkan:
   - Property: `ADMIN_PASSWORD` → Value: `Bismillaah`
   - Property: `WA_NUMBER` → Value: `625979228683` (ganti dengan nomor kamu)

### 3. Hubungkan Website
1. Buka file `script.js`.
2. Ganti baris ini:
   ```js
   const APPS_SCRIPT_URL = "";
   ```
   menjadi:
   ```js
   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/XXXX/exec";
   ```
3. Simpan.

### 4. Deploy ke GitHub Pages
Upload semua file di folder ini ke repository GitHub kamu, lalu aktifkan GitHub Pages.

## Cara Pakai Admin
1. Buka website.
2. Klik **Admin** di menu header.
3. Masukkan password: **Bismillaah**
4. Kelola Produk, Pesanan, Custom, dan Pengaturan.

## Catatan Keamanan
- Password admin hanya ada di Script Properties Apps Script.
- Tidak ada di file HTML/JS yang di-deploy ke GitHub.
- Token admin sementara disimpan di localStorage browser setelah login.
