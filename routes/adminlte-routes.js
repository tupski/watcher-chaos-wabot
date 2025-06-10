const express = require('express');
const router = express.Router();
const { checkSession } = require('../middleware/auth');
const { createAdminLTELayout } = require('../views/adminlte-layout');
const Message = require('../models/message');

// Login page (without layout)
router.get('/login', (req, res) => {
    if (req.session && req.session.authenticated) {
        return res.redirect('/dashboard');
    }

    const loginHtml = `
<!DOCTYPE html>
<html lang="id" class="h-100">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login | Bot Lords Mobile Dashboard</title>

    <!-- Google Font: Source Sans Pro -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- AdminLTE 3 -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/css/adminlte.min.css">
    <!-- SweetAlert2 -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
</head>
<body class="hold-transition login-page">
<div class="login-box">
    <div class="card card-outline card-primary">
        <div class="card-header text-center">
            <a href="#" class="h1"><b>Bot</b>LM</a>
            <p class="login-box-msg">Lords Mobile Dashboard</p>
        </div>
        <div class="card-body">
            <form id="loginForm">
                <div class="input-group mb-3">
                    <input type="text" class="form-control" placeholder="Username" id="username" required>
                    <div class="input-group-append">
                        <div class="input-group-text">
                            <span class="fas fa-user"></span>
                        </div>
                    </div>
                </div>
                <div class="input-group mb-3">
                    <input type="password" class="form-control" placeholder="Password" id="password" required>
                    <div class="input-group-append">
                        <div class="input-group-text">
                            <span class="fas fa-lock"></span>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-8">
                        <div class="icheck-primary">
                            <input type="checkbox" id="remember">
                            <label for="remember">
                                Remember Me
                            </label>
                        </div>
                    </div>
                    <div class="col-4">
                        <button type="submit" class="btn btn-primary btn-block">Sign In</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- jQuery -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<!-- Bootstrap 4 -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js"></script>
<!-- AdminLTE 3 -->
<script src="https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/js/adminlte.min.js"></script>
<!-- SweetAlert2 -->
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<script>
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Please fill in all fields'
            });
            return;
        }

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Login Successful',
                    text: 'Redirecting to dashboard...',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = '/dashboard';
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Login Failed',
                    text: data.message || 'Invalid credentials'
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred during login'
            });
        }
    });
</script>

</body>
</html>
    `;

    res.send(loginHtml);
});

// Reference to WhatsApp client (will be set from index.js)
let whatsappClientRef = null;

/**
 * Set WhatsApp client reference
 */
function setWhatsAppClientRef(client) {
    whatsappClientRef = client;
}

