// Connect to Socket.io server
const socket = io();

// DOM elements
const qrPlaceholder = document.getElementById('qr-placeholder');
const qrCodeCanvas = document.getElementById('qr-code-canvas');
const qrExpired = document.getElementById('qr-expired');
const connectionStatus = document.getElementById('connection-status');
const messageTableBody = document.getElementById('message-table-body');
const groupsTableBody = document.getElementById('groups-table-body');
const pagination = document.getElementById('pagination');
const refreshBtn = document.getElementById('refresh-btn');
const refreshQrBtn = document.getElementById('refresh-qr-btn');
const refreshGroupsBtn = document.getElementById('refresh-groups-btn');
const deleteMessageBtn = document.getElementById('delete-message-btn');
const copyGroupIdBtn = document.getElementById('copy-group-id-btn');
const groupIdInput = document.getElementById('group-id-input');
const copySuccessAlert = document.getElementById('copy-success-alert');

// Current page and IDs for modals
let currentPage = 1;
let currentMessageId = null;
let currentGroupId = null;

// Bootstrap modal instances
let messageModal;
let groupIdModal;

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Bootstrap modals
    messageModal = new bootstrap.Modal(document.getElementById('messageModal'));
    groupIdModal = new bootstrap.Modal(document.getElementById('groupIdModal'));

    // Load initial data
    loadMessages(currentPage);
    loadGroups();

    // Set up event listeners
    setupEventListeners();

    // Check for authentication response
    checkAuthResponse();
});

// Set up event listeners
function setupEventListeners() {
    // Refresh messages button
    refreshBtn.addEventListener('click', () => {
        loadMessages(currentPage);
    });

    // Refresh QR button
    refreshQrBtn.addEventListener('click', () => {
        socket.emit('refresh-qr');
        showQrPlaceholder();
    });

    // Refresh groups button
    refreshGroupsBtn.addEventListener('click', () => {
        loadGroups();
    });

    // Delete message button
    deleteMessageBtn.addEventListener('click', () => {
        if (currentMessageId) {
            deleteMessage(currentMessageId);
        }
    });

    // Copy group ID button
    copyGroupIdBtn.addEventListener('click', () => {
        if (groupIdInput.value) {
            navigator.clipboard.writeText(groupIdInput.value)
                .then(() => {
                    // Show success message
                    copySuccessAlert.classList.remove('d-none');
                    setTimeout(() => {
                        copySuccessAlert.classList.add('d-none');
                    }, 2000);
                })
                .catch(err => {
                    console.error('Could not copy text: ', err);
                    alert('Failed to copy to clipboard. Please copy manually.');
                });
        }
    });

    // Socket.io event listeners
    setupSocketListeners();
}

// Set up Socket.io event listeners
function setupSocketListeners() {
    // QR code event
    socket.on('qr', (qrData) => {
        displayQRCode(qrData);
    });

    // Connection status events
    socket.on('whatsapp-connected', () => {
        updateConnectionStatus('connected');
    });

    socket.on('whatsapp-disconnected', () => {
        updateConnectionStatus('disconnected');
    });

    socket.on('qr-expired', () => {
        showQrExpired();
    });

    // New message event
    socket.on('new-message', (message) => {
        // If we're on the first page, add the new message to the top
        if (currentPage === 1) {
            prependMessageToTable(message);
        } else {
            // Show notification that new messages are available
            showNewMessageNotification();
        }
    });
}

// Load messages from the API
function loadMessages(page) {
    currentPage = page;

    // Show loading indicator
    messageTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Loading messages...</td></tr>';

    fetch(`/api/messages?page=${page}`)
        .then(response => response.json())
        .then(data => {
            displayMessages(data.messages);
            updatePagination(data);
        })
        .catch(error => {
            console.error('Error loading messages:', error);
            messageTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading messages. Please try again.</td></tr>';
        });
}

// Display messages in the table
function displayMessages(messages) {
    if (messages.length === 0) {
        messageTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No messages found</td></tr>';
        return;
    }

    messageTableBody.innerHTML = '';

    messages.forEach(message => {
        const row = createMessageRow(message);
        messageTableBody.appendChild(row);
    });
}

