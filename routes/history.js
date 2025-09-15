const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const History = require('../models/History');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Save new history
router.post('/save', protect, async (req, res) => {
  try {
    const { userId, fileName, xAxis, yAxis, chartType, rows, fileSize } = req.body;
    if (!userId || !fileName) {
      return res.status(400).json({ success: false, message: 'userId and fileName are required.' });
    }
    const history = new History({ userId, fileName, xAxis, yAxis, chartType, rows, fileSize });
    await history.save();
    res.json({ success: true, history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get history for user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await History.find({ userId }).sort({ uploadDate: -1 });
    res.json({ success: true, history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/history/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const hist = await History.findById(req.params.id);
    if (!hist || hist.userId.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    // Mongoose v6+ no longer supports remove(); use deleteOne() on the document
    await hist.deleteOne();

    res.json({ success: true, message: 'History deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Download file
router.get('/download/:id', protect, async (req, res) => {
  const entry = await History.findById(req.params.id);
  if (!entry) return res.status(404).json({ message:'Not found' });

  // you must have saved req.file.filename as `storedName` in History
  const filePath = path.join(__dirname,'../uploads', entry.storedName);
  return res.download(filePath, entry.fileName);
});

module.exports = router;
