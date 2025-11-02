# BE_songs_apps
OpenMusic API v3 is a backend built with Hapi or Express, featuring playlist export via email using RabbitMQ and Nodemailer, album cover upload via local or S3 storage, and Redis-based server-side caching. It includes user auth, album, song, and playlist management with improved performance

- Server entry: [src/server.js](src/server.js)
- Package: [package.json](package.json)

Fitur utama
- Autentikasi JWT (akses & refresh) — manager: [`TokenManager`](src/tokenize/TokenManager.js)  
- Users: pendaftaran & ambil data — service: [`UsersService`](src/services/userServices.js)  
- Songs: CRUD & query — service: [`SongsService`](src/services/songService.js)  
- Albums: CRUD, upload cover (S3), likes — service: [`AlbumsService`](src/services/albumsService.js) dan storage: [`S3StorageService`](src/services/storageService.js)  
- Playlists: CRUD, tambah/hapus lagu, aktivitas — service: [`PlaylistsService`](src/services/playlistService.js) dan aktivitas: [`PlaylistActivitiesService`](src/services/playlistActivitiesService.js)  
- Kolaborasi playlist — service: [`CollaborationsService`](src/services/collaborationService.js)  
- Ekspor playlist (producer -> RabbitMQ) — [`ProducerService`](src/services/producerservice.js)  
- Caching Redis — [`CacheService`](src/services/cacheService.js)

API (ringkasan route)
- Users: [src/api/users/routes.js](src/api/users/routes.js) — handler: [src/api/users/handler.js](src/api/users/handler.js)  
- Songs: [src/api/songs/routes.js](src/api/songs/routes.js) — handler: [src/api/songs/handler.js](src/api/songs/handler.js)  
- Albums: [src/api/albums/routes.js](src/api/albums/routes.js) — handler: [src/api/albums/handler.js](src/api/albums/handler.js)  
- Playlists: [src/api/playlists/routes.js](src/api/playlists/routes.js) — handler: [src/api/playlists/handler.js](src/api/playlists/handler.js)  
- Authentications: [src/api/authentication/routes.js](src/api/authentication/routes.js) — handler: [src/api/authentication/handler.js](src/api/authentication/handler.js)  
- Collaborations: [src/api/collaborations/routes.js](src/api/collaborations/routes.js) — handler: [src/api/collaborations/handler.js](src/api/collaborations/handler.js)  
- Exports: [src/api/exports/routes.js](src/api/exports/routes.js) — handler: [src/api/exports/handler.js](src/api/exports/handler.js)

Persyaratan & konfigurasi lingkungan
- Node.js (ES module mode; lihat "type": "module" di [package.json](package.json))
- PostgreSQL — koneksi diatur lewat env vars: lihat `.env`  
- Redis — host lewat env var `REDIS_HOST` (digunakan oleh [`CacheService`](src/services/cacheService.js))  
- RabbitMQ — env `RABBITMQ_SERVER` (digunakan oleh [`ProducerService`](src/services/producerservice.js))  
- AWS S3 (opsional untuk upload cover) — env `S3_BUCKET_NAME`, `S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (digunakan oleh [`S3StorageService`](src/services/storageService.js))  
- JWT keys: `ACCESS_TOKEN_KEY`, `REFRESH_TOKEN_KEY`, `ACCESS_TOKEN_AGE` (lihat [src/tokenize/TokenManager.js](src/tokenize/TokenManager.js))  

Contoh .env penting
- HOST, PORT  
- PGUSER, PGPASSWORD, PGDATABASE, PGHOST, PGPORT  
- ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, ACCESS_TOKEN_AGE  
- RABBITMQ_SERVER  
- REDIS_HOST / REDIS_SERVER  
- S3_BUCKET_NAME, S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

Database & migrasi
- Script migrasi ada di folder [migrations/](migrations/) (tabel users, albums, songs, playlists, playlist_songs, collaborations, authentications, playlist_song_activities, user_album_likes, ...). Jalankan dengan:
  npm run migrate
  (konfigurasi `node-pg-migrate` dan env PG_* harus benar)

Menjalankan project
- Install deps:
  npm install
- Jalankan server:
  npm run dev
  atau
  npm start

Validator & error handling
- Validator Joi berada di folder [src/validator/](src/validator/) — contoh: [`UsersValidator`](src/validator/users/index.js), [`SongsValidator`](src/validator/songs/index.js), [`UploadsValidator`](src/validator/uploads/index.js)  
- Error khusus menggunakan kelas-kelas di [src/exceptions/](src/exceptions/) seperti [`InvariantError`](src/exceptions/InvariantError.js), [`AuthenticationError`](src/exceptions/AuthenticationError.js), [`AuthorizationError`](src/exceptions/AuthorizationError.js), [`NotFoundError`](src/exceptions/NotFound.js)

Catatan pengembangan
- Payload upload album cover dikonfigurasi di route [src/api/albums/routes.js](src/api/albums/routes.js) (multipart streaming).  
- Caching album detail & likes diimplementasikan di [`AlbumsService`](src/services/albumsService.js) menggunakan [`CacheService`](src/services/cacheService.js).  
- Ekspor playlist dikirim ke antrean RabbitMQ (`export:playlists`) oleh [`ProducerService`](src/services/producerservice.js).

Struktur utama
- src/server.js — bootstrap aplikasi dan pendaftaran plugin/plugin routes  
- src/api/* — plugin Hapi untuk resource (handlers + routes + index)  
- src/services/* — logika bisnis & akses DB / eksternal  
- src/validator/* — skema validasi input  
- src/exceptions/* — kelas error custom  
- migrations/* — skrip inisialisasi DB

Kontak & lisensi
- Project ini tidak menyertakan rincian lisensi. Sesuaikan dan tambahkan file LICENSE jika diperlukan.

Untuk membuka file utama, lihat:
- [src/server.js](src/server.js)
- [package.json](package.json)
- [migrations/](migrations/)
- [src/services/playlistService.js](src/services/playlistService.js)
- [src/services/albumsService.js](src/services/albumsService.js)
- [src/services/storageService.js](src/services/storageService.js)
- [src/services/cacheService.js](src/services/cacheService.js)
