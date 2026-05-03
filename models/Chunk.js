const mongoose = require('mongoose');

const ChunkSchema = new mongoose.Schema({
  text: { type: String, required: true },
  embedding: { type: [Number], required: true },
  filename: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chunk', ChunkSchema);
