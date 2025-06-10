/**
 * Dashboard JavaScript Functions
 * Handles real-time updates, message logs, and device management
 */

// Global variables
let socket;
let currentPage = 1;
let currentFilters = {};
let messageLogInterval;

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeSocket();
    initializeMessageLog();
    initializeBotProfile();
    initializeRealTimeUpdates();
});

/**
 * Initialize Socket.IO connection
 */
function initializeSocket() {
    socket = io();
    
    // Device events
    socket.on('device-qr', handleDeviceQR);
    socket.on('device-ready', handleDeviceReady);
    socket.on('device-disconnected', handleDeviceDisconnected);
    socket.on('device-auth-failed', handleDeviceAuthFailed);
    
    // Message events
    socket.on('new-message', handleNewMessage);
    
    // Connection events
    socket.on('connect', () => {
        console.log('Connected to server');
        updateConnectionStatus(true);
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        updateConnectionStatus(false);
    });
}

/**
 * Initialize Message Log functionality
 */
function initializeMessageLog() {
    if (document.getElementById('messageLogTable')) {
        loadMessageLog();
        
        // Set up auto-refresh
        messageLogInterval = setInterval(() => {
            if (currentPage === 1) { // Only auto-refresh first page
                loadMessageLog(false); // Don't show loading indicator
            }
        }, 5000);
        
        // Set up filter form
        const filterForm = document.getElementById('messageFilterForm');
        if (filterForm) {
            filterForm.addEventListener('submit', function(e) {
                e.preventDefault();
                applyMessageFilters();
            });
        }
        
        // Set up clear filters button
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', clearMessageFilters);
        }
        
        // Set up export button
        const exportBtn = document.getElementById('exportMessages');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportMessages);
        }
    }
}

/**
 * Initialize Bot Profile functionality
 */
function initializeBotProfile() {
    if (document.getElementById('devicesList')) {
        loadDevices();
        
        // Set up add device button
        const addDeviceBtn = document.getElementById('addDeviceBtn');
        if (addDeviceBtn) {
            addDeviceBtn.addEventListener('click', showAddDeviceModal);
        }
    }
}

/**
 * Initialize real-time updates for statistics
 */
function initializeRealTimeUpdates() {
    // Update statistics every 30 seconds
    setInterval(updateStatistics, 30000);
}

/**
 * Load message log with pagination
 */
async function loadMessageLog(showLoading = true) {
    if (showLoading) {
        showMessageLogLoading();
    }
    
    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit: 10,
            ...currentFilters
        });
        
        const response = await fetch(`/dashboard/api/messages?${params}`);
        const data = await response.json();
        
        if (data.success) {
            renderMessageLog(data.data.messages, data.data.pagination);
        } else {
            showError('Gagal memuat log pesan: ' + data.message);
        }
    } catch (error) {
        console.error('Error loading message log:', error);
        showError('Terjadi kesalahan saat memuat log pesan');
    } finally {
        hideMessageLogLoading();
    }
}

/**
 * Render message log table
 */
function renderMessageLog(messages, pagination) {
    const tbody = document.getElementById('messageLogBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    messages.forEach(message => {
        const row = createMessageRow(message);
        tbody.appendChild(row);
    });
    
    // Update pagination
    renderMessagePagination(pagination);
}

/**
 * Create message table row
 */
function createMessageRow(message) {
    const row = document.createElement('tr');
    
    const date = new Date(message.timestamp);
    const dateStr = date.toLocaleDateString('id-ID');
    const timeStr = date.toLocaleTimeString('id-ID');
    
    const typeClass = message.type === 'sent' ? 'text-primary' : 'text-success';
    const statusClass = message.status === 'success' ? 'text-success' : 
                       message.status === 'failed' ? 'text-danger' : 'text-warning';
    
    const truncatedMessage = message.body.length > 50 ? 
        message.body.substring(0, 50) + '...' : message.body;
    
    row.innerHTML = `
        <td>${dateStr}, ${timeStr}</td>
        <td><span class="${typeClass}">${message.type === 'sent' ? 'Terkirim' : 'Diterima'}</span></td>
        <td><span class="${statusClass}">${getStatusText(message.status)}</span></td>
        <td title="${message.body}">${truncatedMessage}</td>
        <td>
            <button class="btn btn-sm btn-outline-primary" onclick="showMessageDetail('${message.id}')">
                Detail Pesan
            </button>
        </td>
    `;
    
    return row;
}

/**
 * Get status text in Indonesian
 */
function getStatusText(status) {
    switch (status) {
        case 'success': return 'Berhasil';
        case 'failed': return 'Gagal';
        case 'pending': return 'Menunggu';
        default: return status;
    }
}

/**
 * Render message pagination
 */
