# RabiGuard

Asisten AI darurat gigitan hewan dan rabies untuk warga dan wisatawan Bali.
Tim Neural Dewata – AI Web Innovation Challenge, Bali DigiFest 2026 (kategori Mahasiswa/Umum).

## Problem & Target User
Rabies endemik di Bali dan hampir semua kematiannya bisa dicegah dengan profilaksis pascapajanan (PEP) yang cepat. Masalahnya ada pada keterlambatan korban mengambil keputusan: warga menganggap luka kecil sepele, wisatawan tidak tahu risiko dan ke mana harus pergi. Pengguna: warga Bali dan wisatawan yang baru digigit atau dicakar hewan. Detail ada di proposal.

## Key Features
- Chatbot triase dua bahasa (Indonesia/Inggris) yang bertanya balik bila informasi kurang
- Konfirmasi hasil ekstraksi sebelum klasifikasi dijalankan
- Mesin triase WHO Kategori I–III berbasis aturan di kode (`lib/triage.ts`), bukan AI
- Tanya jawab lanjutan setelah hasil (dibatasi pada hasil klasifikasi dan anjuran baku WHO)
- Timer cuci luka 15 menit, peringatan gejala, anjuran per kategori
- Daftar faskes per kabupaten/kota dengan filter dan tautan peta
- Ringkasan kasus yang dapat disalin untuk petugas, tombol darurat 112
- Mode fallback: formulir pilihan ganda bila AI/API gagal, klasifikasi tetap berjalan

## Tech Stack
- Frontend: Next.js 15 (React 19), TypeScript, Tailwind CSS 4
- Backend: Node.js (Next.js API Route `app/api/chat/route.ts`)
- Database: tidak ada. Data faskes berupa file statis `lib/facilities.ts`. Aplikasi tidak menyimpan data pengguna.
- Hosting: Vercel

## AI Implementation
Model: Google Gemini 3.6 Flash (default `gemini-3.6-flash`) melalui Gemini API (`generateContent`), dipanggil dari backend. Model dapat diganti lewat variabel `GEMINI_MODEL`.

| Tahap | Dikerjakan oleh | Input → Output |
|---|---|---|
| 1. Ekstraksi | AI (Gemini) | Cerita bebas pengguna → JSON (hewan, jenis kontak, kondisi kulit, selaput lendir, gejala, bahasa), divalidasi terhadap skema |
| 2. Klasifikasi | Aturan di kode | Data terstruktur → Kategori I/II/III. Bila ambigu, dipilih kategori lebih berisiko |
| 3. Penjelasan | AI (Gemini) | Kategori + anjuran baku → penjelasan singkat dalam bahasa pengguna (kategori dan anjuran tidak boleh diubah) |

Hanya teks deskripsi kejadian yang dikirim ke model. Catatan: pada free tier Gemini API, Google dapat memakai data untuk meningkatkan produknya; gunakan paid tier untuk penggunaan nyata. Tidak ada login, nama, atau data identitas. API key hanya dibaca di server (environment variable).

Pengaman: pembatasan 40 permintaan per 10 menit per IP (per instance server).

Penanganan error: bila API gagal atau keluaran tidak sesuai skema, pengguna diarahkan ke formulir pilihan ganda. Bila penjelasan AI gagal, hasil tetap tampil dengan teks anjuran baku.

## Architecture / Data Flow
Pengguna → Frontend (`app/page.tsx`) → `POST /api/chat` → Gemini (ekstraksi) → konfirmasi pengguna → `classify()` di `lib/triage.ts` → Gemini (penjelasan) + data faskes → hasil di frontend.
Gagal di tengah jalan → formulir pilihan ganda + klasifikasi lokal + nomor 112.

## Installation / Run Instructions
Prasyarat: Node.js 18.18 atau lebih baru.
```bash
npm install
npm run dev  # http://localhost:3000
```
Untuk produksi: `npm run build` lalu `npm start`. Di Vercel, set `GEMINI_API_KEY` di Environment Variables.

## Deployment URL
https://rabiguard.vercel.app

## Demo Account
Tidak diperlukan (tanpa login).

## AI & Technology Disclosure
| Komponen |
|---|---|
| Nama Produk | RabiGuard |
| Framework / Frontend | Next.js 15 (React 19), TypeScript, Tailwind CSS 4 |
| Backend / Runtime | Node.js (Next.js API Route) |
| Database / Storage | Tidak ada; data faskes statis di repository, tidak menyimpan data pengguna |
| Hosting / Deployment | Vercel |
| AI Model / API / Method | Google Gemini 3.6 Flash (Gemini API) + mesin triase berbasis aturan WHO |
| Peran AI dalam Produk | Mengekstrak cerita bebas menjadi data terstruktur, bertanya balik, dan menjelaskan hasil dalam bahasa pengguna |
| Dataset / Data Source | Pedoman WHO dan Kemenkes RI tentang gigitan hewan penular rabies; daftar faskes disusun dari sumber publik, perlu verifikasi berkala |
| Open-source Libraries | next, react, react-dom, tailwindcss, @tailwindcss/postcss, typescript |
| Template / Boilerplate | Tidak ada |
| AI Coding Assistant | Claude (Anthropic) digunakan untuk membantu menulis kode MVP; tim menguji dan bertanggung jawab atas kode |
| Pre-existing Components | Tidak ada; seluruh produk dikembangkan untuk kompetisi ini |
| Third-party Assets / Credits | Font Atkinson Hyperlegible (SIL OFL, via next/font/google); tautan peta memakai pencarian Google Maps |

## Known Limitations
- Bukan alat diagnosis dan tidak menggantikan tenaga medis
- Hasil bergantung pada kelengkapan cerita pengguna
- Butuh internet dan layanan AI aktif untuk fitur chat (fallback formulir tersedia)
- Daftar faskes statis, belum berisi nomor telepon, dan diperbarui manual
- Bahasa saat ini hanya Indonesia dan Inggris
- Belum diuji ke pengguna sebenarnya

## Third-party Resources / Credits
Next.js, React, Tailwind CSS, Gemini API (Google), font Atkinson Hyperlegible.

## Team Members
[Fylbeartz Yulian Changniago (ketua), Kaleb Bun Dwi Prasetia – anggota, Nataanel Grecio – anggota]
