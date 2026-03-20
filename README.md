# Room Management System

A full-stack **web-based room management system** designed for small lodging facilities.
(Setup manual inside room-management-system dir)
The system manages:

- Guest check-in
- Guest check-out
- Room availability
- Cleaning workflow
- Aadhaar image storage
- Real-time notifications for cleaners

The application is designed to be **simple, fast, and mobile friendly**, so reception staff can operate it easily.

---

# System Overview

The system contains two main operational roles:

- **CRE (Customer Relation Executive)** – manages guests at reception
- **Cleaner** – handles room cleaning tasks

An **Admin** account manages system configuration and cleaner accounts.

---

# Technology Stack

## Frontend
- React
- TailwindCSS
- Axios
- WebSocket client

## Backend
- FastAPI (Python)
- SQLAlchemy ORM
- JWT Authentication
- WebSockets

## Database
- MySQL

## Object Storage
- MinIO (for Aadhaar images)

## Deployment
- Linux VPS
- Nginx Reverse Proxy
- Gunicorn + Uvicorn workers

Architecture:

```
React Client
     |
     v
FastAPI Backend
     |
     |---- MySQL Database
     |
     |---- MinIO Object Storage
     |
     |---- WebSocket Server
```

---

# User Roles

## Admin

Only one admin account exists.

Admin permissions:

- Create cleaner accounts
- View room status
- View system logs
- Manage rooms during initial setup

---

## CRE (Customer Relation Executive)

Reception staff responsible for guest management.

Permissions:

- View available rooms
- Check-in customers
- Checkout customers
- Upload Aadhaar image
- Trigger cleaning request

---

## Cleaner

Cleaning staff responsible for preparing rooms.

Permissions:

- View assigned cleaning tasks
- Start cleaning
- Mark cleaning completed

---

# Authentication

Authentication uses **JWT tokens**.

Login requires:

```
username
password
```

User table structure:

```
id
username
password_hash
role (ADMIN | CRE | CLEANER)
created_at
```

---

# Room System

The system simulates **20 rooms**.

Example:

```
Room 1
Room 2
Room 3
...
Room 20
```

Rooms are stored in the database.

---

# Room Status

Rooms can have the following states:

```
AVAILABLE
OCCUPIED
DIRTY
CLEANING
READY
```

Typical workflow:

```
AVAILABLE → OCCUPIED → DIRTY → CLEANING → AVAILABLE
```

Meaning:

- **AVAILABLE** → room ready for guests
- **OCCUPIED** → guest currently staying
- **DIRTY** → guest checked out, waiting for cleaning
- **CLEANING** → cleaner currently cleaning
- **READY** → optional state similar to available

---

# Customer System

Customers are identified using **phone number**.

Customer table:

```
id
name
phone (unique)
aadhaar_image_path
created_at
```

Duplicate Aadhaar uploads are prevented.

If the phone number already exists:

- Aadhaar image is **reused**
- A new upload is **not required**

---

# Aadhaar Image Storage

Aadhaar images are stored in **MinIO object storage**.

Example storage path:

```
aadhaar-images/customer_id/aadhaar.jpg
```

The database only stores the **object path**.

Images are **never deleted**.
---

# Check-In Workflow

CRE dashboard displays **Available Rooms**.

When a room is selected, a **check-in popup form** appears.

Form fields:

```
Name
Phone number
Payment method
Aadhaar image upload
Room number
```

Check-in process:

1. CRE fills the form
2. System checks if phone number already exists

If customer exists:

```
reuse Aadhaar image
```

If new customer:

```
upload Aadhaar image to MinIO
create new customer record
```

Then:

```
create stay record
update room status → OCCUPIED
```

---

# Stay Table

Tracks each visit.

```
id
room_id
customer_id
payment_method
checkin_time
checkout_time
status
```

---

# Checkout Workflow

CRE opens the **Occupied Rooms** dashboard.

Steps:

1. Select occupied room
2. Click checkout

System actions:

```
update stay.checkout_time
change room status → DIRTY
create cleaning task
assign cleaner
send realtime notification
```

---

# Cleaning Task System

Cleaning tasks are created automatically after checkout.

Cleaning task table:

```
id
room_id
assigned_cleaner_id
status
created_at
started_at
completed_at
```

Task statuses:

```
PENDING
CLEANING
COMPLETED
```

---

# Cleaner Assignment

Cleaner assignment uses **Round-Robin scheduling**.

Example:

Cleaners:

```
Cleaner A
Cleaner B
Cleaner C
```

Assignments:

```
Task 1 → A
Task 2 → B
Task 3 → C
Task 4 → A
```

This prevents the same cleaner from receiving consecutive tasks.

---

# Cleaner Workflow

Cleaner dashboard shows assigned tasks.

Cleaning process:

### Start Cleaning

Cleaner clicks **Start Cleaning**

System updates:

```
room.status → CLEANING
task.status → CLEANING
task.started_at
```

### Complete Cleaning

Cleaner clicks **Completed**

System updates:

```
task.status → COMPLETED
task.completed_at
room.status → AVAILABLE
```

---

# Real-Time Notifications

The system uses **WebSockets**.

When CRE checks out a room:

```
server emits cleaning task event
```

Cleaner dashboards instantly receive:

```
New cleaning task assigned
Room number
```

---

# CRE Portal Interface

The CRE portal is designed to be **very simple**.

Home page contains two buttons:

```
Available Rooms
Occupied Rooms
```

---

## Available Rooms Page

Displays rooms with status:

```
AVAILABLE
```

Rooms appear as **clickable cards**.

Clicking a room opens the **Check-In Form Popup**.

---

## Occupied Rooms Page

Displays rooms with status:

```
OCCUPIED
```

Each room allows:

```
Checkout
```

After checkout:

```
room → DIRTY
cleaning task created
```

---

# Admin Panel

Admin capabilities:

```
Create cleaner accounts
View rooms
View logs
```

Cleaner account fields:

```
username
password
```

---

# Audit Logging

The system records important actions.

Examples:

```
CRE checked in customer
CRE checked out room
Cleaner started cleaning
Cleaner completed cleaning
Admin created cleaner account
```

Log table:

```
id
user_id
action
target_id
timestamp
```

---

# Project Folder Structure

```
backend/
 └── app/
     ├── auth/
     ├── database/
     ├── routers/
     ├── services/
     ├── storage/
     ├── websocket/
     └── utils/

frontend/
 └── src/
     ├── api/
     ├── components/
     ├── context/
     ├── pages/
     └── websocket/
```

---

# Security

Security features include:

```
HTTPS
JWT authentication
Role-based access control
```

Permissions:

```
Admin → admin routes
CRE → check-in / checkout
Cleaner → cleaning tasks
```

---

# Deployment

Backend server:

```
gunicorn -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
```

Frontend:

```
React build served via Nginx
```

Deployment target:

```
Linux VPS
```

---

# Data Retention

All system data is stored **permanently**.

No automatic deletion occurs.

---

# UI Design Goals

The interface is designed to be:

- Simple
- Fast
- Mobile responsive
- Easy for reception staff

Primary UI pattern:

```
Dashboard + Popup Forms
```

---

# Future Improvements

Possible enhancements:

- Room analytics dashboard
- Payment integration
- SMS notifications
- Guest history tracking
- Multi-property support

---
