const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const session = require('express-session');
const { router: apiRoutes, setWhatsAppClient } = require('./routes/api');
const authRoutes = require('./routes/auth');

const dashboardRoutes = require('./routes/dashboard');
const { router: adminlteRoutes, setWhatsAppClientRef: setAdminLTEWhatsAppClientRef } = require('./routes/adminlte-routes');
const { router: apiGroupsRoutes, setWhatsAppClientRef: setApiGroupsWhatsAppClientRef } = require('./routes/api-groups');
const apiSettingsRoutes = require('./routes/api-settings');
const apiCommandsRoutes = require('./routes/api-commands');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);



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
app.use('/api/groups', apiGroupsRoutes);
app.use('/api/settings', apiSettingsRoutes);
app.use('/api/system', apiSettingsRoutes);
app.use('/api/commands', apiCommandsRoutes);

// Auth routes
app.use('/auth', authRoutes);



// Dashboard routes (original)
app.use('/dashboard-old', dashboardRoutes);

// AdminLTE Dashboard routes (new)
app.use('/dashboard', adminlteRoutes);

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/');
    });
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Root route - serve landing page
app.get('/', (req, res) => {
    console.log('Root route accessed, session:', req.session ? 'exists' : 'none');
    console.log('Authenticated:', req.session ? req.session.authenticated : 'no session');

    if (req.session && req.session.authenticated) {
        console.log('Redirecting to /dashboard');
        res.redirect('/dashboard');
    } else {
        console.log('Serving landing page');
        res.sendFile(path.join(__dirname, 'public', 'landing.html'));
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
module.exports = { server, io, app, setWhatsAppClient, setAdminLTEWhatsAppClientRef, setApiGroupsWhatsAppClientRef };
