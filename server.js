const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const { router: apiRoutes, setWhatsAppClient } = require('./routes/api');
const authRoutes = require('./routes/auth');
const { router: paymentRoutes, setWhatsAppClient: setPaymentWhatsAppClient } = require('./routes/payment');

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
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api', apiRoutes);

// Auth routes
app.use('/auth', authRoutes);

// Payment routes
app.use('/payment', paymentRoutes);

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Serve the main HTML file for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export the server, io, app, and setWhatsAppClient for use in index.js
module.exports = { server, io, app, setWhatsAppClient, setPaymentWhatsAppClient };
