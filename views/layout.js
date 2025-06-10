// Dashboard layout template with Bootstrap 5
function createLayout(title, content, activeMenu = 'dashboard', username = 'Admin') {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title} - Bot Lords Mobile</title>
            
            <!-- Bootstrap 5 CSS -->
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <!-- Bootstrap Icons -->
            <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet">
            <!-- Custom CSS -->
            <style>
                :root {
                    --primary-color: #667eea;
                    --secondary-color: #764ba2;
                    --sidebar-width: 280px;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f8f9fa;
                }
                
                .sidebar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    height: 100vh;
                    width: var(--sidebar-width);
                    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
                    color: white;
                    z-index: 1000;
                    transition: transform 0.3s ease;
                }
                
                .sidebar-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                
                .sidebar-header h4 {
                    margin: 0;
                    font-weight: 600;
                }
                
                .sidebar-menu {
                    padding: 1rem 0;
                }
                
                .sidebar-menu .nav-link {
                    color: rgba(255,255,255,0.8);
                    padding: 0.75rem 1.5rem;
                    border-radius: 0;
                    transition: all 0.3s ease;
                    border-left: 3px solid transparent;
                }
                
                .sidebar-menu .nav-link:hover {
                    color: white;
                    background-color: rgba(255,255,255,0.1);
                    border-left-color: white;
                }
                
                .sidebar-menu .nav-link.active {
                    color: white;
                    background-color: rgba(255,255,255,0.2);
                    border-left-color: white;
                }
                
                .sidebar-menu .nav-link i {
                    width: 20px;
                    margin-right: 0.75rem;
                }
                
                .main-content {
                    margin-left: var(--sidebar-width);
                    min-height: 100vh;
                }
                
                .top-navbar {
                    background: white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    padding: 1rem 2rem;
                    margin-bottom: 2rem;
                }
                
                .content-wrapper {
                    padding: 0 2rem 2rem;
                }
                
                .stat-card {
                    background: white;
                    border-radius: 10px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    border-left: 4px solid var(--primary-color);
                    transition: transform 0.2s ease;
                }
                
                .stat-card:hover {
                    transform: translateY(-2px);
                }
                
                .stat-card .stat-icon {
                    width: 50px;
                    height: 50px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                }
                
                .stat-card .stat-number {
                    font-size: 2rem;
                    font-weight: bold;
                    color: var(--primary-color);
                    margin: 0;
                }
                
                .stat-card .stat-label {
                    color: #6c757d;
                    font-size: 0.9rem;
                    margin: 0;
                }
                
                .card {
                    border: none;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    border-radius: 10px;
                }
                
                .card-header {
                    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
                    color: white;
                    border-radius: 10px 10px 0 0 !important;
                    border: none;
                }
                
                .btn-primary {
                    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
                    border: none;
                }
                
                .btn-primary:hover {
                    background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
                    border: none;
                }
                
                .table th {
                    border-top: none;
                    font-weight: 600;
                    color: #495057;
                }
                
                .badge {
                    font-size: 0.75rem;
                    padding: 0.5rem 0.75rem;
                }
                
                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .sidebar {
                        transform: translateX(-100%);
                    }

                    .sidebar.show {
                        transform: translateX(0);
                    }

                    .main-content {
                        margin-left: 0;
                    }

                    .content-wrapper {
                        padding: 0 1rem 5rem; /* Add bottom padding for floating menu */
                    }

                    .top-navbar {
                        padding: 1rem;
                        position: sticky;
                        top: 0;
                        z-index: 1020;
                    }
                }

                .mobile-menu-btn {
                    display: none;
                }

                @media (max-width: 768px) {
                    .mobile-menu-btn {
                        display: block;
                    }
                }

                .sidebar-overlay {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    z-index: 999;
                }

                @media (max-width: 768px) {
                    .sidebar-overlay.show {
                        display: block;
                    }
                }

                /* Floating Quick Access Menu for Mobile */
                .floating-menu {
                    display: none;
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
                    border-radius: 25px;
                    padding: 10px 20px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    z-index: 1030;
                }

                @media (max-width: 768px) {
                    .floating-menu {
                        display: flex;
                        gap: 15px;
                        align-items: center;
                    }
                }

                .floating-menu a {
                    color: white;
                    text-decoration: none;
                    padding: 8px 12px;
                    border-radius: 15px;
                    transition: background 0.3s;
                    font-size: 0.9rem;
                }

                .floating-menu a:hover {
                    background: rgba(255,255,255,0.2);
                }

                .floating-menu a.active {
                    background: rgba(255,255,255,0.3);
                }

                /* Clickable Cards */
                .clickable-card {
                    cursor: pointer;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }

                .clickable-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                }
            </style>
        </head>
        <body>
            <!-- Sidebar -->
            <nav class="sidebar" id="sidebar">
                <div class="sidebar-header">
                    <h4><i class="bi bi-robot"></i> Bot Lords Mobile</h4>
                    <small>Dashboard Admin</small>
                </div>
                
                <div class="sidebar-menu">
                    <ul class="nav flex-column">
                        <li class="nav-item">
                            <a class="nav-link ${activeMenu === 'dashboard' ? 'active' : ''}" href="/dashboard">
                                <i class="bi bi-speedometer2"></i> Dashboard
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${activeMenu === 'groups' ? 'active' : ''}" href="/dashboard/groups">
                                <i class="bi bi-people"></i> Group Management
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${activeMenu === 'settings' ? 'active' : ''}" href="/dashboard/settings">
                                <i class="bi bi-gear"></i> Bot Settings
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${activeMenu === 'hell-events' ? 'active' : ''}" href="/dashboard/hell-events">
                                <i class="bi bi-fire"></i> Hell Events
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${activeMenu === 'commands' ? 'active' : ''}" href="/dashboard/commands">
                                <i class="bi bi-list-ul"></i> Command List
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${activeMenu === 'statistics' ? 'active' : ''}" href="/dashboard/statistics">
                                <i class="bi bi-graph-up"></i> Statistics
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${activeMenu === 'logs' ? 'active' : ''}" href="/dashboard/logs">
                                <i class="bi bi-terminal"></i> System Logs
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${activeMenu === 'profile' ? 'active' : ''}" href="/dashboard/profile">
                                <i class="bi bi-person"></i> Profile
                            </a>
                        </li>
                        <li class="nav-item mt-3">
                            <a class="nav-link" href="/dashboard/logout">
                                <i class="bi bi-box-arrow-right"></i> Logout
                            </a>
                        </li>
                    </ul>
                </div>
            </nav>
            
            <!-- Sidebar Overlay for Mobile -->
            <div class="sidebar-overlay" id="sidebarOverlay"></div>

            <!-- Floating Quick Access Menu for Mobile -->
            <div class="floating-menu">
                <a href="/dashboard" class="${activeMenu === 'dashboard' ? 'active' : ''}">
                    <i class="bi bi-speedometer2"></i>
                </a>
                <a href="/dashboard/groups" class="${activeMenu === 'groups' ? 'active' : ''}">
                    <i class="bi bi-people"></i>
                </a>
                <a href="/dashboard/settings" class="${activeMenu === 'settings' ? 'active' : ''}">
                    <i class="bi bi-gear"></i>
                </a>
                <a href="/dashboard/logs" class="${activeMenu === 'logs' ? 'active' : ''}">
                    <i class="bi bi-terminal"></i>
                </a>
            </div>

            <!-- Main Content -->
            <div class="main-content">
                <!-- Top Navbar -->
                <nav class="top-navbar d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <button class="btn btn-link mobile-menu-btn me-3" id="mobileMenuBtn">
                            <i class="bi bi-list fs-4"></i>
                        </button>
                        <h5 class="mb-0">${title}</h5>
                    </div>
                    <div class="d-flex align-items-center">
                        <span class="me-3">Welcome, ${username}</span>
                        <a href="/dashboard/logout" class="btn btn-outline-danger btn-sm">
                            <i class="bi bi-box-arrow-right"></i> Logout
                        </a>
                    </div>
                </nav>
                
                <!-- Content -->
                <div class="content-wrapper">
                    ${content}
                </div>
            </div>
            
            <!-- Bootstrap 5 JS -->
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
            
            <!-- Custom JS -->
            <script>
                // Mobile menu toggle
                document.getElementById('mobileMenuBtn').addEventListener('click', function() {
                    const sidebar = document.getElementById('sidebar');
                    const overlay = document.getElementById('sidebarOverlay');
                    
                    sidebar.classList.toggle('show');
                    overlay.classList.toggle('show');
                });
                
                // Close sidebar when clicking overlay
                document.getElementById('sidebarOverlay').addEventListener('click', function() {
                    const sidebar = document.getElementById('sidebar');
                    const overlay = document.getElementById('sidebarOverlay');
                    
                    sidebar.classList.remove('show');
                    overlay.classList.remove('show');
                });
                
                // Auto-refresh for real-time data (every 30 seconds)
                if (window.location.pathname.includes('/dashboard')) {
                    setInterval(function() {
                        // Only refresh if user is still on the page
                        if (document.visibilityState === 'visible') {
                            // You can add specific refresh logic here
                            console.log('Auto-refresh check');
                        }
                    }, 30000);
                }
            </script>
        </body>
        </html>
    `;
}

module.exports = { createLayout };