// Create a table row for a message
function createMessageRow(message) {
    const row = document.createElement('tr');

    // Add appropriate class based on message type
    if (message.type === 'sent') {
        row.classList.add('message-sent');
    } else if (message.type === 'received') {
        row.classList.add('message-received');
    } else if (message.status === 'failed') {
        row.classList.add('message-failed');
    }

    // Format date
    const date = new Date(message.timestamp);
    const formattedDate = date.toLocaleString();

    // Create row content
    row.innerHTML = `
        <td>${formattedDate}</td>
        <td>${message.type}</td>
        <td>${message.contact}</td>
        <td class="message-text">${message.body}</td>
        <td>${message.status || 'N/A'}</td>
        <td>
            <button class="btn btn-sm btn-primary view-btn" data-id="${message.id}">
                <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-sm btn-danger delete-btn" data-id="${message.id}">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;

    // Add event listeners to buttons
    const viewBtn = row.querySelector('.view-btn');
    const deleteBtn = row.querySelector('.delete-btn');

    viewBtn.addEventListener('click', () => {
        showMessageDetails(message);
    });

    deleteBtn.addEventListener('click', () => {
        deleteMessage(message.id);
    });

    return row;
}

// Prepend a new message to the table
function prependMessageToTable(message) {
    const row = createMessageRow(message);

    // If table is empty (showing "No messages found"), clear it first
    if (messageTableBody.innerHTML.includes('No messages found')) {
        messageTableBody.innerHTML = '';
    }

    // Add the new row at the top
    messageTableBody.insertBefore(row, messageTableBody.firstChild);

    // Highlight the new row
    row.classList.add('highlight');
    setTimeout(() => {
        row.classList.remove('highlight');
    }, 2000);
}

// Update pagination controls
function updatePagination(data) {
    pagination.innerHTML = '';

    if (data.totalPages <= 1) {
        return;
    }

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.classList.add('page-item');
    if (currentPage === 1) {
        prevLi.classList.add('disabled');
    }
    prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`;
    prevLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            loadMessages(currentPage - 1);
        }
    });
    pagination.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= data.totalPages; i++) {
        const pageLi = document.createElement('li');
        pageLi.classList.add('page-item');
        if (i === currentPage) {
            pageLi.classList.add('active');
        }
        pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        pageLi.addEventListener('click', (e) => {
            e.preventDefault();
            loadMessages(i);
        });
        pagination.appendChild(pageLi);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.classList.add('page-item');
    if (currentPage === data.totalPages) {
        nextLi.classList.add('disabled');
    }
    nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`;
    nextLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < data.totalPages) {
            loadMessages(currentPage + 1);
        }
    });
    pagination.appendChild(nextLi);
}

// Show message details in modal
function showMessageDetails(message) {
    const modalBody = document.getElementById('message-modal-body');
    currentMessageId = message.id;

    // Format date
    const date = new Date(message.timestamp);
    const formattedDate = date.toLocaleString();

    modalBody.innerHTML = `
        <div class="mb-3">
            <strong>Date/Time:</strong> ${formattedDate}
        </div>
        <div class="mb-3">
            <strong>Type:</strong> ${message.type}
        </div>
        <div class="mb-3">
            <strong>From/To:</strong> ${message.contact}
        </div>
        <div class="mb-3">
            <strong>Message:</strong>
            <div class="p-3 bg-light rounded">${message.body}</div>
        </div>
        <div class="mb-3">
            <strong>Status:</strong> ${message.status || 'N/A'}
        </div>
    `;

    messageModal.show();
}

// Delete a message
function deleteMessage(id) {
    if (confirm('Are you sure you want to delete this message? This will also delete it from WhatsApp if possible.')) {
        fetch(`/api/messages/${id}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Close modal if open
                    if (currentMessageId === id) {
                        messageModal.hide();
                    }

                    // Reload messages
                    loadMessages(currentPage);

                    // Emit delete event to server for WhatsApp deletion
                    socket.emit('delete-message', id);
                } else {
                    alert('Failed to delete message: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error deleting message:', error);
                alert('An error occurred while deleting the message');
            });
    }
}

// Display QR code
function displayQRCode(qrData) {
    // Hide placeholder and show QR code canvas
    qrPlaceholder.classList.add('d-none');
    qrExpired.classList.add('d-none');
    qrCodeCanvas.classList.remove('d-none');

    // Create an image element
    const img = new Image();
    img.src = qrData;

    // When the image loads, draw it on the canvas
    img.onload = function() {
        const canvas = qrCodeCanvas;
        const ctx = canvas.getContext('2d');

        // Set canvas dimensions to match the image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0);
    };
}

// Show QR placeholder
function showQrPlaceholder() {
    qrPlaceholder.classList.remove('d-none');
    qrCodeCanvas.classList.add('d-none');
    qrExpired.classList.add('d-none');
}

// Show QR expired message
function showQrExpired() {
    qrPlaceholder.classList.add('d-none');
    qrCodeCanvas.classList.add('d-none');
    qrExpired.classList.remove('d-none');
}

// Update connection status
function updateConnectionStatus(status) {
    if (status === 'connected') {
        connectionStatus.innerHTML = '<span class="badge bg-success">Connected</span>';
        // Load groups when connected, but with a slight delay to ensure client is fully initialized
        console.log('Client: WhatsApp connected, loading groups in 2 seconds...');
        setTimeout(loadGroups, 2000);
    } else {
        connectionStatus.innerHTML = '<span class="badge bg-warning">Disconnected</span>';
    }
}

