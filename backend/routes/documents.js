import express from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Document from '../models/Document.js';
import { authorizeRoles } from '../middleware/roles.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    // Accept common doc and image types
    const allowed = [
      'application/pdf',
      'image/jpeg', 'image/png', 'image/webp',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Unsupported file type'));
  }
});

// GET /api/documents - list documents (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { propertyId, tenantId, leaseId, category } = req.query;
    const query = {};
    if (propertyId) query.propertyId = propertyId;
    if (tenantId) query.tenantId = tenantId;
    if (leaseId) query.leaseId = leaseId;
    if (category) query.category = category;

    const docs = await Document.find(query).sort({ uploadDate: -1 });
    res.json(docs);
  } catch (err) {
    console.error('Error listing documents:', err);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

// GET /api/documents/:id - get one document metadata
router.get('/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err) {
    console.error('Error fetching document:', err);
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid document ID' });
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// POST /api/documents - upload a new document
router.post('/',
  authorizeRoles('admin','property_manager'),
  upload.single('file'),
  [
    body('category').isIn(['Lease Agreement', 'Payment Receipt', 'Tax Document', 'Tenant ID', 'Property Deed', 'Insurance Policy', 'Maintenance Report', 'Other']).withMessage('Invalid category'),
    body('propertyId').optional().isMongoId(),
    body('tenantId').optional().isMongoId(),
    body('leaseId').optional().isMongoId(),
    body('notes').optional().isString(),
    body('tags').optional().isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // remove uploaded file if validation fails
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) return res.status(400).json({ error: 'File is required' });

      const file = req.file;
      const relativePath = path.relative(path.join(__dirname, '..'), file.path).replace(/\\/g, '/');
      const url = `/uploads/${path.basename(file.path)}`;

      const doc = new Document({
        name: path.basename(file.filename, path.extname(file.filename)),
        originalName: file.originalname,
        type: file.mimetype,
        size: file.size,
        category: req.body.category,
        propertyId: req.body.propertyId || null,
        tenantId: req.body.tenantId || null,
        leaseId: req.body.leaseId || null,
        url,
        path: relativePath,
        tags: Array.isArray(req.body.tags) ? req.body.tags : [],
        notes: req.body.notes || ''
      });

      await doc.save();
      res.status(201).json(doc);
    } catch (err) {
      console.error('Error uploading document:', err);
      // attempt cleanup on failure
      if (req.file) fs.unlink(req.file.path, () => {});
      res.status(500).json({ error: 'Failed to upload document' });
    }
  }
);

// DELETE /api/documents/:id - delete a document and its file
router.delete('/:id', authorizeRoles('admin','property_manager'), async (req, res) => {
  try {
    const doc = await Document.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Remove physical file
    const filePath = path.join(__dirname, '..', doc.path);
    fs.unlink(filePath, () => {});

    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Error deleting document:', err);
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid document ID' });
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