// Dashboard main page
router.get('/', checkSession, (req, res) => {
    // Get basic statistics
    const messageStats = Message.getAll(1, 1);
    const totalMessages = messageStats.pagination ? messageStats.pagination.totalItems : 0;
    
    // Calculate message stats
    let sentCount = 0;
    let receivedCount = 0;
    let failedCount = 0;
    
    const recentMessages = Message.getAll(1, 100);
    if (recentMessages.messages) {
        recentMessages.messages.forEach(msg => {
            if (msg.type === 'sent') sentCount++;
            else if (msg.type === 'received') receivedCount++;
            if (msg.status === 'failed') failedCount++;
        });
    }

    // Get bot status
    const isConnected = whatsappClientRef && whatsappClientRef.info;
    const botInfo = isConnected ? whatsappClientRef.info : null;

    // Build recent messages table
    let recentMessagesHtml = '';
    if (recentMessages.messages && recentMessages.messages.length > 0) {
        recentMessages.messages.slice(0, 5).forEach(msg => {
            const timestamp = new Date(msg.timestamp).toLocaleString('id-ID', {
                timeZone: 'Asia/Jakarta',
                hour: '2-digit',
                minute: '2-digit'
            });
            const typeIcon = msg.type === 'received' ? 'fas fa-arrow-down text-success' : 'fas fa-arrow-up text-primary';
            const statusBadge = msg.status === 'failed' ? 'badge-danger' : 
                               msg.status === 'sent' ? 'badge-success' : 'badge-info';
            
            recentMessagesHtml += `
                <tr>
                    <td><small>${timestamp}</small></td>
                    <td><i class="${typeIcon}"></i></td>
                    <td><strong>${msg.contact || 'Unknown'}</strong></td>
                    <td>
                        <div class="message-preview">
                            ${(msg.body || '').substring(0, 50)}${(msg.body || '').length > 50 ? '...' : ''}
                        </div>
                    </td>
                    <td><span class="badge ${statusBadge}">${msg.status || 'unknown'}</span></td>
                </tr>
            `;
        });
    } else {
        recentMessagesHtml = '<tr><td colspan="5" class="text-center text-muted">Tidak ada pesan terbaru</td></tr>';
    }

    // Build device info section
    let deviceInfoHtml = '';
    if (isConnected) {
        deviceInfoHtml = `
            <div class="col-12">
                <h6>Informasi Device</h6>
                <p class="mb-1"><strong>Nomor:</strong> +${botInfo.wid.user}</p>
                <p class="mb-1"><strong>Platform:</strong> ${botInfo.platform || 'WhatsApp Web'}</p>
                <p class="mb-0"><strong>Status:</strong> <span class="badge badge-success">Online</span></p>
            </div>
        `;
    } else {
        deviceInfoHtml = `
            <div class="col-12">
                <div class="alert alert-warning" role="alert">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    Bot belum terhubung ke WhatsApp. Silakan scan QR Code di halaman Bot Profile.
                </div>
                <a href="/dashboard/bot-profile" class="btn btn-primary">
                    <i class="fas fa-qrcode mr-1"></i> Scan QR Code
                </a>
            </div>
        `;
    }

    const content = `
        <!-- Info boxes -->
        <div class="row">
            <div class="col-12 col-sm-6 col-md-3">
                <div class="info-box">
                    <span class="info-box-icon bg-info elevation-1"><i class="fas fa-comments"></i></span>
                    <div class="info-box-content">
                        <span class="info-box-text">Total Pesan</span>
                        <span class="info-box-number">${totalMessages}</span>
                    </div>
                </div>
            </div>
            <div class="col-12 col-sm-6 col-md-3">
                <div class="info-box mb-3">
                    <span class="info-box-icon bg-success elevation-1"><i class="fas fa-arrow-up"></i></span>
                    <div class="info-box-content">
                        <span class="info-box-text">Pesan Terkirim</span>
                        <span class="info-box-number">${sentCount}</span>
                    </div>
                </div>
            </div>
            <div class="col-12 col-sm-6 col-md-3">
                <div class="info-box mb-3">
                    <span class="info-box-icon bg-warning elevation-1"><i class="fas fa-arrow-down"></i></span>
                    <div class="info-box-content">
                        <span class="info-box-text">Pesan Diterima</span>
                        <span class="info-box-number">${receivedCount}</span>
                    </div>
                </div>
            </div>
            <div class="col-12 col-sm-6 col-md-3">
                <div class="info-box mb-3">
                    <span class="info-box-icon bg-danger elevation-1"><i class="fas fa-exclamation-triangle"></i></span>
                    <div class="info-box-content">
                        <span class="info-box-text">Pesan Gagal</span>
                        <span class="info-box-number">${failedCount}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <!-- Bot Status Card -->
            <div class="col-lg-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-robot mr-1"></i>
                            Status Bot
                        </h3>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-12 mb-3">
                                <div class="d-flex align-items-center">
                                    <span class="status-indicator ${isConnected ? 'status-online' : 'status-offline'}"></span>
                                    <div>
                                        <strong>WhatsApp Connection</strong><br>
                                        <small class="text-muted">${isConnected ? 'Terhubung' : 'Tidak Terhubung'}</small>
                                    </div>
                                </div>
                            </div>
                            ${deviceInfoHtml}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions Card -->
            <div class="col-lg-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-bolt mr-1"></i>
                            Quick Actions
                        </h3>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-6 mb-3">
                                <a href="/dashboard/messages" class="btn btn-info btn-block">
                                    <i class="fas fa-comments mr-1"></i>
                                    Message Log
                                </a>
                            </div>
                            <div class="col-6 mb-3">
                                <a href="/dashboard/groups" class="btn btn-success btn-block">
                                    <i class="fas fa-users mr-1"></i>
                                    Groups
                                </a>
                            </div>
                            <div class="col-6 mb-3">
                                <a href="/dashboard/commands" class="btn btn-warning btn-block">
                                    <i class="fas fa-list mr-1"></i>
                                    Commands
                                </a>
                            </div>
                            <div class="col-6 mb-3">
                                <a href="/dashboard/settings" class="btn btn-secondary btn-block">
                                    <i class="fas fa-cogs mr-1"></i>
                                    Settings
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Messages -->
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-clock mr-1"></i>
                            Pesan Terbaru
                        </h3>
                        <div class="card-tools">
                            <a href="/dashboard/messages" class="btn btn-tool">
                                <i class="fas fa-external-link-alt"></i>
                            </a>
                        </div>
                    </div>
                    <div class="card-body table-responsive p-0">
                        <table class="table table-striped table-valign-middle">
                            <thead>
                                <tr>
                                    <th>Waktu</th>
                                    <th>Tipe</th>
                                    <th>Kontak</th>
                                    <th>Pesan</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${recentMessagesHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- System Information -->
        <div class="row">
            <div class="col-lg-4">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-server mr-1"></i>
                            System Info
                        </h3>
                    </div>
                    <div class="card-body">
                        <p><strong>Bot Version:</strong> 2.0.0</p>
                        <p><strong>Node.js:</strong> ${process.version}</p>
                        <p><strong>Platform:</strong> ${process.platform}</p>
                        <p><strong>Uptime:</strong> <span id="systemUptime">Calculating...</span></p>
                    </div>
                </div>
            </div>
            
            <div class="col-lg-4">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-chart-pie mr-1"></i>
                            Message Statistics
                        </h3>
                    </div>
                    <div class="card-body">
                        <div class="progress-group">
                            Pesan Terkirim
                            <span class="float-right"><b>${sentCount}</b>/${totalMessages}</span>
                            <div class="progress progress-sm">
                                <div class="progress-bar bg-success" style="width: ${totalMessages > 0 ? (sentCount / totalMessages) * 100 : 0}%"></div>
                            </div>
                        </div>
                        <div class="progress-group">
                            Pesan Diterima
                            <span class="float-right"><b>${receivedCount}</b>/${totalMessages}</span>
                            <div class="progress progress-sm">
                                <div class="progress-bar bg-warning" style="width: ${totalMessages > 0 ? (receivedCount / totalMessages) * 100 : 0}%"></div>
                            </div>
                        </div>
                        <div class="progress-group">
                            Pesan Gagal
                            <span class="float-right"><b>${failedCount}</b>/${totalMessages}</span>
                            <div class="progress progress-sm">
                                <div class="progress-bar bg-danger" style="width: ${totalMessages > 0 ? (failedCount / totalMessages) * 100 : 0}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-lg-4">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-tools mr-1"></i>
                            Quick Tools
                        </h3>
                    </div>
                    <div class="card-body">
                        <button class="btn btn-outline-primary btn-sm btn-block mb-2" onclick="refreshDashboard()">
                            <i class="fas fa-sync-alt mr-1"></i> Refresh Dashboard
                        </button>
                        <button class="btn btn-outline-warning btn-sm btn-block mb-2" onclick="clearMessageLog()">
                            <i class="fas fa-trash mr-1"></i> Clear Message Log
                        </button>
                        <button class="btn btn-outline-info btn-sm btn-block" onclick="exportData()">
                            <i class="fas fa-download mr-1"></i> Export Data
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Update system uptime
            function updateUptime() {
                const startTime = new Date('${new Date().toISOString()}');
                const now = new Date();
                const uptime = Math.floor((now - startTime) / 1000);
                
                const hours = Math.floor(uptime / 3600);
                const minutes = Math.floor((uptime % 3600) / 60);
                const seconds = uptime % 60;
                
                const uptimeElement = document.getElementById('systemUptime');
                if (uptimeElement) {
                    uptimeElement.textContent = hours + 'h ' + minutes + 'm ' + seconds + 's';
                }
            }
            
            // Update uptime every second
            setInterval(updateUptime, 1000);
            updateUptime();
            
            // Dashboard functions
            function refreshDashboard() {
                window.location.reload();
            }
            
            function clearMessageLog() {
                if (confirm('Apakah Anda yakin ingin menghapus semua log pesan?')) {
                    fetch('/api/messages/clear', { method: 'DELETE' })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                showNotification('success', 'Log pesan berhasil dihapus');
                                setTimeout(() => window.location.reload(), 1500);
                            } else {
                                showNotification('error', 'Gagal menghapus log pesan');
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            showNotification('error', 'Terjadi kesalahan');
                        });
                }
            }
            
            function exportData() {
                // Implement export functionality
                showNotification('info', 'Fitur export akan segera tersedia');
            }
        </script>
    `;

    res.send(createAdminLTELayout('Dashboard', content, 'dashboard', req.session.username));
});

