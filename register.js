app.post('/register', async (req, res) => {
    const { name, email, password, age } = req.body;

    // Check if user exists
    const emailExist = await User.findOne({ email });
    if (emailExist) return res.status(400).send('Email already exists');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashedPassword, age });
    try {
        await user.save();
        res.send({ user: user._id });
    } catch (err) {
        res.status(400).send(err);
    }
});
