# Room Management System – system_architecture.md

## System Overview

The Room Management System is a full-stack web application designed to manage:

- Guest check-ins
- Guest check-outs
- Room availability
- Cleaning workflows
- Aadhaar image storage
- Real-time cleaner notifications

Architecture model:

React Client → FastAPI Backend → MySQL Database  
                                → MinIO Object Storage  
                                → WebSocket Server

Deployment target: **Linux VPS**

---

# Technology Stack

Frontend
- React
- TailwindCSS
- Axios
- WebSocket client

Backend
- FastAPI
- SQLAlchemy ORM
- JWT Authentication
- WebSockets

Database
- MySQL 8+

Python Database Drivers
- SQLAlchemy
- aiomysql

Object Storage
- MinIO

Deployment
- Linux VPS
- Nginx reverse proxy
- Gunicorn + Uvicorn workers

---

# Environment Configuration

All configuration must be stored in a `.env` file.

Example `.env` file:

DATABASE_URL=mysql+aiomysql://room_user:securepassword@localhost/room_management

JWT_SECRET_KEY=supersecretkey
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=aadhaar-images

FRONTEND_ORIGIN=http://localhost:5173

---

# Backend Folder Structure

backend/
│
├── app/
│
│   ├── main.py
│   ├── config.py
│
│   ├── database/
│   │   ├── connection.py
│   │   └── models.py
│
│   ├── auth/
│   │   ├── jwt_handler.py
│   │   ├── password_utils.py
│   │   └── dependencies.py
│
│   ├── routers/
│   │   ├── auth_routes.py
│   │   ├── room_routes.py
│   │   ├── checkin_routes.py
│   │   ├── cleaner_routes.py
│   │   └── admin_routes.py
│
│   ├── services/
│   │   ├── room_service.py
│   │   ├── cleaning_service.py
│   │   ├── customer_service.py
│   │   └── assignment_service.py
│
│   ├── websocket/
│   │   └── socket_manager.py
│
│   ├── storage/
│   │   └── minio_client.py
│
│   └── utils/
│       └── logger.py
│
└── requirements.txt

---

# Frontend Folder Structure

frontend/
│
├── src/
│
│   ├── api/
│   │   └── apiClient.js
│
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── CREDashboard.jsx
│   │   ├── CleanerDashboard.jsx
│   │   └── AdminPanel.jsx
│
│   ├── components/
│   │   ├── RoomCard.jsx
│   │   ├── CheckinModal.jsx
│   │   ├── CheckoutModal.jsx
│   │   └── CleaningTaskCard.jsx
│
│   ├── websocket/
│   │   └── socket.js
│
│   ├── context/
│   │   └── AuthContext.jsx
│
│   ├── App.jsx
│   └── main.jsx

---

# Database Configuration

Database type:

MySQL 8+

Connection string format:

mysql+aiomysql://username:password@localhost/room_management

Example:

mysql+aiomysql://room_user:securepassword@localhost/room_management

---

# Database Schema

## Users Table

users

id INT PRIMARY KEY AUTO_INCREMENT  
username VARCHAR(100) UNIQUE  
password_hash TEXT  
role ENUM('ADMIN','CRE','CLEANER')  
created_at DATETIME  

Index

INDEX idx_username (username)

---

## Rooms Table

rooms

id INT PRIMARY KEY AUTO_INCREMENT  
room_number INT UNIQUE  
status VARCHAR(20)  
created_at DATETIME  

Indexes

INDEX idx_room_status (status)

Room statuses

AVAILABLE  
OCCUPIED  
DIRTY  
CLEANING  
READY  

---

## Customers Table

customers

id INT PRIMARY KEY AUTO_INCREMENT  
name VARCHAR(150)  
phone VARCHAR(20) UNIQUE  
aadhaar_image_path TEXT  
created_at DATETIME  

Indexes

INDEX idx_phone (phone)