function renderMessagePagination(pagination) {
    const paginationContainer = document.getElementById('messagePagination');
    if (!paginationContainer) return;
    
    let paginationHTML = '<nav><ul class="pagination pagination-sm justify-content-center">';
    
    // Previous button
    if (pagination.hasPrev) {
        paginationHTML += `<li class="page-item">
            <a class="page-link" href="#" onclick="goToMessagePage(${pagination.currentPage - 1})">‹</a>
        </li>`;
    } else {
        paginationHTML += '<li class="page-item disabled"><span class="page-link">‹</span></li>';
    }
    
    // Page numbers (smart pagination)
    const startPage = Math.max(1, pagination.currentPage - 2);
    const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);
    
    if (startPage > 1) {
        paginationHTML += '<li class="page-item"><a class="page-link" href="#" onclick="goToMessagePage(1)">1</a></li>';
        if (startPage > 2) {
            paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === pagination.currentPage) {
            paginationHTML += `<li class="page-item active"><span class="page-link">${i}</span></li>`;
        } else {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="goToMessagePage(${i})">${i}</a></li>`;
        }
    }
    
    if (endPage < pagination.totalPages) {
        if (endPage < pagination.totalPages - 1) {
            paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="goToMessagePage(${pagination.totalPages})">${pagination.totalPages}</a></li>`;
    }
    
    // Next button
    if (pagination.hasNext) {
        paginationHTML += `<li class="page-item">
            <a class="page-link" href="#" onclick="goToMessagePage(${pagination.currentPage + 1})">›</a>
        </li>`;
    } else {
        paginationHTML += '<li class="page-item disabled"><span class="page-link">›</span></li>';
    }
    
    paginationHTML += '</ul></nav>';
    paginationContainer.innerHTML = paginationHTML;
}

/**
 * Go to specific message page
 */
function goToMessagePage(page) {
    currentPage = page;
    loadMessageLog();
}

/**
 * Apply message filters
 */
function applyMessageFilters() {
    const form = document.getElementById('messageFilterForm');
    const formData = new FormData(form);
    
    currentFilters = {};
    for (let [key, value] of formData.entries()) {
        if (value.trim()) {
            currentFilters[key] = value.trim();
        }
    }
    
    currentPage = 1; // Reset to first page
    loadMessageLog();
}

/**
 * Clear message filters
 */
function clearMessageFilters() {
    document.getElementById('messageFilterForm').reset();
    currentFilters = {};
    currentPage = 1;
    loadMessageLog();
}

/**
 * Export messages to CSV
 */
async function exportMessages() {
    try {
        const params = new URLSearchParams(currentFilters);
        const response = await fetch(`/dashboard/api/messages/export?${params}`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `messages_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showSuccess('File CSV berhasil diunduh');
        } else {
            showError('Gagal mengekspor pesan');
        }
    } catch (error) {
        console.error('Error exporting messages:', error);
        showError('Terjadi kesalahan saat mengekspor pesan');
    }
}

/**
 * Show message detail modal
 */
async function showMessageDetail(messageId) {
    try {
        const response = await fetch(`/dashboard/api/messages/${messageId}`);
        const data = await response.json();
        
        if (data.success) {
            const message = data.data;
            const modal = document.getElementById('messageDetailModal');
            
            // Populate modal content
            document.getElementById('messageDetailContent').innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <strong>Tanggal:</strong><br>
                        ${new Date(message.timestamp).toLocaleString('id-ID')}
                    </div>
                    <div class="col-md-6">
                        <strong>Tipe:</strong><br>
                        <span class="${message.type === 'sent' ? 'text-primary' : 'text-success'}">
                            ${message.type === 'sent' ? 'Terkirim' : 'Diterima'}
                        </span>
                    </div>
                </div>
                <hr>
                <div class="row">
                    <div class="col-md-6">
                        <strong>Chat:</strong><br>
                        ${message.chatName}
                    </div>
                    <div class="col-md-6">
                        <strong>Dari:</strong><br>
                        ${message.fromName}
                    </div>
                </div>
                <hr>
                <div class="row">
                    <div class="col-12">
                        <strong>Pesan:</strong><br>
                        <div class="border p-3 bg-light rounded">
                            ${message.body}
                        </div>
                    </div>
                </div>
                ${message.deviceId ? `
                <hr>
                <div class="row">
                    <div class="col-12">
                        <strong>Device ID:</strong><br>
                        ${message.deviceId}
                    </div>
                </div>
                ` : ''}
            `;
            
            // Show modal
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        } else {
            showError('Gagal memuat detail pesan');
        }
    } catch (error) {
        console.error('Error loading message detail:', error);
        showError('Terjadi kesalahan saat memuat detail pesan');
    }
}

// Device Management Functions
/**
 * Load devices list
 */
async function loadDevices() {
    try {
        const response = await fetch('/dashboard/api/devices');
        const data = await response.json();
        
        if (data.success) {
            renderDevicesList(data.data);
        } else {
            showError('Gagal memuat daftar device: ' + data.message);
        }
    } catch (error) {
        console.error('Error loading devices:', error);
        showError('Terjadi kesalahan saat memuat daftar device');
    }
}

