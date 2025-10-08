Alpha Backend (Express + SQLite3)
================================

What I created:
- Express server (server.js) which serves static files from ../public
- SQLite database at ./database.db initialized using your schema.sql
- CRUD API endpoints:
  - /api/categorias  (GET, POST, PUT /:id, DELETE /:id)
  - /api/etiquetas   (GET, POST, DELETE /:id)
  - /api/productos   (GET, GET /:id, POST, PUT /:id, DELETE /:id)
  - /api/auth/login   (POST)  -> expects { username, password }

Notes based on your choices:
- Passwords kept simple / plaintext as requested (not recommended for production).
- Single database file: database.db (created in this folder).
- The server serves your frontend from ../public (so keep your existing frontend files in a sibling folder named 'public' or adjust path in server.js).

How to run:
1. Move this folder to your project root or ensure ../public points to your frontend folder.
2. In this folder run:
   npm install
   npm start
3. The server will run on port 3000 by default.

If you want me to automatically inject fetch() into your frontend forms (so forms call these endpoints), tell me and I will patch the frontend.
