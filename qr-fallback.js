// Fallback QR Code Generator for SEDS CUSAT Digital ID System
// This provides a visual representation when external QR libraries fail to load

// Simple QR code pattern generator (ASCII art style)
function generateFallbackQR(canvas, data) {
    const ctx = canvas.getContext('2d');
    const size = 120;
    canvas.width = size;
    canvas.height = size;
    
    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    
    // Generate a simple pattern based on data hash
    const hash = simpleStringHash(data);
    const pattern = generatePattern(hash);
    
    // Draw pattern
    ctx.fillStyle = '#4A90E2';
    const cellSize = size / 15; // 15x15 grid
    
    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
            const index = i * 15 + j;
            if (pattern[index % pattern.length]) {
                ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
            }
        }
    }
    
    // Add corner squares (QR code style)
    drawCornerSquare(ctx, 0, 0, cellSize * 3);
    drawCornerSquare(ctx, size - cellSize * 3, 0, cellSize * 3);
    drawCornerSquare(ctx, 0, size - cellSize * 3, cellSize * 3);
    
    // Add center square
    const centerSize = cellSize * 2;
    const centerX = (size - centerSize) / 2;
    const centerY = (size - centerSize) / 2;
    ctx.fillStyle = '#4A90E2';
    ctx.fillRect(centerX, centerY, centerSize, centerSize);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(centerX + cellSize/2, centerY + cellSize/2, centerSize - cellSize, centerSize - cellSize);
}

function drawCornerSquare(ctx, x, y, size) {
    ctx.fillStyle = '#4A90E2';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + size/3, y + size/3, size/3, size/3);
}

function simpleStringHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

function generatePattern(hash) {
    const pattern = [];
    let currentHash = hash;
    
    for (let i = 0; i < 225; i++) { // 15x15 = 225 cells
        pattern.push(currentHash % 3 === 0);
        currentHash = Math.floor(currentHash / 3) || (hash + i);
    }
    
    return pattern;
}

// Text-based QR representation
function generateTextQR(container, data) {
    const qrData = JSON.parse(data);
    const textRepresentation = `
        <div style="
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
        ">
            <div style="font-weight: bold; color: #4A90E2; margin-bottom: 5px;">SEDS QR</div>
            <div style="color: #666; font-size: 8px;">
                ID: ${qrData.memberInfo.id}<br>
                ${qrData.memberInfo.name}<br>
                ${qrData.memberInfo.role}<br>
                Hash: ${qrData.hash.substring(0, 8)}...
            </div>
            <div style="margin-top: 5px; font-size: 6px; color: #999;">
                Scan with admin app
            </div>
        </div>
    `;
    
    container.innerHTML = textRepresentation;
}

// Fallback QR Code object
window.FallbackQR = {
    toCanvas: function(canvas, data, options, callback) {
        try {
            if (typeof data === 'string' && data.startsWith('{')) {
                // If it's JSON data, use text representation
                const container = canvas.parentElement;
                generateTextQR(container, data);
                canvas.style.display = 'none';
            } else {
                // Use pattern-based QR
                generateFallbackQR(canvas, data);
            }
            
            if (callback) callback(null);
        } catch (error) {
            if (callback) callback(error);
        }
    }
};

// Google Charts QR Code API fallback
window.GoogleQR = {
    toCanvas: function(canvas, data, options, callback) {
        try {
            const encodedData = encodeURIComponent(data);
            const size = options.width || 120;
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                const ctx = canvas.getContext('2d');
                canvas.width = size;
                canvas.height = size;
                ctx.drawImage(img, 0, 0, size, size);
                if (callback) callback(null);
            };
            img.onerror = function() {
                // If Google Charts fails, use fallback
                window.FallbackQR.toCanvas(canvas, data, options, callback);
            };
            img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}`;
        } catch (error) {
            window.FallbackQR.toCanvas(canvas, data, options, callback);
        }
    }
};

console.log('QR Fallback system loaded'); 