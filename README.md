# TeamForge

A production-ready SaaS platform where students can discover teammates for hackathons, startup ideas, open-source projects, and research work.

## Project Structure

```
teamforge/
├── client/          # React (Vite) frontend
└── server/          # Node.js / Express backend
```

## Getting Started

### Backend

```bash
cd server
cp .env.example .env
# Fill in your MONGO_URI in .env
npm install
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

### Environment Variables (server/.env)

| Variable     | Description                      |
|--------------|----------------------------------|
| `MONGO_URI`  | MongoDB Atlas connection string  |
| `PORT`       | Server port (default: 5000)      |
| `NODE_ENV`   | `development` or `production`    |
| `CLIENT_URL` | Frontend origin for CORS         |

## API Endpoints

| Method | Endpoint       | Description          |
|--------|----------------|----------------------|
| GET    | `/`            | API root             |
| GET    | `/api/health`  | Server health check  |

## Tech Stack

**Frontend**: React · Vite · Tailwind CSS · React Router · Framer Motion  
**Backend**: Node.js · Express.js  
**Database**: MongoDB Atlas (via Mongoose)

## Sprint Roadmap

- ✅ **Sprint 1** — Project foundation + Landing page
- 🔜 **Sprint 2** — Authentication (JWT) + User profiles
- 🔜 **Sprint 3** — Project posting + Browse projects
- 🔜 **Sprint 4** — Applications + Team management
- 🔜 **Sprint 5** — Real-time chat (Socket.io) + Notifications
