# TikTok Downloader

Situs statis untuk mengunduh video, foto (slideshow), dan audio TikTok tanpa watermark. Tinggal tempel tautan TikTok, media diambil dan siap diunduh langsung dari browser.

## Fitur

- Unduh video TikTok tanpa watermark (versi standar & HD jika tersedia)
- Unduh postingan foto/slideshow satu per satu, atau semuanya sekaligus dalam satu file `.zip`
- Unduh audio asli dari video/foto
- Tempel otomatis dari clipboard
- 100% front-end — tidak butuh server atau backend sendiri

## Struktur Proyek

```
tikdown/
├── index.html      # Struktur halaman
├── css/
│   └── style.css   # Tampilan & tema
└── js/
    └── script.js   # Logika pengambilan dan pengunduhan media
```

## Cara Kerja

1. Pengguna menempelkan tautan TikTok (video atau foto) ke kolom input.
2. Situs memanggil API publik [tikwm.com](https://www.tikwm.com) untuk mengambil data media dari tautan tersebut.
3. Untuk mengunduh, file diambil sebagai blob langsung dari sumbernya — jika diblokir CORS, otomatis dicoba lewat proxy publik (`corsproxy.io`, `allorigins.win`) sebagai jalur cadangan.
4. Slideshow foto dapat dikemas menjadi satu file `.zip` menggunakan [JSZip](https://stuk.github.io/jszip/) langsung di browser.

## Menjalankan Secara Lokal

Karena ini murni HTML/CSS/JS statis, cukup buka `index.html` langsung di browser, atau jalankan server statis sederhana agar fetch berjalan lebih stabil:

```bash
npx serve .
```

## Deploy

Bisa langsung di-hosting di platform static hosting mana pun tanpa proses build, misalnya:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

## Ketergantungan Eksternal

- [JSZip](https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js) — dimuat lewat CDN, untuk membuat file `.zip` dari kumpulan foto
- API publik [tikwm.com](https://www.tikwm.com) — untuk mengambil data media dari tautan TikTok

## Disclaimer

Proyek ini tidak berafiliasi dengan TikTok. Fungsinya bergantung pada endpoint API publik pihak ketiga yang dapat berubah atau berhenti berfungsi sewaktu-waktu tanpa pemberitahuan.

## Kredit

Dibuat oleh **Devzii** — [linktr.ee/devzii_](https://linktr.ee/devzii_) 
