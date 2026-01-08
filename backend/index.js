const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDb = require('./src/config/dbConnect');
const bodyParser = require('body-parser');
const authRoute = require('./src/routes/authRoute');
const chatRoute = require('./src/routes/chatRoute');
const statusRoute = require('./src/routes/statusRoute');
const initializeSocket = require('./src/services/socketService');
const http = require('http');

dotenv.config();

// Fix 1: Ensure PORT has a fallback value
const PORT = process.env.PORT || 8000;

const app = express();
connectDb();
// Middleware
app.use(express.json());
app.use(cookieParser());

const corsOption = {
    // Ensure FRONTEND_URL in .env is http://127.0.0.1:5173 or http://localhost:5173
//    origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : "http://localhost:5173",
      origin: process.env.FRONTEND_URL,
    // origin:['http://127.0.0.1:5173'],
    
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

// console.log(corsOption);

app.use(cors(corsOption));


const server = http.createServer(app);
const io = initializeSocket(server);

app.use((req, res, next) => {
    req.io = io;
    req.socketUserMap = io.socketUserMap;
    next();
});

// Routes
app.use('/api/auth', authRoute);
app.use('/api/chats', chatRoute);
app.use('/api/status', statusRoute);

// Fix 2: Add '0.0.0.0' to force IPv4 listening
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});