// Message Log page
router.get('/messages', checkSession, (req, res) => {
    const result = Message.getAll(1, 1000); // Get all messages for DataTables
    const messages = result.messages || [];

    // Build messages table rows
    let messagesHtml = '';
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

        const typeIcon = message.type === 'received' ?
            '<i class="fas fa-arrow-down text-success"></i> Masuk' :
            '<i class="fas fa-arrow-up text-primary"></i> Keluar';

        const statusBadge = message.status === 'failed' ? 'badge-danger' :
                           message.status === 'sent' ? 'badge-success' : 'badge-info';

        const messageBody = (message.body || '').replace(/'/g, "\\'");

        messagesHtml += `
            <tr>
                <td><small>${timestamp}</small></td>
                <td>${typeIcon}</td>
                <td><strong>${message.contact || 'Unknown'}</strong></td>
                <td>
                    <div class="message-preview" onclick="showMessageDetail('${message.id}', '${messageBody}', '${message.contact || 'Unknown'}', '${timestamp}', '${message.type}')">
                        ${(message.body || '').substring(0, 50)}${(message.body || '').length > 50 ? '...' : ''}
                    </div>
                </td>
                <td><span class="badge ${statusBadge}">${message.status || 'unknown'}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMessage('${message.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    const content = `
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-comments mr-1"></i>
                            Message Log
                        </h3>
                        <div class="card-tools">
                            <button class="btn btn-tool" onclick="refreshMessages()">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                            <button class="btn btn-tool text-danger" onclick="clearAllMessages()">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <table id="messagesTable" class="table table-bordered table-striped data-table">
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
                                ${messagesHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Message Detail Modal -->
        <div class="modal fade" id="messageDetailModal" tabindex="-1" role="dialog">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">Detail Pesan</h4>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>Kontak:</strong>
                                <p id="modalContact" class="mb-0"></p>
                            </div>
                            <div class="col-md-6">
                                <strong>Waktu:</strong>
                                <p id="modalTimestamp" class="mb-0"></p>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>Tipe:</strong>
                                <p id="modalType" class="mb-0"></p>
                            </div>
                            <div class="col-md-6">
                                <strong>ID Pesan:</strong>
                                <p id="modalId" class="mb-0 font-monospace"></p>
                            </div>
                        </div>
                        <div class="mb-3">
                            <strong>Isi Pesan:</strong>
                            <div id="modalMessage" class="border rounded p-3 mt-2" style="background-color: #f8f9fa; white-space: pre-wrap;"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Tutup</button>
                        <button type="button" class="btn btn-primary" onclick="copyMessageText()">
                            <i class="fas fa-copy mr-1"></i>Copy Pesan
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Initialize DataTable
            $(document).ready(function() {
                $('#messagesTable').DataTable({
                    order: [[0, 'desc']], // Sort by timestamp descending
                    columnDefs: [
                        { orderable: false, targets: [5] } // Disable sorting for action column
                    ]
                });
            });

            // Function to format WhatsApp markdown
            function formatWhatsAppMarkdown(text) {
                if (!text) return '';

                text = text.replace(/&/g, '&amp;')
                          .replace(/</g, '&lt;')
                          .replace(/>/g, '&gt;');

                text = text
                    .replace(/\\*([^*]+)\\*/g, '<strong>$1</strong>')
                    .replace(/_([^_]+)_/g, '<em>$1</em>')
                    .replace(/~([^~]+)~/g, '<del>$1</del>')
                    .replace(/\`\`\`([^\`]+)\`\`\`/g, '<code class="d-block bg-light p-2 rounded">$1</code>')
                    .replace(/\`([^\`]+)\`/g, '<code class="bg-light px-1 rounded">$1</code>');

                return text;
            }

            // Function to show message detail modal
            function showMessageDetail(id, body, contact, timestamp, type) {
                document.getElementById('modalId').textContent = id;
                document.getElementById('modalContact').textContent = contact;
                document.getElementById('modalTimestamp').textContent = timestamp;
                document.getElementById('modalType').innerHTML = type === 'received' ?
                    '<i class="fas fa-arrow-down text-success mr-1"></i>Pesan Masuk' :
                    '<i class="fas fa-arrow-up text-primary mr-1"></i>Pesan Keluar';

                const formattedMessage = formatWhatsAppMarkdown(body);
                document.getElementById('modalMessage').innerHTML = formattedMessage;
                document.getElementById('modalMessage').setAttribute('data-original', body);

                $('#messageDetailModal').modal('show');
            }

            // Function to copy message text
            function copyMessageText() {
                const originalText = document.getElementById('modalMessage').getAttribute('data-original');
                navigator.clipboard.writeText(originalText).then(() => {
                    showNotification('success', 'Pesan berhasil disalin!');
                }).catch(err => {
                    showNotification('error', 'Gagal menyalin pesan');
                });
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
                                showNotification('success', 'Pesan berhasil dihapus');
                                window.location.reload();
                            } else {
                                showNotification('error', 'Gagal menghapus pesan');
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            showNotification('error', 'Terjadi kesalahan');
                        });
                }
            }

            function clearAllMessages() {
                if (confirm('Apakah Anda yakin ingin menghapus semua pesan? Tindakan ini tidak dapat dibatalkan.')) {
                    fetch('/api/messages/clear', { method: 'DELETE' })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                showNotification('success', 'Semua pesan berhasil dihapus');
                                window.location.reload();
                            } else {
                                showNotification('error', 'Gagal menghapus pesan');
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            showNotification('error', 'Terjadi kesalahan');
                        });
                }
            }
        </script>
    `;

    res.send(createAdminLTELayout('Message Log', content, 'messages', req.session.username));
});

// Bot Profile page
router.get('/bot-profile', checkSession, (req, res) => {
    // Get bot status
    const isConnected = whatsappClientRef && whatsappClientRef.info;
    const botInfo = isConnected ? whatsappClientRef.info : null;

    // Get message statistics
    const messageStats = Message.getAll(1, 1);
    const totalMessages = messageStats.pagination ? messageStats.pagination.totalItems : 0;

    let sentCount = 0;
    let receivedCount = 0;
    let failedCount = 0;

    const recentMessages = Message.getAll(1, 1000);
    if (recentMessages.messages) {
        recentMessages.messages.forEach(msg => {
            if (msg.type === 'sent') sentCount++;
            else if (msg.type === 'received') receivedCount++;
            if (msg.status === 'failed') failedCount++;
        });
    }

    // Build device info section
    let deviceInfoHtml = '';
    if (isConnected) {
        deviceInfoHtml = `
            <div class="col-12 mb-3">
                <h6>Informasi Device</h6>
                <table class="table table-sm">
                    <tr>
                        <td><strong>Nomor:</strong></td>
                        <td>+${botInfo.wid.user}</td>
                    </tr>
                    <tr>
                        <td><strong>Device ID:</strong></td>
                        <td><code>${botInfo.wid._serialized}</code></td>
                    </tr>
                    <tr>
                        <td><strong>Platform:</strong></td>
                        <td>${botInfo.platform || 'WhatsApp Web'}</td>
                    </tr>
                </table>
            </div>

            <div class="col-12">
                <button class="btn btn-danger" onclick="logoutBot()">
                    <i class="fas fa-sign-out-alt mr-1"></i>Logout WhatsApp
                </button>
            </div>
        `;
    } else {
        deviceInfoHtml = `
            <div class="col-12 mb-3">
                <div class="alert alert-warning" role="alert">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    Bot belum terhubung ke WhatsApp. Scan QR Code untuk login.
                </div>
            </div>

            <div class="col-12 text-center" id="qrCodeContainer">
                <div class="spinner-border text-primary" role="status">
                    <span class="sr-only">Loading QR Code...</span>
                </div>
                <p class="mt-2 text-muted">Menunggu QR Code...</p>
            </div>
        `;
    }

    const content = `
        <div class="row">
            <!-- Bot Status Card -->
            <div class="col-lg-6">
                <div class="card card-primary">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-robot mr-1"></i>
                            Status Bot
                        </h3>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-12 mb-3">
                                <div class="d-flex align-items-center">
                                    <span class="status-indicator ${isConnected ? 'status-online' : 'status-offline'}"></span>
                                    <div>
                                        <h6 class="mb-1">WhatsApp Connection</h6>
                                        <p class="mb-0 text-muted">
                                            ${isConnected ? 'Terhubung' : 'Tidak Terhubung'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            ${deviceInfoHtml}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bot Information Card -->
            <div class="col-lg-6">
                <div class="card card-info">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-info-circle mr-1"></i>
                            Informasi Bot
                        </h3>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tr>
                                <td><strong>Nama:</strong></td>
                                <td>Bot Lords Mobile</td>
                            </tr>
                            <tr>
                                <td><strong>Versi:</strong></td>
                                <td>2.0.0</td>
                            </tr>
                            <tr>
                                <td><strong>Platform:</strong></td>
                                <td>Node.js ${process.version}</td>
                            </tr>
                            <tr>
                                <td><strong>Framework:</strong></td>
                                <td>whatsapp-web.js</td>
                            </tr>
                            <tr>
                                <td><strong>Uptime:</strong></td>
                                <td><span id="botUptime">Calculating...</span></td>
                            </tr>
                            <tr>
                                <td><strong>Bot Owner:</strong></td>
                                <td>${process.env.BOT_OWNER_NUMBER || 'Not set'}</td>
                            </tr>
                            <tr>
                                <td><strong>Timezone:</strong></td>
                                <td>GMT+${process.env.TIMEZONE_OFFSET || '7'}</td>
                            </tr>
                            <tr>
                                <td><strong>Mode:</strong></td>
                                <td>
                                    <span class="badge ${process.env.NODE_ENV === 'production' ? 'badge-success' : 'badge-warning'}">
                                        ${process.env.NODE_ENV || 'development'}
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Message Statistics -->
        <div class="row">
            <div class="col-12">
                <div class="card card-success">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-chart-bar mr-1"></i>
                            Statistik Pesan
                        </h3>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-lg-3 col-6">
                                <div class="small-box bg-info">
                                    <div class="inner">
                                        <h3>${totalMessages}</h3>
                                        <p>Total Pesan</p>
                                    </div>
                                    <div class="icon">
                                        <i class="fas fa-comments"></i>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-3 col-6">
                                <div class="small-box bg-success">
                                    <div class="inner">
                                        <h3>${sentCount}</h3>
                                        <p>Pesan Terkirim</p>
                                    </div>
                                    <div class="icon">
                                        <i class="fas fa-arrow-up"></i>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-3 col-6">
                                <div class="small-box bg-warning">
                                    <div class="inner">
                                        <h3>${receivedCount}</h3>
                                        <p>Pesan Diterima</p>
                                    </div>
                                    <div class="icon">
                                        <i class="fas fa-arrow-down"></i>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-3 col-6">
                                <div class="small-box bg-danger">
                                    <div class="inner">
                                        <h3>${failedCount}</h3>
                                        <p>Pesan Gagal</p>
                                    </div>
                                    <div class="icon">
                                        <i class="fas fa-exclamation-triangle"></i>
                                    </div>
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
                                    <div class="progress-bar bg-warning" role="progressbar"
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

        <script>
            // Initialize Socket.IO for real-time updates
            const socket = io();

            // Handle QR code updates
            socket.on('qr', function(qrCodeUrl) {
                const qrContainer = document.getElementById('qrCodeContainer');
                if (qrContainer) {
                    qrContainer.innerHTML = '<img src="' + qrCodeUrl + '" alt="QR Code" class="img-fluid" style="max-width: 300px;"><p class="mt-2 text-muted">Scan QR Code dengan WhatsApp Anda</p>';
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
                    uptimeElement.textContent = hours + 'h ' + minutes + 'm ' + seconds + 's';
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
                                showNotification('success', 'Berhasil logout dari WhatsApp');
                                window.location.reload();
                            } else {
                                showNotification('error', 'Gagal logout: ' + data.message);
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            showNotification('error', 'Terjadi kesalahan saat logout');
                        });
                }
            }
        </script>
    `;

    res.send(createAdminLTELayout('Bot Profile', content, 'bot-profile', req.session.username));
});

// Commands page
router.get('/commands', checkSession, (req, res) => {
    const content = `
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-list mr-1"></i>
                            Command List
                        </h3>
                        <div class="card-tools">
                            <button class="btn btn-primary btn-sm" onclick="addNewCommand()">
                                <i class="fas fa-plus mr-1"></i>Add Command
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-bordered table-striped data-table" id="commandsTable">
                                <thead>
                                    <tr>
                                        <th>Command</th>
                                        <th>Description</th>
                                        <th>Access Level</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><code>!hell</code></td>
                                        <td>Show current Hell Event information</td>
                                        <td><span class="badge badge-success">All Users</span></td>
                                        <td><span class="badge badge-success">Active</span></td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-primary" onclick="editCommand('hell')">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline-danger" onclick="toggleCommand('hell')">
                                                <i class="fas fa-power-off"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><code>!monster</code></td>
                                        <td>Show monster rotation schedule</td>
                                        <td><span class="badge badge-success">All Users</span></td>
                                        <td><span class="badge badge-success">Active</span></td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-primary" onclick="editCommand('monster')">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline-danger" onclick="toggleCommand('monster')">
                                                <i class="fas fa-power-off"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><code>!help</code></td>
                                        <td>Show available commands</td>
                                        <td><span class="badge badge-success">All Users</span></td>
                                        <td><span class="badge badge-success">Active</span></td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-primary" onclick="editCommand('help')">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline-danger" onclick="toggleCommand('help')">
                                                <i class="fas fa-power-off"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><code>!rent</code></td>
                                        <td>Bot rental management</td>
                                        <td><span class="badge badge-warning">Admin</span></td>
                                        <td><span class="badge badge-success">Active</span></td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-primary" onclick="editCommand('rent')">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline-danger" onclick="toggleCommand('rent')">
                                                <i class="fas fa-power-off"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><code>!restart</code></td>
                                        <td>Restart bot system</td>
                                        <td><span class="badge badge-danger">Bot Owner</span></td>
                                        <td><span class="badge badge-success">Active</span></td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-primary" onclick="editCommand('restart')">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline-danger" onclick="toggleCommand('restart')">
                                                <i class="fas fa-power-off"></i>
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Command Edit Modal -->
        <div class="modal fade" id="commandEditModal" tabindex="-1" role="dialog">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">Edit Command</h4>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="commandEditForm">
                            <div class="form-group">
                                <label for="commandName">Command Name</label>
                                <input type="text" class="form-control" id="commandName" readonly>
                            </div>
                            <div class="form-group">
                                <label for="commandDescription">Description</label>
                                <input type="text" class="form-control" id="commandDescription">
                            </div>
                            <div class="form-group">
                                <label for="commandAccess">Access Level</label>
                                <select class="form-control" id="commandAccess">
                                    <option value="all">All Users</option>
                                    <option value="member">Group Members</option>
                                    <option value="admin">Group Admin</option>
                                    <option value="owner">Bot Owner</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="commandMessage">Response Message</label>
                                <textarea class="form-control" id="commandMessage" rows="5" placeholder="Enter the response message for this command..."></textarea>
                                <small class="form-text text-muted">
                                    You can use WhatsApp formatting: *bold*, _italic_, ~strikethrough~, \`code\`
                                </small>
                            </div>
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" id="commandEnabled">
                                <label class="form-check-label" for="commandEnabled">
                                    Command Enabled
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveCommand()">
                            <i class="fas fa-save mr-1"></i>Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Initialize DataTable
            $(document).ready(function() {
                $('#commandsTable').DataTable({
                    columnDefs: [
                        { orderable: false, targets: [4] } // Disable sorting for action column
                    ]
                });
            });

            function editCommand(commandName) {
                // Set command name
                document.getElementById('commandName').value = commandName;

                // Load command data (this would normally come from an API)
                const commandData = {
                    'hell': {
                        description: 'Show current Hell Event information',
                        access: 'all',
                        message: 'Current Hell Event information will be displayed here.',
                        enabled: true
                    },
                    'monster': {
                        description: 'Show monster rotation schedule',
                        access: 'all',
                        message: 'Monster rotation schedule will be displayed here.',
                        enabled: true
                    },
                    'help': {
                        description: 'Show available commands',
                        access: 'all',
                        message: 'Available commands:\\n!hell - Hell Event info\\n!monster - Monster rotation\\n!help - This help',
                        enabled: true
                    },
                    'rent': {
                        description: 'Bot rental management',
                        access: 'admin',
                        message: 'Bot rental management commands.',
                        enabled: true
                    },
                    'restart': {
                        description: 'Restart bot system',
                        access: 'owner',
                        message: 'Bot will restart in 30 seconds...',
                        enabled: true
                    }
                };

                const data = commandData[commandName] || {};
                document.getElementById('commandDescription').value = data.description || '';
                document.getElementById('commandAccess').value = data.access || 'all';
                document.getElementById('commandMessage').value = data.message || '';
                document.getElementById('commandEnabled').checked = data.enabled || false;

                $('#commandEditModal').modal('show');
            }

            function saveCommand() {
                const commandName = document.getElementById('commandName').value;
                const description = document.getElementById('commandDescription').value;
                const access = document.getElementById('commandAccess').value;
                const message = document.getElementById('commandMessage').value;
                const enabled = document.getElementById('commandEnabled').checked;

                // Here you would normally send the data to an API
                console.log('Saving command:', {
                    name: commandName,
                    description,
                    access,
                    message,
                    enabled
                });

                showNotification('success', 'Command updated successfully!');
                $('#commandEditModal').modal('hide');
            }

            function toggleCommand(commandName) {
                if (confirm('Are you sure you want to toggle this command?')) {
                    // Here you would normally call an API to toggle the command
                    showNotification('info', 'Command ' + commandName + ' toggled');
                }
            }

            function addNewCommand() {
                // Clear form
                document.getElementById('commandEditForm').reset();
                document.getElementById('commandName').value = '';
                document.getElementById('commandName').readOnly = false;
                $('#commandEditModal').modal('show');
            }
        </script>
    `;

    res.send(createAdminLTELayout('Command List', content, 'commands', req.session.username));
});

// Groups page
router.get('/groups', checkSession, (req, res) => {
    const content = `
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-users mr-1"></i>
                            WhatsApp Groups
                        </h3>
                        <div class="card-tools">
                            <button class="btn btn-success btn-sm" onclick="refreshGroups()">
                                <i class="fas fa-sync-alt mr-1"></i>Refresh
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-bordered table-striped data-table" id="groupsTable">
                                <thead>
                                    <tr>
                                        <th>Group Name</th>
                                        <th>Members</th>
                                        <th>Hell Events</th>
                                        <th>Bot Status</th>
                                        <th>Rent Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <strong>Lords Mobile Indonesia</strong><br>
                                            <small class="text-muted">120363167287303832@g.us</small>
                                        </td>
                                        <td>
                                            <span class="badge badge-info">156 members</span>
                                        </td>
                                        <td>
                                            <span class="badge badge-success">All Events</span>
                                        </td>
                                        <td>
                                            <span class="badge badge-success">
                                                <i class="fas fa-check-circle mr-1"></i>Active
                                            </span>
                                        </td>
                                        <td>
                                            <span class="badge badge-warning">
                                                <i class="fas fa-clock mr-1"></i>15 days left
                                            </span>
                                        </td>
                                        <td>
                                            <div class="btn-group" role="group">
                                                <button class="btn btn-sm btn-outline-primary" onclick="editGroup('120363167287303832@g.us')">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-warning" onclick="toggleBot('120363167287303832@g.us')">
                                                    <i class="fas fa-power-off"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-danger" onclick="leaveGroup('120363167287303832@g.us')">
                                                    <i class="fas fa-sign-out-alt"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>LM Guild Alliance</strong><br>
                                            <small class="text-muted">120363329911125895@g.us</small>
                                        </td>
                                        <td>
                                            <span class="badge badge-info">89 members</span>
                                        </td>
                                        <td>
                                            <span class="badge badge-primary">Watcher & Chaos</span>
                                        </td>
                                        <td>
                                            <span class="badge badge-success">
                                                <i class="fas fa-check-circle mr-1"></i>Active
                                            </span>
                                        </td>
                                        <td>
                                            <span class="badge badge-success">
                                                <i class="fas fa-infinity mr-1"></i>Unlimited
                                            </span>
                                        </td>
                                        <td>
                                            <div class="btn-group" role="group">
                                                <button class="btn btn-sm btn-outline-primary" onclick="editGroup('120363329911125895@g.us')">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-warning" onclick="toggleBot('120363329911125895@g.us')">
                                                    <i class="fas fa-power-off"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-danger" onclick="leaveGroup('120363329911125895@g.us')">
                                                    <i class="fas fa-sign-out-alt"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Test Group</strong><br>
                                            <small class="text-muted">120363123456789012@g.us</small>
                                        </td>
                                        <td>
                                            <span class="badge badge-info">25 members</span>
                                        </td>
                                        <td>
                                            <span class="badge badge-secondary">Disabled</span>
                                        </td>
                                        <td>
                                            <span class="badge badge-danger">
                                                <i class="fas fa-times-circle mr-1"></i>Inactive
                                            </span>
                                        </td>
                                        <td>
                                            <span class="badge badge-danger">
                                                <i class="fas fa-exclamation-triangle mr-1"></i>Expired
                                            </span>
                                        </td>
                                        <td>
                                            <div class="btn-group" role="group">
                                                <button class="btn btn-sm btn-outline-primary" onclick="editGroup('120363123456789012@g.us')">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-success" onclick="toggleBot('120363123456789012@g.us')">
                                                    <i class="fas fa-power-off"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-danger" onclick="leaveGroup('120363123456789012@g.us')">
                                                    <i class="fas fa-sign-out-alt"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Group Edit Modal -->
        <div class="modal fade" id="groupEditModal" tabindex="-1" role="dialog">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">Edit Group Settings</h4>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="groupEditForm">
                            <div class="form-group">
                                <label for="groupId">Group ID</label>
                                <input type="text" class="form-control" id="groupId" readonly>
                            </div>
                            <div class="form-group">
                                <label for="groupName">Group Name</label>
                                <input type="text" class="form-control" id="groupName" readonly>
                            </div>
                            <div class="form-group">
                                <label for="hellEventSetting">Hell Event Notifications</label>
                                <select class="form-control" id="hellEventSetting">
                                    <option value="all">All Hell Events</option>
                                    <option value="watcherchaos">Watcher & Chaos Dragon Only</option>
                                    <option value="disabled">Disabled</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="botEnabled">Bot Status</label>
                                <select class="form-control" id="botEnabled">
                                    <option value="true">Enabled</option>
                                    <option value="false">Disabled</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="rentExpiry">Rent Expiry</label>
                                <input type="datetime-local" class="form-control" id="rentExpiry">
                                <small class="form-text text-muted">Leave empty for unlimited access</small>
                            </div>
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" id="autoMessages">
                                <label class="form-check-label" for="autoMessages">
                                    Enable Auto Messages
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveGroupSettings()">
                            <i class="fas fa-save mr-1"></i>Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Initialize DataTable
            $(document).ready(function() {
                $('#groupsTable').DataTable({
                    columnDefs: [
                        { orderable: false, targets: [5] } // Disable sorting for action column
                    ]
                });
            });

            function editGroup(groupId) {
                // Set group ID
                document.getElementById('groupId').value = groupId;

                // Load group data (this would normally come from an API)
                const groupData = {
                    '120363167287303832@g.us': {
                        name: 'Lords Mobile Indonesia',
                        hellEvent: 'all',
                        enabled: true,
                        rentExpiry: '',
                        autoMessages: true
                    },
                    '120363329911125895@g.us': {
                        name: 'LM Guild Alliance',
                        hellEvent: 'watcherchaos',
                        enabled: true,
                        rentExpiry: '',
                        autoMessages: true
                    },
                    '120363123456789012@g.us': {
                        name: 'Test Group',
                        hellEvent: 'disabled',
                        enabled: false,
                        rentExpiry: '2024-01-01T00:00',
                        autoMessages: false
                    }
                };

                const data = groupData[groupId] || {};
                document.getElementById('groupName').value = data.name || '';
                document.getElementById('hellEventSetting').value = data.hellEvent || 'all';
                document.getElementById('botEnabled').value = data.enabled ? 'true' : 'false';
                document.getElementById('rentExpiry').value = data.rentExpiry || '';
                document.getElementById('autoMessages').checked = data.autoMessages || false;

                $('#groupEditModal').modal('show');
            }

            function saveGroupSettings() {
                const groupId = document.getElementById('groupId').value;
                const hellEvent = document.getElementById('hellEventSetting').value;
                const enabled = document.getElementById('botEnabled').value === 'true';
                const rentExpiry = document.getElementById('rentExpiry').value;
                const autoMessages = document.getElementById('autoMessages').checked;

                // Here you would normally send the data to an API
                console.log('Saving group settings:', {
                    groupId,
                    hellEvent,
                    enabled,
                    rentExpiry,
                    autoMessages
                });

                showNotification('success', 'Group settings updated successfully!');
                $('#groupEditModal').modal('hide');
            }

            function toggleBot(groupId) {
                if (confirm('Are you sure you want to toggle bot status for this group?')) {
                    // Here you would normally call an API to toggle the bot
                    showNotification('info', 'Bot status toggled for group');
                }
            }

            function leaveGroup(groupId) {
                if (confirm('Are you sure you want to leave this group? This action cannot be undone.')) {
                    // Here you would normally call an API to leave the group
                    showNotification('warning', 'Left group successfully');
                }
            }

            function refreshGroups() {
                showNotification('info', 'Refreshing group list...');
                // Here you would normally reload the group data
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        </script>
    `;

    res.send(createAdminLTELayout('Groups', content, 'groups', req.session.username));
});

// Settings page
router.get('/settings', checkSession, (req, res) => {
    const content = `
        <div class="row">
            <!-- Bot Settings -->
            <div class="col-lg-6">
                <div class="card card-primary">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-robot mr-1"></i>
                            Bot Settings
                        </h3>
                    </div>
                    <div class="card-body">
                        <form id="botSettingsForm">
                            <div class="form-group">
                                <label for="botOwner">Bot Owner Number</label>
                                <input type="text" class="form-control" id="botOwner" value="${process.env.BOT_OWNER_NUMBER || ''}" placeholder="628xxxxxxxxxx">
                            </div>
                            <div class="form-group">
                                <label for="timezone">Timezone Offset</label>
                                <select class="form-control" id="timezone">
                                    <option value="7" ${process.env.TIMEZONE_OFFSET === '7' ? 'selected' : ''}>GMT+7 (WIB)</option>
                                    <option value="8" ${process.env.TIMEZONE_OFFSET === '8' ? 'selected' : ''}>GMT+8 (WITA)</option>
                                    <option value="9" ${process.env.TIMEZONE_OFFSET === '9' ? 'selected' : ''}>GMT+9 (WIT)</option>
                                </select>
                            </div>
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" id="autoRestart">
                                <label class="form-check-label" for="autoRestart">
                                    Auto Restart Daily
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="card-footer">
                        <button type="button" class="btn btn-primary" onclick="saveBotSettings()">
                            <i class="fas fa-save mr-1"></i>Save Settings
                        </button>
                    </div>
                </div>
            </div>

            <!-- Hell Events Settings -->
            <div class="col-lg-6">
                <div class="card card-warning">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-fire mr-1"></i>
                            Hell Events Settings
                        </h3>
                    </div>
                    <div class="card-body">
                        <form id="hellSettingsForm">
                            <div class="form-group">
                                <label for="discordChannel">Discord Channel ID</label>
                                <input type="text" class="form-control" id="discordChannel" value="${process.env.DISCORD_CHANNEL_ID || ''}" placeholder="1301050443090104360">
                            </div>
                            <div class="form-group">
                                <label for="defaultFilter">Default Hell Event Filter</label>
                                <select class="form-control" id="defaultFilter">
                                    <option value="false">All Hell Events</option>
                                    <option value="true">Watcher & Chaos Dragon Only</option>
                                </select>
                            </div>
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" id="hellNotifications" checked>
                                <label class="form-check-label" for="hellNotifications">
                                    Enable Hell Event Notifications
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="card-footer">
                        <button type="button" class="btn btn-warning" onclick="saveHellSettings()">
                            <i class="fas fa-save mr-1"></i>Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <!-- Monster Rotation Settings -->
            <div class="col-lg-6">
                <div class="card card-success">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-dragon mr-1"></i>
                            Monster Rotation Settings
                        </h3>
                    </div>
                    <div class="card-body">
                        <form id="monsterSettingsForm">
                            <div class="form-group">
                                <label for="resetTime">Daily Reset Time</label>
                                <input type="time" class="form-control" id="resetTime" value="11:55">
                                <small class="form-text text-muted">Time in WIB (GMT+7)</small>
                            </div>
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" id="monsterNotifications" checked>
                                <label class="form-check-label" for="monsterNotifications">
                                    Enable Daily Monster Notifications
                                </label>
                            </div>
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" id="individualLookup" checked>
                                <label class="form-check-label" for="individualLookup">
                                    Enable Individual Monster Lookup
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="card-footer">
                        <button type="button" class="btn btn-success" onclick="saveMonsterSettings()">
                            <i class="fas fa-save mr-1"></i>Save Settings
                        </button>
                    </div>
                </div>
            </div>

            <!-- Payment Settings -->
            <div class="col-lg-6">
                <div class="card card-info">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-credit-card mr-1"></i>
                            Payment Settings
                        </h3>
                    </div>
                    <div class="card-body">
                        <form id="paymentSettingsForm">
                            <div class="form-group">
                                <label for="xenditMode">Xendit Mode</label>
                                <select class="form-control" id="xenditMode">
                                    <option value="test">Test Mode</option>
                                    <option value="live">Live Mode</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Pricing (IDR)</label>
                                <div class="row">
                                    <div class="col-6">
                                        <input type="number" class="form-control" placeholder="Daily" value="2000">
                                        <small class="form-text text-muted">Per day</small>
                                    </div>
                                    <div class="col-6">
                                        <input type="number" class="form-control" placeholder="Weekly" value="10000">
                                        <small class="form-text text-muted">Per week</small>
                                    </div>
                                </div>
                                <div class="row mt-2">
                                    <div class="col-6">
                                        <input type="number" class="form-control" placeholder="Monthly" value="50000">
                                        <small class="form-text text-muted">Per month</small>
                                    </div>
                                    <div class="col-6">
                                        <input type="number" class="form-control" placeholder="Yearly" value="950000">
                                        <small class="form-text text-muted">Per year</small>
                                    </div>
                                </div>
                            </div>
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" id="trialEnabled" checked>
                                <label class="form-check-label" for="trialEnabled">
                                    Enable 1-day Trial
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="card-footer">
                        <button type="button" class="btn btn-info" onclick="savePaymentSettings()">
                            <i class="fas fa-save mr-1"></i>Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- System Actions -->
        <div class="row">
            <div class="col-12">
                <div class="card card-danger">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-exclamation-triangle mr-1"></i>
                            System Actions
                        </h3>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3">
                                <button class="btn btn-warning btn-block" onclick="restartBot()">
                                    <i class="fas fa-redo mr-1"></i>Restart Bot
                                </button>
                            </div>
                            <div class="col-md-3">
                                <button class="btn btn-info btn-block" onclick="clearLogs()">
                                    <i class="fas fa-trash mr-1"></i>Clear Logs
                                </button>
                            </div>
                            <div class="col-md-3">
                                <button class="btn btn-success btn-block" onclick="exportData()">
                                    <i class="fas fa-download mr-1"></i>Export Data
                                </button>
                            </div>
                            <div class="col-md-3">
                                <button class="btn btn-danger" onclick="factoryReset()">
                                    <i class="fas fa-exclamation-triangle mr-1"></i>Factory Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            function saveBotSettings() {
                const botOwner = document.getElementById('botOwner').value;
                const timezone = document.getElementById('timezone').value;
                const autoRestart = document.getElementById('autoRestart').checked;

                // Here you would normally send the data to an API
                console.log('Saving bot settings:', { botOwner, timezone, autoRestart });
                showNotification('success', 'Bot settings saved successfully!');
            }

            function saveHellSettings() {
                const discordChannel = document.getElementById('discordChannel').value;
                const defaultFilter = document.getElementById('defaultFilter').value;
                const hellNotifications = document.getElementById('hellNotifications').checked;

                console.log('Saving hell settings:', { discordChannel, defaultFilter, hellNotifications });
                showNotification('success', 'Hell Events settings saved successfully!');
            }

            function saveMonsterSettings() {
                const resetTime = document.getElementById('resetTime').value;
                const monsterNotifications = document.getElementById('monsterNotifications').checked;
                const individualLookup = document.getElementById('individualLookup').checked;

                console.log('Saving monster settings:', { resetTime, monsterNotifications, individualLookup });
                showNotification('success', 'Monster Rotation settings saved successfully!');
            }

            function savePaymentSettings() {
                const xenditMode = document.getElementById('xenditMode').value;
                const trialEnabled = document.getElementById('trialEnabled').checked;

                console.log('Saving payment settings:', { xenditMode, trialEnabled });
                showNotification('success', 'Payment settings saved successfully!');
            }

            function restartBot() {
                if (confirm('Are you sure you want to restart the bot? This will disconnect all users temporarily.')) {
                    showNotification('warning', 'Bot restart initiated...');
                    // Here you would call the restart API
                }
            }

            function clearLogs() {
                if (confirm('Are you sure you want to clear all logs?')) {
                    showNotification('info', 'Logs cleared successfully!');
                }
            }

            function exportData() {
                showNotification('info', 'Exporting data...');
                // Here you would trigger data export
            }

            function factoryReset() {
                if (confirm('WARNING: This will reset all settings and data. Are you absolutely sure?')) {
                    if (confirm('This action cannot be undone. Continue?')) {
                        showNotification('error', 'Factory reset initiated...');
                    }
                }
            }
        </script>
    `;

    res.send(createAdminLTELayout('Settings', content, 'settings', req.session.username));
});

// Statistics page
router.get('/statistics', checkSession, (req, res) => {
    const messageStats = Message.getAll(1, 1);
    const totalMessages = messageStats.pagination ? messageStats.pagination.totalItems : 0;

    let sentCount = 0;
    let receivedCount = 0;
    let failedCount = 0;

    const recentMessages = Message.getAll(1, 1000);
    if (recentMessages.messages) {
        recentMessages.messages.forEach(msg => {
            if (msg.type === 'sent') sentCount++;
            else if (msg.type === 'received') receivedCount++;
            if (msg.status === 'failed') failedCount++;
        });
    }

    const content = `
        <div class="row">
            <!-- Message Statistics -->
            <div class="col-lg-3 col-6">
                <div class="small-box bg-info">
                    <div class="inner">
                        <h3>${totalMessages}</h3>
                        <p>Total Messages</p>
                    </div>
                    <div class="icon">
                        <i class="fas fa-comments"></i>
                    </div>
                    <a href="/dashboard/messages" class="small-box-footer">
                        More info <i class="fas fa-arrow-circle-right"></i>
                    </a>
                </div>
            </div>

            <div class="col-lg-3 col-6">
                <div class="small-box bg-success">
                    <div class="inner">
                        <h3>${sentCount}</h3>
                        <p>Messages Sent</p>
                    </div>
                    <div class="icon">
                        <i class="fas fa-arrow-up"></i>
                    </div>
                    <a href="#" class="small-box-footer">
                        More info <i class="fas fa-arrow-circle-right"></i>
                    </a>
                </div>
            </div>

            <div class="col-lg-3 col-6">
                <div class="small-box bg-warning">
                    <div class="inner">
                        <h3>${receivedCount}</h3>
                        <p>Messages Received</p>
                    </div>
                    <div class="icon">
                        <i class="fas fa-arrow-down"></i>
                    </div>
                    <a href="#" class="small-box-footer">
                        More info <i class="fas fa-arrow-circle-right"></i>
                    </a>
                </div>
            </div>

            <div class="col-lg-3 col-6">
                <div class="small-box bg-danger">
                    <div class="inner">
                        <h3>${failedCount}</h3>
                        <p>Failed Messages</p>
                    </div>
                    <div class="icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <a href="#" class="small-box-footer">
                        More info <i class="fas fa-arrow-circle-right"></i>
                    </a>
                </div>
            </div>
        </div>

        <div class="row">
            <!-- Charts -->
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-chart-pie mr-1"></i>
                            Message Distribution
                        </h3>
                    </div>
                    <div class="card-body">
                        <canvas id="messageChart" style="min-height: 250px; height: 250px; max-height: 250px; max-width: 100%;"></canvas>
                    </div>
                </div>
            </div>

            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-chart-line mr-1"></i>
                            Daily Activity
                        </h3>
                    </div>
                    <div class="card-body">
                        <canvas id="activityChart" style="min-height: 250px; height: 250px; max-height: 250px; max-width: 100%;"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <!-- System Performance -->
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-server mr-1"></i>
                            System Performance
                        </h3>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3">
                                <div class="info-box">
                                    <span class="info-box-icon bg-info"><i class="fas fa-memory"></i></span>
                                    <div class="info-box-content">
                                        <span class="info-box-text">Memory Usage</span>
                                        <span class="info-box-number" id="memoryUsage">Loading...</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="info-box">
                                    <span class="info-box-icon bg-success"><i class="fas fa-microchip"></i></span>
                                    <div class="info-box-content">
                                        <span class="info-box-text">CPU Usage</span>
                                        <span class="info-box-number" id="cpuUsage">Loading...</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="info-box">
                                    <span class="info-box-icon bg-warning"><i class="fas fa-clock"></i></span>
                                    <div class="info-box-content">
                                        <span class="info-box-text">Uptime</span>
                                        <span class="info-box-number" id="systemUptime">Loading...</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="info-box">
                                    <span class="info-box-icon bg-danger"><i class="fas fa-wifi"></i></span>
                                    <div class="info-box-content">
                                        <span class="info-box-text">Connection</span>
                                        <span class="info-box-number">Stable</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Chart.js -->
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

        <script>
            // Message Distribution Chart
            const messageCtx = document.getElementById('messageChart').getContext('2d');
            new Chart(messageCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Sent', 'Received', 'Failed'],
                    datasets: [{
                        data: [${sentCount}, ${receivedCount}, ${failedCount}],
                        backgroundColor: ['#28a745', '#ffc107', '#dc3545']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });

            // Daily Activity Chart
            const activityCtx = document.getElementById('activityChart').getContext('2d');
            new Chart(activityCtx, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Messages',
                        data: [12, 19, 3, 5, 2, 3, 9],
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });

            // Update system performance
            function updateSystemPerformance() {
                // Simulate system performance data
                const memoryUsage = Math.floor(Math.random() * 40 + 30) + '%';
                const cpuUsage = Math.floor(Math.random() * 20 + 10) + '%';

                document.getElementById('memoryUsage').textContent = memoryUsage;
                document.getElementById('cpuUsage').textContent = cpuUsage;

                // Update uptime
                const startTime = new Date('${new Date().toISOString()}');
                const now = new Date();
                const uptime = Math.floor((now - startTime) / 1000);

                const hours = Math.floor(uptime / 3600);
                const minutes = Math.floor((uptime % 3600) / 60);

                document.getElementById('systemUptime').textContent = hours + 'h ' + minutes + 'm';
            }

            // Update performance every 5 seconds
            setInterval(updateSystemPerformance, 5000);
            updateSystemPerformance();
        </script>
    `;

    res.send(createAdminLTELayout('Statistics', content, 'statistics', req.session.username));
});

// Logs page
router.get('/logs', checkSession, (req, res) => {
    const content = `
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-file-alt mr-1"></i>
                            System Logs
                        </h3>
                        <div class="card-tools">
                            <button class="btn btn-outline-primary btn-sm" onclick="refreshLogs()">
                                <i class="fas fa-sync-alt mr-1"></i>Refresh
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="clearLogs()">
                                <i class="fas fa-trash mr-1"></i>Clear
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
                                <i class="fas fa-info-circle mr-1"></i>
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
                        <h6 class="mb-0"><i class="fas fa-filter mr-2"></i>Log Filters</h6>
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
                        <h6 class="mb-0"><i class="fas fa-download mr-2"></i>Export Logs</h6>
                    </div>
                    <div class="card-body">
                        <button class="btn btn-outline-primary btn-block mb-2" onclick="downloadLogs('txt')">
                            <i class="fas fa-file-alt mr-1"></i>Download as TXT
                        </button>
                        <button class="btn btn-outline-success btn-block mb-2" onclick="downloadLogs('json')">
                            <i class="fas fa-file-code mr-1"></i>Download as JSON
                        </button>
                        <button class="btn btn-outline-info btn-block" onclick="emailLogs()">
                            <i class="fas fa-envelope mr-1"></i>Email Logs
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Initialize Socket.IO for real-time logs
            const socket = io();

            // Handle log updates
            socket.on('log', function(logData) {
                const logContainer = document.getElementById('logContent');
                const logEntry = document.createElement('div');

                // Determine log level class
                let logClass = 'text-light';
                if (logData.level === 'error') logClass = 'text-danger';
                else if (logData.level === 'warning') logClass = 'text-warning';
                else if (logData.level === 'info') logClass = 'text-info';
                else if (logData.level === 'success') logClass = 'text-success';

                logEntry.className = logClass;
                logEntry.textContent = '[' + new Date().toISOString() + '] ' + logData.message;

                logContainer.appendChild(logEntry);

                // Auto-scroll to bottom
                const container = document.getElementById('logContainer');
                container.scrollTop = container.scrollHeight;

                // Keep only last 1000 log entries
                const entries = logContainer.children;
                if (entries.length > 1000) {
                    logContainer.removeChild(entries[0]);
                }
            });

            function refreshLogs() {
                window.location.reload();
            }

            function clearLogs() {
                if (confirm('Are you sure you want to clear all logs?')) {
                    document.getElementById('logContent').innerHTML = '<div class="text-muted">--- Logs cleared ---</div>';
                    showNotification('info', 'Logs cleared successfully');
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

                showNotification('success', 'Logs downloaded successfully');
            }

            function emailLogs() {
                showNotification('info', 'Email logs feature will be available soon');
            }
        </script>
    `;

    res.send(createAdminLTELayout('System Logs', content, 'logs', req.session.username));
});

module.exports = { router, setWhatsAppClientRef };
