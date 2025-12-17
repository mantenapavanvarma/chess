import express from 'express'
import { fileURLToPath } from 'url';
import path from 'path'
const app = express()
const PORT = 5000;
import { WebSocketServer } from 'ws';
import {signup} from './helpers/signup.js';
import {login} from './helpers/login.js';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import cookie from "cookie";
import dotenv from 'dotenv';
dotenv.config();

//rooms
const rooms = [
    {
        id: "1",
        w: {
            username:'pavan',
            socket: null
        },
        b: {
            username:null,
            socket: null
        },
        isActive: true,
        isRunning: false,
        state: {

        }
    }
]

// Middleware to parse form data
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = app.listen(PORT, (err)=>{
    if (err) {
        console.log(err);
        return
    }
    console.log("Server started at "+PORT);
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, 'public')))

// app.get('/', verifyToken, (req, res)=>{
//     res.sendFile(path.join(__dirname, 'public', 'index', 'index.html'))
// })

app.get('/', verifyToken, (req, res)=>{
    res.sendFile(path.join(__dirname, 'public', 'home', 'home.html'))
})

app.post('/logout', verifyToken, (req, res) => {
    // Clear the token cookie
    res.clearCookie('token', {
        httpOnly: true,
        // secure: true, // Uncomment this if you're using HTTPS
    });
    res.status(200).send('Logged out successfully');
});

//to get home page user details
app.get('/home', verifyToken, (req, res)=>{
    // Assuming you have a function to get user details by ID
    const userId = req.user.id; // Get user ID from the verified token
    // Fetch user details from your database or service
    // For example, you can use a function like getUserDetails(userId)
    // Here, we will just send back the user ID and username as an example
    // res.json({ id: userId, username: req.user.username });
    setTimeout(()=>{
        res.json({ id: userId, username: req.user.username });
    },2000)
})

//Get requests

app.get('/login', (req, res)=>{
    res.sendFile(path.join(__dirname, 'public', 'login', 'login.html'))
})

app.get('/signup', (req, res)=>{
    res.sendFile(path.join(__dirname, 'public', 'signup', 'signup.html'))
})

app.get('/room/:roomId', verifyToken,(req, res)=>{
    const roomId = req.params.roomId;
    const room = rooms.find(r => r.id === roomId);
    if(room){
        if(room.w.username === req.user.username || room.b.username === req.user.username){
            return res.sendFile(path.join(__dirname, 'public', 'index', 'index.html'))
        }
        if(!room.w.username){
            room.w.username = req.user.username
            return res.sendFile(path.join(__dirname, 'public', 'index', 'index.html'))
        }
        if(!room.b.username){
            room.b.username = req.user.username
            return res.sendFile(path.join(__dirname, 'public', 'index', 'index.html'))
        }
    }else return res.json({ rejection : "Inavlid room reference" });
    return res.json({ rejection : "Room space is already occupied" });
})

// Post requests

app.post('/login', (req, res)=>{
    const { username, password } = req.body;
    login(username, password)
    .then(data => {
        if (!data.success) {
            return res.status(400).send('Login failed');
        }
        if (!data.user) {
            return res.status(400).send('User not found');
        }
        // Generate a JWT token (you can customize the payload and expiration time)
        const token = jwt.sign({id: data.user.user_id, username: data.user.username }, process.env.JWT_SECRET_KEY);
        // Store token in a cookie
        res.cookie('token', token, {
            httpOnly: true,
            // secure: true, // Uncomment this if you're using HTTPS
            expires: new Date('9999-12-31'), // Set an extremely far expiration date
        });
        return res.status(200).json({ success: true }); // redirect directly, no need to return JSON
    })
    .catch(err => {
        console.error('Login failed:', err.message);
        res.status(400).send(err.message);
    });
})

app.post('/signup', (req, res)=>{
    const { username, password, cpassword } = req.body;
    if(password !== cpassword || password.length <= 5) return res.status(400).send("Password mismatch or too short");
    signup(username, password)
    .then((result) => res.status(200).json({ success: result.success }))
    .catch(err => res.status(400).send(err.message));
})

wss.on('connection', (ws, request) => {
    
    const cookieHeader = request.headers.cookie;

    console.log('Client connected, uid created');

    if (cookieHeader) {
        // Parse the cookie string into an object
        const token = cookie.parse(cookieHeader).token;
        const verified = jwt.verify(token, process.env.JWT_SECRET_KEY);

        // register the user
        ws.user = verified
        const room = assignSocket(verified.username, ws);
        
        if(room) console.log("Websocket registered", room);

        // You can also use the cookies for authentication/authorization logic here
    } else {
        console.log('No cookie header found');
    }

    // Handle incoming messages from the client
    ws.on('message', (message) => {
        const data = JSON.parse(message)
        console.log(data);
        ws.send(JSON.stringify(data));
    });

    ws.on('close', ()=>{
        console.log("Closed");
    })
});

//Function to verify JWT token
// Middleware to verify token
function verifyToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.status(401).send('Access denied');

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = verified;
        next();
    } catch (err) {
        res.status(403).send('Invalid token');
    }
}

function findRoomByUsername(username) {
    return rooms.find(room =>
        room.w.username === username || room.b.username === username
    );
}

function assignSocket(username, ws) {
    const room = findRoomByUsername(username);

    if (!room) {
        console.log("Room not found for user:", username);
        return null;
    }

    if (room.w.username === username) {
        room.w.socket = ws;
    } else if (room.b.username === username) {
        room.b.socket = ws;
    }

    return room;
}

