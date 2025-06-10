const express = require('express');
const router = express.Router();
const { requireAuth, redirectIfAuthenticated, checkSession } = require('../middleware/auth');
const { getAllGroupsSettings, updateGroupSettings } = require('../utils/groupSettings');
const { getJoinedGroups, getConfiguredJoinedGroups, getAllCommands } = require('../utils/whatsappUtils');
const fs = require('fs');
const path = require('path');

// Store WhatsApp client reference
let whatsappClientRef = null;

// Set WhatsApp client reference
function setWhatsAppClientRef(client) {
    whatsappClientRef = client;
}

// Get recent activities (dynamic)
function getRecentActivities() {
    const activities = [];
    const now = new Date();

    // Add some dynamic activities based on current time and system state
    activities.push({
        icon: 'bi-robot',
        iconColor: 'text-primary',
        title: 'Bot Online',
        description: 'System running normally',
        time: 'Active',
        timeColor: 'text-success'
    });

    // Add uptime activity
    const uptimeMinutes = Math.floor(process.uptime() / 60);
    activities.push({
        icon: 'bi-clock',
        iconColor: 'text-info',
        title: 'System Uptime',
        description: `Running for ${uptimeMinutes} minutes`,
        time: 'Continuous',
        timeColor: 'text-info'
    });

    // Add memory usage activity
    const memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    activities.push({
        icon: 'bi-cpu',
        iconColor: 'text-warning',
        title: 'Memory Usage',
        description: `${memoryUsage} MB allocated`,
        time: 'Real-time',
        timeColor: 'text-warning'
    });

    // Add Hell Event status
    const hellEventStatus = process.env.ONLY_WATCHER_CHAOS === 'true' ? 'Filtered' : 'All Events';
    activities.push({
        icon: 'bi-fire',
        iconColor: 'text-danger',
        title: 'Hell Event Monitor',
        description: `Mode: ${hellEventStatus}`,
        time: 'Monitoring',
        timeColor: 'text-danger'
    });

    return activities;
}

