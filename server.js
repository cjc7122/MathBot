const express = require('express');
const cors = require('cors');
const axios = require('axios');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const port = 10000; // Update with your desired port

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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'; // Replace with your actual OpenAI API key

// In-memory user database (for demo purposes)
const users = [
    { email: 'user1', password: 'password1' },
	{ email: 'colin.cressman@gmail.com', password: 'password1' },
    // Add more users as needed
];

let authenticatedUser = null;

// Function to process the GPT-3 API response
const processResponse = (data) => {
    const solution = data.choices.length > 0 ? data.choices[0].message.content.trim() : 'No solution found';
    return solution;
};

// Function to generate a random verification code
const generateVerificationCode = () => {
    // Generate a random 3-byte (6-digit) hexadecimal code
    const randomBytes = crypto.randomBytes(3);
    const verificationCode = randomBytes.toString('hex').toUpperCase().slice(0, 6);

    return verificationCode;
};


app.use(cors());
app.use(express.json());

// Middleware to check if the user is authenticated
const authenticateUser = (req, res, next) => {
    const { email, password } = req.body;
    const user = users.find((u) => u.email === email	&& u.password === password);
    if (user) {
        next();
    } else {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

// Middleware to check if the user is already registered
const checkDuplicateUser = (req, res, next) => {
    const { email } = req.body;
    const userExists = users.some((u) => u.email === email);

    if (userExists) {
        return res.status(409).json({ error: 'Email already registered' });
    }
    next();
};

// Middleware to check if the user is already registered
const checkPassword = (req, res, next) => {
    const { email, password, password2 } = req.body;
	
	if (password !== password2) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }
	next();
};

// Middleware to handle email verification
const sendVerificationEmail = async (req, res, next) => {
    const { email } = req.body;
    const verificationCode = generateVerificationCode(); // Implement your function to generate a code

    // Send verification email
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'cjc7122@gmail.com',
            pass: 'bany uvnf rhoi dnfj',
        },
    });

    const mailOptions = {
        from: 'cjc7122@gmail.com',
        to: email,
        subject: 'Verify Your Email',
        text: `Your verification code is: ${verificationCode}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};

app.use(express.static('public'));

// Test endpoint to check if the server is running
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Login endpoint
app.post('/login', authenticateUser, (req, res) => {
    const { email, password } = req.body;

    const user = users.find((u) => u.email === email && u.password === password);
    if (user) {
        authenticatedUser = user;
        res.json({ message: 'Login successful' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Logout endpoint
app.post('/logout', (req, res) => {
    authenticatedUser = null;
    res.json({ message: 'Logout successful' });
});

// Registration endpoint
app.post('/register', checkDuplicateUser, checkPassword, sendVerificationEmail, (req, res) => {
    const { email, password, password2 } = req.body;
	
    users.push({ email, password });
    res.json({ message: 'Register successful' });
});

app.post('/solve', async (req, res) => {
    const { problem } = req.body;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
					{ role: 'system', content: 'You are a helpful assistant that provides solutions to math problems. Give your answers labeled |Step 1, |Step 2, ect... do one calculation at a time. do not round. do not make assumptions. do not simplify. Show answer in fraction form.' },
					{ role: 'user', content: `${problem}` }
				],
                temperature: 0,
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const solution = processResponse(response.data);
        res.json({ solution });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'An error occurred' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});