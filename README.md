AI-Powered Chatbot (mChat)
Structure:
 - backend/  : Express + MongoDB + OpenAI provider abstraction
 - frontend/ : React app (create-react-app style) with SSE streaming UI

Quick start (local):
1. Start MongoDB (or use Docker Compose):
   docker compose up -d
2. Backend:
   cd backend
   cp .env.example .env   # edit values (OPENAI_API_KEY, JWT_SECRET)
   npm install
   npm run seed
   npm run dev
3. Frontend:
   cd frontend
   npm install
   npm start
Notes on streaming:
 - A sample SSE stream endpoint is implemented at GET /api/chat/stream (demo echo).
 - To enable OpenAI streaming, update providers/openaiProvider.js to handle response stream and forward to SSE clients.
