const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');

// Get all todos for a specific user
router.get('/', async (req, res) => {
  try {
    const { user } = req.query;
    let query = {};
    
    if (user) {
      query.user = user;
    }
    
    const todos = await Todo.find(query).sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new todo
router.post('/', async (req, res) => {
  try {
    const { user, content } = req.body;
    
    if (!user || !content) {
      return res.status(400).json({ error: 'User and content are required' });
    }
    
    const todo = new Todo({ user, content });
    await todo.save();
    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update todo
router.put('/:id', async (req, res) => {
  try {
    const { content } = req.body;
    const updated = await Todo.findByIdAndUpdate(
      req.params.id, 
      { content }, 
      { new: true }
    );
    
    if (!updated) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete todo
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Todo.findByIdAndDelete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user statistics
router.get('/stats/:user', async (req, res) => {
  try {
    const { user } = req.params;
    const totalEntries = await Todo.countDocuments({ user });
    
    // Get unique active days
    const todos = await Todo.find({ user });
    const uniqueDates = new Set();
    todos.forEach(todo => {
      const date = new Date(todo.createdAt).toISOString().split('T')[0];
      uniqueDates.add(date);
    });
    
    res.json({
      totalEntries,
      activeDays: uniqueDates.size,
      recentEntries: todos.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download user data with password protection
router.post('/download/:user', async (req, res) => {
  try {
    const { user } = req.params;
    const { password } = req.body;
    
    // Password validation
    const userPasswords = {
      'ramprasanth': 'ram',
      'rampradop': 'ram',
      'shoban': 'shoban',
      'varsha': 'butter'
    };
    
    if (!password || userPasswords[user] !== password) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Fetch user data
    const todos = await Todo.find({ user }).sort({ createdAt: -1 });
    
    // Calculate statistics
    const uniqueDates = new Set();
    const dailyStats = {};
    
    todos.forEach(todo => {
      const date = new Date(todo.createdAt).toISOString().split('T')[0];
      uniqueDates.add(date);
      dailyStats[date] = (dailyStats[date] || 0) + 1;
    });
    
    // Calculate streak
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);
    
    while (currentDate >= new Date(new Date().setMonth(new Date().getMonth() - 3))) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const hasEntry = todos.some(todo => {
        const todoDate = new Date(todo.createdAt).toISOString().split('T')[0];
        return todoDate === dateStr;
      });
      
      if (hasEntry) {
        streak++;
      } else if (streak > 0) {
        break;
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    const downloadData = {
      user: user,
      downloadDate: new Date().toISOString(),
      statistics: {
        totalEntries: todos.length,
        activeDays: uniqueDates.size,
        currentStreak: streak,
        dailyBreakdown: dailyStats
      },
      entries: todos.map(todo => ({
        id: todo._id,
        content: todo.content,
        createdAt: todo.createdAt,
        wordCount: todo.content.split(' ').length,
        characterCount: todo.content.length
      }))
    };
    
    res.json(downloadData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download all users data (admin function)
router.post('/download-all', async (req, res) => {
  try {
    const { password } = req.body;
    const adminPassword = 'admin123';
    
    // Validate admin password
    if (!password || password !== adminPassword) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }
    
    const users = ['ramprasanth', 'rampradop', 'shoban', 'varsha'];
    const allUserData = {};
    
    for (const user of users) {
      const todos = await Todo.find({ user }).sort({ createdAt: -1 });
      
      // Calculate statistics for each user
      const uniqueDates = new Set();
      const dailyStats = {};
      
      todos.forEach(todo => {
        const date = new Date(todo.createdAt).toISOString().split('T')[0];
        uniqueDates.add(date);
        dailyStats[date] = (dailyStats[date] || 0) + 1;
      });
      
      // Calculate streak for each user
      const today = new Date();
      let streak = 0;
      let currentDate = new Date(today);
      
      while (currentDate >= new Date(new Date().setMonth(new Date().getMonth() - 3))) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const hasEntry = todos.some(todo => {
          const todoDate = new Date(todo.createdAt).toISOString().split('T')[0];
          return todoDate === dateStr;
        });
        
        if (hasEntry) {
          streak++;
        } else if (streak > 0) {
          break;
        }
        
        currentDate.setDate(currentDate.getDate() - 1);
      }
      
      allUserData[user] = {
        statistics: {
          totalEntries: todos.length,
          activeDays: uniqueDates.size,
          currentStreak: streak,
          dailyBreakdown: dailyStats
        },
        entries: todos.map(todo => ({
          id: todo._id,
          content: todo.content,
          createdAt: todo.createdAt,
          wordCount: todo.content.split(' ').length,
          characterCount: todo.content.length
        }))
      };
    }
    
    const downloadData = {
      downloadDate: new Date().toISOString(),
      totalUsers: users.length,
      users: allUserData,
      summary: {
        totalEntries: Object.values(allUserData).reduce((sum, userData) => sum + userData.statistics.totalEntries, 0),
        mostActiveUser: users.reduce((prev, current) => 
          allUserData[current].statistics.totalEntries > allUserData[prev].statistics.totalEntries ? current : prev
        )
      }
    };
    
    res.json(downloadData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
