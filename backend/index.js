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

// 1. Environment variables ko load karna (.env file se)
dotenv.config();

// 2. Port set karna (Environment variable se ya phir default 8000)
const PORT = process.env.PORT || 8000;

const app = express();

// 3. Database connection call karna
connectDb();

// --- MIDDLEWARE SETUP ---

// JSON data ko handle karne ke liye
app.use(express.json());

// Cookies ko read/parse karne ke liye (Auth tokens ke liye zaroori hai)
app.use(cookieParser());

// 4. CORS Setup: Frontend aur Backend ko aapas mein communicate karne ki permission dena
const corsOption = {
    // Frontend ke URL ko allow karna
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true, // Cookies bhenjne ki permission dena
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};
app.use(cors(corsOption));

// --- SERVER & SOCKET INTEGRATION ---

// 5. HTTP Server banana (Socket.io ko attach karne ke liye basic 'app' se behtar hai)
const server = http.createServer(app);

// Socket service ko initialize karna
const io = initializeSocket(server);

// 6. Custom Middleware: Socket 'io' object ko har request mein pass karna
// Is ki wajah se aap Controllers mein req.io use kar paate hain
app.use((req, res, next) => {
    req.io = io;
    req.socketUserMap = io.socketUserMap; // Online users ki mapping
    next();
});

// --- ROUTES ---

// 7. API ke endpoints define karna
app.use('/api/auth', authRoute);     // Signup/Login routes
app.use('/api/chats', chatRoute);    // Messaging routes
app.use('/api/status', statusRoute); // Status update routes

// --- SERVER START ---

// 8. Server ko listen mode mein daalna
// '0.0.0.0' use kiya gaya hai taake network ke andar access ho sakay (Localhost IPv4 fix)
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});