/**
 * Render devices list
 */
function renderDevicesList(devices) {
    const container = document.getElementById('devicesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    devices.forEach(device => {
        const deviceCard = createDeviceCard(device);
        container.appendChild(deviceCard);
    });
}

/**
 * Create device card
 */
function createDeviceCard(device) {
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4 mb-3';
    
    const statusClass = device.status === 'connected' ? 'success' : 
                       device.status === 'qr_ready' ? 'warning' : 'danger';
    
    const statusText = device.status === 'connected' ? 'Terhubung' :
                      device.status === 'qr_ready' ? 'Menunggu Scan QR' :
                      device.status === 'disconnected' ? 'Terputus' : 'Error';
    
    card.innerHTML = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h6 class="mb-0">${device.name}</h6>
                <span class="badge bg-${statusClass}">${statusText}</span>
            </div>
            <div class="card-body">
                ${device.phoneNumber ? `<p class="mb-2"><strong>Nomor:</strong> ${device.phoneNumber}</p>` : ''}
                <p class="mb-2"><strong>Device ID:</strong> ${device.id}</p>
                <p class="mb-2"><strong>Grup Assigned:</strong> ${device.assignedGroups ? device.assignedGroups.length : 0}</p>
                ${device.lastConnected ? `<p class="mb-2"><small class="text-muted">Terakhir terhubung: ${new Date(device.lastConnected).toLocaleString('id-ID')}</small></p>` : ''}
                
                <div class="btn-group w-100" role="group">
                    ${device.status === 'qr_ready' ? `
                        <button class="btn btn-primary btn-sm" onclick="showDeviceQR('${device.id}')">
                            <i class="bi bi-qr-code"></i> QR Code
                        </button>
                    ` : ''}
                    <button class="btn btn-outline-primary btn-sm" onclick="manageDeviceGroups('${device.id}')">
                        <i class="bi bi-people"></i> Grup
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="removeDevice('${device.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Utility Functions
function showMessageLogLoading() {
    const tbody = document.getElementById('messageLogBody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border spinner-border-sm"></div> Memuat...</td></tr>';
    }
}

function hideMessageLogLoading() {
    // Loading will be replaced by actual content
}

function updateConnectionStatus(connected) {
    const statusElements = document.querySelectorAll('.connection-status');
    statusElements.forEach(el => {
        el.className = `connection-status badge ${connected ? 'bg-success' : 'bg-danger'}`;
        el.textContent = connected ? 'Terhubung' : 'Terputus';
    });
}

function showSuccess(message) {
    // You can implement toast notifications here
    console.log('Success:', message);
}

function showError(message) {
    // You can implement toast notifications here
    console.error('Error:', message);
}

function updateStatistics() {
    // Implement real-time statistics update
    fetch('/dashboard/api/stats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update statistics cards
                updateStatsCards(data.data);
            }
        })
        .catch(error => console.error('Error updating statistics:', error));
}

function updateStatsCards(stats) {
    // Update message statistics cards
    const sentCard = document.getElementById('totalSentMessages');
    const receivedCard = document.getElementById('totalReceivedMessages');
    const failedCard = document.getElementById('totalFailedMessages');
    
    if (sentCard) sentCard.textContent = stats.totalSent.toLocaleString('id-ID');
    if (receivedCard) receivedCard.textContent = stats.totalReceived.toLocaleString('id-ID');
    if (failedCard) failedCard.textContent = stats.totalFailed.toLocaleString('id-ID');
}

// Event Handlers
function handleDeviceQR(data) {
    console.log('Device QR received:', data.deviceId);
    // Update device card or show QR modal
    loadDevices(); // Refresh devices list
}

function handleDeviceReady(data) {
    console.log('Device ready:', data.deviceId);
    loadDevices(); // Refresh devices list
    showSuccess(`Device ${data.deviceId} berhasil terhubung`);
}

function handleDeviceDisconnected(data) {
    console.log('Device disconnected:', data.deviceId);
    loadDevices(); // Refresh devices list
    showError(`Device ${data.deviceId} terputus: ${data.reason}`);
}

function handleDeviceAuthFailed(data) {
    console.log('Device auth failed:', data.deviceId);
    loadDevices(); // Refresh devices list
    showError(`Autentikasi gagal untuk device ${data.deviceId}: ${data.message}`);
}

function handleNewMessage(data) {
    console.log('New message received:', data);
    
    // If we're on the first page of message log, refresh it
    if (currentPage === 1 && document.getElementById('messageLogTable')) {
        loadMessageLog(false);
    }
    
    // Update statistics
    updateStatistics();
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (messageLogInterval) {
        clearInterval(messageLogInterval);
    }
});
