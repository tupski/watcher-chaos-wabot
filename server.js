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

// Middleware
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
