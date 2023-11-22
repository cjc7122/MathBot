const express = require('express');
const cors = require('cors');
const axios = require('axios');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const port = 10000; // Update with your desired port

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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'; // Replace with your actual OpenAI API key

// In-memory user database (for demo purposes)
let users = [
    { firstname: 'test', lastname: 'user', email: 'user1', password: 'password1' },
	{ firstname: 'Colin', lastname: 'Cressman', email: 'colin.cressman@gmail.com', password: 'password1' },
    // Add more users as needed
];

let tempVerify = [
    { email: 'user1', verificationCode: '######' },
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


// Define CORS options
const corsOptions = {
    origin: 'https://mathbot-5zr7.onrender.com/', // Replace with the actual origin of your frontend application
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
    optionsSuccessStatus: 204, // Return a 204 status code for preflight requests
};

// Enable CORS with options
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
	console.log(email)
    if (userExists) {
        return res.status(409).json({ error: 'Email already registered' });
    }
    next();
};

// Middleware to check if the user is already registered
const checkPassword = (req, res, next) => {
    const { password1, password2 } = req.body;
	
	if (password1 !== password2) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }
	
	next();
};

// Middleware to handle email verification
const sendVerificationEmail = async (req, res, next) => {
    // Check if the passwords match and the email is not already registered
    if (!res.headersSent) {
        const { email } = req.body;
        const verificationCode = generateVerificationCode();
		tempVerify.push({ email, verificationCode });
		
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
				return res.status(402).json({ error: 'E-Mail failed to send!' });
			}
			console.log('Email sent:', info.response);
		});
    }
	next();
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
    res.json({ message: 'Register successful' });
});

app.post('/verify', (req, res) => {
    const { firstname, lastname, email, password3, verificationCode } = req.body;
	const password = password3;
    const matchingEntry = tempVerify.find(entry => entry.email === email && entry.verificationCode === verificationCode);

    if (!matchingEntry) {
        return res.status(401).json({ error: 'Invalid verification code' });
    }

    // Remove the matching entry from the temporary verification array
    tempVerify = tempVerify.filter(entry => entry.email !== email);

    // Add the user to the main users array
    users.push({ firstname, lastname, email, password });

    // Log the verification success
    console.log(`Verification successful for ${email}`);
	console.log(users);
	console.log(tempVerify);

    res.json({ message: 'Verification successful' });
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