// Show notification for new messages
function showNewMessageNotification() {
    // Create a notification element
    const notification = document.createElement('div');
    notification.classList.add('alert', 'alert-info', 'alert-dismissible', 'fade', 'show', 'position-fixed', 'top-0', 'start-50', 'translate-middle-x', 'mt-3');
    notification.setAttribute('role', 'alert');
    notification.innerHTML = `
        New messages received! <a href="#" class="alert-link" id="load-new-messages">Go to first page</a> to see them.
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Add event listener to the link
    notification.querySelector('#load-new-messages').addEventListener('click', (e) => {
        e.preventDefault();
        loadMessages(1);
        notification.remove();
    });

    // Add to the document
    document.body.appendChild(notification);

    // Remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Load WhatsApp groups
function loadGroups() {
    console.log('Client: Loading WhatsApp groups...');
    // Show loading indicator
    groupsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Loading groups...</td></tr>';

    fetch('/api/groups')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Client: Groups data received:', data);
            if (data.success) {
                displayGroups(data.groups);
            } else {
                console.error('Client: Error from server:', data.message);
                groupsTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">${data.message}</td></tr>`;

                // If the client is not initialized, try again after a delay
                if (data.message && data.message.includes('not fully initialized')) {
                    console.log('Client: WhatsApp not fully initialized, retrying in 5 seconds...');
                    setTimeout(loadGroups, 5000);
                }
            }
        })
        .catch(error => {
            console.error('Client: Error loading groups:', error);
            groupsTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading groups. Please try again.</td></tr>';

            // Add a retry button
            const retryBtn = document.createElement('button');
            retryBtn.className = 'btn btn-primary mt-3';
            retryBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Retry';
            retryBtn.onclick = loadGroups;

            const container = document.createElement('div');
            container.className = 'text-center';
            container.appendChild(retryBtn);

            groupsTableBody.parentNode.parentNode.appendChild(container);
        });
}

// Display groups in the table
function displayGroups(groups) {
    if (groups.length === 0) {
        groupsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No groups found</td></tr>';
        return;
    }

    groupsTableBody.innerHTML = '';

    groups.forEach(group => {
        const row = document.createElement('tr');

        // Format date
        const date = group.timestamp ? new Date(group.timestamp) : null;
        const formattedDate = date ? date.toLocaleString() : 'N/A';

        // Create row content
        row.innerHTML = `
            <td class="text-truncate" style="max-width: 200px;">${group.id}</td>
            <td>${group.name}</td>
            <td>${group.participants}</td>
            <td>${group.isAdmin ? '<span class="badge bg-success">Admin</span>' : '<span class="badge bg-secondary">Member</span>'}</td>
            <td>${group.unreadCount || 0}</td>
            <td>${formattedDate}</td>
            <td>
                <button type="button" class="btn btn-sm btn-info copy-id-btn" data-id="${group.id}">
                    <i class="bi bi-clipboard"></i> Copy ID
                </button>
            </td>
        `;

        // Add event listener to copy button
        const copyBtn = row.querySelector('.copy-id-btn');
        copyBtn.addEventListener('click', () => {
            showGroupIdModal(group.id);
        });

        groupsTableBody.appendChild(row);
    });
}

// Show group ID modal
function showGroupIdModal(groupId) {
    currentGroupId = groupId;
    groupIdInput.value = groupId;
    groupIdModal.show();
}

// Check for authentication response in URL parameters
function checkAuthResponse() {
    const urlParams = new URLSearchParams(window.location.search);

    // Check for successful authentication
    if (urlParams.has('auth') && urlParams.get('auth') === 'success') {
        const username = urlParams.get('user');
        showNotification(`Successfully logged in as ${username}`, 'success');

        // Remove the query parameters from the URL without refreshing the page
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check for authentication errors
    if (urlParams.has('error')) {
        const error = urlParams.get('error');
        let errorMessage = 'Authentication failed';

        switch (error) {
            case 'no_code':
                errorMessage = 'No authorization code received from Discord';
                break;
            case 'token_exchange':
                errorMessage = 'Failed to exchange authorization code for token';
                break;
            case 'user_data':
                errorMessage = 'Failed to fetch user data from Discord';
                break;
            case 'server_error':
                errorMessage = 'Server error during authentication';
                break;
        }

        showNotification(errorMessage, 'danger');

        // Remove the query parameters from the URL without refreshing the page
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Show a notification
function showNotification(message, type = 'info') {
    // Create a notification element
    const notification = document.createElement('div');
    notification.classList.add('alert', `alert-${type}`, 'alert-dismissible', 'fade', 'show', 'position-fixed', 'top-0', 'start-50', 'translate-middle-x', 'mt-3');
    notification.setAttribute('role', 'alert');
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Add to the document
    document.body.appendChild(notification);

    // Remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}
