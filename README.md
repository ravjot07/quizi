
# Quizi — Full-Stack Quiz Application (React + Node.js + MongoDB)

**Quizi** is a full-stack quiz web application that allows users to take timed quizzes using questions fetched from the [Open Trivia DB API](https://opentdb.com/).  
It features real-time progress tracking, per-question navigation, auto-submission on timeout, detailed performance reports with charts, and persistent session storage in MongoDB.

---

## Features

 **Modern Full Stack Architecture**
- Frontend: **React (Vite)** + **Tailwind CSS**
- Backend: **Node.js + Express**
- Database: **MongoDB** (stores quiz sessions, results, and user emails)
- Dockerized: Works out-of-the-box with **Docker Compose**

 **Quiz Functionality**
- Fetches **15 random questions** from Open Trivia DB
- Shuffled answers (deterministic per session)
- **30-minute countdown timer** with auto-submit
- Navigation between questions & question overview panel
- **Session state retained** for 30 minutes (via MongoDB)

 **Detailed Results**
- Displays per-question correctness, user answers, and correct answers
- Score summary and per-difficulty breakdown
- Charts using **Recharts** (Pie + Bar)
- Printable report view

 **Responsive & Accessible UI**
- Fully responsive (mobile/tablet/desktop)
- Keyboard-accessible navigation
- Built with Tailwind’s modern design system

---

##  Architecture Overview

frontend/ → React + Vite app (UI, quiz logic, charts)
backend/ → Express API (handles sessions, scoring, persistence)
mongo/ → MongoDB container for storing quiz data
docker-compose.yml → Defines all services and networks

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React (Vite), React Router, Zustand (state), Tailwind CSS, Recharts |
| **Backend** | Node.js, Express, MongoDB Driver, UUID, Node-Fetch |
| **Database** | MongoDB (running in Docker) |
| **DevOps** | Docker, Docker Compose |
| **APIs** | Open Trivia DB (`https://opentdb.com/api.php?amount=15`) |

---

##  Local Development Setup

### Requirements
- Node.js ≥ 18
- npm ≥ 8
- MongoDB (local) or Docker

---

###  Clone the repository
```
git clone https://github.com/ravjot07/quizi.git
cd quizi
```
 Run Backend (Express)
```
cd backend
npm install
npm start
Backend runs at → http://localhost:4000
```

Run Frontend (React + Vite)
```
cd ../frontend
npm install
npm run dev
Frontend runs at → http://localhost:5173
```
During local development, /api requests are proxied to http://localhost:4000 via vite.config.js.


### **Docker Deployment**

### **Build and Run**

From the project root (`CT/`):

`docker compose up -d --build` 

### Access the Application

| Component    | URL / Connection                               | Description                 |
| ------------ | ---------------------------------------------- | --------------------------- |
| **Frontend** | [http://localhost:4173](http://localhost:4173) | React UI served via `serve` |
| **Backend**  | [http://localhost:4000](http://localhost:4000) | Express API service         |
| **MongoDB**  | `mongodb://localhost:27017`                    | Database storing quiz data  |

### Services Overview
| Service    | Description                   | Port  |
| ---------- | ----------------------------- | ----- |
| `frontend` | React (Vite) production build | 4173  |
| `backend`  | Node.js + Express API         | 4000  |
| `mongo`    | MongoDB instance              | 27017 |

### Environment Variables
**Backend (`backend/.env`)**
```
PORT=4000
MONGO_URI=mongodb://mongo:27017/quizi
NODE_ENV=production`
```
**Frontend (`frontend/.env`)**

`VITE_API_BASE=http://backend:4000`

### API Endpoints
| Method | Endpoint                 | Description                      |
| ------ | ------------------------ | -------------------------------- |
| `POST` | `/api/start`             | Start a new quiz session         |
| `POST` | `/api/submit`            | Submit answers and compute score |
| `GET`  | `/api/report/:sessionId` | Retrieve detailed report         |
