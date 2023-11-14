const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 10000; // Update with your desired port

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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'; // Replace with your actual OpenAI API key

// In-memory user database (for demo purposes)
const users = [
    { username: 'user1', password: 'password1' },
    { username: 'user2', password: 'password2' },
    // Add more users as needed
];

let authenticatedUser = null;

// Function to process the GPT-3 API response
const processResponse = (data) => {
    const solution = data.choices.length > 0 ? data.choices[0].message.content.trim() : 'No solution found';
    return solution;
};

app.use(cors());
app.use(express.json());

// Middleware to check if the user is authenticated
const authenticateUser = (req, res, next) => {
    const { username, password } = req.body;
    const user = users.find((u) => u.username === username && u.password === password);
    if (user) {
        next();
    } else {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

app.use(express.static('public'));

// Test endpoint to check if the server is running
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Login endpoint
app.post('/login', authenticateUser, (req, res) => {
    const { username, password } = req.body;

    const user = users.find((u) => u.username === username && u.password === password);
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

app.post('/solve', async (req, res) => {
    const { problem } = req.body;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
					{ role: 'system', content: 'You are a helpful assistant that provides solutions to math problems. Give your answer in a way that can be easily parsed step by step. do one calculation at a time. do not round. do not make assumptions. do not simplify. Show answer in fraction form.' },
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