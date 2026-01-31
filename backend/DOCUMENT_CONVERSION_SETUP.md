# Document Conversion Setup

This application supports automatic conversion of Word and Excel files to PDF for preview functionality.

## Prerequisites

The application requires **LibreOffice** to be installed on the server for document conversion.

## Installation Instructions

### Windows

1. **Download LibreOffice:**
   - Visit: https://www.libreoffice.org/download/download/
   - Download the Windows installer (64-bit recommended)

2. **Install LibreOffice:**
   - Run the installer
   - Follow the installation wizard
   - Default installation path: `C:\Program Files\LibreOffice`

3. **Add to System PATH (if not automatic):**
   - Open System Properties → Environment Variables
   - Edit the `Path` variable
   - Add: `C:\Program Files\LibreOffice\program`
   - Click OK to save

4. **Verify Installation:**
   ```bash
   soffice --version
   ```
   You should see the LibreOffice version number.

### Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install -y libreoffice
```

### Linux (CentOS/RHEL)

```bash
sudo yum install -y libreoffice
```

### macOS

```bash
brew install --cask libreoffice
```

Or download from: https://www.libreoffice.org/download/download/

## Verification

After installation, verify that LibreOffice is accessible:

```bash
# Windows
soffice --version

# Linux/macOS
libreoffice --version
```

## Supported File Types

### Documents
- PDF (.pdf) - Direct preview
- Word (.doc, .docx) - Converted to PDF
- Excel (.xls, .xlsx) - Converted to PDF

### Images
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### File Size Limit
- Maximum: 10MB per file

### Blocked File Types (Security)
Scripts and executables are blocked:
- .exe, .bat, .cmd, .sh, .ps1, .vbs
- .js, .jar, .app, .deb, .rpm
- .dmg, .pkg, .msi, .scr

## Troubleshooting

### "LibreOffice is not installed" Error

**Solution:**
1. Install LibreOffice using the instructions above
2. Ensure it's added to your system PATH
3. Restart your terminal/command prompt
4. Restart the backend server

### Conversion Timeout

If conversions are timing out for large files:
1. Check file size (must be under 10MB)
2. Ensure LibreOffice is not running in the background
3. Try converting the file manually to test LibreOffice

### Permission Issues (Linux)

```bash
sudo chmod +x /usr/bin/soffice
```

## Alternative: Cloud Conversion Service

If you cannot install LibreOffice on your server, you can use a cloud conversion service:

1. Sign up for a service like CloudConvert or Zamzar
2. Get an API key
3. Update the conversion service to use the cloud API

Contact your system administrator for assistance.
