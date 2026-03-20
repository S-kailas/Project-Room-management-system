# Room Management System — Localhost/VPS Initial Setup

This guide installs and runs the **Room Management System** on a **fresh Linux VPS**.

Stack used:

* FastAPI
* React + Vite
* MySQL
* MinIO (Aadhaar storage)
* uv (Python package manager)

---

# 1. Update VPS

```bash
sudo apt update && sudo apt upgrade -y
```

Install base tools:

```bash
sudo apt install -y git curl build-essential
```

---

# 2. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify:

```bash
node -v
npm -v
```

---

# 3. Install MySQL

```bash
sudo apt install mysql-server -y
```

Start MySQL

```bash
sudo systemctl start mysql
sudo systemctl enable mysql
```

Open MySQL shell

```bash
sudo mysql
```

Create database:

```sql
CREATE DATABASE room_management;

CREATE USER 'room_user'@'localhost' IDENTIFIED BY 'strongpassword';

GRANT ALL PRIVILEGES ON room_management.* TO 'room_user'@'localhost';

FLUSH PRIVILEGES;

EXIT;
```

---

# 4. Install Python

```bash
sudo apt install python3 python3-venv python3-dev -y
```

---

# 5. Install UV (Python package manager)

```bash
curl -Ls https://astral.sh/uv/install.sh | bash
```

Reload shell

```bash
source ~/.bashrc
```

Verify

```bash
uv --version
```

---

# 6. Install MinIO

Download server:

```bash
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/
```

Create storage directory

```bash
mkdir ~/minio-data
```

Set credentials

```bash
export MINIO_ROOT_USER=minioadmin
export MINIO_ROOT_PASSWORD=minioadmin
```

Start MinIO

```bash
minio server ~/minio-data --console-address ":9001"
```

MinIO endpoints:

```
API: http://SERVER_IP:9000
Console: http://SERVER_IP:9001
```

Login:

```
username: minioadmin
password: minioadmin
```

Create bucket:

```
aadhaar-images
```

---

# 7. Clone Project

```bash
git clone https://github.com/S-kailas/Project-Room-management-system.git
cd room-management-system
```

---

# 8. Backend Setup

```bash
cd backend
```

Create environment

```bash
uv venv
source .venv/bin/activate
```

Install dependencies

```bash
uv pip install -r requirements.txt
```

Create `.env`

```env
DATABASE_URL=mysql+aiomysql://room_user:strongpassword@localhost/room_management

JWT_SECRET_KEY=supersecretkey

MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=aadhaar-images

FRONTEND_ORIGIN=http://SERVER_IP:5173
```

Start backend

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

API will run at:

```
http://SERVER_IP:8000
```

Swagger docs:

```
http://SERVER_IP:8000/docs
```

---

# 9. Frontend Setup

Open new terminal

```bash
cd room-management-system/frontend
```

Install packages

```bash
npm install
```

Create `.env`

```env
VITE_API_URL=http://SERVER_IP:8000
VITE_WS_URL=ws://SERVER_IP:8000
```

Start frontend

```bash
npm run dev -- --host
```

Frontend will run at:

```
http://SERVER_IP:5173
```

---

# 10. Default Admin Login

On first backend startup the system creates:

```
username: admin
password: admin123
```

Admin can create:

* CRE accounts
* Cleaner accounts

---

# 11. System Architecture

```
Browser
   ↓
React (5173)
   ↓
FastAPI (8000)
   ↓
MySQL (database)

FastAPI
   ↓
MinIO (Aadhaar image storage)

WebSockets
   ↓
Realtime cleaner notifications
```

---

# 12. Verify Everything

Backend:

```
http://SERVER_IP:8000/docs
```

Frontend:

```
http://SERVER_IP:5173
```

MinIO Console:

```
http://SERVER_IP:9001
```

---

# 13. Optional Production Improvements

Recommended for production:

* Nginx reverse proxy
* HTTPS (Let's Encrypt)
* PM2 for frontend
* Systemd service for FastAPI
* Docker compose

---

# 14. Directory Structure

```
room-management-system
│
├── backend
│   ├── app
│   └── requirements.txt
│
├── frontend
│   ├── src
│   └── package.json
│
└── README.md
```

---

# System Ready 🚀

You now have a fully running:

* Room management system
* CRE check-in
* Cleaner task management
* Aadhaar storage via MinIO
* Realtime notifications via WebSockets
