const express = require('express');
const router = express.Router();
const { requireAuth, redirectIfAuthenticated, checkSession } = require('../middleware/auth');
const { getAllGroupsSettings, updateGroupSettings } = require('../utils/groupSettings');
const fs = require('fs');
const path = require('path');

// Login page
router.get('/login', redirectIfAuthenticated, (req, res) => {
    const error = req.query.error;
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bot Lords Mobile - Login</title>

            <!-- Bootstrap 5 CSS -->
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <!-- Bootstrap Icons -->
            <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet">

            <style>
                body {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }

                .login-card {
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }

                .login-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 2rem;
                    text-align: center;
                }

                .login-body {
                    padding: 2rem;
                }

                .form-control:focus {
                    border-color: #667eea;
                    box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
                }

                .btn-login {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    padding: 0.75rem;
                    font-weight: 500;
                    transition: transform 0.2s ease;
                }

                .btn-login:hover {
                    transform: translateY(-2px);
                    background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
                }

                .error-alert {
                    border-left: 4px solid #dc3545;
                }
            </style>
        </head>
        <body>
            <div class="container-fluid d-flex align-items-center justify-content-center min-vh-100">
                <div class="row w-100 justify-content-center">
                    <div class="col-md-6 col-lg-4">
                        <div class="login-card">
                            <div class="login-header">
                                <h3 class="mb-2">
                                    <i class="bi bi-robot fs-2"></i>
                                </h3>
                                <h4 class="mb-1">Bot Lords Mobile</h4>
                                <p class="mb-0 opacity-75">Dashboard Admin</p>
                            </div>

                            <div class="login-body">
                                ${error ? `
                                    <div class="alert alert-danger error-alert" role="alert">
                                        <i class="bi bi-exclamation-triangle me-2"></i>
                                        ${error}
                                    </div>
                                ` : ''}

                                <form method="POST" action="/dashboard/login">
                                    <div class="mb-3">
                                        <label for="username" class="form-label">
                                            <i class="bi bi-person me-2"></i>Username
                                        </label>
                                        <input type="text" class="form-control" id="username" name="username" required>
                                    </div>

                                    <div class="mb-4">
                                        <label for="password" class="form-label">
                                            <i class="bi bi-lock me-2"></i>Password
                                        </label>
                                        <input type="password" class="form-control" id="password" name="password" required>
                                    </div>

                                    <button type="submit" class="btn btn-primary btn-login w-100">
                                        <i class="bi bi-box-arrow-in-right me-2"></i>Login
                                    </button>
                                </form>

                                <div class="text-center mt-4">
                                    <small class="text-muted">© 2025 Bot Lords Mobile Dashboard</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bootstrap 5 JS -->
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
        </body>
        </html>
    `);
});

// Login POST
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    const validUsername = process.env.DASHBOARD_USERNAME || 'admin';
    const validPassword = process.env.DASHBOARD_PASSWORD || 'admin123';
    
    if (username === validUsername && password === validPassword) {
        req.session.authenticated = true;
        req.session.username = username;
        res.redirect('/dashboard');
    } else {
        res.redirect('/dashboard/login?error=Invalid username or password');
    }
});

// Dashboard main page
router.get('/', checkSession, (req, res) => {
    const { createLayout } = require('../views/layout');
    const allGroups = getAllGroupsSettings();
    const groupCount = Object.keys(allGroups).length;

    let activeGroups = 0;
    let rentGroups = 0;

    for (const [, settings] of Object.entries(allGroups)) {
        if (settings.botEnabled !== false) activeGroups++;
        if (settings.rentMode) rentGroups++;
    }
    
    const content = `
        <!-- Statistics Cards -->
        <div class="row mb-4">
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="stat-card">
                    <div class="stat-icon bg-primary text-white">
                        <i class="bi bi-people"></i>
                    </div>
                    <h3 class="stat-number">${groupCount}</h3>
                    <p class="stat-label">Total Groups</p>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="stat-card">
                    <div class="stat-icon bg-success text-white">
                        <i class="bi bi-check-circle"></i>
                    </div>
                    <h3 class="stat-number">${activeGroups}</h3>
                    <p class="stat-label">Active Groups</p>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="stat-card">
                    <div class="stat-icon bg-warning text-white">
                        <i class="bi bi-credit-card"></i>
                    </div>
                    <h3 class="stat-number">${rentGroups}</h3>
                    <p class="stat-label">Rent Groups</p>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="stat-card">
                    <div class="stat-icon bg-info text-white">
                        <i class="bi bi-gift"></i>
                    </div>
                    <h3 class="stat-number">${activeGroups - rentGroups}</h3>
                    <p class="stat-label">Free Groups</p>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="row mb-4">
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="bi bi-lightning me-2"></i>Quick Actions</h5>
                    </div>
                    <div class="card-body">
                        <div class="d-grid gap-2">
                            <a href="/dashboard/groups" class="btn btn-primary">
                                <i class="bi bi-people me-2"></i>Manage Groups
                            </a>
                            <a href="/dashboard/settings" class="btn btn-outline-primary">
                                <i class="bi bi-gear me-2"></i>Bot Settings
                            </a>
                            <a href="/dashboard/hell-events" class="btn btn-outline-primary">
                                <i class="bi bi-fire me-2"></i>Hell Events
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="bi bi-info-circle me-2"></i>System Status</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-6">
                                <small class="text-muted">Bot Owner</small>
                                <p class="mb-2">${process.env.BOT_OWNER_NUMBER || 'Not set'}</p>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Timezone</small>
                                <p class="mb-2">GMT+${process.env.TIMEZONE_OFFSET || '7'}</p>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Hell Events</small>
                                <p class="mb-2">
                                    <span class="badge ${process.env.ONLY_WATCHER_CHAOS === 'true' ? 'bg-warning' : 'bg-success'}">
                                        ${process.env.ONLY_WATCHER_CHAOS === 'true' ? 'Watcher/Chaos Only' : 'All Events'}
                                    </span>
                                </p>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Payment Mode</small>
                                <p class="mb-2">
                                    <span class="badge ${process.env.XENDIT_IS_PRODUCTION === 'true' ? 'bg-success' : 'bg-secondary'}">
                                        ${process.env.XENDIT_IS_PRODUCTION === 'true' ? 'Production' : 'Development'}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="bi bi-clock-history me-2"></i>Recent Activity</h5>
                    </div>
                    <div class="card-body">
                        <div class="list-group list-group-flush">
                            <div class="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <i class="bi bi-robot text-primary me-2"></i>
                                    <strong>Bot Started</strong>
                                    <small class="text-muted d-block">System initialized successfully</small>
                                </div>
                                <small class="text-muted">Just now</small>
                            </div>
                            <div class="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <i class="bi bi-people text-success me-2"></i>
                                    <strong>${activeGroups} Groups Active</strong>
                                    <small class="text-muted d-block">Bot is responding to commands</small>
                                </div>
                                <small class="text-muted">Active</small>
                            </div>
                            <div class="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <i class="bi bi-fire text-warning me-2"></i>
                                    <strong>Hell Event Monitor</strong>
                                    <small class="text-muted d-block">Monitoring Discord for Hell Events</small>
                                </div>
                                <small class="text-muted">Running</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    res.send(createLayout('Dashboard', content, 'dashboard', req.session.username));
});

