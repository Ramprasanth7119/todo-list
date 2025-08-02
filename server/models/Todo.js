const mongoose = require('mongoose');

const TodoSchema = new mongoose.Schema({
  user: { type: String, required: true, enum: ['ramprasanth', 'rampradop', 'shoban', 'varsha'] },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Todo', TodoSchema);
