const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Analysis = require('../models/Analysis');
const History  = require('../models/History');    // <— import
const router   = express.Router();

// save a new analysis
router.post('/', protect, async (req, res) => {
  const { historyId, xAxis, yAxis, chartType } = req.body;
  if (!historyId) return res.status(400).json({ message: 'historyId required' });
  const a = await Analysis.create({
    userId: req.user.id,
    historyId, xAxis, yAxis, chartType
  });
  res.json({ analysis: a });
});

// list all saved analyses for this user
router.get('/', protect, async (req, res) => {
  const list = await Analysis.find({ userId: req.user.id })
    .populate('historyId', 'fileName uploadDate');
  res.json({ analyses: list });
});

// DELETE /api/analysis/:id  — remove a saved analysis
router.delete('/:id', protect, async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);
    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }
    // only owner may delete
    if (analysis.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    await analysis.remove();
    res.json({ message: 'Analysis deleted', id: req.params.id });
  } catch (err) {
    console.error('Error deleting analysis:', err);
    res.status(500).json({ message: 'Error deleting analysis', error: err.message });
  }
});

// PATCH /api/analysis/:id  — rename the underlying fileName
router.patch('/:id', protect, async (req, res) => {
  const { name } = req.body;
  try {
    const analysis = await Analysis.findById(req.params.id);
    if (!analysis) return res.status(404).json({ message: 'Analysis not found' });
    if (analysis.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    // update the History record
    const history = await History.findById(analysis.historyId);
    if (!history) return res.status(404).json({ message: 'History not found' });
    history.fileName = name;
    await history.save();

    res.json({ message: 'Renamed', fileName: history.fileName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not rename', error: err.message });
  }
});

module.exports = router;