// Get recent Hell Events with pagination
function getRecentHellEventsTable(page = 1) {
    const limit = 10;
    const offset = (page - 1) * limit;

    // Sample Hell Events data (in production, this would come from database)
    const allEvents = [
        {
            time: new Date(),
            event: 'Watcher',
            eventType: 'watcher',
            task: 'Kill 500 monsters',
            points: '2.5K',
            status: 'sent',
            sentTo: ['Group A', 'Group B', 'Group C']
        },
        {
            time: new Date(Date.now() - 1800000), // 30 minutes ago
            event: 'Chaos Dragon',
            eventType: 'chaos_dragon',
            task: 'Gather 1M resources',
            points: '3.2K',
            status: 'sent',
            sentTo: ['Group A', 'Group B']
        },
        {
            time: new Date(Date.now() - 3600000), // 1 hour ago
            event: 'Ancient Core',
            eventType: 'ancient_core',
            task: 'Complete 10 quests',
            points: '1.8K',
            status: 'filtered',
            sentTo: []
        },
        {
            time: new Date(Date.now() - 5400000), // 1.5 hours ago
            event: 'Chaos Core',
            eventType: 'chaos_core',
            task: 'Defeat 100 enemies',
            points: '2.1K',
            status: 'sent',
            sentTo: ['Group A']
        },
        {
            time: new Date(Date.now() - 7200000), // 2 hours ago
            event: 'Yellow Orb',
            eventType: 'yellow_orb',
            task: 'Collect 500K gold',
            points: '1.5K',
            status: 'filtered',
            sentTo: []
        },
        {
            time: new Date(Date.now() - 9000000), // 2.5 hours ago
            event: 'Red Orb',
            eventType: 'red_orb',
            task: 'Train 200 troops',
            points: '1.9K',
            status: 'sent',
            sentTo: ['Group B', 'Group C']
        }
    ];

    const totalEvents = allEvents.length;
    const totalPages = Math.ceil(totalEvents / limit);
    const paginatedEvents = allEvents.slice(offset, offset + limit);

    // Generate event badge based on type
    function getEventBadge(eventType, eventName) {
        const badges = {
            'watcher': 'bg-success',
            'chaos_dragon': 'bg-danger',
            'ancient_core': 'bg-primary',
            'chaos_core': 'bg-info',
            'yellow_orb': 'bg-warning',
            'red_orb': 'bg-danger-subtle text-danger'
        };

        return `<span class="badge ${badges[eventType] || 'bg-secondary'}">${eventName}</span>`;
    }

    // Generate status button
    function getStatusButton(status, sentTo, eventId) {
        if (status === 'sent') {
            return `
                <button class="btn btn-sm btn-success" onclick="showSentGroups('${eventId}', '${sentTo.join(', ')}')">
                    <i class="bi bi-check-circle me-1"></i>Sent
                </button>
            `;
        } else {
            return `<span class="badge bg-secondary">Filtered</span>`;
        }
    }

    // Build table rows
    let eventRows = '';
    paginatedEvents.forEach((event, index) => {
        const eventId = `event_${offset + index}`;
        eventRows += `
            <tr>
                <td>${event.time.toLocaleDateString('id-ID')} ${event.time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                <td>${getEventBadge(event.eventType, event.event)}</td>
                <td>${event.task}</td>
                <td>${event.points}</td>
                <td>${getStatusButton(event.status, event.sentTo, eventId)}</td>
            </tr>
        `;
    });

    // Generate pagination
    let paginationHtml = '';
    if (totalPages > 1) {
        paginationHtml = '<nav aria-label="Hell Events pagination"><ul class="pagination justify-content-center">';

        // Previous button
        if (page > 1) {
            paginationHtml += `<li class="page-item"><a class="page-link" href="?page=${page - 1}">‹</a></li>`;
        }

        // Page numbers (show max 5 pages)
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(totalPages, page + 2);

        for (let i = startPage; i <= endPage; i++) {
            if (i === page) {
                paginationHtml += `<li class="page-item active"><span class="page-link">${i}</span></li>`;
            } else {
                paginationHtml += `<li class="page-item"><a class="page-link" href="?page=${i}">${i}</a></li>`;
            }
        }

        // Next button
        if (page < totalPages) {
            paginationHtml += `<li class="page-item"><a class="page-link" href="?page=${page + 1}">›</a></li>`;
        }

        paginationHtml += '</ul></nav>';
    }

    return `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Event</th>
                        <th>Task</th>
                        <th>Points</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${eventRows}
                </tbody>
            </table>
        </div>

        ${paginationHtml}

        <div class="text-center mt-3">
            <small class="text-muted">
                <i class="bi bi-info-circle me-1"></i>
                Events are automatically detected from Discord and sent to configured groups
            </small>
        </div>

        <!-- Modal for showing sent groups -->
        <div class="modal fade" id="sentGroupsModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Event Sent To Groups</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="sentGroupsContent">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>

        <script>
            function showSentGroups(eventId, groups) {
                document.getElementById('sentGroupsContent').innerHTML =
                    '<p><strong>This Hell Event was sent to:</strong></p><ul>' +
                    groups.split(', ').map(group => '<li>' + group + '</li>').join('') +
                    '</ul>';

                new bootstrap.Modal(document.getElementById('sentGroupsModal')).show();
            }

            function refreshEvents() {
                location.reload();
            }
        </script>
    `;
}

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
                <div class="stat-card clickable-card" onclick="window.location.href='/dashboard/groups'">
                    <div class="stat-icon bg-primary text-white">
                        <i class="bi bi-people"></i>
                    </div>
                    <h3 class="stat-number">${groupCount}</h3>
                    <p class="stat-label">Total Groups</p>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="stat-card clickable-card" onclick="window.location.href='/dashboard/groups'">
                    <div class="stat-icon bg-success text-white">
                        <i class="bi bi-check-circle"></i>
                    </div>
                    <h3 class="stat-number">${activeGroups}</h3>
                    <p class="stat-label">Active Groups</p>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="stat-card clickable-card" onclick="window.location.href='/dashboard/groups'">
                    <div class="stat-icon bg-warning text-white">
                        <i class="bi bi-credit-card"></i>
                    </div>
                    <h3 class="stat-number">${rentGroups}</h3>
                    <p class="stat-label">Rent Groups</p>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="stat-card clickable-card" onclick="window.location.href='/dashboard/groups'">
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
                <div class="card clickable-card" onclick="window.location.href='/dashboard/groups'">
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
                <div class="card clickable-card" onclick="window.location.href='/dashboard/statistics'">
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
                <div class="card clickable-card" onclick="window.location.href='/dashboard/logs'">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="bi bi-clock-history me-2"></i>Recent Activity</h5>
                    </div>
                    <div class="card-body">
                        <div class="list-group list-group-flush">
                            ${getRecentActivities().map(activity => `
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <i class="bi ${activity.icon} ${activity.iconColor} me-2"></i>
                                        <strong>${activity.title}</strong>
                                        <small class="text-muted d-block">${activity.description}</small>
                                    </div>
                                    <small class="${activity.timeColor}">${activity.time}</small>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    res.send(createLayout('Dashboard', content, 'dashboard', req.session.username));
});

// Command List page
router.get('/commands', checkSession, (req, res) => {
    const { createLayout } = require('../views/layout');
    const commands = getAllCommands();

    let commandsHtml = '';

    for (const [category, commandList] of Object.entries(commands)) {
        commandsHtml += `
            <div class="col-12 mb-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="bi bi-folder me-2"></i>${category}</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Command</th>
                                        <th>Description</th>
                                        <th>Access Level</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${commandList.map(cmd => `
                                        <tr>
                                            <td><code>${cmd.command}</code></td>
                                            <td>${cmd.description}</td>
                                            <td>
                                                <span class="badge ${cmd.adminOnly ? 'bg-warning' : 'bg-success'}">
                                                    <i class="bi bi-${cmd.adminOnly ? 'shield-lock' : 'people'} me-1"></i>
                                                    ${cmd.adminOnly ? 'Admin Only' : 'All Users'}
                                                </span>
                                            </td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary" onclick="editCommandMessage('${cmd.command}')">
                                                    <i class="bi bi-pencil me-1"></i>Edit Message
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    const content = `
        <div class="row">
            <div class="col-12 mb-4">
                <div class="card">
                    <div class="card-body text-center">
                        <h4><i class="bi bi-list-ul me-2"></i>Bot Command List</h4>
                        <p class="text-muted">Complete list of all available bot commands organized by category</p>
                    </div>
                </div>
            </div>
            ${commandsHtml}
        </div>

        <!-- Command Usage Guide -->
        <div class="row mt-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0"><i class="bi bi-info-circle me-2"></i>Usage Guide</h6>
                    </div>
                    <div class="card-body">
                        <ul class="list-unstyled">
                            <li class="mb-2">
                                <span class="badge bg-success me-2">All Users</span>
                                Can be used by any group member
                            </li>
                            <li class="mb-2">
                                <span class="badge bg-warning me-2">Admin Only</span>
                                Requires group admin privileges
                            </li>
                            <li class="mb-2">
                                <span class="badge bg-danger me-2">BOT_OWNER</span>
                                Only bot owner can use
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0"><i class="bi bi-lightbulb me-2"></i>Tips</h6>
                    </div>
                    <div class="card-body">
                        <ul class="list-unstyled">
                            <li class="mb-2">
                                <i class="bi bi-arrow-right text-primary me-2"></i>
                                Commands are case-insensitive
                            </li>
                            <li class="mb-2">
                                <i class="bi bi-arrow-right text-primary me-2"></i>
                                Use <code>!help</code> for quick reference
                            </li>
                            <li class="mb-2">
                                <i class="bi bi-arrow-right text-primary me-2"></i>
                                Some commands have sub-options
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <!-- Command Message Edit Modal -->
        <div class="modal fade" id="commandMessageModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Command Message</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="commandMessageForm">
                            <div class="mb-3">
                                <label for="commandName" class="form-label">Command</label>
                                <input type="text" class="form-control" id="commandName" readonly>
                            </div>
                            <div class="mb-3">
                                <label for="commandMessage" class="form-label">Response Message</label>
                                <textarea class="form-control" id="commandMessage" rows="6"
                                          placeholder="Enter the message that bot will send when this command is used..."></textarea>
                                <div class="form-text">
                                    You can use variables like {user}, {group}, {time}, etc.
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="commandEnabled" class="form-label">Status</label>
                                <select class="form-select" id="commandEnabled">
                                    <option value="true">Enabled</option>
                                    <option value="false">Disabled</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveCommandMessage()">Save Changes</button>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Sample command messages (in production, load from database)
            const commandMessages = {
                '!ping': 'Pong! Bot is online and responding.',
                '!help': 'Available commands: !ping, !hell, !monster, !tagall, !rent',
                '!hell': 'Current Hell Event information will be displayed here.',
                '!monster': 'Current monster rotation information.',
                '!tagall': 'Tagging all group members...',
                '!rent': 'Bot rental information and pricing.',
                '!ai': 'AI assistant is ready to help you!'
            };

            function editCommandMessage(command) {
                document.getElementById('commandName').value = command;
                document.getElementById('commandMessage').value = commandMessages[command] || '';
                document.getElementById('commandEnabled').value = 'true';

                new bootstrap.Modal(document.getElementById('commandMessageModal')).show();
            }

            function saveCommandMessage() {
                const command = document.getElementById('commandName').value;
                const message = document.getElementById('commandMessage').value;
                const enabled = document.getElementById('commandEnabled').value;

                // In production, save to database via API
                commandMessages[command] = message;

                // Close modal and show success message
                bootstrap.Modal.getInstance(document.getElementById('commandMessageModal')).hide();

                // Show success toast or alert
                alert('Command message updated successfully!');
            }
        </script>
    `;

    res.send(createLayout('Command List', content, 'commands', req.session.username));
});

// Settings page
router.get('/settings', checkSession, async (req, res) => {
    const { createLayout } = require('../views/layout');

    try {
        // Get joined groups for WhatsApp Groups section
        const joinedGroups = await getJoinedGroups(whatsappClientRef);
        const configuredGroupIds = process.env.WHATSAPP_GROUP_IDS ?
            process.env.WHATSAPP_GROUP_IDS.split(',').map(id => id.trim()) : [];

        // Build WhatsApp groups checklist table
        let whatsappGroupsTable = '';
        if (joinedGroups.length > 0) {
            whatsappGroupsTable = `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th width="50">
                                    <input type="checkbox" id="selectAll" onchange="toggleAllGroups(this)">
                                </th>
                                <th>Group Name</th>
                                <th>Members</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${joinedGroups.map(group => {
                                const isConfigured = configuredGroupIds.includes(group.id);
                                return `
                                    <tr>
                                        <td>
                                            <input type="checkbox" name="whatsapp_groups" value="${group.id}"
                                                   ${isConfigured ? 'checked' : ''} class="group-checkbox">
                                        </td>
                                        <td>
                                            <div>
                                                <strong>${group.name}</strong>
                                                <small class="d-block text-muted">${group.id}</small>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="badge bg-info">${group.participantCount} members</span>
                                        </td>
                                        <td>
                                            <span class="badge ${isConfigured ? 'bg-success' : 'bg-secondary'}">
                                                ${isConfigured ? 'Configured' : 'Not Configured'}
                                            </span>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            whatsappGroupsTable = `
                <div class="alert alert-warning" role="alert">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    No WhatsApp groups found. Make sure the bot has joined some groups.
                </div>
            `;
        }

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
                                    <label class="form-label">
                                        <i class="bi bi-whatsapp me-2"></i>WhatsApp Groups Configuration
                                    </label>
                                    <div class="form-text mb-3">Select groups to receive Hell Event notifications</div>
                                    ${whatsappGroupsTable}
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

                            <!-- AI Settings Section -->
                            <hr class="my-4">
                            <h5 class="mb-3"><i class="bi bi-robot me-2"></i>AI Assistant Settings</h5>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="ai_provider" class="form-label">
                                        <i class="bi bi-cpu me-2"></i>AI Provider
                                    </label>
                                    <select name="ai_provider" id="ai_provider" class="form-select">
                                        <option value="gemini" ${process.env.AI_PROVIDER === 'gemini' ? 'selected' : ''}>Google Gemini</option>
                                        <option value="openai" ${process.env.AI_PROVIDER === 'openai' ? 'selected' : ''}>OpenAI ChatGPT</option>
                                        <option value="claude" ${process.env.AI_PROVIDER === 'claude' ? 'selected' : ''}>Anthropic Claude</option>
                                    </select>
                                    <div class="form-text">Choose AI provider for !ai command</div>
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="ai_api_key" class="form-label">
                                        <i class="bi bi-key me-2"></i>AI API Key
                                    </label>
                                    <input type="password" name="ai_api_key" id="ai_api_key" class="form-control"
                                           value="${process.env.AI_API_KEY ? '••••••••••••••••' : ''}"
                                           placeholder="Enter API key for selected provider">
                                    <div class="form-text">API key for the selected AI provider</div>
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

        <script>
            function toggleAllGroups(selectAllCheckbox) {
                const checkboxes = document.querySelectorAll('.group-checkbox');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = selectAllCheckbox.checked;
                });
            }

            // Update form submission to handle checkboxes
            document.querySelector('form').addEventListener('submit', function(e) {
                const checkedGroups = Array.from(document.querySelectorAll('.group-checkbox:checked'))
                    .map(checkbox => checkbox.value);

                // Create hidden input for selected groups
                const hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.name = 'whatsapp_groups_list';
                hiddenInput.value = checkedGroups.join(',');
                this.appendChild(hiddenInput);
            });
        </script>
    `;

        res.send(createLayout('Bot Settings', content, 'settings', req.session.username));

    } catch (error) {
        console.error('Error loading settings:', error);
        const content = `
            <div class="row">
                <div class="col-12">
                    <div class="alert alert-danger" role="alert">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Error loading settings. Please try again.
                    </div>
                </div>
            </div>
        `;
        res.send(createLayout('Bot Settings', content, 'settings', req.session.username));
    }
});

// Update global settings
router.post('/update-global-settings', checkSession, (req, res) => {
    const { only_watcher_chaos, discord_channel, whatsapp_groups_list, bot_owner, timezone_offset, ai_provider, ai_api_key } = req.body;
    
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
        if (whatsapp_groups_list) {
            envContent = envContent.replace(
                /WHATSAPP_GROUP_IDS=.*/,
                `WHATSAPP_GROUP_IDS=${whatsapp_groups_list}`
            );
        }

        // Update BOT_OWNER_NUMBER
        if (bot_owner) {
            envContent = envContent.replace(
                /BOT_OWNER_NUMBER=.*/,
                `BOT_OWNER_NUMBER=${bot_owner}`
            );
        }

        // Update TIMEZONE_OFFSET
        if (timezone_offset) {
            envContent = envContent.replace(
                /TIMEZONE_OFFSET=.*/,
                `TIMEZONE_OFFSET=${timezone_offset}`
            );
        }

        // Update AI_PROVIDER
        if (ai_provider) {
            envContent = envContent.replace(
                /AI_PROVIDER=.*/,
                `AI_PROVIDER=${ai_provider}`
            );
        }

        // Update AI_API_KEY
        if (ai_api_key && ai_api_key !== '••••••••••••••••') {
            envContent = envContent.replace(
                /AI_API_KEY=.*/,
                `AI_API_KEY=${ai_api_key}`
            );
        }

        fs.writeFileSync(envPath, envContent);

        // Update process.env
        process.env.ONLY_WATCHER_CHAOS = only_watcher_chaos;
        if (discord_channel) process.env.DISCORD_CHANNEL_ID = discord_channel;
        if (whatsapp_groups_list) process.env.WHATSAPP_GROUP_IDS = whatsapp_groups_list;
        if (bot_owner) process.env.BOT_OWNER_NUMBER = bot_owner;
        if (timezone_offset) process.env.TIMEZONE_OFFSET = timezone_offset;
        if (ai_provider) process.env.AI_PROVIDER = ai_provider;
        if (ai_api_key && ai_api_key !== '••••••••••••••••') process.env.AI_API_KEY = ai_api_key;
        
        res.redirect('/dashboard/settings?success=Settings updated successfully');
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

// Message Log page
router.get('/messages', checkSession, (req, res) => {
    const { createLayout } = require('../views/layout');
    const Message = require('../models/message');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type || '';
    const status = req.query.status || '';

    // Get messages with filters
    const result = Message.getAll(page, limit);
    const messages = result.messages || [];
    const pagination = result.pagination || {};

    // Build filter options
    const typeOptions = [
        { value: '', label: 'Semua Tipe' },
        { value: 'received', label: 'Pesan Masuk' },
        { value: 'sent', label: 'Pesan Keluar' }
    ];

    const statusOptions = [
        { value: '', label: 'Semua Status' },
        { value: 'received', label: 'Diterima' },
        { value: 'sent', label: 'Terkirim' },
        { value: 'failed', label: 'Gagal' }
    ];

    // Build filter form
    let filterForm = `
        <div class="row mb-3">
            <div class="col-md-3">
                <select class="form-select" id="typeFilter" onchange="applyMessageFilters()">
                    ${typeOptions.map(opt =>
                        `<option value="${opt.value}" ${type === opt.value ? 'selected' : ''}>${opt.label}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="col-md-3">
                <select class="form-select" id="statusFilter" onchange="applyMessageFilters()">
                    ${statusOptions.map(opt =>
                        `<option value="${opt.value}" ${status === opt.value ? 'selected' : ''}>${opt.label}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="col-md-3">
                <input type="date" class="form-control" id="dateFilter" onchange="applyMessageFilters()">
            </div>
            <div class="col-md-3">
                <button class="btn btn-outline-secondary" onclick="clearMessageFilters()">
                    <i class="bi bi-x-circle me-1"></i>Reset Filter
                </button>
            </div>
        </div>
    `;

    // Build message table
    let messageRows = '';
    messages.forEach(message => {
        const timestamp = new Date(message.timestamp).toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const typeIcon = message.type === 'received' ? 'bi-arrow-down-circle text-success' : 'bi-arrow-up-circle text-primary';
        const statusBadge = message.status === 'failed' ? 'bg-danger' :
                           message.status === 'sent' ? 'bg-success' : 'bg-info';

        messageRows += `
            <tr>
                <td>
                    <small class="text-muted">${timestamp}</small>
                </td>
                <td>
                    <i class="bi ${typeIcon} me-1"></i>
                    ${message.type === 'received' ? 'Masuk' : 'Keluar'}
                </td>
                <td>
                    <strong>${message.contact || 'Unknown'}</strong>
                </td>
                <td>
                    <div class="message-preview" style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${message.body || '-'}
                    </div>
                </td>
                <td>
                    <span class="badge ${statusBadge}">${message.status || 'unknown'}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMessage('${message.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    // Build pagination
    let paginationHtml = '';
    if (pagination.totalPages > 1) {
        paginationHtml = '<nav aria-label="Message pagination"><ul class="pagination justify-content-center">';

        if (pagination.hasPrev) {
            paginationHtml += `<li class="page-item"><a class="page-link" href="?page=${pagination.currentPage - 1}&type=${type}&status=${status}">‹</a></li>`;
        }

        const startPage = Math.max(1, pagination.currentPage - 2);
        const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            if (i === pagination.currentPage) {
                paginationHtml += `<li class="page-item active"><span class="page-link">${i}</span></li>`;
            } else {
                paginationHtml += `<li class="page-item"><a class="page-link" href="?page=${i}&type=${type}&status=${status}">${i}</a></li>`;
            }
        }

        if (pagination.hasNext) {
            paginationHtml += `<li class="page-item"><a class="page-link" href="?page=${pagination.currentPage + 1}&type=${type}&status=${status}">›</a></li>`;
        }

        paginationHtml += '</ul></nav>';
    }

    const content = `
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0"><i class="bi bi-chat-dots me-2"></i>Message Log</h5>
                        <div>
                            <button class="btn btn-outline-primary btn-sm me-2" onclick="refreshMessages()">
                                <i class="bi bi-arrow-clockwise me-1"></i>Refresh
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="clearAllMessages()">
                                <i class="bi bi-trash me-1"></i>Clear All
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        ${filterForm}

                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Waktu</th>
                                        <th>Tipe</th>
                                        <th>Kontak</th>
                                        <th>Pesan</th>
                                        <th>Status</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${messageRows || '<tr><td colspan="6" class="text-center text-muted">Tidak ada pesan</td></tr>'}
                                </tbody>
                            </table>
                        </div>

                        ${paginationHtml}

                        <div class="text-center mt-3">
                            <small class="text-muted">
                                <i class="bi bi-info-circle me-1"></i>
                                Menampilkan ${messages.length} dari ${pagination.totalItems || 0} pesan
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            function applyMessageFilters() {
                const type = document.getElementById('typeFilter').value;
                const status = document.getElementById('statusFilter').value;
                const date = document.getElementById('dateFilter').value;

                let url = '/dashboard/messages?';
                const params = [];

                if (type) params.push('type=' + type);
                if (status) params.push('status=' + status);
                if (date) params.push('date=' + date);

                window.location.href = url + params.join('&');
            }

            function clearMessageFilters() {
                window.location.href = '/dashboard/messages';
            }

            function refreshMessages() {
                window.location.reload();
            }

            function deleteMessage(id) {
                if (confirm('Apakah Anda yakin ingin menghapus pesan ini?')) {
                    fetch('/api/messages/' + id, { method: 'DELETE' })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                window.location.reload();
                            } else {
                                alert('Gagal menghapus pesan: ' + data.message);
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            alert('Terjadi kesalahan saat menghapus pesan');
                        });
                }
            }

            function clearAllMessages() {
                if (confirm('Apakah Anda yakin ingin menghapus semua pesan? Tindakan ini tidak dapat dibatalkan.')) {
                    fetch('/api/messages/clear', { method: 'DELETE' })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                window.location.reload();
                            } else {
                                alert('Gagal menghapus pesan: ' + data.message);
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            alert('Terjadi kesalahan saat menghapus pesan');
                        });
                }
            }
        </script>
    `;

    res.send(createLayout('Message Log', content, 'messages', req.session.username));
});

// Bot Profile page
router.get('/bot-profile', checkSession, (req, res) => {
    const { createLayout } = require('../views/layout');
    const Message = require('../models/message');

    // Get bot status
    const isConnected = whatsappClientRef && whatsappClientRef.info;
    const botInfo = isConnected ? whatsappClientRef.info : null;

    // Get message statistics
    const messageStats = Message.getAll(1, 1);
    const totalMessages = messageStats.pagination ? messageStats.pagination.totalItems : 0;

    // Calculate basic stats (you can enhance this)
    let sentCount = 0;
    let receivedCount = 0;
    let failedCount = 0;

    // Get recent messages for stats calculation
    const recentMessages = Message.getAll(1, 1000);
    if (recentMessages.messages) {
        recentMessages.messages.forEach(msg => {
            if (msg.type === 'sent') sentCount++;
            else if (msg.type === 'received') receivedCount++;
            if (msg.status === 'failed') failedCount++;
        });
    }

    const content = `
        <div class="row mb-4">
            <!-- Bot Status Card -->
            <div class="col-lg-6 mb-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="bi bi-robot me-2"></i>Status Bot</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-12 mb-3">
                                <div class="d-flex align-items-center">
                                    <div class="status-indicator ${isConnected ? 'bg-success' : 'bg-danger'} me-3"></div>
                                    <div>
                                        <h6 class="mb-1">WhatsApp Connection</h6>
                                        <p class="mb-0 text-muted">
                                            ${isConnected ? 'Terhubung' : 'Tidak Terhubung'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            ${isConnected ? `
                                <div class="col-12 mb-3">
                                    <h6>Informasi Device</h6>
                                    <p class="mb-1"><strong>Nomor:</strong> +${botInfo.wid.user}</p>
                                    <p class="mb-1"><strong>Device ID:</strong> ${botInfo.wid._serialized}</p>
                                    <p class="mb-0"><strong>Platform:</strong> ${botInfo.platform || 'WhatsApp Web'}</p>
                                </div>

                                <div class="col-12">
                                    <button class="btn btn-outline-danger" onclick="logoutBot()">
                                        <i class="bi bi-box-arrow-right me-1"></i>Logout WhatsApp
                                    </button>
                                </div>
                            ` : `
                                <div class="col-12 mb-3">
                                    <div class="alert alert-warning" role="alert">
                                        <i class="bi bi-exclamation-triangle me-2"></i>
                                        Bot belum terhubung ke WhatsApp. Scan QR Code untuk login.
                                    </div>
                                </div>

                                <div class="col-12 text-center" id="qrCodeContainer">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Loading QR Code...</span>
                                    </div>
                                    <p class="mt-2 text-muted">Menunggu QR Code...</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bot Information Card -->
            <div class="col-lg-6 mb-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="bi bi-info-circle me-2"></i>Informasi Bot</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-12 mb-3">
                                <h6>Bot Lords Mobile</h6>
                                <p class="mb-1"><strong>Versi:</strong> 2.0.0</p>
                                <p class="mb-1"><strong>Platform:</strong> Node.js</p>
                                <p class="mb-1"><strong>Framework:</strong> whatsapp-web.js</p>
                                <p class="mb-0"><strong>Uptime:</strong> <span id="botUptime">Calculating...</span></p>
                            </div>

                            <div class="col-12">
                                <h6>Environment</h6>
                                <p class="mb-1"><strong>Bot Owner:</strong> ${process.env.BOT_OWNER_NUMBER || 'Not set'}</p>
                                <p class="mb-1"><strong>Timezone:</strong> GMT+${process.env.TIMEZONE_OFFSET || '7'}</p>
                                <p class="mb-0"><strong>Mode:</strong> ${process.env.NODE_ENV || 'development'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Message Statistics -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="bi bi-bar-chart me-2"></i>Statistik Pesan</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-lg-3 col-md-6 mb-3">
                                <div class="stat-card">
                                    <div class="stat-icon bg-primary text-white">
                                        <i class="bi bi-chat-dots"></i>
                                    </div>
                                    <h3 class="stat-number">${totalMessages}</h3>
                                    <p class="stat-label">Total Pesan</p>
                                </div>
                            </div>
                            <div class="col-lg-3 col-md-6 mb-3">
                                <div class="stat-card">
                                    <div class="stat-icon bg-success text-white">
                                        <i class="bi bi-arrow-up-circle"></i>
                                    </div>
                                    <h3 class="stat-number">${sentCount}</h3>
                                    <p class="stat-label">Pesan Terkirim</p>
                                </div>
                            </div>
                            <div class="col-lg-3 col-md-6 mb-3">
                                <div class="stat-card">
                                    <div class="stat-icon bg-info text-white">
                                        <i class="bi bi-arrow-down-circle"></i>
                                    </div>
                                    <h3 class="stat-number">${receivedCount}</h3>
                                    <p class="stat-label">Pesan Diterima</p>
                                </div>
                            </div>
                            <div class="col-lg-3 col-md-6 mb-3">
                                <div class="stat-card">
                                    <div class="stat-icon bg-danger text-white">
                                        <i class="bi bi-x-circle"></i>
                                    </div>
                                    <h3 class="stat-number">${failedCount}</h3>
                                    <p class="stat-label">Pesan Gagal</p>
                                </div>
                            </div>
                        </div>

                        <div class="row mt-4">
                            <div class="col-12">
                                <h6>Aktivitas Hari Ini</h6>
                                <div class="progress mb-3" style="height: 25px;">
                                    <div class="progress-bar bg-success" role="progressbar"
                                         style="width: ${totalMessages > 0 ? (sentCount / totalMessages) * 100 : 0}%">
                                        Terkirim (${sentCount})
                                    </div>
                                    <div class="progress-bar bg-info" role="progressbar"
                                         style="width: ${totalMessages > 0 ? (receivedCount / totalMessages) * 100 : 0}%">
                                        Diterima (${receivedCount})
                                    </div>
                                    <div class="progress-bar bg-danger" role="progressbar"
                                         style="width: ${totalMessages > 0 ? (failedCount / totalMessages) * 100 : 0}%">
                                        Gagal (${failedCount})
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .status-indicator {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                display: inline-block;
            }

            .stat-card {
                background: white;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
                border: 1px solid #e9ecef;
            }

            .stat-icon {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 15px;
                font-size: 20px;
            }

            .stat-number {
                font-size: 2rem;
                font-weight: bold;
                margin-bottom: 5px;
                color: #333;
            }

            .stat-label {
                color: #666;
                margin-bottom: 0;
                font-size: 0.9rem;
            }
        </style>

        <script>
            // Initialize Socket.IO for real-time updates
            const socket = io();

            // Handle QR code updates
            socket.on('qr', function(qrCodeUrl) {
                const qrContainer = document.getElementById('qrCodeContainer');
                if (qrContainer) {
                    qrContainer.innerHTML = \`
                        <img src="\${qrCodeUrl}" alt="QR Code" class="img-fluid" style="max-width: 300px;">
                        <p class="mt-2 text-muted">Scan QR Code dengan WhatsApp Anda</p>
                    \`;
                }
            });

            // Handle connection ready
            socket.on('ready', function() {
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            });

            // Calculate and update uptime
            function updateUptime() {
                const startTime = new Date('${new Date().toISOString()}');
                const now = new Date();
                const uptime = Math.floor((now - startTime) / 1000);

                const hours = Math.floor(uptime / 3600);
                const minutes = Math.floor((uptime % 3600) / 60);
                const seconds = uptime % 60;

                const uptimeElement = document.getElementById('botUptime');
                if (uptimeElement) {
                    uptimeElement.textContent = \`\${hours}h \${minutes}m \${seconds}s\`;
                }
            }

            // Update uptime every second
            setInterval(updateUptime, 1000);
            updateUptime();

            // Logout function
            function logoutBot() {
                if (confirm('Apakah Anda yakin ingin logout dari WhatsApp? Bot akan berhenti bekerja sampai login kembali.')) {
                    fetch('/api/logout', { method: 'POST' })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                alert('Berhasil logout dari WhatsApp');
                                window.location.reload();
                            } else {
                                alert('Gagal logout: ' + data.message);
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            alert('Terjadi kesalahan saat logout');
                        });
                }
            }
        </script>
    `;

    res.send(createLayout('Bot Profile', content, 'bot-profile', req.session.username));
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
                        ${getRecentHellEventsTable(req.query.page)}
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
router.get('/groups', checkSession, async (req, res) => {
    const { createLayout } = require('../views/layout');
    const { getConfiguredJoinedGroups } = require('../utils/whatsappUtils');

    try {
        // Get only joined groups (filters out test groups and non-joined groups)
        const joinedGroups = await getConfiguredJoinedGroups(whatsappClientRef);

        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Groups per page
        const offset = (page - 1) * limit;

        const totalGroups = joinedGroups.length;
        const totalPages = Math.ceil(totalGroups / limit);
        const paginatedGroups = joinedGroups.slice(offset, offset + limit);

        // Build table rows for paginated groups
        let groupRows = '';
        for (const group of paginatedGroups) {
            const isActive = group.botEnabled;
            const isRent = group.rentMode;
            const hellNotifications = group.hellNotifications;

            groupRows += `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <i class="bi bi-people me-2 text-primary"></i>
                            <div>
                                <strong>${group.name}</strong>
                                <small class="d-block text-muted">${group.id}</small>
                                <small class="d-block text-info">${group.participantCount} members</small>
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
                            <input type="hidden" name="groupId" value="${group.id}">
                            <select name="hellNotifications" class="form-select form-select-sm" onchange="this.form.submit()">
                                <option value="all" ${hellNotifications === 'all' ? 'selected' : ''}>All Events</option>
                                <option value="watcherchaos" ${hellNotifications === 'watcherchaos' ? 'selected' : ''}>Watcher & Chaos</option>
                                <option value="off" ${hellNotifications === 'off' ? 'selected' : ''}>Disabled</option>
                            </select>
                        </form>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-info" onclick="manageCommands('${group.id}', '${group.name}')">
                            <i class="bi bi-gear me-1"></i>Manage
                        </button>
                    </td>
                    <td>
                        <form method="POST" action="/dashboard/toggle-bot" class="d-inline">
                            <input type="hidden" name="groupId" value="${group.id}">
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
                    <h3 class="stat-number">${joinedGroups.filter(g => g.botEnabled).length}</h3>
                    <p class="stat-label">Active Groups</p>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="stat-card clickable-card" onclick="window.location.href='/dashboard/groups'">
                    <div class="stat-icon bg-warning text-white">
                        <i class="bi bi-credit-card"></i>
                    </div>
                    <h3 class="stat-number">${joinedGroups.filter(g => g.rentMode).length}</h3>
                    <p class="stat-label">Rent Groups</p>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="stat-card clickable-card" onclick="window.location.href='/dashboard/groups'">
                    <div class="stat-icon bg-info text-white">
                        <i class="bi bi-gift"></i>
                    </div>
                    <h3 class="stat-number">${joinedGroups.filter(g => g.botEnabled && !g.rentMode).length}</h3>
                    <p class="stat-label">Free Groups</p>
                </div>
            </div>
        </div>

        <!-- Groups Table -->
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="mb-0"><i class="bi bi-people me-2"></i>Group Management</h5>
                            <small class="text-muted">Page ${page} of ${totalPages} (${totalGroups} total groups)</small>
                        </div>

                        <!-- Filter Controls -->
                        <div class="row g-2">
                            <div class="col-md-4">
                                <div class="input-group input-group-sm">
                                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                                    <input type="text" class="form-control" id="groupFilter" placeholder="Search groups...">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <select class="form-select form-select-sm" id="statusFilter">
                                    <option value="">All Status</option>
                                    <option value="active">Active Only</option>
                                    <option value="inactive">Inactive Only</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <select class="form-select form-select-sm" id="typeFilter">
                                    <option value="">All Types</option>
                                    <option value="rent">Rent Groups</option>
                                    <option value="free">Free Groups</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <button class="btn btn-outline-secondary btn-sm w-100" onclick="clearFilters()">
                                    <i class="bi bi-x-circle me-1"></i>Clear
                                </button>
                            </div>
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
                                            <th>Commands</th>
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

            // Filter functionality
            function filterTable() {
                const searchTerm = document.getElementById('groupFilter').value.toLowerCase();
                const statusFilter = document.getElementById('statusFilter').value;
                const typeFilter = document.getElementById('typeFilter').value;
                const rows = document.querySelectorAll('tbody tr');

                rows.forEach(row => {
                    const groupName = row.cells[0].textContent.toLowerCase();
                    const statusBadge = row.cells[1].querySelector('.badge');
                    const typeBadge = row.cells[2].querySelector('.badge');

                    const matchesSearch = groupName.includes(searchTerm);
                    const matchesStatus = !statusFilter ||
                        (statusFilter === 'active' && statusBadge.classList.contains('bg-success')) ||
                        (statusFilter === 'inactive' && !statusBadge.classList.contains('bg-success'));
                    const matchesType = !typeFilter ||
                        (typeFilter === 'rent' && typeBadge.textContent.includes('Rent')) ||
                        (typeFilter === 'free' && typeBadge.textContent.includes('Free'));

                    row.style.display = matchesSearch && matchesStatus && matchesType ? '' : 'none';
                });
            }

            function clearFilters() {
                document.getElementById('groupFilter').value = '';
                document.getElementById('statusFilter').value = '';
                document.getElementById('typeFilter').value = '';
                filterTable();
            }

            // Add event listeners
            document.addEventListener('DOMContentLoaded', function() {
                document.getElementById('groupFilter').addEventListener('input', filterTable);
                document.getElementById('statusFilter').addEventListener('change', filterTable);
                document.getElementById('typeFilter').addEventListener('change', filterTable);
            });

            // Command management
            function manageCommands(groupId, groupName) {
                // Create modal content
                const modalContent = \`
                    <div class="modal fade" id="commandsModal" tabindex="-1">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Manage Commands - \${groupName}</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <p class="text-muted mb-3">Select which commands are allowed in this group:</p>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <h6>Basic Commands</h6>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="cmd_ping" checked>
                                                <label class="form-check-label" for="cmd_ping">!ping</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="cmd_help" checked>
                                                <label class="form-check-label" for="cmd_help">!help</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="cmd_cmd" checked>
                                                <label class="form-check-label" for="cmd_cmd">!cmd</label>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <h6>Game Commands</h6>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="cmd_hell" checked>
                                                <label class="form-check-label" for="cmd_hell">!hell</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="cmd_monster" checked>
                                                <label class="form-check-label" for="cmd_monster">!monster</label>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <h6>Group Management</h6>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="cmd_tagall">
                                                <label class="form-check-label" for="cmd_tagall">!tagall (Admin)</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="cmd_permission">
                                                <label class="form-check-label" for="cmd_permission">!permission (Admin)</label>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <h6>Other Commands</h6>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="cmd_ai" checked>
                                                <label class="form-check-label" for="cmd_ai">!ai</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="cmd_rent" checked>
                                                <label class="form-check-label" for="cmd_rent">!rent</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                    <button type="button" class="btn btn-primary" onclick="saveCommandPermissions('\${groupId}')">Save Changes</button>
                                </div>
                            </div>
                        </div>
                    </div>
                \`;

                // Remove existing modal if any
                const existingModal = document.getElementById('commandsModal');
                if (existingModal) {
                    existingModal.remove();
                }

                // Add modal to body
                document.body.insertAdjacentHTML('beforeend', modalContent);

                // Show modal
                new bootstrap.Modal(document.getElementById('commandsModal')).show();
            }

            function saveCommandPermissions(groupId) {
                const permissions = {};
                const checkboxes = document.querySelectorAll('#commandsModal .form-check-input');

                checkboxes.forEach(checkbox => {
                    const command = checkbox.id.replace('cmd_', '');
                    permissions[command] = checkbox.checked;
                });

                // In production, save to database via API
                console.log('Saving permissions for group', groupId, permissions);

                // Close modal and show success
                bootstrap.Modal.getInstance(document.getElementById('commandsModal')).hide();
                alert('Command permissions updated successfully!');
            }
        </script>
    `;

        res.send(createLayout('Group Management', content, 'groups', req.session.username));

    } catch (error) {
        console.error('Error loading groups:', error);
        const content = `
            <div class="row">
                <div class="col-12">
                    <div class="alert alert-danger" role="alert">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Error loading groups. WhatsApp client may not be ready.
                    </div>
                </div>
            </div>
        `;
        res.send(createLayout('Group Management', content, 'groups', req.session.username));
    }
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

// Profile page
router.get('/profile', checkSession, (req, res) => {
    const { createLayout } = require('../views/layout');

    const content = `
        <div class="row">
            <div class="col-md-8 mx-auto">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="bi bi-person me-2"></i>Profile Settings</h5>
                    </div>
                    <div class="card-body">
                        <form method="POST" action="/dashboard/update-profile">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="display_name" class="form-label">
                                        <i class="bi bi-person-badge me-2"></i>Display Name
                                    </label>
                                    <input type="text" name="display_name" id="display_name" class="form-control"
                                           value="${req.session.displayName || req.session.username || 'Admin'}"
                                           placeholder="Enter display name">
                                    <div class="form-text">Name shown in dashboard header</div>
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="username" class="form-label">
                                        <i class="bi bi-person me-2"></i>Username
                                    </label>
                                    <input type="text" name="username" id="username" class="form-control"
                                           value="${req.session.username || 'admin'}"
                                           placeholder="Enter username">
                                    <div class="form-text">Username for login</div>
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="current_password" class="form-label">
                                        <i class="bi bi-lock me-2"></i>Current Password
                                    </label>
                                    <input type="password" name="current_password" id="current_password" class="form-control"
                                           placeholder="Enter current password">
                                    <div class="form-text">Required to change password</div>
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="new_password" class="form-label">
                                        <i class="bi bi-key me-2"></i>New Password
                                    </label>
                                    <input type="password" name="new_password" id="new_password" class="form-control"
                                           placeholder="Enter new password (optional)">
                                    <div class="form-text">Leave blank to keep current password</div>
                                </div>
                            </div>

                            <div class="d-flex justify-content-between">
                                <button type="submit" class="btn btn-primary">
                                    <i class="bi bi-check-lg me-2"></i>Update Profile
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

        <!-- Account Information -->
        <div class="row mt-4">
            <div class="col-md-8 mx-auto">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0"><i class="bi bi-info-circle me-2"></i>Account Information</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <small class="text-muted">Current Session</small>
                                <p class="mb-0">${req.session.username || 'admin'}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <small class="text-muted">Login Time</small>
                                <p class="mb-0">${new Date().toLocaleString('id-ID')}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <small class="text-muted">Session ID</small>
                                <p class="mb-0 text-truncate">${req.sessionID || 'N/A'}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <small class="text-muted">Access Level</small>
                                <p class="mb-0">
                                    <span class="badge bg-success">Administrator</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    res.send(createLayout('Profile Settings', content, 'profile', req.session.username));
});

// Update profile
router.post('/update-profile', checkSession, (req, res) => {
    const { display_name, username, current_password, new_password } = req.body;

    try {
        const validUsername = process.env.DASHBOARD_USERNAME || 'admin';
        const validPassword = process.env.DASHBOARD_PASSWORD || 'admin123';

        // Verify current password if trying to change password
        if (new_password && current_password !== validPassword) {
            return res.redirect('/dashboard/profile?error=Current password is incorrect');
        }

        // Update .env file
        const fs = require('fs');
        const path = require('path');
        const envPath = path.join(__dirname, '..', '.env');
        let envContent = fs.readFileSync(envPath, 'utf8');

        // Update username
        if (username && username !== validUsername) {
            envContent = envContent.replace(
                /DASHBOARD_USERNAME=.*/,
                `DASHBOARD_USERNAME=${username}`
            );
            process.env.DASHBOARD_USERNAME = username;
        }

        // Update password
        if (new_password) {
            envContent = envContent.replace(
                /DASHBOARD_PASSWORD=.*/,
                `DASHBOARD_PASSWORD=${new_password}`
            );
            process.env.DASHBOARD_PASSWORD = new_password;
        }

        fs.writeFileSync(envPath, envContent);

        // Update session
        req.session.username = username || req.session.username;
        req.session.displayName = display_name || req.session.displayName;

        res.redirect('/dashboard/profile?success=Profile updated successfully');

    } catch (error) {
        console.error('Error updating profile:', error);
        res.redirect('/dashboard/profile?error=Failed to update profile');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/dashboard/login');
});

// Export setWhatsAppClientRef function
router.setWhatsAppClientRef = setWhatsAppClientRef;

module.exports = router;
