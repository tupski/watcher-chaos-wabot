/**
 * AdminLTE 3 Layout for Bot Lords Mobile Dashboard
 */

function createAdminLTELayout(title, content, activeMenu = '', username = '') {
    return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title} | Bot Lords Mobile Dashboard</title>

    <!-- Google Font: Source Sans Pro -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- AdminLTE 3 -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/css/adminlte.min.css">
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <!-- DataTables -->
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap4.min.css">
    <!-- SweetAlert2 -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
    <!-- Custom CSS -->
    <style>
        .brand-link {
            border-bottom: 1px solid #4f5962;
        }
        .brand-text {
            font-weight: 300;
            font-size: 1.2rem;
        }
        .sidebar-dark-primary .nav-sidebar > .nav-item > .nav-link.active {
            background-color: #007bff;
            color: #fff;
        }
        .content-wrapper {
            background-color: #f4f6f9;
        }
        .card {
            box-shadow: 0 0 1px rgba(0,0,0,.125), 0 1px 3px rgba(0,0,0,.2);
            margin-bottom: 1rem;
        }
        .info-box {
            box-shadow: 0 0 1px rgba(0,0,0,.125), 0 1px 3px rgba(0,0,0,.2);
            border-radius: .25rem;
            background-color: #fff;
            display: flex;
            margin-bottom: 1rem;
            min-height: 80px;
            padding: .5rem;
            position: relative;
            width: 100%;
        }
        .info-box .info-box-icon {
            border-radius: .25rem;
            align-items: center;
            display: flex;
            font-size: 1.875rem;
            justify-content: center;
            text-align: center;
            width: 70px;
        }
        .info-box .info-box-content {
            display: flex;
            flex-direction: column;
            justify-content: center;
            line-height: 1.8;
            flex: 1;
            padding: 0 10px;
        }
        .status-indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 5px;
        }
        .status-online { background-color: #28a745; }
        .status-offline { background-color: #dc3545; }
        .message-preview {
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            cursor: pointer;
        }
        .message-preview:hover {
            background-color: #f8f9fa;
            padding: 2px 4px;
            border-radius: 3px;
        }
        .floating-menu {
            display: none;
        }
        @media (max-width: 768px) {
            .floating-menu {
                display: flex;
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #007bff;
                border-radius: 25px;
                padding: 10px;
                box-shadow: 0 4px 12px rgba(0,123,255,0.3);
                z-index: 1050;
                gap: 10px;
            }
            .floating-menu a {
                color: white;
                text-decoration: none;
                padding: 8px 12px;
                border-radius: 15px;
                transition: background-color 0.3s;
            }
            .floating-menu a:hover,
            .floating-menu a.active {
                background-color: rgba(255,255,255,0.2);
                color: white;
            }
        }
    </style>
</head>
<body class="hold-transition sidebar-mini layout-fixed">
<div class="wrapper">

    <!-- Preloader -->
    <div class="preloader flex-column justify-content-center align-items-center">
        <img class="animation__shake" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjMDA3YmZmIi8+Cjwvc3ZnPgo=" alt="BotLM Logo" height="60" width="60">
    </div>

    <!-- Navbar -->
    <nav class="main-header navbar navbar-expand navbar-white navbar-light">
        <!-- Left navbar links -->
        <ul class="navbar-nav">
            <li class="nav-item">
                <a class="nav-link" data-widget="pushmenu" href="#" role="button"><i class="fas fa-bars"></i></a>
            </li>
            <li class="nav-item d-none d-sm-inline-block">
                <a href="/dashboard" class="nav-link">Dashboard</a>
            </li>
            <li class="nav-item d-none d-sm-inline-block">
                <a href="/dashboard/bot-profile" class="nav-link">Bot Profile</a>
            </li>
        </ul>

        <!-- Right navbar links -->
        <ul class="navbar-nav ml-auto">
            <!-- Messages Dropdown Menu -->
            <li class="nav-item dropdown">
                <a class="nav-link" data-toggle="dropdown" href="#">
                    <i class="far fa-comments"></i>
                    <span class="badge badge-danger navbar-badge" id="messageCount">0</span>
                </a>
                <div class="dropdown-menu dropdown-menu-lg dropdown-menu-right">
                    <a href="#" class="dropdown-item">
                        <div class="media">
                            <div class="media-body">
                                <h3 class="dropdown-item-title">
                                    Recent Messages
                                </h3>
                                <p class="text-sm" id="recentMessagePreview">No new messages</p>
                            </div>
                        </div>
                    </a>
                    <div class="dropdown-divider"></div>
                    <a href="/dashboard/messages" class="dropdown-item dropdown-footer">See All Messages</a>
                </div>
            </li>
            
            <!-- User Account Menu -->
            <li class="nav-item dropdown">
                <a class="nav-link" data-toggle="dropdown" href="#">
                    <i class="far fa-user"></i>
                    <span class="d-none d-md-inline">${username || 'Admin'}</span>
                </a>
                <div class="dropdown-menu dropdown-menu-lg dropdown-menu-right">
                    <span class="dropdown-item-title">
                        <i class="fas fa-user mr-2"></i>
                        ${username || 'Administrator'}
                    </span>
                    <div class="dropdown-divider"></div>
                    <a href="/dashboard/settings" class="dropdown-item">
                        <i class="fas fa-cog mr-2"></i> Settings
                    </a>
                    <div class="dropdown-divider"></div>
                    <a href="/logout" class="dropdown-item">
                        <i class="fas fa-sign-out-alt mr-2"></i> Logout
                    </a>
                </div>
            </li>
            
            <!-- Control Sidebar Toggle -->
            <li class="nav-item">
                <a class="nav-link" data-widget="fullscreen" href="#" role="button">
                    <i class="fas fa-expand-arrows-alt"></i>
                </a>
            </li>
        </ul>
    </nav>

    <!-- Main Sidebar Container -->
    <aside class="main-sidebar sidebar-dark-primary elevation-4">
        <!-- Brand Logo -->
        <a href="/dashboard" class="brand-link">
            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzMiIGhlaWdodD0iMzMiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjZmZmIi8+Cjwvc3ZnPgo=" alt="BotLM Logo" class="brand-image img-circle elevation-3" style="opacity: .8">
            <span class="brand-text font-weight-light">Bot Lords Mobile</span>
        </a>

        <!-- Sidebar -->
        <div class="sidebar">
            <!-- Sidebar Menu -->
            <nav class="mt-2">
                <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
                    <!-- Dashboard -->
                    <li class="nav-item">
                        <a href="/dashboard" class="nav-link ${activeMenu === 'dashboard' ? 'active' : ''}">
                            <i class="nav-icon fas fa-tachometer-alt"></i>
                            <p>Dashboard</p>
                        </a>
                    </li>
                    
                    <!-- Bot Management -->
                    <li class="nav-header">BOT MANAGEMENT</li>
                    <li class="nav-item">
                        <a href="/dashboard/bot-profile" class="nav-link ${activeMenu === 'bot-profile' ? 'active' : ''}">
                            <i class="nav-icon fas fa-robot"></i>
                            <p>Bot Profile</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="/dashboard/messages" class="nav-link ${activeMenu === 'messages' ? 'active' : ''}">
                            <i class="nav-icon fas fa-comments"></i>
                            <p>Message Log</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="/dashboard/commands" class="nav-link ${activeMenu === 'commands' ? 'active' : ''}">
                            <i class="nav-icon fas fa-list"></i>
                            <p>Command List</p>
                        </a>
                    </li>
                    
                    <!-- Group Management -->
                    <li class="nav-header">GROUP MANAGEMENT</li>
                    <li class="nav-item">
                        <a href="/dashboard/groups" class="nav-link ${activeMenu === 'groups' ? 'active' : ''}">
                            <i class="nav-icon fas fa-users"></i>
                            <p>Groups</p>
                        </a>
                    </li>
                    
                    <!-- System -->
                    <li class="nav-header">SYSTEM</li>
                    <li class="nav-item">
                        <a href="/dashboard/settings" class="nav-link ${activeMenu === 'settings' ? 'active' : ''}">
                            <i class="nav-icon fas fa-cogs"></i>
                            <p>Settings</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="/dashboard/statistics" class="nav-link ${activeMenu === 'statistics' ? 'active' : ''}">
                            <i class="nav-icon fas fa-chart-bar"></i>
                            <p>Statistics</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="/dashboard/logs" class="nav-link ${activeMenu === 'logs' ? 'active' : ''}">
                            <i class="nav-icon fas fa-file-alt"></i>
                            <p>System Logs</p>
                        </a>
                    </li>
                </ul>
            </nav>
        </div>
    </aside>

    <!-- Content Wrapper -->
    <div class="content-wrapper">
        <!-- Content Header (Page header) -->
        <div class="content-header">
            <div class="container-fluid">
                <div class="row mb-2">
                    <div class="col-sm-6">
                        <h1 class="m-0">${title}</h1>
                    </div>
                    <div class="col-sm-6">
                        <ol class="breadcrumb float-sm-right">
                            <li class="breadcrumb-item"><a href="/dashboard">Dashboard</a></li>
                            ${title !== 'Dashboard' ? `<li class="breadcrumb-item active">${title}</li>` : ''}
                        </ol>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main content -->
        <section class="content">
            <div class="container-fluid">
                ${content}
            </div>
        </section>
    </div>

    <!-- Footer -->
    <footer class="main-footer">
        <strong>Copyright &copy; 2024 <a href="#">Bot Lords Mobile</a>.</strong>
        All rights reserved.
        <div class="float-right d-none d-sm-inline-block">
            <b>Version</b> 2.0.0
        </div>
    </footer>

    <!-- Floating Quick Access Menu for Mobile -->
    <div class="floating-menu">
        <a href="/dashboard" class="${activeMenu === 'dashboard' ? 'active' : ''}">
            <i class="fas fa-tachometer-alt"></i>
        </a>
        <a href="/dashboard/groups" class="${activeMenu === 'groups' ? 'active' : ''}">
            <i class="fas fa-users"></i>
        </a>
        <a href="/dashboard/messages" class="${activeMenu === 'messages' ? 'active' : ''}">
            <i class="fas fa-comments"></i>
        </a>
        <a href="/dashboard/bot-profile" class="${activeMenu === 'bot-profile' ? 'active' : ''}">
            <i class="fas fa-robot"></i>
        </a>
        <a href="/dashboard/settings" class="${activeMenu === 'settings' ? 'active' : ''}">
            <i class="fas fa-cogs"></i>
        </a>
    </div>
</div>

<!-- jQuery -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<!-- Bootstrap 4 -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js"></script>
<!-- AdminLTE 3 -->
<script src="https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/js/adminlte.min.js"></script>
<!-- DataTables -->
<script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap4.min.js"></script>
<!-- SweetAlert2 -->
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<!-- Socket.IO -->
<script src="/socket.io/socket.io.js"></script>

<script>
    // Initialize AdminLTE
    $(document).ready(function() {
        // Initialize DataTables if present
        if ($.fn.DataTable) {
            $('.data-table').DataTable({
                responsive: true,
                lengthChange: false,
                autoWidth: false,
                pageLength: 25,
                language: {
                    search: "Cari:",
                    lengthMenu: "Tampilkan _MENU_ data per halaman",
                    info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
                    infoEmpty: "Menampilkan 0 sampai 0 dari 0 data",
                    infoFiltered: "(difilter dari _MAX_ total data)",
                    paginate: {
                        first: "Pertama",
                        last: "Terakhir",
                        next: "Selanjutnya",
                        previous: "Sebelumnya"
                    },
                    emptyTable: "Tidak ada data tersedia"
                }
            });
        }

        // Initialize Socket.IO for real-time updates
        if (typeof io !== 'undefined') {
            const socket = io();
            
            // Handle new messages
            socket.on('new-message', function(message) {
                updateMessageCount();
                updateRecentMessage(message);
            });
            
            // Handle WhatsApp connection status
            socket.on('whatsapp-connected', function() {
                showNotification('success', 'WhatsApp terhubung!');
            });
            
            socket.on('whatsapp-disconnected', function() {
                showNotification('warning', 'WhatsApp terputus!');
            });
        }
    });

    // Update message count in navbar
    function updateMessageCount() {
        fetch('/api/messages?limit=1')
            .then(response => response.json())
            .then(data => {
                if (data.pagination) {
                    document.getElementById('messageCount').textContent = data.pagination.totalItems || 0;
                }
            })
            .catch(error => console.error('Error updating message count:', error));
    }

    // Update recent message preview
    function updateRecentMessage(message) {
        const preview = document.getElementById('recentMessagePreview');
        if (preview && message) {
            const text = message.body ? message.body.substring(0, 50) + '...' : 'New message received';
            preview.textContent = text;
        }
    }

    // Show notification using SweetAlert2 toasts
    function showNotification(type, message) {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
        });

        Toast.fire({
            icon: type,
            title: message
        });
    }

    // Make showNotification globally available
    window.showNotification = showNotification;

    // Initialize message count on page load
    updateMessageCount();
</script>

</body>
</html>
    `;
}

module.exports = {
    createAdminLTELayout
};
