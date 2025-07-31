const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());  
app.use(cors(
    { origin: '*', },
    { credentials: true },
    { methods: 'GET,HEAD,PUT,PATCH,POST,DELETE' }
));
 
const todoRoutes = require('./routes/todoRoutes');  
app.use('/api/todos', todoRoutes);

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('🔗 Connected to database:', mongoose.connection.name || 'todo-list');
  app.listen(5000, () => console.log('🚀 Server running on port 5000'));
}).catch(err => {
  console.error('❌ MongoDB connection failed:');
  console.error('Error:', err.message);
  console.error('💡 Please check your MongoDB connection string and credentials');
  console.error('🔧 Make sure your IP is whitelisted in MongoDB Atlas Network Access');
  process.exit(1);
});
