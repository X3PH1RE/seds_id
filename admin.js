// Admin JavaScript file for SEDS CUSAT Digital ID System

// Global variables
let currentAdmin = null;
let cameraStream = null;
let isScanning = false;

// Initialize admin application
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminApp();
});

function initializeAdminApp() {
    // Check if user is logged in as admin
    checkAdminAuth();
    
    // Initialize admin dashboard
    if (currentAdmin) {
        initAdminDashboard();
    }
}

function checkAdminAuth() {
    const storedUser = sessionStorage.getItem('currentUser');
    const storedUserType = sessionStorage.getItem('currentUserType');
    
    if (storedUser && storedUserType === 'admin') {
        currentAdmin = JSON.parse(storedUser);
        
        // Update welcome message
        const adminWelcome = document.getElementById('adminWelcome');
        if (adminWelcome) {
            adminWelcome.textContent = `Welcome, ${currentAdmin.name}!`;
        }
    } else {
        // Redirect to login if not admin
        window.location.href = 'index.html';
    }
}

function initAdminDashboard() {
    // Initialize event listeners
    initVerificationEventListeners();
    initCameraEventListeners();
    initDatabaseEventListeners();
    
    // Load member database
    loadMemberDatabase();
}

function initVerificationEventListeners() {
    // Manual QR verification
    const verifyBtn = document.getElementById('verifyBtn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', handleManualVerification);
    }
    
    // Admin logout
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', handleAdminLogout);
    }
}

function initCameraEventListeners() {
    const startCameraBtn = document.getElementById('startCameraBtn');
    const stopCameraBtn = document.getElementById('stopCameraBtn');
    
    if (startCameraBtn) {
        startCameraBtn.addEventListener('click', startCamera);
    }
    
    if (stopCameraBtn) {
        stopCameraBtn.addEventListener('click', stopCamera);
    }
}

function initDatabaseEventListeners() {
    const refreshDbBtn = document.getElementById('refreshDbBtn');
    const exportDbBtn = document.getElementById('exportDbBtn');
    
    if (refreshDbBtn) {
        refreshDbBtn.addEventListener('click', refreshDatabase);
    }
    
    if (exportDbBtn) {
        exportDbBtn.addEventListener('click', exportDatabase);
    }
}

async function handleManualVerification() {
    const qrDataInput = document.getElementById('qrData');
    const qrData = qrDataInput.value.trim();
    
    if (!qrData) {
        showAlert('Please enter QR code data', 'error');
        return;
    }
    
    const verifyBtn = document.getElementById('verifyBtn');
    const originalText = verifyBtn.textContent;
    verifyBtn.textContent = 'Verifying...';
    verifyBtn.disabled = true;
    
    try {
        const result = await verifyQRCode(qrData);
        displayVerificationResult(result);
        
        // Clear input after successful verification
        if (result.success) {
            qrDataInput.value = '';
        }
    } catch (error) {
        showAlert('Error during verification', 'error');
        console.error('Verification error:', error);
    } finally {
        verifyBtn.textContent = originalText;
        verifyBtn.disabled = false;
    }
}

function displayVerificationResult(result) {
    const outputSection = document.getElementById('verificationOutput');
    
    if (!outputSection) return;
    
    // Clear previous results
    outputSection.innerHTML = '';
    
    if (result.success) {
        outputSection.className = 'output-section verification-success';
        outputSection.innerHTML = `
            <h4>✅ Verification Successful</h4>
            <p><strong>Status:</strong> ${result.data.status}</p>
            <p><strong>Verified at:</strong> ${new Date(result.data.verificationTime).toLocaleString()}</p>
            <hr>
            <h5>Member Details:</h5>
            <p><strong>Name:</strong> ${result.data.member.name}</p>
            <p><strong>ID:</strong> ${result.data.member.id}</p>
            <p><strong>Role:</strong> ${result.data.member.role}</p>
            <p><strong>Batch:</strong> ${result.data.member.batch}</p>
            <p><strong>Department:</strong> ${result.data.member.department}</p>
            <p><strong>Email:</strong> ${result.data.member.email}</p>
            <p><strong>Phone:</strong> ${result.data.member.phone}</p>
            <p><strong>Join Date:</strong> ${formatDate(result.data.member.joinDate)}</p>
        `;
        showAlert('QR code verified successfully', 'success');
    } else {
        outputSection.className = 'output-section verification-error';
        outputSection.innerHTML = `
            <h4>❌ Verification Failed</h4>
            <p><strong>Error:</strong> ${result.message}</p>
            ${result.data && result.data.status ? `<p><strong>Status:</strong> ${result.data.status}</p>` : ''}
            ${result.data && result.data.providedHash ? `
                <hr>
                <h5>Debug Information:</h5>
                <p><strong>Provided Hash:</strong> ${result.data.providedHash}</p>
                <p><strong>Expected Hash:</strong> ${result.data.expectedHash || 'N/A'}</p>
            ` : ''}
        `;
        showAlert('QR code verification failed', 'error');
    }
}

