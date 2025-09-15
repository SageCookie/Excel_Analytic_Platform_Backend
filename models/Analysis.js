const mongoose = require('mongoose');
const analysisSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  historyId:  { type: mongoose.Schema.Types.ObjectId, ref: 'History', required: true },
  xAxis:      String,
  yAxis:      String,
  chartType:  String,
  createdAt:  { type: Date, default: Date.now }
});
module.exports = mongoose.model('Analysis', analysisSchema);