// Sample data for SEDS CUSAT Digital ID System
// This will be replaced with actual database API calls in production

// Secret salt for QR code generation (should be kept secure in production)
const SECRET_SALT = "SEDS_CUSAT_2024_SECRET_KEY";

// Sample member data
const membersData = [
    {
        id: "SEDS2024001",
        username: "john.doe",
        password: "password123",
        name: "John Doe",
        role: "Core Team",
        batch: "2024",
        email: "john.doe@example.com",
        phone: "+91 9876543210",
        department: "Computer Science",
        profilePhoto: "https://via.placeholder.com/150x150/4A90E2/FFFFFF?text=JD",
        joinDate: "2024-01-15",
        isActive: true
    },
    {
        id: "SEDS2024002",
        username: "jane.smith",
        password: "password123",
        name: "Jane Smith",
        role: "Tech Team",
        batch: "2023",
        email: "jane.smith@example.com",
        phone: "+91 9876543211",
        department: "Electronics",
        profilePhoto: "https://via.placeholder.com/150x150/E74C3C/FFFFFF?text=JS",
        joinDate: "2023-08-20",
        isActive: true
    },
    {
        id: "SEDS2024003",
        username: "mike.johnson",
        password: "password123",
        name: "Mike Johnson",
        role: "Design Team",
        batch: "2024",
        email: "mike.johnson@example.com",
        phone: "+91 9876543212",
        department: "Mechanical",
        profilePhoto: "https://via.placeholder.com/150x150/2ECC71/FFFFFF?text=MJ",
        joinDate: "2024-02-10",
        isActive: true
    },
    {
        id: "SEDS2024004",
        username: "sarah.wilson",
        password: "password123",
        name: "Sarah Wilson",
        role: "Content Team",
        batch: "2023",
        email: "sarah.wilson@example.com",
        phone: "+91 9876543213",
        department: "English",
        profilePhoto: "https://via.placeholder.com/150x150/9B59B6/FFFFFF?text=SW",
        joinDate: "2023-09-15",
        isActive: true
    },
    {
        id: "SEDS2024005",
        username: "alex.brown",
        password: "password123",
        name: "Alex Brown",
        role: "Research Team",
        batch: "2022",
        email: "alex.brown@example.com",
        phone: "+91 9876543214",
        department: "Aerospace",
        profilePhoto: "https://via.placeholder.com/150x150/F39C12/FFFFFF?text=AB",
        joinDate: "2022-07-01",
        isActive: true
    }
];

// Admin credentials
const adminCredentials = {
    username: "admin",
    password: "admin123",
    name: "Admin User",
    role: "Administrator"
};

// Function to authenticate user
function authenticateUser(username, password) {
    // Check if admin
    if (username === adminCredentials.username && password === adminCredentials.password) {
        return {
            success: true,
            user: adminCredentials,
            type: 'admin'
        };
    }
    
    // Check regular members
    const member = membersData.find(m => 
        (m.username === username || m.email === username) && 
        m.password === password && 
        m.isActive
    );
    
    if (member) {
        return {
            success: true,
            user: member,
            type: 'member'
        };
    }
    
    return {
        success: false,
        message: "Invalid credentials"
    };
}

// Function to get member by ID
function getMemberById(id) {
    return membersData.find(m => m.id === id);
}

// Function to get member by username
function getMemberByUsername(username) {
    return membersData.find(m => m.username === username);
}

// Function to get all members (admin only)
function getAllMembers() {
    return membersData.filter(m => m.isActive);
}

// Simple hash function for HTTP environments (fallback)
function simpleHash(str) {
    let hash = 0;
    if (str.length === 0) return hash.toString(16);
    
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to positive hex string
    return Math.abs(hash).toString(16).padStart(8, '0');
}

// Function to generate QR code data
async function generateQRData(member) {
    const dataToHash = `${member.name}|${member.id}|${member.role}|${SECRET_SALT}`;
    
    try {
        let hashHex;
        
        // Try to use Web Crypto API (for HTTPS environments)
        if (window.crypto && window.crypto.subtle && window.location.protocol === 'https:') {
            const encoder = new TextEncoder();
            const data = encoder.encode(dataToHash);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } else {
            // Fallback to simple hash for HTTP environments
            console.warn('Using fallback hash method. For production, use HTTPS for better security.');
            hashHex = simpleHash(dataToHash);
        }
        
        return {
            hash: hashHex,
            memberInfo: {
                name: member.name,
                id: member.id,
                role: member.role,
                batch: member.batch
            }
        };
    } catch (error) {
        console.error('Error generating QR data:', error);
        // Fallback to simple hash if crypto fails
        const hashHex = simpleHash(dataToHash);
        return {
            hash: hashHex,
            memberInfo: {
                name: member.name,
                id: member.id,
                role: member.role,
                batch: member.batch
            }
        };
    }
}

// Function to verify QR code (admin only)
async function verifyQRCode(qrData) {
    try {
        const data = JSON.parse(qrData);
        const member = getMemberById(data.memberInfo.id);
        
        if (!member) {
            return {
                success: false,
                message: "Member not found",
                data: null
            };
        }
        
        // Regenerate hash to verify
        const expectedQRData = await generateQRData(member);
        
        if (expectedQRData && expectedQRData.hash === data.hash) {
            return {
                success: true,
                message: "QR code verified successfully",
                data: {
                    member: member,
                    verificationTime: new Date().toISOString(),
                    status: "VALID"
                }
            };
        } else {
            return {
                success: false,
                message: "QR code verification failed - Invalid hash",
                data: {
                    providedHash: data.hash,
                    expectedHash: expectedQRData ? expectedQRData.hash : null,
                    status: "INVALID"
                }
            };
        }
    } catch (error) {
        return {
            success: false,
            message: "Invalid QR code format",
            data: null
        };
    }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        membersData,
        adminCredentials,
        authenticateUser,
        getMemberById,
        getMemberByUsername,
        getAllMembers,
        generateQRData,
        verifyQRCode,
        SECRET_SALT
    };
} 