async function startCamera() {
    const video = document.getElementById('video');
    const startBtn = document.getElementById('startCameraBtn');
    const stopBtn = document.getElementById('stopCameraBtn');
    
    if (!video) return;
    
    try {
        updateScanStatus('Starting camera...', 'info');
        
        // Request camera access
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'environment', // Use back camera if available
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });
        
        video.srcObject = cameraStream;
        video.style.display = 'block';
        
        // Wait for video to be ready
        video.onloadedmetadata = function() {
            console.log('Video loaded, starting QR scanning...');
            
            // Start QR scanning
            isScanning = true;
            startQRScanning();
        };
        
        // Update button states
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';
        
        showAlert('Camera started successfully', 'success');
        updateScanStatus('Camera ready - position QR code in view', 'info');
        
    } catch (error) {
        console.error('Camera access error:', error);
        
        let errorMessage = 'Camera access denied';
        if (error.name === 'NotFoundError') {
            errorMessage = 'No camera found';
        } else if (error.name === 'NotAllowedError') {
            errorMessage = 'Camera access denied by user';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = 'Camera not supported';
        }
        
        showAlert(errorMessage, 'error');
        updateScanStatus(errorMessage, 'error');
    }
}

function stopCamera() {
    const video = document.getElementById('video');
    const startBtn = document.getElementById('startCameraBtn');
    const stopBtn = document.getElementById('stopCameraBtn');
    
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    if (video) {
        video.srcObject = null;
        video.style.display = 'none';
    }
    
    // Update button states
    startBtn.style.display = 'inline-block';
    stopBtn.style.display = 'none';
    
    // Stop scanning
    isScanning = false;
    
    updateScanStatus('Camera stopped', 'info');
    showAlert('Camera stopped', 'info');
}

function startQRScanning() {
    if (!isScanning) return;
    
    const canvas = document.getElementById('canvas');
    const video = document.getElementById('video');
    const scanStatus = document.getElementById('scanStatus');
    
    if (!canvas || !video) return;
    
    const context = canvas.getContext('2d');
    
    // Set canvas size to match video
    if (video.videoWidth && video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    } else {
        canvas.width = 640;
        canvas.height = 480;
    }
    
    function scanFrame() {
        if (!isScanning) return;
        
        try {
            // Draw current video frame to canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Get image data from canvas
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            
            // Try to decode QR code
            if (typeof jsQR !== 'undefined') {
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });
                
                if (code) {
                    console.log('QR Code detected:', code.data);
                    updateScanStatus('QR Code detected! Verifying...', 'success');
                    
                    // Stop scanning temporarily
                    isScanning = false;
                    
                    // Verify the detected QR code
                    handleDetectedQR(code.data);
                    
                    // Restart scanning after a delay
                    setTimeout(() => {
                        if (cameraStream) {
                            isScanning = true;
                            updateScanStatus('Scanning for QR codes...', 'info');
                            scanFrame();
                        }
                    }, 3000);
                    
                    return;
                } else {
                    updateScanStatus('Scanning for QR codes...', 'info');
                }
            } else {
                // Fallback if jsQR is not available
                updateScanStatus('Scanning library not loaded. Manual input required.', 'warning');
            }
            
            // Continue scanning
            requestAnimationFrame(scanFrame);
            
        } catch (error) {
            console.error('QR scanning error:', error);
            updateScanStatus('Scanning error. Try repositioning QR code.', 'warning');
            
            // Continue scanning despite errors
            setTimeout(() => {
                if (isScanning) {
                    scanFrame();
                }
            }, 500);
        }
    }
    
    // Start scanning
    updateScanStatus('Scanning for QR codes...', 'info');
    scanFrame();
}

function updateScanStatus(message, type = 'info') {
    const scanStatus = document.getElementById('scanStatus');
    if (scanStatus) {
        scanStatus.textContent = message;
        
        // Update color based on type
        switch(type) {
            case 'success':
                scanStatus.style.color = '#2ecc71';
                break;
            case 'warning':
                scanStatus.style.color = '#f39c12';
                break;
            case 'error':
                scanStatus.style.color = '#e74c3c';
                break;
            default:
                scanStatus.style.color = '#666';
        }
    }
}

