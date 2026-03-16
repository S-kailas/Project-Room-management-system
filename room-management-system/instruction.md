# Room Management System – instruction.md

## Project Overview

Build a **web-based room management system** for a small lodging facility.

The system manages:

- Guest check-ins
- Guest check-outs
- Room availability
- Cleaning task assignment
- Aadhaar image storage
- Real-time notifications for cleaners

The system must be **simple and easy to use**, especially for CRE staff working at reception.

The interface must work on:

- Desktop
- Laptop
- Mobile browsers

---

# Technology Stack

Frontend:
- React
- TailwindCSS

Backend:
- FastAPI (Python)

Database:
- Mysql 

Authentication:
- JWT authentication

Realtime communication:
- WebSockets

File storage:
- MinIO object storage

Deployment target:
- Linux VPS

---

# User Roles

There are **three roles**.

## Admin

Only one admin account exists.

Permissions:

- Create cleaner accounts
- View system logs
- View room status
- Manage rooms during initial setup

---

## CRE (Customer Relation Executive)

Reception staff responsible for managing customers.

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

Login uses:

- username
- password

Authentication uses **JWT tokens**.

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

For testing purposes the system must simulate **20 rooms**.

Example:

```
Room 1
Room 2
Room 3
...
Room 20
```

Rooms must exist in the database.

---

# Room Status States

Rooms can have the following statuses:

```
AVAILABLE
OCCUPIED
DIRTY
CLEANING
READY
```

Main workflow:

```
AVAILABLE → OCCUPIED → DIRTY → CLEANING → AVAILABLE
```

Meaning:

AVAILABLE = ready for guest  
OCCUPIED = guest currently staying  
DIRTY = checkout completed, waiting for cleaning  
CLEANING = cleaner currently cleaning  
READY = optional state (may behave same as AVAILABLE)

---

# Customer System

Customer records must prevent duplicate Aadhaar uploads.

Customers are identified using:

```
phone number
```

Customer table:

```
id
name
phone (unique)
aadhaar_image_path
created_at
```

If a phone number already exists:

- do NOT upload Aadhaar again
- reuse stored Aadhaar image path

---

# Aadhaar Image Storage

Aadhaar images must be stored in **MinIO object storage**.

Example path:

```
aadhaar-images/customer_id/aadhaar.jpg
```

Database stores only the file path.

Images are **never deleted**.

No file-size validation required.

---

# Payment Method

Payment method is a **text field**.

Typical values include:

```
Cash
UPI
Card
Online
```

However the field must allow **custom text input**.

---

# Check-In System

CRE dashboard shows **Available Rooms**.

When CRE clicks a room, a **check-in popup form** appears.

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
2. System checks if phone number exists

If customer exists:
- reuse Aadhaar image

If new customer:
- upload Aadhaar to MinIO
- create customer record

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

# Checkout Process

CRE opens **Occupied Rooms dashboard**.

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

# Cleaner Assignment Logic

Cleaner assignment must use **Round-Robin scheduling**.

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

This prevents the same cleaner from receiving consecutive tasks when multiple cleaners exist.

---

# Cleaner Workflow

Cleaner dashboard shows assigned tasks.

Cleaning process:

1. Cleaner clicks **Start Cleaning**

System updates:

```
room.status → CLEANING
task.status → CLEANING
task.started_at
```

2. Cleaner clicks **Completed**

System updates:

```
task.status → COMPLETED
task.completed_at
room.status → AVAILABLE
```

---

# Realtime Notifications

Use **WebSockets**.

When CRE checks out a room:

```
server emits cleaning task event
```

Cleaner dashboards must instantly receive:

```
New cleaning task assigned
Room number
```

---

# CRE Portal Interface

CRE portal must be **extremely simple**.

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

Rooms appear as clickable cards.

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

The system must log important actions.

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

# Security Requirements

System must include:

```
HTTPS
JWT authentication
Role-based access control
```

Permissions:

```
CRE → check-in / checkout
Cleaner → cleaning tasks
Admin → user management
```

---

# Data Retention

All data must be stored **permanently**.

No automatic deletion.

---

# UI Requirements

Design goals:

- very simple interface
- large room cards
- mobile responsive
- minimal navigation

Primary interface pattern:

```
dashboard + popup forms
```