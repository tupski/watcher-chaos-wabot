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

module.exports = { router, setWhatsAppClientRef };
