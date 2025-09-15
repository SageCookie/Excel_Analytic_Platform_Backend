const express = require('express');
const multer  = require('multer');
const path    = require('path');
const xlsx    = require('xlsx');
const { protect } = require('../middleware/authMiddleware');
const History = require('../models/History');
const router  = express.Router();

// Configure storage (for now, store in local 'uploads/' folder)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept only .xls and .xlsx
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.xls', '.xlsx'];
  const ext = path.extname(file.originalname);
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only .xls and .xlsx files are allowed'));
  }
};

const upload = multer({ storage, fileFilter });

// Route: POST /api/upload
router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    // parse workbook
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // save history with row count and stored filename
    const entry = await History.create({
      userId:     req.user.id,
      fileName:   req.file.originalname,
      storedName: req.file.filename,        // newly added
      rows:       data.length,
      fileSize:   req.file.size,
      xAxis:      req.body.xAxis,
      yAxis:      req.body.yAxis,
      chartType:  req.body.chartType
    });

    res.json({ message: '✅ Uploaded & history saved', data, history: entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error processing upload', error: err.message });
  }
});

// Download file by its History _id
router.get('/download/:id', protect, async (req, res) => {
  const entry = await History.findById(req.params.id);
  if (!entry) {
    return res.status(404).json({ message: 'Not found' });
  }
  // serve the file from uploads/
  const filePath = path.join(__dirname, '../uploads', entry.storedName);
  return res.download(filePath, entry.fileName);
});

module.exports = router;