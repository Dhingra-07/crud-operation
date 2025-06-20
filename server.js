const express = require('express');
const mongoose = require('mongoose');
const app = express();
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/simplecrud', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.log("❌ DB Error", err));

const User = require('./User');

// Create
app.post('/users', async (req, res) => {
    const user = new User(req.body);
    await user.save();
    res.send(user);
});

// Read All
app.get('/users', async (req, res) => {
    const users = await User.find();
    res.send(users);
});

// Read One
app.get('/users/:id', async (req, res) => {
    const user = await User.findById(req.params.id);
    res.send(user);
});

// Update
app.put('/users/:id', async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.send(user);
});

// Delete
app.delete('/users/:id', async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    res.send(user);
});

app.listen(3000, () => {
    console.log('🚀 Server running on http://localhost:3000');
});
