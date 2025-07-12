# SEDS CUSAT Digital ID System

A lightweight, secure digital ID card system for SEDS CUSAT club members. This system allows members to access their digital ID cards with QR codes for verification, and provides admin tools for verification and member management.

## Features

### For Members
- **Secure Login**: Simple username/password authentication
- **Digital ID Card**: Professional-looking ID card with:
  - Full name and photo
  - Member ID and role
  - Batch and department information
  - Secure QR code for verification
- **Responsive Design**: Works on all devices (desktop, tablet, mobile)
- **Download Support**: ID card download functionality (coming soon)

### For Admins
- **QR Code Verification**: Verify member QR codes manually or via camera
- **Member Database**: View and manage all active members
- **Data Export**: Export member data to CSV format
- **Camera Integration**: Real-time QR code scanning (requires HTTPS)
- **Verification Logs**: Track verification history and results

## Technology Stack

- **Frontend**: Vanilla HTML5, CSS3, and JavaScript
- **QR Code Generation**: QRCode.js library
- **Security**: SHA-256 hashing for QR code data
- **Storage**: Browser sessionStorage for demo (easily replaceable with API)
- **Deployment**: Static hosting compatible (GitHub Pages, Netlify, etc.)

## Quick Start

### 1. Download/Clone the Project
```bash
git clone [repository-url]
cd seds-cusat-digital-id
```

### 2. Demo Credentials
The system comes with pre-configured demo accounts:

**Member Login:**
- Username: `john.doe`
- Password: `password123`

**Admin Login:**
- Username: `admin`
- Password: `admin123`

### 3. Local Testing
Simply open `index.html` in your web browser to start using the system.

For camera functionality (QR scanning), you'll need to serve the files over HTTPS:
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server -p 8000
```

Then access via `http://localhost:8000`

## File Structure

```
seds-cusat-digital-id/
├── index.html          # Login page
├── dashboard.html      # Member dashboard with ID card
├── admin.html         # Admin verification portal
├── styles.css         # All styling and responsive design
├── script.js          # Main application logic
├── admin.js           # Admin-specific functionality
├── data.js            # Sample data and authentication
└── README.md          # This file
```

## Configuration

### Adding New Members
Edit the `membersData` array in `data.js`:

```javascript
{
    id: "SEDS2024XXX",
    username: "user.name",
    password: "secure_password",
    name: "Full Name",
    role: "Team Name",
    batch: "2024",
    email: "user@example.com",
    phone: "+91 XXXXXXXXXX",
    department: "Department Name",
    profilePhoto: "https://example.com/photo.jpg",
    joinDate: "2024-01-01",
    isActive: true
}
```

### Customizing QR Code Security
Update the `SECRET_SALT` in `data.js` with your own secure string:

```javascript
const SECRET_SALT = "YOUR_SECURE_SECRET_KEY_HERE";
```

### Styling Customization
The color scheme and branding can be modified in `styles.css`:

```css
/* Main brand colors */
:root {
    --primary-color: #4A90E2;
    --secondary-color: #357abd;
    --success-color: #2ecc71;
    --error-color: #e74c3c;
}
```

## Deployment

### GitHub Pages
1. Push your code to a GitHub repository
2. Go to repository Settings > Pages
3. Select source branch (main/master)
4. Your site will be available at `https://username.github.io/repository-name`

### Netlify
1. Drag and drop the project folder to [Netlify](https://netlify.com)
2. Or connect your GitHub repository for automatic deployments

### Other Static Hosts
The system works with any static hosting service:
- Vercel
- Firebase Hosting
- AWS S3 Static Website
- Any web hosting provider

## Security Features

### QR Code Security
- Each QR code contains a SHA-256 hash of member data + secret salt
- Hash verification prevents tampering
- Member information is encoded securely

### Authentication
- Session-based authentication using browser storage
- Easy to replace with JWT tokens or API authentication
- Secure password handling (currently demo passwords)

### Data Protection
- No sensitive data stored in QR codes
- Hash-based verification system
- Admin-only access to verification tools

## Database Integration

The current system uses static JSON data for demonstration. To integrate with a real database:

1. **Replace data.js functions** with API calls:
   ```javascript
   // Instead of local data
   async function authenticateUser(username, password) {
       const response = await fetch('/api/auth/login', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ username, password })
       });
       return await response.json();
   }
   ```

2. **Update the backend API endpoints**:
   - `POST /api/auth/login` - User authentication
   - `GET /api/members/:id` - Get member details
   - `POST /api/qr/verify` - Verify QR code
   - `GET /api/admin/members` - Get all members (admin only)

3. **Add environment variables** for configuration:
   ```javascript
   const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
   const SECRET_SALT = process.env.SECRET_SALT || 'fallback-secret';
   ```

## Browser Compatibility

- **Modern Browsers**: Chrome 60+, Firefox 60+, Safari 12+, Edge 79+
- **Mobile Browsers**: iOS Safari 12+, Chrome Mobile 60+
- **Required Features**: ES6, Web Crypto API, Canvas API, getUserMedia (for camera)

## Known Limitations

1. **Camera QR Scanning**: Currently a placeholder - needs jsQR library integration
2. **Download Feature**: ID card download is not yet implemented
3. **Offline Support**: No service worker or offline capabilities
4. **Real-time Updates**: No websocket or real-time synchronization

## Future Enhancements

- [ ] Real QR code scanning with jsQR library
- [ ] ID card download as PDF/image
- [ ] Offline support with service workers
- [ ] Multi-language support
- [ ] Advanced admin dashboard with analytics
- [ ] Email notifications for verification events
- [ ] Mobile app version using PWA technologies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is provided as-is for educational and organizational use. Modify as needed for your specific requirements.

## Support

For issues or questions:
1. Check the browser console for error messages
2. Ensure all files are served over HTTPS for camera features
3. Verify that the QR code library is loaded properly
4. Test with the provided demo credentials first

## Contact

For technical support or customization requests, please contact the development team. 