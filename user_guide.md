# Panduan Pengguna UrbanFix

Dokumen ini berisi langkah-langkah lengkap penggunaan aplikasi dari dua sudut pandang:

- Warga/pengguna (membuat laporan dan memverifikasi)
- Pemerintah/Admin (memvalidasi laporan dan menandai selesai)

## A. Panduan untuk Warga/Pengguna

### 1) Membuka aplikasi

1. Buka aplikasi UrbanFix di browser.
2. Anda akan melihat halaman Forum yang berisi daftar laporan.
3. Gunakan menu navigasi di bagian atas untuk berpindah halaman:
    - Forum
    - Submit
    - City Map
    - Admin

### 2) Melihat dan mencari laporan di Forum

1. Di halaman Forum, lihat daftar laporan yang ada.
2. Gunakan kotak Search reports untuk mencari berdasarkan judul, deskripsi, atau kategori.
3. Gunakan filter Status untuk menampilkan laporan berdasarkan status:
    - Pending
    - Real
    - Completed
4. Klik tombol Verify pada kartu laporan untuk membuka halaman verifikasi laporan tersebut.

### 3) Membuat laporan baru (Submit)

1. Buka menu Submit.
2. Isi form laporan:
    - Issue title: judul singkat masalah.
    - Description: penjelasan detail masalah.
    - Email contact (opsional): isi jika tidak anonim.
    - Image URL (opsional): tautan foto bukti.
    - Submit anonymously: centang jika ingin anonim.
3. Pilih kategori dengan mengklik tombol kategori. Anda bisa memilih lebih dari satu kategori.
4. Tentukan lokasi masalah:
    - Gunakan peta dan arahkan crosshair ke lokasi yang tepat.
    - Klik Select this location untuk mengunci koordinat.
    - (Opsional) Klik Use my location untuk mengambil lokasi saat ini.
5. Klik Submit report untuk mengirim laporan.
6. Setelah berhasil, Anda akan diarahkan ke halaman verifikasi laporan tersebut.

### 4) Memverifikasi laporan (Upvote)

1. Buka halaman verifikasi melalui tombol Verify di Forum, atau setelah submit laporan baru.
2. Baca detail laporan dan status saat ini.
3. Klik Confirm issue untuk mengonfirmasi laporan.
4. Sistem akan mencatat upvote berdasarkan IP Anda.
5. Jika Anda sudah pernah mengonfirmasi laporan ini, tombol akan nonaktif dan muncul pesan bahwa Anda sudah mengonfirmasi.

### 5) Melihat peta kota (City Map)

1. Buka menu City Map.
2. Anda akan melihat peta dengan marker laporan.
3. Gunakan filter status untuk menampilkan laporan tertentu.
4. Klik marker untuk melihat ringkasan laporan.

## B. Panduan untuk Pemerintah/Admin

### 1) Login Admin

1. Buka menu Admin.
2. Masukkan username dan password admin (diatur pada file .env saat deployment).
3. Klik Sign in untuk masuk ke dashboard admin.

### 2) Melihat daftar laporan prioritas

1. Di dashboard admin, Anda akan melihat daftar Priority queue.
2. Daftar ini diurutkan berdasarkan status dan jumlah upvote.
3. Klik salah satu laporan untuk memilih laporan yang akan ditindaklanjuti.

### 3) Menandai laporan selesai (Completed)

1. Setelah memilih laporan, isi Resolution image URL dengan tautan foto bukti perbaikan.
2. Klik Mark completed untuk menandai laporan selesai.
3. Status laporan akan berubah menjadi Completed.

### 4) Logout Admin

1. Klik tombol Logout di dashboard admin untuk keluar.

## C. Ringkasan Tindakan yang Bisa Dilakukan

### Warga/Pengguna

- Melihat laporan di Forum
- Mencari dan memfilter laporan
- Membuat laporan baru
- Memverifikasi laporan (upvote)
- Melihat laporan di peta kota

### Pemerintah/Admin

- Login ke dashboard admin
- Melihat prioritas laporan
- Menandai laporan selesai dengan bukti
- Logout
