// Main JavaScript file for SEDS CUSAT Digital ID System

// Global variables
let currentUser = null;
let currentUserType = null;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    
    // Check if user is logged in
    checkAuthStatus();
    
    // Initialize based on current page
    if (filename === 'index.html' || filename === '') {
        initLoginPage();
    } else if (filename === 'dashboard.html') {
        initDashboard();
    }
}

function checkAuthStatus() {
    // Check if user is logged in (using sessionStorage for demo)
    const storedUser = sessionStorage.getItem('currentUser');
    const storedUserType = sessionStorage.getItem('currentUserType');
    
    if (storedUser && storedUserType) {
        currentUser = JSON.parse(storedUser);
        currentUserType = storedUserType;
        
        // Redirect if on login page but already logged in
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        
        if (filename === 'index.html' || filename === '') {
            if (currentUserType === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        }
    } else {
        // Redirect to login if not logged in and not on login page
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        
        if (filename !== 'index.html' && filename !== '') {
            window.location.href = 'index.html';
        }
    }
}

function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showAlert('Please enter both username and password', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Signing in...';
    submitBtn.disabled = true;
    
    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const authResult = authenticateUser(username, password);
        
        if (authResult.success) {
            // Store user session
            sessionStorage.setItem('currentUser', JSON.stringify(authResult.user));
            sessionStorage.setItem('currentUserType', authResult.type);
            
            // Redirect based on user type
            if (authResult.type === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        } else {
            showAlert(authResult.message || 'Invalid credentials', 'error');
        }
    } catch (error) {
        showAlert('An error occurred during login', 'error');
        console.error('Login error:', error);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

function initDashboard() {
    if (!currentUser || currentUserType !== 'member') {
        window.location.href = 'index.html';
        return;
    }
    
    // Initialize dashboard elements
    updateWelcomeMessage();
    populateIDCard();
    initializeDashboardEventListeners();
    generateQRCode();
}

function updateWelcomeMessage() {
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome, ${currentUser.name}!`;
    }
}

function populateIDCard() {
    // Update member information
    const memberName = document.getElementById('memberName');
    const memberId = document.getElementById('memberId');
    const memberRole = document.getElementById('memberRole');
    const memberBatch = document.getElementById('memberBatch');
    const profilePhoto = document.getElementById('profilePhoto');
    
    if (memberName) memberName.textContent = currentUser.name;
    if (memberId) memberId.textContent = currentUser.id;
    if (memberRole) memberRole.textContent = currentUser.role;
    if (memberBatch) memberBatch.textContent = currentUser.batch;
    if (profilePhoto) profilePhoto.src = currentUser.profilePhoto;
}

async function generateQRCode() {
    const qrCanvas = document.getElementById('qrCanvas');
    if (!qrCanvas) {
        console.error('QR Canvas element not found');
        return;
    }
    
    try {
        console.log('Generating QR data for user:', currentUser.name);
        
        // Generate QR data
        const qrData = await generateQRData(currentUser);
        
        if (!qrData) {
            console.error('Failed to generate QR data');
            showAlert('Failed to generate QR code data', 'error');
            return;
        }
        
        console.log('QR data generated successfully:', qrData);
        
        // Create QR code using the qrcode library
        const qrDataString = JSON.stringify(qrData);
        
        // Try different QR generation methods
        if (typeof QRCode !== 'undefined') {
            // Use official QRCode library
            console.log('Using official QRCode library');
            QRCode.toCanvas(qrCanvas, qrDataString, {
                width: 120,
                margin: 1,
                color: {
                    dark: '#4A90E2',
                    light: '#FFFFFF'
                }
            }, function(error) {
                if (error) {
                    console.error('QR Code generation error:', error);
                    // Try fallback on error
                    tryFallbackQR(qrCanvas, qrDataString);
                } else {
                    console.log('QR Code generated successfully with official library');
                }
            });
        } else if (typeof GoogleQR !== 'undefined') {
            // Use Google QR API fallback
            console.log('Using Google QR API fallback');
            GoogleQR.toCanvas(qrCanvas, qrDataString, {
                width: 120,
                margin: 1,
                color: {
                    dark: '#4A90E2',
                    light: '#FFFFFF'
                }
            }, function(error) {
                if (error) {
                    console.error('Google QR API error:', error);
                    tryFallbackQR(qrCanvas, qrDataString);
                } else {
                    console.log('QR Code generated successfully with Google API');
                }
            });
        } else {
            // Use local fallback
            console.log('Using local fallback QR generator');
            tryFallbackQR(qrCanvas, qrDataString);
        }
        
    } catch (error) {
        console.error('QR Code generation error:', error);
        showAlert('Error generating QR code: ' + error.message, 'error');
    }
}

function tryFallbackQR(canvas, data) {
    try {
        if (typeof FallbackQR !== 'undefined') {
            console.log('Using FallbackQR generator');
            FallbackQR.toCanvas(canvas, data, { width: 120 }, function(error) {
                if (error) {
                    console.error('Fallback QR error:', error);
                    showTextQR(canvas, data);
                } else {
                    console.log('Fallback QR generated successfully');
                }
            });
        } else {
            showTextQR(canvas, data);
        }
    } catch (error) {
        console.error('Fallback QR generation failed:', error);
        showTextQR(canvas, data);
    }
}

function showTextQR(canvas, data) {
    try {
        const container = canvas.parentElement;
        const qrData = JSON.parse(data);
        
        const textRepresentation = document.createElement('div');
        textRepresentation.style.cssText = `
            background: #f8f9fa;
            border: 2px solid #4A90E2;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            font-family: monospace;
            font-size: 10px;
            line-height: 1.2;
            width: 120px;
            height: 120px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            overflow: hidden;
        `;
        
        textRepresentation.innerHTML = `
            <div style="font-weight: bold; color: #4A90E2; margin-bottom: 5px;">SEDS QR</div>
            <div style="color: #666; font-size: 8px;">
                ID: ${qrData.memberInfo.id}<br>
                ${qrData.memberInfo.name}<br>
                ${qrData.memberInfo.role}<br>
                Hash: ${qrData.hash.substring(0, 8)}...
            </div>
            <div style="margin-top: 5px; font-size: 6px; color: #999;">
                Verification Code
            </div>
        `;
        
        // Replace canvas with text representation
        container.appendChild(textRepresentation);
        canvas.style.display = 'none';
        
        console.log('Text QR representation generated');
        showAlert('QR code generated (text format)', 'info');
        
    } catch (error) {
        console.error('Text QR generation failed:', error);
        showAlert('Unable to generate QR code', 'error');
    }
}

function initializeDashboardEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Download button
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', handleDownloadIDCard);
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', handleRefreshData);
    }
}

function handleLogout() {
    // Clear session storage
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUserType');
    
    // Redirect to login
    window.location.href = 'index.html';
}

function handleDownloadIDCard() {
    // Create a download link for the ID card
    // This is a simplified version - in production, you might want to use html2canvas or similar
    const idCard = document.querySelector('.id-card');
    
    if (idCard) {
        // For now, just show an alert
        showAlert('Download functionality will be implemented in the next version', 'info');
        
        // TODO: Implement actual download functionality
        // - Use html2canvas to capture the ID card
        // - Convert to image/PDF
        // - Trigger download
    }
}

async function handleRefreshData() {
    const refreshBtn = document.getElementById('refreshBtn');
    const originalText = refreshBtn.textContent;
    
    refreshBtn.textContent = 'Refreshing...';
    refreshBtn.disabled = true;
    
    try {
        // Simulate API call to refresh data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real application, you would fetch updated data from the server
        // For now, just regenerate the QR code
        await generateQRCode();
        
        showAlert('Data refreshed successfully', 'success');
    } catch (error) {
        showAlert('Error refreshing data', 'error');
        console.error('Refresh error:', error);
    } finally {
        refreshBtn.textContent = originalText;
        refreshBtn.disabled = false;
    }
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

// Error handling for missing QR code library
if (typeof QRCode === 'undefined') {
    console.warn('QR Code library not loaded. QR code generation will be disabled.');
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleLogin,
        generateQRCode,
        showAlert,
        formatDate
    };
} 