---

## Stays Table

stays

id INT PRIMARY KEY AUTO_INCREMENT  
room_id INT  
customer_id INT  
payment_method VARCHAR(50)  
checkin_time DATETIME  
checkout_time DATETIME  
status VARCHAR(20)  

Foreign Keys

room_id → rooms.id  
customer_id → customers.id  

Indexes

INDEX idx_room_id (room_id)

---

## Cleaning Tasks Table

cleaning_tasks

id INT PRIMARY KEY AUTO_INCREMENT  
room_id INT  
assigned_cleaner_id INT  
status VARCHAR(20)  
created_at DATETIME  
started_at DATETIME  
completed_at DATETIME  

Indexes

INDEX idx_clean_status (status)

Statuses

PENDING  
CLEANING  
COMPLETED  

---

## Logs Table

logs

id INT PRIMARY KEY AUTO_INCREMENT  
user_id INT  
action TEXT  
target_id INT  
timestamp DATETIME  

---

# Database Initialization

On backend startup:

1. Create tables if they do not exist.
2. Check if rooms table is empty.
3. If empty, create **20 room records**.

Example:

Room 1 → AVAILABLE  
Room 2 → AVAILABLE  
...  
Room 20 → AVAILABLE  

4. Ensure an admin account exists.

---

# Aadhaar Image Storage

MinIO bucket

aadhaar-images

File naming pattern

aadhaar-images/customer_id/<uuid>.jpg

Upload process

1. CRE uploads Aadhaar image
2. Backend receives file
3. Backend uploads to MinIO
4. Database stores object path

---

# API Architecture

Base path

/api/v1

---

# Authentication

Login endpoint

POST /auth/login

Request

username  
password  

Response

access_token  
role  

Authorization header format

Authorization: Bearer <token>

Token expiry

1440 minutes

---

# Room APIs

GET /rooms/available  
GET /rooms/occupied  

---

# Check-In API

POST /checkin

Form fields

name  
phone  
payment_method  
aadhaar_image  
room_id  

Process

1. Check if phone exists
2. If exists reuse Aadhaar image
3. If new customer upload Aadhaar
4. Create stay record
5. Update room → OCCUPIED

---

# Checkout API

POST /checkout/{room_id}

Process

1. Update stay checkout_time
2. Update room → DIRTY
3. Create cleaning task
4. Assign cleaner
5. Send websocket notification

---

# Cleaner Assignment Algorithm

Round-robin scheduling.

Cleaner assignment state must be stored in database.

Example logic

next_cleaner = cleaners[(last_assigned_index + 1) % total_cleaners]

This prevents the same cleaner receiving consecutive tasks.

---

# Cleaner APIs

GET /cleaner/tasks

POST /cleaner/start/{task_id}

Updates

task.status → CLEANING  
room.status → CLEANING  

POST /cleaner/complete/{task_id}

Updates

task.status → COMPLETED  
room.status → AVAILABLE  

---

# WebSocket Architecture

Endpoint

/ws/cleaner

Connected clients

Cleaner dashboards

Example message

{
 "event": "NEW_TASK",
 "room_id": 5
}

WebSocket reliability

Client must reconnect automatically if connection drops.

Heartbeat ping interval

30 seconds

---

# CORS Configuration

Allow frontend origin

http://localhost:5173

Production domain

---

# Production Deployment

Backend server

Gunicorn with Uvicorn workers

Command

gunicorn -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000

Reverse proxy

Nginx

Frontend

React build served via Nginx

---

# Security Architecture

Authentication

JWT tokens

Authorization

Role-based permissions

Admin → admin routes  
CRE → checkin / checkout  
Cleaner → cleaning routes  

Transport

HTTPS required

---

# Logging

System logs include

Check-in  
Checkout  
Cleaning started  
Cleaning completed  
Admin actions  

Purpose

Audit trail  
Debugging  
Operational monitoring