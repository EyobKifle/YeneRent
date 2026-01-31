import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

/**
 * File Conversion Service
 * Converts Word and Excel files to PDF using LibreOffice
 */

class FileConversionService {
  constructor() {
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedExtensions = {
      documents: ['.pdf', '.doc', '.docx'],
      spreadsheets: ['.xls', '.xlsx'],
      images: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    };
    this.blockedExtensions = [
      '.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.jar',
      '.app', '.deb', '.rpm', '.dmg', '.pkg', '.msi', '.scr'
    ];
  }

  /**
   * Check if file type is allowed
   */
  isAllowedFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    
    // Block dangerous file types
    if (this.blockedExtensions.includes(ext)) {
      return false;
    }

    // Check if it's in allowed extensions
    const allAllowed = [
      ...this.allowedExtensions.documents,
      ...this.allowedExtensions.spreadsheets,
      ...this.allowedExtensions.images
    ];

    return allAllowed.includes(ext);
  }

  /**
   * Check if file size is within limit
   */
  isValidFileSize(fileSize) {
    return fileSize <= this.maxFileSize;
  }

  /**
   * Check if file needs conversion to PDF
   */
  needsConversion(filename) {
    const ext = path.extname(filename).toLowerCase();
    return ['.doc', '.docx', '.xls', '.xlsx'].includes(ext);
  }

  /**
   * Convert Word/Excel file to PDF using LibreOffice
   */
  async convertToPDF(inputPath, outputDir) {
    try {
      const isWindows = process.platform === 'win32';
      const sofficePath = isWindows 
        ? '"C:\\Program Files\\LibreOffice\\program\\soffice.exe"' 
        : 'soffice';

      // Check if LibreOffice is installed
      try {
        await execAsync(`${sofficePath} --version`);
      } catch (error) {
        if (!isWindows) {
          console.warn('LibreOffice not found. Attempting alternative commands...');
          try {
            await execAsync('libreoffice --version');
          } catch (altError) {
            throw new Error('LibreOffice is not installed. Please install LibreOffice to enable document conversion.');
          }
        } else {
          throw new Error('LibreOffice is not installed at the expected path C:\\Program Files\\LibreOffice\\program\\soffice.exe');
        }
      }

      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      // Convert using LibreOffice headless mode
      // On Windows, the command needs to be properly quoted
      const command = `${sofficePath} --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;
      
      console.log(`Converting file: ${inputPath}`);
      const { stdout, stderr } = await execAsync(command, { timeout: 30000 }); // 30 second timeout

      if (stderr && !stderr.includes('Warning')) {
        console.error('Conversion stderr:', stderr);
      }

      // Get the output PDF filename
      const inputFilename = path.basename(inputPath);
      const outputFilename = inputFilename.replace(/\.(doc|docx|xls|xlsx)$/i, '.pdf');
      const outputPath = path.join(outputDir, outputFilename);

      // Check if conversion was successful
      try {
        await fs.access(outputPath);
        console.log(`Conversion successful: ${outputPath}`);
        return outputPath;
      } catch (error) {
        throw new Error('Conversion failed: Output PDF not found');
      }
    } catch (error) {
      console.error('File conversion error:', error);
      throw error;
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push('No file provided');
      return { valid: false, errors };
    }

    // Check file type
    if (!this.isAllowedFileType(file.originalname || file.name)) {
      const ext = path.extname(file.originalname || file.name);
      errors.push(`File type ${ext} is not allowed. Allowed types: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), Images`);
    }

    // Check file size
    if (!this.isValidFileSize(file.size)) {
      errors.push(`File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    return {
      valid: errors.length === 0,
      errors,
      needsConversion: this.needsConversion(file.originalname || file.name)
    };
  }

  /**
   * Get file extension info
   */
  getFileInfo(filename) {
    const ext = path.extname(filename).toLowerCase();
    const name = path.basename(filename, ext);

    return {
      extension: ext,
      name,
      isPDF: ext === '.pdf',
      isWord: ['.doc', '.docx'].includes(ext),
      isExcel: ['.xls', '.xlsx'].includes(ext),
      isImage: this.allowedExtensions.images.includes(ext),
      needsConversion: this.needsConversion(filename)
    };
  }
}

export default new FileConversionService();