// Settings page
router.get('/settings', checkSession, (req, res) => {
    const { createLayout } = require('../views/layout');

    const content = `
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="bi bi-gear me-2"></i>Bot Settings</h5>
                    </div>
                    <div class="card-body">
                        <form method="POST" action="/dashboard/update-global-settings">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="only_watcher_chaos" class="form-label">
                                        <i class="bi bi-fire me-2"></i>Global Hell Event Filter
                                    </label>
                                    <select name="only_watcher_chaos" id="only_watcher_chaos" class="form-select">
                                        <option value="false" ${process.env.ONLY_WATCHER_CHAOS !== 'true' ? 'selected' : ''}>All Hell Events</option>
                                        <option value="true" ${process.env.ONLY_WATCHER_CHAOS === 'true' ? 'selected' : ''}>Watcher & Chaos Dragon Only</option>
                                    </select>
                                    <div class="form-text">Choose which Hell Events to send globally (can be overridden per group)</div>
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="discord_channel" class="form-label">
                                        <i class="bi bi-discord me-2"></i>Discord Channel ID
                                    </label>
                                    <input type="text" name="discord_channel" id="discord_channel" class="form-control"
                                           value="${process.env.DISCORD_CHANNEL_ID || ''}" placeholder="Discord Channel ID">
                                    <div class="form-text">Discord channel to monitor for Hell Events</div>
                                </div>

                                <div class="col-12 mb-3">
                                    <label for="whatsapp_groups" class="form-label">
                                        <i class="bi bi-whatsapp me-2"></i>WhatsApp Group IDs
                                    </label>
                                    <textarea name="whatsapp_groups" id="whatsapp_groups" class="form-control" rows="3"
                                              placeholder="Group1@g.us,Group2@g.us,Group3@g.us">${process.env.WHATSAPP_GROUP_IDS || ''}</textarea>
                                    <div class="form-text">Comma-separated list of WhatsApp group IDs to send notifications</div>
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="bot_owner" class="form-label">
                                        <i class="bi bi-person-badge me-2"></i>Bot Owner Number
                                    </label>
                                    <input type="text" name="bot_owner" id="bot_owner" class="form-control"
                                           value="${process.env.BOT_OWNER_NUMBER || ''}" placeholder="6282211219993">
                                    <div class="form-text">WhatsApp number of bot owner (without + or country code)</div>
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="timezone_offset" class="form-label">
                                        <i class="bi bi-clock me-2"></i>Timezone Offset
                                    </label>
                                    <select name="timezone_offset" id="timezone_offset" class="form-select">
                                        <option value="7" ${process.env.TIMEZONE_OFFSET === '7' ? 'selected' : ''}>GMT+7 (WIB)</option>
                                        <option value="8" ${process.env.TIMEZONE_OFFSET === '8' ? 'selected' : ''}>GMT+8 (WITA)</option>
                                        <option value="9" ${process.env.TIMEZONE_OFFSET === '9' ? 'selected' : ''}>GMT+9 (WIT)</option>
                                    </select>
                                    <div class="form-text">Timezone for monster reset and other scheduled tasks</div>
                                </div>
                            </div>

                            <div class="d-flex justify-content-between">
                                <button type="submit" class="btn btn-primary">
                                    <i class="bi bi-check-lg me-2"></i>Save Settings
                                </button>
                                <a href="/dashboard" class="btn btn-outline-secondary">
                                    <i class="bi bi-arrow-left me-2"></i>Back to Dashboard
                                </a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <!-- System Information -->
        <div class="row mt-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="bi bi-info-circle me-2"></i>System Information</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3 mb-3">
                                <small class="text-muted">Base URL</small>
                                <p class="mb-0">${process.env.BASE_URL || 'Not set'}</p>
                            </div>
                            <div class="col-md-3 mb-3">
                                <small class="text-muted">Xendit Mode</small>
                                <p class="mb-0">
                                    <span class="badge ${process.env.XENDIT_IS_PRODUCTION === 'true' ? 'bg-success' : 'bg-secondary'}">
                                        ${process.env.XENDIT_IS_PRODUCTION === 'true' ? 'Production' : 'Development'}
                                    </span>
                                </p>
                            </div>
                            <div class="col-md-3 mb-3">
                                <small class="text-muted">Node.js Version</small>
                                <p class="mb-0">${process.version}</p>
                            </div>
                            <div class="col-md-3 mb-3">
                                <small class="text-muted">Uptime</small>
                                <p class="mb-0">${Math.floor(process.uptime() / 60)} minutes</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    res.send(createLayout('Bot Settings', content, 'settings', req.session.username));
});

// Update global settings
router.post('/update-global-settings', checkSession, (req, res) => {
    const { only_watcher_chaos, discord_channel, whatsapp_groups } = req.body;
    
    // Update .env file (in production, you might want to use a database)
    const fs = require('fs');
    const path = require('path');
    
    try {
        const envPath = path.join(__dirname, '..', '.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // Update ONLY_WATCHER_CHAOS
        envContent = envContent.replace(
            /ONLY_WATCHER_CHAOS=.*/,
            `ONLY_WATCHER_CHAOS=${only_watcher_chaos}`
        );
        
        // Update DISCORD_CHANNEL_ID
        if (discord_channel) {
            envContent = envContent.replace(
                /DISCORD_CHANNEL_ID=.*/,
                `DISCORD_CHANNEL_ID=${discord_channel}`
            );
        }
        
        // Update WHATSAPP_GROUP_IDS
        if (whatsapp_groups) {
            envContent = envContent.replace(
                /WHATSAPP_GROUP_IDS=.*/,
                `WHATSAPP_GROUP_IDS=${whatsapp_groups}`
            );
        }
        
        fs.writeFileSync(envPath, envContent);
        
        // Update process.env
        process.env.ONLY_WATCHER_CHAOS = only_watcher_chaos;
        if (discord_channel) process.env.DISCORD_CHANNEL_ID = discord_channel;
        if (whatsapp_groups) process.env.WHATSAPP_GROUP_IDS = whatsapp_groups;
        
        res.redirect('/dashboard?success=Settings updated successfully');
    } catch (error) {
        console.error('Error updating settings:', error);
        res.redirect('/dashboard?error=Failed to update settings');
    }
});

// Statistics page
router.get('/statistics', checkSession, (req, res) => {
    const { createLayout } = require('../views/layout');
    const allGroups = getAllGroupsSettings();

    // Calculate statistics
    let totalGroups = Object.keys(allGroups).length;
    let activeGroups = 0;
    let rentGroups = 0;
    let freeGroups = 0;
    let hellAllGroups = 0;
    let hellWatcherChaosGroups = 0;
    let hellOffGroups = 0;

    for (const [, settings] of Object.entries(allGroups)) {
        if (settings.botEnabled !== false) activeGroups++;
        if (settings.rentMode) rentGroups++;
        else if (settings.botEnabled !== false) freeGroups++;

        const hellSetting = settings.hellNotifications || 'all';
        if (hellSetting === 'all') hellAllGroups++;
        else if (hellSetting === 'watcherchaos') hellWatcherChaosGroups++;
        else if (hellSetting === 'off') hellOffGroups++;
    }

    const content = `
        <!-- Statistics Overview -->
        <div class="row mb-4">
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="stat-card">
                    <div class="stat-icon bg-primary text-white">
                        <i class="bi bi-people"></i>
                    </div>
                    <h3 class="stat-number">${totalGroups}</h3>
                    <p class="stat-label">Total Groups</p>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="stat-card">
                    <div class="stat-icon bg-success text-white">
                        <i class="bi bi-check-circle"></i>
                    </div>
                    <h3 class="stat-number">${activeGroups}</h3>
                    <p class="stat-label">Active Groups</p>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="stat-card">
                    <div class="stat-icon bg-warning text-white">
                        <i class="bi bi-credit-card"></i>
                    </div>
                    <h3 class="stat-number">${rentGroups}</h3>
                    <p class="stat-label">Rent Groups</p>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="stat-card">
                    <div class="stat-icon bg-info text-white">
                        <i class="bi bi-gift"></i>
                    </div>
                    <h3 class="stat-number">${freeGroups}</h3>
                    <p class="stat-label">Free Groups</p>
                </div>
            </div>
        </div>

        <!-- Hell Event Statistics -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="bi bi-fire me-2"></i>Hell Event Statistics</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <div class="text-center">
                                    <div class="stat-icon bg-success text-white mx-auto mb-2" style="width: 60px; height: 60px;">
                                        <i class="bi bi-check-all"></i>
                                    </div>
                                    <h4 class="text-success">${hellAllGroups}</h4>
                                    <p class="text-muted">All Events</p>
                                </div>
                            </div>
                            <div class="col-md-4 mb-3">
                                <div class="text-center">
                                    <div class="stat-icon bg-warning text-white mx-auto mb-2" style="width: 60px; height: 60px;">
                                        <i class="bi bi-filter"></i>
                                    </div>
                                    <h4 class="text-warning">${hellWatcherChaosGroups}</h4>
                                    <p class="text-muted">Watcher & Chaos Only</p>
                                </div>
                            </div>
                            <div class="col-md-4 mb-3">
                                <div class="text-center">
                                    <div class="stat-icon bg-danger text-white mx-auto mb-2" style="width: 60px; height: 60px;">
                                        <i class="bi bi-x-circle"></i>
                                    </div>
                                    <h4 class="text-danger">${hellOffGroups}</h4>
                                    <p class="text-muted">Disabled</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- System Performance -->
        <div class="row mb-4">
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="bi bi-cpu me-2"></i>System Performance</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-6 mb-3">
                                <small class="text-muted">Memory Usage</small>
                                <p class="mb-0">${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB</p>
                            </div>
                            <div class="col-6 mb-3">
                                <small class="text-muted">Uptime</small>
                                <p class="mb-0">${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m</p>
                            </div>
                            <div class="col-6 mb-3">
                                <small class="text-muted">Node.js Version</small>
                                <p class="mb-0">${process.version}</p>
                            </div>
                            <div class="col-6 mb-3">
                                <small class="text-muted">Platform</small>
                                <p class="mb-0">${process.platform}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="bi bi-activity me-2"></i>Bot Activity</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-6 mb-3">
                                <small class="text-muted">Active Rate</small>
                                <p class="mb-0">${totalGroups > 0 ? Math.round((activeGroups / totalGroups) * 100) : 0}%</p>
                            </div>
                            <div class="col-6 mb-3">
                                <small class="text-muted">Rent Rate</small>
                                <p class="mb-0">${totalGroups > 0 ? Math.round((rentGroups / totalGroups) * 100) : 0}%</p>
                            </div>
                            <div class="col-6 mb-3">
                                <small class="text-muted">Hell Events</small>
                                <p class="mb-0">
                                    <span class="badge ${process.env.ONLY_WATCHER_CHAOS === 'true' ? 'bg-warning' : 'bg-success'}">
                                        ${process.env.ONLY_WATCHER_CHAOS === 'true' ? 'Filtered' : 'All'}
                                    </span>
                                </p>
                            </div>
                            <div class="col-6 mb-3">
                                <small class="text-muted">Payment Mode</small>
                                <p class="mb-0">
                                    <span class="badge ${process.env.XENDIT_IS_PRODUCTION === 'true' ? 'bg-success' : 'bg-secondary'}">
                                        ${process.env.XENDIT_IS_PRODUCTION === 'true' ? 'Live' : 'Test'}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Group Distribution Chart -->
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="bi bi-pie-chart me-2"></i>Group Distribution</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>By Status</h6>
                                <div class="progress mb-3" style="height: 25px;">
                                    <div class="progress-bar bg-success" role="progressbar"
                                         style="width: ${totalGroups > 0 ? (activeGroups / totalGroups) * 100 : 0}%">
                                        Active (${activeGroups})
                                    </div>
                                    <div class="progress-bar bg-danger" role="progressbar"
                                         style="width: ${totalGroups > 0 ? ((totalGroups - activeGroups) / totalGroups) * 100 : 0}%">
                                        Inactive (${totalGroups - activeGroups})
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6>By Type</h6>
                                <div class="progress mb-3" style="height: 25px;">
                                    <div class="progress-bar bg-warning" role="progressbar"
                                         style="width: ${totalGroups > 0 ? (rentGroups / totalGroups) * 100 : 0}%">
                                        Rent (${rentGroups})
                                    </div>
                                    <div class="progress-bar bg-info" role="progressbar"
                                         style="width: ${totalGroups > 0 ? (freeGroups / totalGroups) * 100 : 0}%">
                                        Free (${freeGroups})
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    res.send(createLayout('Statistics', content, 'statistics', req.session.username));
});

// Logs page
router.get('/logs', checkSession, (req, res) => {
    const { createLayout } = require('../views/layout');

    const content = `
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0"><i class="bi bi-terminal me-2"></i>System Logs</h5>
                        <div>
                            <button class="btn btn-outline-primary btn-sm" onclick="refreshLogs()">
                                <i class="bi bi-arrow-clockwise me-1"></i>Refresh
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="clearLogs()">
                                <i class="bi bi-trash me-1"></i>Clear
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="bg-dark text-light p-3 rounded" style="height: 500px; overflow-y: auto; font-family: 'Courier New', monospace; font-size: 0.9rem;" id="logContainer">
                            <div id="logContent">
                                <div class="text-success">[${new Date().toISOString()}] System started</div>
                                <div class="text-info">[${new Date().toISOString()}] WhatsApp client ready</div>
                                <div class="text-info">[${new Date().toISOString()}] Discord client connected</div>
                                <div class="text-warning">[${new Date().toISOString()}] Monster reset scheduler started</div>
                                <div class="text-warning">[${new Date().toISOString()}] Rent expiry scheduler started</div>
                                <div class="text-success">[${new Date().toISOString()}] All systems operational</div>
                                <div class="text-muted">--- Real-time logs will appear here ---</div>
                            </div>
                        </div>
                        <div class="mt-3">
                            <small class="text-muted">
                                <i class="bi bi-info-circle me-1"></i>
                                Logs are updated in real-time. Use the refresh button to reload or clear to empty the log.
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Log Controls -->
        <div class="row mt-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0"><i class="bi bi-funnel me-2"></i>Log Filters</h6>
                    </div>
                    <div class="card-body">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="showInfo" checked>
                            <label class="form-check-label text-info" for="showInfo">
                                Info Messages
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="showWarning" checked>
                            <label class="form-check-label text-warning" for="showWarning">
                                Warning Messages
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="showError" checked>
                            <label class="form-check-label text-danger" for="showError">
                                Error Messages
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="showSuccess" checked>
                            <label class="form-check-label text-success" for="showSuccess">
                                Success Messages
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0"><i class="bi bi-download me-2"></i>Export Logs</h6>
                    </div>
                    <div class="card-body">
                        <p class="text-muted mb-3">Download logs for external analysis</p>
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-primary" onclick="downloadLogs('txt')">
                                <i class="bi bi-file-text me-2"></i>Download as TXT
                            </button>
                            <button class="btn btn-outline-success" onclick="downloadLogs('json')">
                                <i class="bi bi-file-code me-2"></i>Download as JSON
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Auto-refresh logs every 5 seconds
            setInterval(refreshLogs, 5000);

            function refreshLogs() {
                // Simulate new log entries
                const logContainer = document.getElementById('logContent');
                const now = new Date().toISOString();
                const messages = [
                    { type: 'info', text: 'WhatsApp message processed' },
                    { type: 'success', text: 'Hell Event notification sent' },
                    { type: 'warning', text: 'Group rent expiring soon' },
                    { type: 'info', text: 'Monster rotation updated' }
                ];

                if (Math.random() > 0.7) { // 30% chance to add new log
                    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                    const logEntry = document.createElement('div');
                    logEntry.className = 'text-' + (randomMessage.type === 'info' ? 'info' :
                                                   randomMessage.type === 'success' ? 'success' :
                                                   randomMessage.type === 'warning' ? 'warning' : 'danger');
                    logEntry.textContent = '[' + now + '] ' + randomMessage.text;
                    logContainer.appendChild(logEntry);

                    // Auto-scroll to bottom
                    const container = document.getElementById('logContainer');
                    container.scrollTop = container.scrollHeight;
                }
            }

            function clearLogs() {
                if (confirm('Are you sure you want to clear all logs?')) {
                    document.getElementById('logContent').innerHTML =
                        '<div class="text-muted">--- Logs cleared ---</div>';
                }
            }

            function downloadLogs(format) {
                const logs = document.getElementById('logContent').innerText;
                const blob = new Blob([logs], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'bot-logs-' + new Date().toISOString().split('T')[0] + '.' + format;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
        </script>
    `;

    res.send(createLayout('System Logs', content, 'logs', req.session.username));
});

// Hell Events page
router.get('/hell-events', checkSession, (req, res) => {
    const { createLayout } = require('../views/layout');

    const content = `
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="bi bi-fire me-2"></i>Hell Event Management</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <h6>Global Settings</h6>
                                <p class="text-muted">Current global Hell Event filter setting</p>
                                <div class="alert ${process.env.ONLY_WATCHER_CHAOS === 'true' ? 'alert-warning' : 'alert-success'}" role="alert">
                                    <i class="bi bi-${process.env.ONLY_WATCHER_CHAOS === 'true' ? 'filter' : 'check-all'} me-2"></i>
                                    <strong>Global Filter:</strong>
                                    ${process.env.ONLY_WATCHER_CHAOS === 'true' ? 'Watcher & Chaos Dragon Only' : 'All Hell Events'}
                                </div>
                                <a href="/dashboard/settings" class="btn btn-outline-primary">
                                    <i class="bi bi-gear me-2"></i>Change Global Settings
                                </a>
                            </div>
                            <div class="col-md-6 mb-3">
                                <h6>Command Usage</h6>
                                <p class="text-muted">Users can override global settings per group</p>
                                <div class="bg-light p-3 rounded">
                                    <code>!hell all</code> - Show all Hell Events<br>
                                    <code>!hell watcherchaos</code> - Watcher & Chaos only<br>
                                    <code>!hell off</code> - Disable notifications<br>
                                    <code>!hell status</code> - Check current setting
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Hell Event Statistics -->
        <div class="row mb-4">
            <div class="col-md-4 mb-3">
                <div class="card text-center">
                    <div class="card-body">
                        <div class="stat-icon bg-success text-white mx-auto mb-3">
                            <i class="bi bi-check-all"></i>
                        </div>
                        <h4 class="text-success">All Events</h4>
                        <p class="text-muted">Groups receiving all Hell Events</p>
                        <h2 class="mb-0">${Object.values(getAllGroupsSettings()).filter(s => (s.hellNotifications || 'all') === 'all').length}</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="card text-center">
                    <div class="card-body">
                        <div class="stat-icon bg-warning text-white mx-auto mb-3">
                            <i class="bi bi-filter"></i>
                        </div>
                        <h4 class="text-warning">Filtered</h4>
                        <p class="text-muted">Groups with Watcher & Chaos only</p>
                        <h2 class="mb-0">${Object.values(getAllGroupsSettings()).filter(s => s.hellNotifications === 'watcherchaos').length}</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="card text-center">
                    <div class="card-body">
                        <div class="stat-icon bg-danger text-white mx-auto mb-3">
                            <i class="bi bi-x-circle"></i>
                        </div>
                        <h4 class="text-danger">Disabled</h4>
                        <p class="text-muted">Groups with notifications off</p>
                        <h2 class="mb-0">${Object.values(getAllGroupsSettings()).filter(s => s.hellNotifications === 'off').length}</h2>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Hell Events -->
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0"><i class="bi bi-clock-history me-2"></i>Recent Hell Events</h5>
                        <button class="btn btn-outline-primary btn-sm" onclick="refreshEvents()">
                            <i class="bi bi-arrow-clockwise me-1"></i>Refresh
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>Event</th>
                                        <th>Task</th>
                                        <th>Duration</th>
                                        <th>Points</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody id="eventsTable">
                                    <tr>
                                        <td>${new Date().toLocaleString()}</td>
                                        <td><span class="badge bg-success">Watcher</span></td>
                                        <td>Kill 500 monsters</td>
                                        <td>45 minutes</td>
                                        <td>2.5K</td>
                                        <td><span class="badge bg-success">Sent</span></td>
                                    </tr>
                                    <tr>
                                        <td>${new Date(Date.now() - 3600000).toLocaleString()}</td>
                                        <td><span class="badge bg-warning">Ancient Core</span></td>
                                        <td>Complete 10 quests</td>
                                        <td>60 minutes</td>
                                        <td>1.8K</td>
                                        <td><span class="badge bg-secondary">Filtered</span></td>
                                    </tr>
                                    <tr>
                                        <td>${new Date(Date.now() - 7200000).toLocaleString()}</td>
                                        <td><span class="badge bg-success">Chaos Dragon</span></td>
                                        <td>Gather 1M resources</td>
                                        <td>30 minutes</td>
                                        <td>3.2K</td>
                                        <td><span class="badge bg-success">Sent</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="text-center mt-3">
                            <small class="text-muted">
                                <i class="bi bi-info-circle me-1"></i>
                                Events are automatically detected from Discord and sent to configured groups
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            function refreshEvents() {
                // Simulate refresh
                const button = event.target.closest('button');
                const icon = button.querySelector('i');
                icon.classList.add('fa-spin');

                setTimeout(() => {
                    icon.classList.remove('fa-spin');
                    // You can add actual refresh logic here
                }, 1000);
            }
        </script>
    `;

    res.send(createLayout('Hell Events', content, 'hell-events', req.session.username));
});

// Group management page with pagination
router.get('/groups', checkSession, (req, res) => {
    const { createLayout } = require('../views/layout');
    const allGroups = getAllGroupsSettings();
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Groups per page
    const offset = (page - 1) * limit;

    const groupEntries = Object.entries(allGroups);
    const totalGroups = groupEntries.length;
    const totalPages = Math.ceil(totalGroups / limit);
    const paginatedGroups = groupEntries.slice(offset, offset + limit);

    // Build table rows for paginated groups
    let groupRows = '';
    for (const [groupId, settings] of paginatedGroups) {
        const isActive = settings.botEnabled !== false;
        const isRent = settings.rentMode;
        const hellNotifications = settings.hellNotifications || 'all';

        groupRows += `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="bi bi-people me-2 text-primary"></i>
                        <div>
                            <strong>${groupId.length > 30 ? groupId.substring(0, 30) + '...' : groupId}</strong>
                            <small class="d-block text-muted">${groupId}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge ${isActive ? 'bg-success' : 'bg-danger'}">
                        <i class="bi bi-${isActive ? 'check-circle' : 'x-circle'} me-1"></i>
                        ${isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <span class="badge ${isRent ? 'bg-warning' : 'bg-info'}">
                        <i class="bi bi-${isRent ? 'credit-card' : 'gift'} me-1"></i>
                        ${isRent ? 'Rent' : 'Free'}
                    </span>
                    ${isRent && settings.rentExpiry ? `<small class="d-block text-muted">Expires: ${new Date(settings.rentExpiry).toLocaleDateString()}</small>` : ''}
                </td>
                <td>
                    <form method="POST" action="/dashboard/update-group-settings" class="d-inline">
                        <input type="hidden" name="groupId" value="${groupId}">
                        <select name="hellNotifications" class="form-select form-select-sm" onchange="this.form.submit()">
                            <option value="all" ${hellNotifications === 'all' ? 'selected' : ''}>All Events</option>
                            <option value="watcherchaos" ${hellNotifications === 'watcherchaos' ? 'selected' : ''}>Watcher & Chaos</option>
                            <option value="off" ${hellNotifications === 'off' ? 'selected' : ''}>Disabled</option>
                        </select>
                    </form>
                </td>
                <td>
                    <form method="POST" action="/dashboard/toggle-bot" class="d-inline">
                        <input type="hidden" name="groupId" value="${groupId}">
                        <button type="submit" class="btn btn-sm ${isActive ? 'btn-outline-danger' : 'btn-outline-success'}">
                            <i class="bi bi-${isActive ? 'stop' : 'play'} me-1"></i>
                            ${isActive ? 'Disable' : 'Enable'}
                        </button>
                    </form>
                </td>
            </tr>
        `;
    }

    // Generate pagination
    let paginationHtml = '';
    if (totalPages > 1) {
        paginationHtml = '<nav aria-label="Group pagination"><ul class="pagination justify-content-center">';

        // Previous button
        if (page > 1) {
            paginationHtml += `<li class="page-item"><a class="page-link" href="?page=${page - 1}">Previous</a></li>`;
        } else {
            paginationHtml += '<li class="page-item disabled"><span class="page-link">Previous</span></li>';
        }

        // Page numbers
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(totalPages, page + 2);

        if (startPage > 1) {
            paginationHtml += '<li class="page-item"><a class="page-link" href="?page=1">1</a></li>';
            if (startPage > 2) {
                paginationHtml += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            if (i === page) {
                paginationHtml += `<li class="page-item active"><span class="page-link">${i}</span></li>`;
            } else {
                paginationHtml += `<li class="page-item"><a class="page-link" href="?page=${i}">${i}</a></li>`;
            }
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHtml += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            paginationHtml += `<li class="page-item"><a class="page-link" href="?page=${totalPages}">${totalPages}</a></li>`;
        }

        // Next button
        if (page < totalPages) {
            paginationHtml += `<li class="page-item"><a class="page-link" href="?page=${page + 1}">Next</a></li>`;
        } else {
            paginationHtml += '<li class="page-item disabled"><span class="page-link">Next</span></li>';
        }

        paginationHtml += '</ul></nav>';
    }

    const content = `
        <!-- Statistics Summary -->
        <div class="row mb-4">
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="stat-card">
                    <div class="stat-icon bg-primary text-white">
                        <i class="bi bi-people"></i>
                    </div>
                    <h3 class="stat-number">${totalGroups}</h3>
                    <p class="stat-label">Total Groups</p>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="stat-card">
                    <div class="stat-icon bg-success text-white">
                        <i class="bi bi-check-circle"></i>
                    </div>
                    <h3 class="stat-number">${Object.values(allGroups).filter(s => s.botEnabled !== false).length}</h3>
                    <p class="stat-label">Active Groups</p>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="stat-card">
                    <div class="stat-icon bg-warning text-white">
                        <i class="bi bi-credit-card"></i>
                    </div>
                    <h3 class="stat-number">${Object.values(allGroups).filter(s => s.rentMode).length}</h3>
                    <p class="stat-label">Rent Groups</p>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="stat-card">
                    <div class="stat-icon bg-info text-white">
                        <i class="bi bi-gift"></i>
                    </div>
                    <h3 class="stat-number">${Object.values(allGroups).filter(s => s.botEnabled !== false && !s.rentMode).length}</h3>
                    <p class="stat-label">Free Groups</p>
                </div>
            </div>
        </div>

        <!-- Groups Table -->
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0"><i class="bi bi-people me-2"></i>Group Management</h5>
                        <div>
                            <small class="text-muted">Page ${page} of ${totalPages} (${totalGroups} total groups)</small>
                        </div>
                    </div>
                    <div class="card-body">
                        ${totalGroups === 0 ? `
                            <div class="text-center py-5">
                                <i class="bi bi-people display-1 text-muted"></i>
                                <h4 class="mt-3">No Groups Found</h4>
                                <p class="text-muted">No WhatsApp groups are configured yet.</p>
                            </div>
                        ` : `
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Group</th>
                                            <th>Status</th>
                                            <th>Type</th>
                                            <th>Hell Notifications</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${groupRows}
                                    </tbody>
                                </table>
                            </div>

                            <!-- Pagination -->
                            ${paginationHtml}
                        `}
                    </div>
                </div>
            </div>
        </div>

        <!-- Bulk Actions -->
        <div class="row mt-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0"><i class="bi bi-lightning me-2"></i>Bulk Actions</h6>
                    </div>
                    <div class="card-body">
                        <p class="text-muted mb-3">Apply actions to all groups at once</p>
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-success" onclick="bulkAction('enable')">
                                <i class="bi bi-play me-2"></i>Enable All Groups
                            </button>
                            <button class="btn btn-outline-danger" onclick="bulkAction('disable')">
                                <i class="bi bi-stop me-2"></i>Disable All Groups
                            </button>
                            <button class="btn btn-outline-primary" onclick="bulkAction('hell-all')">
                                <i class="bi bi-fire me-2"></i>Set All to "All Hell Events"
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0"><i class="bi bi-info-circle me-2"></i>Group Information</h6>
                    </div>
                    <div class="card-body">
                        <p class="text-muted mb-3">Understanding group settings</p>
                        <ul class="list-unstyled">
                            <li class="mb-2">
                                <span class="badge bg-success me-2">Active</span>
                                Bot responds to commands
                            </li>
                            <li class="mb-2">
                                <span class="badge bg-warning me-2">Rent</span>
                                Paid subscription group
                            </li>
                            <li class="mb-2">
                                <span class="badge bg-info me-2">Free</span>
                                Free usage group
                            </li>
                            <li class="mb-2">
                                <i class="bi bi-fire text-warning me-2"></i>
                                Hell notifications can be customized per group
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <script>
            function bulkAction(action) {
                if (!confirm('Are you sure you want to apply this action to all groups?')) {
                    return;
                }

                // You can implement bulk actions here
                alert('Bulk action "' + action + '" would be applied to all groups');
            }
        </script>
    `;

    res.send(createLayout('Group Management', content, 'groups', req.session.username));
});

// Update group settings
router.post('/update-group-settings', checkSession, (req, res) => {
    const { groupId, hellNotifications } = req.body;

    try {
        updateGroupSettings(groupId, { hellNotifications });
        res.redirect('/dashboard/groups?success=Group settings updated');
    } catch (error) {
        console.error('Error updating group settings:', error);
        res.redirect('/dashboard/groups?error=Failed to update group settings');
    }
});

// Toggle bot status
router.post('/toggle-bot', checkSession, (req, res) => {
    const { groupId } = req.body;

    try {
        const currentSettings = getAllGroupsSettings()[groupId];
        const newStatus = !(currentSettings?.botEnabled !== false);

        updateGroupSettings(groupId, { botEnabled: newStatus });
        res.redirect('/dashboard/groups?success=Bot status updated');
    } catch (error) {
        console.error('Error toggling bot status:', error);
        res.redirect('/dashboard/groups?error=Failed to update bot status');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/dashboard/login');
});

module.exports = router;
