# Dapur Kilat — Game Memasak

![Dapur Kilat](https://img.shields.io/badge/game-Dapur%20Kilat-orange)
![Offline](https://img.shields.io/badge/offline-tanpa%20jaringan-brightgreen)
![Node](https://img.shields.io/badge/node-%3E%3D22-339933)

**Dapur Kilat** adalah game memasak orisinal untuk kompetisi [Make the best cooking game](https://make.fun/bounty/best-cooking-game-20261125-0137) di make.fun. Satu shift 2½ menit di dapur warung: ambil bahan dari rak, cincang di talenan atau goreng di kompor, tata di piring, dan antar ke jendela saji sebelum sabar pelanggan habis.

## Cara main

- **WASD / panah** — jalan
- **E / Spasi** — pakai alat dapur terdekat
- **Klik** — jalan ke suatu tempat, atau klik alat untuk berjalan ke sana dan memakainya
- **P** — jeda · **M** — suara mati/hidup · **R** — main lagi setelah shift selesai

Tiap pesanan adalah resep yang menggabungkan 7 bahan dengan cara berbeda: ada yang harus dicincang 3x di talenan, ada yang harus digoreng 4 detik di kompor (jangan sampai gosong!), ada yang langsung dituang. Dua kompor dan dua piring memungkinkan masak paralel — rencanakan rutenya. Sajikan berurutan dengan cepat untuk membangun kombo hingga x5. Tiga nyawa: pesanan yang kedaluwarsa atau sajian yang salah mengurangi satu nyawa.

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
- `game/src/render.js` — semua gambar canvas
- `game/src/input.js` — keyboard dan mouse
- `game/src/audio.js` — efek suara WebAudio
- `main.ts` — program penyerahan (menyalin `game/` + `screenshots/` ke `/output`, menulis `dossier.json`)

## Lisensi

MIT — lihat [LICENSE](LICENSE).
