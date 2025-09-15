const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName:   String,
  storedName: { type: String, required: true },     
  uploadDate: { type: Date, default: Date.now },
  xAxis:      String,
  yAxis:      String,
  chartType:  String,
  rows:       { type: Number, default: 0 },
  fileSize:   { type: Number, default: 0 }
});

module.exports = mongoose.model('History', historySchema);
