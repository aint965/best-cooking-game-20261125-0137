[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/aint965/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/aint965/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

# Dapur Kilat — Game Memasak

![Dapur Kilat](https://img.shields.io/badge/game-Dapur%20Kilat-orange)
![Offline](https://img.shields.io/badge/offline-tanpa%20jaringan-brightgreen)
![Node](https://img.shields.io/badge/node-%3E%3D22-339933)

**Dapur Kilat** adalah game memasak orisinal untuk kompetisi [Make the best cooking game](https://make.fun/bounty/best-cooking-game-20261125-0137) di make.fun. Satu shift 2½ menit di dapur warung: ambil bahan dari rak, cincang di talenan atau goreng di kompor, tata di piring, dan antar ke jendela saji sebelum sabar pelanggan habis. Koin yang didapat dipakai di toko, upgrade, dan untuk membuka tema warung baru.

## Cara main

- **WASD / panah** — jalan
- **E / Spasi** — pakai alat dapur terdekat
- **Klik** — jalan ke suatu tempat, atau klik alat untuk berjalan ke sana dan memakainya
- **P** — jeda · **M** — suara mati/hidup · **R** — main lagi setelah shift selesai · **Esc** — kembali ke menu

Tiap pesanan adalah resep yang menggabungkan 7 bahan dengan cara berbeda: ada yang harus dicincang 3x di talenan, ada yang harus digoreng 4 detik di kompor (jangan sampai gosong!), ada yang langsung dituang. Dua kompor dan dua piring memungkinkan masak paralel — rencanakan rutenya. Sajikan berurutan dengan cepat untuk membangun kombo hingga x5. Tiga nyawa: pesanan yang kedaluwarsa atau sajian yang salah mengurangi satu nyawa.

## Menu utama

Layar utama menampilkan warung dengan tombol **MAIN**, **TOKO**, **MISI**, **WARUNG**, **UPGRADE**, **PRESTASI**, **HADIAH**, dan **PENGATURAN** — semuanya berfungsi:

- **TOKO** — boost sekali shift yang dibeli dengan koin (nyawa tambahan, kesabaran +25%, koin ganda).
- **MISI** — tugas lintas shift (misalnya sajikan 3 Nasi Goreng) dengan hadiah koin saat diklaim.
- **WARUNG** — tiga tema dapur (Warung Klasik gratis, Warung Pantai, Warung Malam) yang benar-benar mengubah palet dapur.
- **UPGRADE** — peningkatan permanen yang mengubah gameplay: Pisau Tajam (cincang 2x), Kompor Turbo (goreng 3 detik), Hati Ekstra (+1 nyawa tiap shift), Pelayanan Ramah (kesabaran +20%).
- **PRESTASI** — 8 pencapaian yang terbuka dari permainan nyata (sajian pertama, kombo x5, skor 3.000, shift sempurna, dan lainnya).
- **HADIAH** — hadiah harian sekali per hari kalender, dengan bonus beruntun.
- **PENGATURAN** — musik latar dan efek suara hidup/mati, tersimpan dan benar-benar dihormati game.

Semua progres tersimpan di localStorage (kunci `dapur-kilat-*`); skor terbaik tetap di kunci lama `dapur-kilat-best`.

## Jalankan

```sh
node serve.ts
# buka http://localhost:8080
```

Game ini file statis murni di bawah `game/` — tanpa build step, tanpa jaringan, tanpa library. Semua suara dibuat di kode dengan WebAudio.

## Struktur

- `game/index.html` — halaman game
- `game/src/main.js` — loop game, layar, dan mode shot/self-test
- `game/src/kitchen.js` — stasiun dapur, gerakan, dan aturan interaksi
- `game/src/orders.js` — papan pesanan, kesabaran, dan skor
- `game/src/recipes.js` — bahan dan resep
- `game/src/render.js` — semua gambar canvas (dapur, menu utama, sub-layar)
- `game/src/menu.js` — layout tombol menu dan baris sub-layar
- `game/src/meta.js` — koin, upgrade, toko, misi, prestasi, hadiah harian, tema
- `game/src/input.js` — keyboard dan mouse
- `game/src/audio.js` — efek suara WebAudio
- `main.ts` — program penyerahan (menyalin `game/` + `screenshots/` ke `/output`, menulis `dossier.json`)

## Lisensi

MIT — lihat [LICENSE](LICENSE).

---
<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
