const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const session = require('express-session');
const { router: apiRoutes, setWhatsAppClient } = require('./routes/api');
const authRoutes = require('./routes/auth');
const { router: paymentRoutes, setWhatsAppClient: setPaymentWhatsAppClient } = require('./routes/payment');
const dashboardRoutes = require('./routes/dashboard');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware for webhook raw body capture
app.use('/payment/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
    // Store raw body for signature verification
    req.rawBody = req.body;
    // Parse JSON for processing
    try {
        if (Buffer.isBuffer(req.body)) {
            req.body = JSON.parse(req.body.toString());
        } else if (typeof req.body === 'string') {
            req.body = JSON.parse(req.body);
        } else if (typeof req.body === 'object' && req.body !== null) {
            // Already parsed, keep as is
        } else {
            throw new Error('Invalid body type');
        }
    } catch (error) {
        console.error('Error parsing webhook JSON:', error);
        return res.status(400).json({ error: 'Invalid JSON' });
    }
    next();
});

// Regular middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// API routes
app.use('/api', apiRoutes);

// Auth routes
app.use('/auth', authRoutes);

// Payment routes
app.use('/payment', paymentRoutes);

// Dashboard routes
app.use('/dashboard', dashboardRoutes);

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Root route - redirect based on authentication
app.get('/', (req, res) => {
    if (req.session && req.session.authenticated) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/dashboard/login');
    }
});

// Serve the main HTML file for other routes (except dashboard)
app.get('*', (req, res) => {
    // Don't serve index.html for dashboard routes
    if (req.path.startsWith('/dashboard')) {
        res.status(404).send('Dashboard route not found');
        return;
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export the server, io, app, and setWhatsAppClient for use in index.js
module.exports = { server, io, app, setWhatsAppClient, setPaymentWhatsAppClient };
