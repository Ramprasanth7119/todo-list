const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');

// Get all todos
router.get('/', async (req, res) => {
  const todos = await Todo.find();
  res.json(todos);
});

// Add new todo
router.post('/', async (req, res) => {
  const { content } = req.body;
  const todo = new Todo({ content });
  await todo.save();
  res.json(todo);
});

// Update todo
router.put('/:id', async (req, res) => {
  const { content } = req.body;
  const updated = await Todo.findByIdAndUpdate(req.params.id, { content }, { new: true });
  res.json(updated);
});

// Delete todo
router.delete('/:id', async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id);
  res.json({ message: 'Todo deleted' });
});

module.exports = router;
