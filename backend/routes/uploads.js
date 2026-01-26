import express from 'express';
import { uploadImage, uploadDocument } from '../middleware/upload.js';
import { authenticateToken } from '../middleware/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';

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
router.post('/document', authenticateToken, uploadDocument.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.send({
        message: 'Document uploaded successfully',
        file: req.file,
        url: `/uploads/documents/${req.file.filename}`
    });
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