async function handleDetectedQR(qrData) {
    try {
        console.log('Processing detected QR code...');
        
        // Verify the QR code
        const result = await verifyQRCode(qrData);
        
        // Display result
        displayVerificationResult(result);
        
        // Also populate the manual input field for reference
        const qrDataInput = document.getElementById('qrData');
        if (qrDataInput) {
            qrDataInput.value = qrData;
        }
        
        // Show notification
        if (result.success) {
            showAlert('QR code scanned and verified successfully!', 'success');
            updateScanStatus('✅ QR Code verified successfully!', 'success');
        } else {
            showAlert('QR code scanned but verification failed', 'error');
            updateScanStatus('❌ QR Code verification failed', 'error');
        }
        
    } catch (error) {
        console.error('Error processing detected QR code:', error);
        showAlert('Error processing scanned QR code', 'error');
        updateScanStatus('Error processing QR code', 'error');
    }
}

function loadMemberDatabase() {
    const memberList = document.getElementById('memberList');
    
    if (!memberList) return;
    
    const members = getAllMembers();
    memberList.innerHTML = '';
    
    if (members.length === 0) {
        memberList.innerHTML = '<p class="no-results">No members found</p>';
        return;
    }
    
    members.forEach(member => {
        const memberItem = document.createElement('div');
        memberItem.className = 'member-item';
        memberItem.innerHTML = `
            <h4>${member.name}</h4>
            <p><strong>ID:</strong> ${member.id}</p>
            <p><strong>Role:</strong> ${member.role}</p>
            <p><strong>Batch:</strong> ${member.batch}</p>
            <p><strong>Department:</strong> ${member.department}</p>
            <p><strong>Email:</strong> ${member.email}</p>
            <p><strong>Join Date:</strong> ${formatDate(member.joinDate)}</p>
            <p><strong>Status:</strong> ${member.isActive ? 'Active' : 'Inactive'}</p>
        `;
        memberList.appendChild(memberItem);
    });
}

function refreshDatabase() {
    const refreshBtn = document.getElementById('refreshDbBtn');
    const originalText = refreshBtn.textContent;
    
    refreshBtn.textContent = 'Refreshing...';
    refreshBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        loadMemberDatabase();
        showAlert('Database refreshed successfully', 'success');
        
        refreshBtn.textContent = originalText;
        refreshBtn.disabled = false;
    }, 1000);
}

function exportDatabase() {
    const members = getAllMembers();
    
    if (members.length === 0) {
        showAlert('No data to export', 'warning');
        return;
    }
    
    // Create CSV content
    const csvContent = generateCSV(members);
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `seds_members_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert('Database exported successfully', 'success');
    } else {
        showAlert('Export not supported in this browser', 'error');
    }
}

function generateCSV(members) {
    const headers = ['ID', 'Name', 'Role', 'Batch', 'Department', 'Email', 'Phone', 'Join Date', 'Status'];
    const csvRows = [headers.join(',')];
    
    members.forEach(member => {
        const row = [
            member.id,
            `"${member.name}"`,
            `"${member.role}"`,
            member.batch,
            `"${member.department}"`,
            member.email,
            member.phone,
            member.joinDate,
            member.isActive ? 'Active' : 'Inactive'
        ];
        csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
}

function handleAdminLogout() {
    // Stop camera if running
    if (cameraStream) {
        stopCamera();
    }
    
    // Clear session storage
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUserType');
    
    // Redirect to login
    window.location.href = 'index.html';
}

// Utility functions
function showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
    `;
    
    // Set background color based on type
    switch(type) {
        case 'success':
            alert.style.background = '#2ecc71';
            break;
        case 'error':
            alert.style.background = '#e74c3c';
            break;
        case 'warning':
            alert.style.background = '#f39c12';
            break;
        default:
            alert.style.background = '#4A90E2';
    }
    
    alert.textContent = message;
    document.body.appendChild(alert);
    
    // Animate in
    setTimeout(() => {
        alert.style.opacity = '1';
        alert.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 300);
    }, 3000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Handle page unload to cleanup camera
window.addEventListener('beforeunload', function() {
    if (cameraStream) {
        stopCamera();
    }
});

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleManualVerification,
        startCamera,
        stopCamera,
        loadMemberDatabase,
        exportDatabase,
        showAlert,
        formatDate
    };
} 