const mongoose = require('mongoose');

const ProposalSchema = new mongoose.Schema({
  role: { type: String },
  title: { type: String },
  proposal: { type: String },
  context: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Proposal', ProposalSchema);
