# 📦 Inventory Management System — Enterprise Microservices

A production-ready **MERN Stack Inventory Management System** refactored into a clean **Enterprise Microservices Architecture**.

---

## 🏗️ Architecture Overview

```
inventory-management-system/
│
├── frontend/               → React + Vite (Port 5173)
│
├── backend/
│   ├── api-gateway/        → Reverse proxy gateway (Port 5000)
│   ├── auth-service/       → JWT Authentication (Port 5001)
│   ├── product-service/    → Products & Categories (Port 5002)
│   ├── inventory-service/  → Stock, Requests, Audit Logs (Port 5003)
│   ├── supplier-service/   → Suppliers CRUD (Port 5004)
│   ├── customer-service/   → Customers CRUD (Port 5005)
│   ├── purchase-service/   → Purchase Orders CRUD (Port 5006)
│   ├── sales-service/      → Sales CRUD (Port 5007)
│   ├── shared/             → Shared middleware & utilities
│   └── docker-compose.yml
│
└── start.ps1               → One-click startup script
```

---

## 🗄️ Databases (MongoDB — localhost:27017)

| Service           | Database                  |
|-------------------|---------------------------|
| auth-service      | `inventory_auth_db`       |
| product-service   | `inventory_product_db`    |
| inventory-service | `inventory_inventory_db`  |
| supplier-service  | `inventory_supplier_db`   |
| customer-service  | `inventory_customer_db`   |
| purchase-service  | `inventory_purchase_db`   |
| sales-service     | `inventory_sales_db`      |

---

## 🔐 Role-Based Access Control (RBAC)

| Role    | Permissions                                          |
|---------|------------------------------------------------------|
| Admin   | Full access (all routes including Approval, Reports) |
| Manager | Products, Categories, Stock In/Out, Reports          |
| Staff   | Stock In, Stock Out only                             |

---

## 🌐 API Routes (via Gateway on port 5000)

| Endpoint               | Service           | Methods                  |
|------------------------|-------------------|--------------------------|
| `/api/auth/register`   | auth-service      | POST                     |
| `/api/auth/login`      | auth-service      | POST                     |
| `/api/auth/me`         | auth-service      | GET (Protected)          |
| `/api/products`        | product-service   | GET, POST, PUT, DELETE   |
| `/api/categories`      | product-service   | GET, POST, PUT, DELETE   |
| `/api/stock`           | inventory-service | GET, POST                |
| `/api/requests`        | inventory-service | GET, POST, PUT           |
| `/api/notifications`   | inventory-service | GET                      |
| `/api/reports`         | inventory-service | GET                      |
| `/api/suppliers`       | supplier-service  | GET, POST, PUT, DELETE   |
| `/api/customers`       | customer-service  | GET, POST, PUT, DELETE   |
| `/api/purchases`       | purchase-service  | GET, POST, PUT, DELETE   |
| `/api/sales`           | sales-service     | GET, POST, PUT, DELETE   |

---

## 🚀 Quick Start

### Option A: Docker (Recommended for Production)

> **Requires**: Docker Desktop installed and running.

```powershell
# From the project root
.\start.ps1
```

This script automatically detects whether you have Docker Compose V1 or V2 installed.

Then start the frontend separately:
```bash
cd inventory-management-system/frontend
npm install
npm run dev
```

### Option B: Manual (Development)

**1. Start MongoDB** (via MongoDB Compass or mongod service)

**2. Start each microservice** in a separate terminal:

```bash
# Auth Service
cd backend/auth-service && npm install && npm run dev

# Product Service
cd backend/product-service && npm install && npm run dev

# Inventory Service
cd backend/inventory-service && npm install && npm run dev

# API Gateway (start last)
cd backend/api-gateway && npm install && npm run dev
```

**3. Start Frontend**
```bash
cd frontend && npm install && npm run dev
```

Open **http://localhost:5173** in your browser.

---

## ⚙️ Environment Variables

Each service has a `.env` file. Key variables:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/inventory_auth_db
JWT_SECRET=your_jwt_secret_here
```

> ⚠️ **Never commit `.env` files to version control.**

---

## 🔒 Security Features

- **Helmet.js** — HTTP security headers on API Gateway
- **Rate Limiting** — 100 requests per 15 min per IP
- **CORS** — Restricted to `localhost:5173`
- **JWT Authentication** — RS256, 30-day expiry with role payload
- **Password Hashing** — bcryptjs with 10 salt rounds
- **Centralized Error Handling** — No stack traces in production
- **OTP Hidden by Default** — `select: false` on sensitive fields

---

## 🛠️ Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 19, Vite, Axios, React Router |
| Gateway   | Express, http-proxy-middleware, Helmet, Rate-Limit |
| Services  | Node.js, Express, Mongoose        |
| Database  | MongoDB 7 (separate DBs per service) |
| Auth      | JWT (jsonwebtoken), bcryptjs      |
| Container | Docker, Docker Compose            |

---

## 📁 Shared Module

Located at `backend/shared/`, this package is consumed by all microservices via `"shared": "file:../shared"` in each service's `package.json`.

Contains:
- `middleware/auth.middleware.js` — `protect`, `admin`, `authorize()` guards
- `middleware/error.middleware.js` — `errorHandler`, `notFound`

---

## 🧑‍💻 Demo Credentials

| Role  | Email                  | Password  |
|-------|------------------------|-----------|
| Admin | admin@inventory.com    | admin123  |

> Create this user by seeding the database or registering manually (first registered user can be promoted to Admin via MongoDB Compass).

---

## 📄 License

MIT © Inventory Management System
