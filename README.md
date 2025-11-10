Nimbus Backend - quick start
1. Copy .env.example to .env and set values (OPENAI_API_KEY, MONGODB_URI, JWT_SECRET)
2. npm install
3. npm run seed   # creates demo user demo@local / password
4. npm run dev
Notes: The openai provider included is a skeleton for non-streaming calls. Streaming support requires handling OpenAI streaming responses and relaying chunks to clients (SSE or websockets).
