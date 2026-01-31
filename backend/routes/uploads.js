import express from 'express';
import { uploadImage, uploadDocument } from '../middleware/upload.js';
import { authenticateToken } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import fileConversionService from '../services/fileConversionService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// @route   POST /api/uploads/image
// @desc    Upload an image
// @access  Private
router.post('/image', authenticateToken, uploadImage.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.send({
        message: 'Image uploaded successfully',
        file: req.file,
        url: `/uploads/images/${req.file.filename}`
    });
});

// @route   POST /api/uploads/document
// @desc    Upload a document
// @access  Private
router.post('/document', authenticateToken, uploadDocument.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        // Validate file using conversion service
        const validation = fileConversionService.validateFile(req.file);
        if (!validation.valid) {
            // Delete the uploaded file if invalid
            const filePath = req.file.path;
            try {
                await fs.promises.unlink(filePath);
            } catch (unlinkErr) {
                console.error('Error deleting invalid file:', unlinkErr);
            }
            return res.status(400).json({ errors: validation.errors });
        }

        let fileUrl = `/uploads/documents/${req.file.filename}`;
        let fileName = req.file.originalname;

        // Convert if needed
        if (validation.needsConversion) {
            try {
                const outputDir = path.join(path.resolve(), 'uploads/documents');
                const convertedPath = await fileConversionService.convertToPDF(req.file.path, outputDir);
                const convertedFilename = path.basename(convertedPath);
                fileUrl = `/uploads/documents/${convertedFilename}`;
                
                // Optional: Delete the original Word/Excel file after conversion
                // await fs.promises.unlink(req.file.path);
            } catch (conversionError) {
                console.error('Conversion failed, falling back to original file:', conversionError);
            }
        }

        res.send({
            message: 'Document uploaded successfully',
            file: req.file,
            url: fileUrl,
            originalName: fileName
        });
    } catch (error) {
        console.error('Upload route error:', error);
        res.status(500).json({ error: 'Failed to process document upload' });
    }
});

// @route   GET /api/uploads/images/:filename
// @desc    Serve an image
// @access  Public
router.get('/images/:filename', (req, res) => {
    const { filename } = req.params;
    const dirname = path.resolve();
    const fullfilepath = path.join(dirname, 'uploads/images', filename);
    return res.sendFile(fullfilepath);
});

// @route   GET /api/uploads/documents/:filename
// @desc    Serve a document
// @access  Public
router.get('/documents/:filename', (req, res) => {
    const { filename } = req.params;
    const dirname = path.resolve();
    const fullfilepath = path.join(dirname, 'uploads/documents', filename);
    return res.sendFile(fullfilepath);
});

export default router;
