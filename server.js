import express from 'express'
import { fileURLToPath } from 'url';
import path from 'path'
const app = express()
import bodyParser from 'body-parser';
const PORT = 5000;
import { WebSocketServer } from 'ws';
import {signup} from './helpers/signup.js';
import {login} from './helpers/login.js';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

// Middleware to parse form data
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
    res.json({ id: userId, username: req.user.username });
})

//Get requests

app.get('/login', (req, res)=>{
    res.sendFile(path.join(__dirname, 'public', 'login', 'login.html'))
})

app.get('/signup', (req, res)=>{
    res.sendFile(path.join(__dirname, 'public', 'signup', 'signup.html'))
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

wss.on('connection', (ws) => {
    console.log('Client connected, uid created');

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
