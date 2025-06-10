/**
 * Bot Profile Page JavaScript
 * Handles device management, QR codes, and multi-device functionality
 */

// Global variables
let socket;
let devices = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeSocket();
    loadDevices();
    setupEventListeners();
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
    socket.on('device-created', handleDeviceCreated);
    socket.on('device-removed', handleDeviceRemoved);
    
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
 * Setup event listeners
 */
function setupEventListeners() {
    // Add device button
    const addDeviceBtn = document.getElementById('addDeviceBtn');
    if (addDeviceBtn) {
        addDeviceBtn.addEventListener('click', showAddDeviceModal);
    }
}

/**
 * Load devices from server
 */
async function loadDevices() {
    try {
        const response = await fetch('/dashboard/api/devices');
        const data = await response.json();
        
        if (data.success) {
            devices = data.data;
            renderDevicesList(devices);
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
    
    if (devices.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="text-center py-5">
                    <i class="bi bi-phone display-1 text-muted"></i>
                    <h4 class="mt-3">Belum Ada Device</h4>
                    <p class="text-muted">Tambahkan device WhatsApp pertama Anda</p>
                    <button class="btn btn-primary" onclick="showAddDeviceModal()">
                        <i class="bi bi-plus-lg me-2"></i>Tambah Device
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    devices.forEach(device => {
        const deviceCard = createDeviceCard(device);
        container.appendChild(deviceCard);
    });
}

/**
 * Create device card element
 */
function createDeviceCard(device) {
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4 mb-3';
    
    const statusClass = device.status === 'connected' ? 'success' : 
                       device.status === 'qr_ready' ? 'warning' : 'danger';
    
    const statusText = device.status === 'connected' ? 'Terhubung' :
                      device.status === 'qr_ready' ? 'Menunggu Scan QR' :
                      device.status === 'disconnected' ? 'Terputus' : 
                      device.status === 'initializing' ? 'Menginisialisasi' : 'Error';
    
    card.innerHTML = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h6 class="mb-0">${device.name}</h6>
                <span class="badge bg-${statusClass}">${statusText}</span>
            </div>
            <div class="card-body">
                ${device.phoneNumber ? `<p class="mb-2"><strong>Nomor:</strong> ${device.phoneNumber}</p>` : ''}
                <p class="mb-2"><strong>Device ID:</strong> <small class="text-muted">${device.id}</small></p>
                <p class="mb-2"><strong>Grup Assigned:</strong> ${device.assignedGroups ? device.assignedGroups.length : 0}</p>
                ${device.lastConnected ? `<p class="mb-2"><small class="text-muted">Terakhir terhubung: ${new Date(device.lastConnected).toLocaleString('id-ID')}</small></p>` : ''}
                
                <div class="btn-group w-100" role="group">
                    ${device.status === 'qr_ready' ? `
                        <button class="btn btn-primary btn-sm" onclick="showDeviceQR('${device.id}')">
                            <i class="bi bi-qr-code"></i> QR Code
                        </button>
                    ` : ''}
                    ${device.status === 'connected' ? `
                        <button class="btn btn-outline-success btn-sm" onclick="manageDeviceGroups('${device.id}')">
                            <i class="bi bi-people"></i> Grup
                        </button>
                    ` : ''}
                    <button class="btn btn-outline-danger btn-sm" onclick="removeDevice('${device.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Show add device modal
 */
function showAddDeviceModal() {
    const modal = new bootstrap.Modal(document.getElementById('addDeviceModal'));
    modal.show();
}

/**
 * Create new device
 */
async function createDevice() {
    const deviceName = document.getElementById('deviceName').value.trim();
    if (!deviceName) {
        showError('Nama device diperlukan');
        return;
    }

    try {
        showLoading('Membuat device...');
        
        const response = await fetch('/dashboard/api/devices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ deviceName })
        });

        const data = await response.json();
        if (data.success) {
            bootstrap.Modal.getInstance(document.getElementById('addDeviceModal')).hide();
            document.getElementById('deviceName').value = '';
            showSuccess('Device berhasil dibuat! Silakan scan QR code untuk menghubungkan.');
            loadDevices(); // Refresh devices list
        } else {
            showError('Gagal membuat device: ' + data.message);
        }
    } catch (error) {
        console.error('Error creating device:', error);
        showError('Terjadi kesalahan saat membuat device');
    } finally {
        hideLoading();
    }
}

/**
 * Show device QR code
 */
function showDeviceQR(deviceId) {
    const device = devices.find(d => d.id === deviceId);
    if (!device) {
        showError('Device tidak ditemukan');
        return;
    }
    
    const modal = document.getElementById('qrModal');
    const qrContainer = document.getElementById('qrCodeContainer');
    
    if (device.qrCode) {
        qrContainer.innerHTML = `
            <img src="${device.qrCode}" alt="QR Code" class="img-fluid" style="max-width: 300px;">
            <p class="mt-3">Scan QR code ini dengan WhatsApp di ponsel Anda</p>
            <small class="text-muted">QR code akan otomatis refresh jika diperlukan</small>
        `;
    } else {
        qrContainer.innerHTML = `
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Memuat QR Code...</p>
        `;
    }
    
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

/**
 * Manage device groups
 */
function manageDeviceGroups(deviceId) {
    // This will be implemented to show a modal for assigning groups to device
    showInfo('Fitur manage groups untuk device akan segera tersedia');
}

/**
 * Remove device
 */
async function removeDevice(deviceId) {
    const device = devices.find(d => d.id === deviceId);
    if (!device) {
        showError('Device tidak ditemukan');
        return;
    }
    
    if (!confirm(`Apakah Anda yakin ingin menghapus device "${device.name}"?`)) {
        return;
    }

    try {
        showLoading('Menghapus device...');
        
        const response = await fetch(`/dashboard/api/devices/${deviceId}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (data.success) {
            showSuccess('Device berhasil dihapus');
            loadDevices(); // Refresh devices list
        } else {
            showError('Gagal menghapus device: ' + data.message);
        }
    } catch (error) {
        console.error('Error removing device:', error);
        showError('Terjadi kesalahan saat menghapus device');
    } finally {
        hideLoading();
    }
}

/**
 * Refresh QR code
 */
function refreshQR() {
    // Get current device from modal context
    const modal = document.getElementById('qrModal');
    const deviceId = modal.getAttribute('data-device-id');
    
    if (deviceId && socket) {
        socket.emit('refresh-qr', deviceId);
        showInfo('QR Code sedang di-refresh...');
    }
}

// Event Handlers
function handleDeviceQR(data) {
    console.log('Device QR received:', data.deviceId);
    
    // Update device in local array
    const deviceIndex = devices.findIndex(d => d.id === data.deviceId);
    if (deviceIndex !== -1) {
        devices[deviceIndex].qrCode = data.qrCode;
        devices[deviceIndex].status = 'qr_ready';
    }
    
    // If QR modal is open for this device, update it
    const modal = document.getElementById('qrModal');
    if (modal && modal.getAttribute('data-device-id') === data.deviceId) {
        showDeviceQR(data.deviceId);
    }
    
    loadDevices(); // Refresh devices list
}

function handleDeviceReady(data) {
    console.log('Device ready:', data.deviceId);
    
    // Update device in local array
    const deviceIndex = devices.findIndex(d => d.id === data.deviceId);
    if (deviceIndex !== -1) {
        devices[deviceIndex].status = 'connected';
        devices[deviceIndex].phoneNumber = data.phoneNumber;
        devices[deviceIndex].qrCode = null;
    }
    
    loadDevices(); // Refresh devices list
    showSuccess(`Device ${data.deviceId} berhasil terhubung`);
}

function handleDeviceDisconnected(data) {
    console.log('Device disconnected:', data.deviceId);
    
    // Update device in local array
    const deviceIndex = devices.findIndex(d => d.id === data.deviceId);
    if (deviceIndex !== -1) {
        devices[deviceIndex].status = 'disconnected';
    }
    
    loadDevices(); // Refresh devices list
    showError(`Device ${data.deviceId} terputus: ${data.reason}`);
}

function handleDeviceAuthFailed(data) {
    console.log('Device auth failed:', data.deviceId);
    
    // Update device in local array
    const deviceIndex = devices.findIndex(d => d.id === data.deviceId);
    if (deviceIndex !== -1) {
        devices[deviceIndex].status = 'auth_failed';
    }
    
    loadDevices(); // Refresh devices list
    showError(`Autentikasi gagal untuk device ${data.deviceId}: ${data.message}`);
}

function handleDeviceCreated(data) {
    if (data.success) {
        showSuccess('Device berhasil dibuat');
        loadDevices();
    } else {
        showError('Gagal membuat device: ' + data.message);
    }
}

function handleDeviceRemoved(data) {
    if (data.success) {
        showSuccess('Device berhasil dihapus');
        loadDevices();
    } else {
        showError('Gagal menghapus device: ' + data.message);
    }
}

// Utility Functions
function updateConnectionStatus(connected) {
    const statusElements = document.querySelectorAll('.connection-status');
    statusElements.forEach(el => {
        el.className = `connection-status badge ${connected ? 'bg-success' : 'bg-danger'}`;
        el.textContent = connected ? 'Terhubung' : 'Terputus';
    });
}

function showSuccess(message) {
    console.log('Success:', message);
    // You can implement toast notifications here
}

function showError(message) {
    console.error('Error:', message);
    // You can implement toast notifications here
}

function showInfo(message) {
    console.log('Info:', message);
    // You can implement toast notifications here
}

function showLoading(message) {
    console.log('Loading:', message);
    // You can implement loading indicator here
}

function hideLoading() {
    console.log('Loading hidden');
    // You can hide loading indicator here
}
