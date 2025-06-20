// hotelBookingAPI/server.js
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = express();

app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/hotelDB')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error(err));

// MODELS
const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String
}));

const Room = mongoose.model('Room', new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    availableFrom: Date,
    availableTo: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}));

const Booking = mongoose.model('Booking', new mongoose.Schema({
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    checkIn: Date,
    checkOut: Date
}));

// AUTH MIDDLEWARE
const auth = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).send('Access Denied');
    try {
        const verified = jwt.verify(token, 'secretKey');
        req.user = verified;
        next();
    } catch {
        res.status(400).send('Invalid Token');
    }
};

// REGISTER
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).send('Email exists');
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed });
    await user.save();
    res.send({ message: 'Registered successfully' });
});

// LOGIN
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send('User not found');
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).send('Wrong password');
    const token = jwt.sign({ _id: user._id }, 'secretKey');
    res.send({ token });
});

// CREATE ROOM
app.post('/rooms', auth, async (req, res) => {
    const room = new Room({ ...req.body, createdBy: req.user._id });
    await room.save();
    res.send(room);
});

// EDIT ROOM
app.put('/rooms/:id', auth, async (req, res) => {
    const room = await Room.findOneAndUpdate({ _id: req.params.id, createdBy: req.user._id }, req.body, { new: true });
    if (!room) return res.status(404).send('Room not found or not your listing');
    res.send(room);
});

// DELETE ROOM
app.delete('/rooms/:id', auth, async (req, res) => {
    const result = await Room.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!result) return res.status(404).send('Not found or unauthorized');
    res.send({ message: 'Room deleted' });
});

// SEARCH ROOMS
app.get('/rooms/search', async (req, res) => {
    const { from, to } = req.query;
    const rooms = await Room.find({
        availableFrom: { $lte: new Date(from) },
        availableTo: { $gte: new Date(to) }
    });
    res.send(rooms);
});

// BOOK ROOM
app.post('/bookings', auth, async (req, res) => {
    const { roomId, checkIn, checkOut } = req.body;
    const booking = new Booking({ room: roomId, user: req.user._id, checkIn, checkOut });
    await booking.save();
    res.send(booking);
});

app.listen(3000, () => console.log('🚀 Hotel Booking API running on port 3000'));
