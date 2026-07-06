# Inventory Management System - MERN Microservices

A production-ready **MERN Stack Inventory Management System** built with a clean **Enterprise Microservices Architecture**.

---

## Architecture Overview

```
inventory-management-system/
|-- frontend/               # React + Vite Application
|-- backend/
|   |-- api-gateway/        # Reverse proxy gateway (Port 5000)
|   |-- admin-service/      # Admin Service (Port 5001)
|   |-- user-service/       # User Service
|   |-- shared/             # Shared middleware & utilities
|-- docker-compose.yml      # Root docker-compose configuration
```

---

## Quick Start

### Prerequisites
- Node.js (v18+)
- Docker and Docker Compose
- MongoDB (if running locally without Docker)

### Option A: Docker (Recommended)

1. **Build the frontend:**
   Before running the backend API Gateway (which serves the frontend in production), you need to build the frontend.
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

2. **Start the microservices:**
   From the root of the project, run:
   ```bash
   docker-compose up -d --build
   ```

3. Open **http://localhost:5000** in your browser.

### Option B: Local Development

**1. Start MongoDB** (Make sure MongoDB is running on localhost:27017)

**2. Configure Environment Variables:**
   Copy `.env.example` to `.env` in the `admin-service`, `user-service`, and `api-gateway` directories and update the variables (especially MongoDB URIs and JWT secrets).

**3. Start each microservice** in a separate terminal:

```bash
# Admin Service
cd backend/admin-service
npm install
npm run dev

# User Service
cd backend/user-service
npm install
npm run dev

# API Gateway (start last)
cd backend/api-gateway
npm install
npm run dev
```

**4. Start Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser for the development server with HMR.

---

## Environment Variables

Each service has a `.env.example` file. Key variables:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/ims_admin_db
JWT_SECRET=your_jwt_secret_here
```

> **Note:** Never commit `.env` files to version control. They are ignored in `.gitignore`.

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React, Vite, Axios, React Router  |
| Gateway   | Express, http-proxy-middleware    |
| Services  | Node.js, Express, Mongoose        |
| Database  | MongoDB                           |
| Container | Docker, Docker Compose            |

---

## License

MIT License
