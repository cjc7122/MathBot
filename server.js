const express = require('express');
const cors = require('cors');
const axios = require('axios');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = 10000; // Update with your desired port

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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'; // Replace with your actual OpenAI API key

const uri = "mongodb+srv://ccressman:$Cellphone7122@mathbot.i7o0at3.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// In-memory user database (for demo purposes)
let users = [
    { firstName: 'test', lastName: 'user', email: 'user1', password: 'password1', tokens: 0, ad_free: false },
	{ firstName: 'Colin', lastName: 'Cressman', email: 'colin.cressman@gmail.com', password: 'password1', tokens: 10, ad_free: false},
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

// Async function to connect to MongoDB
async function connectToMongoDB() {
    try {
        // Connect the client to the server (optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

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
                user: 'mail.mathbot@gmail.com',
                pass: 'ccwk rejs pwwf uysd',
            },
        });
    
        const mailOptions = {
            from: 'mail.mathbot@gmail.com',
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

// Login endpoint
app.post('/login', authenticateUser, async (req, res) => {
    const { email, password } = req.body;

    try {
		await client.connect();
		
		const db = client.db("MathBot");
		const collection = db.collection("MathbotUsers");
		console.log('Attempting to find user:', { email, password });
		const credentials = await collection.findOne({ email: email.toString(), password: password.toString() });
		console.log('Credentials found:', credentials);
	
		if (credentials) {
			// Search for the user information in the "MathbotUserInfo" collection
            const userInfoCollection = db.collection("MathbotUserInfo");
            const userInfo = await userInfoCollection.findOne({ email });
			
			if (userInfo) {
                // Combine the user credentials and information
                const user = { ...credentials, ...userInfo };
                
                // Include the user's token balance in the response
                res.json({ message: 'Login successful', user: { ...user, password: undefined } });
            } else {
                // Handle case where user information is not found
                res.status(500).json({ error: 'User information not found' });
            }
        } else {
            // Handle case where credentials are not found
            res.status(401).json({ error: 'Invalid credentials' });
        }
	} catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'An error occurred' });
    } finally {
        // Ensure that the client will close when you finish/error
        await client.close();
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
    try {
        console.log('Verification request received:', req.body);

        const { firstName, lastName, email, password3, verificationCode } = req.body;
        const password = password3;

        console.log('Verification data:', { firstName, lastName, email, password, verificationCode });

        const matchingEntry = tempVerify.find(entry => entry.email === email && entry.verificationCode === verificationCode);

        if (!matchingEntry) {
            console.log('Invalid verification code');
            return res.status(401).json({ error: 'Invalid verification code' });
        }

        // Remove the matching entry from the temporary verification array
        tempVerify = tempVerify.filter(entry => entry.email !== email);

        // Add the user to the main users array
        users.push({ firstName, lastName, email, password, tokens: 10, ad_free: false });

        // Log the verification success
        console.log(`Verification successful for ${email}`);
		
		const user = users.find((u) => u.email === email && u.password === password);

        res.json({ message: 'Verification successful', user: { email, firstName, tokens: 10 } });
    } catch (error) {
        console.error('Error during verification:', error);

        // Log the error details
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// /solve endpoint
app.post('/solve', async (req, res) => {
    const { problem } = req.body;

    try {
        // Find the authenticated user
        const userIndex = users.findIndex((u) => u.email === authenticatedUser.email);

        // Ensure the user is found
        if (userIndex === -1) {
            return res.status(500).json({ error: 'Authenticated user not found' });
        }
		
		if (users[userIndex].tokens <= 0) {
			return res.status(510).json({ error: 'No more tokens' });
		}
        // Deduct 1 from the user's tokens
        users[userIndex].tokens -= 1;
        // Make the request to OpenAI
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that provides solutions to math problems. Give your answers labeled ||Step 1, ||Step 2, ect... do one calculation at a time. do not round. do not make assumptions. do not simplify. Show answer in fraction form.' },
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
        // Process the OpenAI response
        const solution = processResponse(response.data);
		const user = users.find((u) => u.email === authenticatedUser.email);
        // Return the solution and the updated token balance
        res.json({ solution, user: { ...user, password: undefined, tokens: user.tokens } });
    } catch (error) {
        console.error('Error:', error.message);

        // If an error occurs, roll back the deduction of tokens
        if (userIndex !== -1) {
            users[userIndex].tokens += 1;
        }

		
        res.status(500).json({ error: 'An error occurred' });
    }
});

// Update your backend API endpoint for watching an ad
app.post('/watch-ad', (req, res) => {
	try {
		// Assume authentication has already been handled
		const userIndex = users.findIndex((u) => u.email === authenticatedUser.email);

		if (userIndex === -1) {
            return res.status(500).json({ error: 'Authenticated user not found' });
        }

		// Increment the user's MathCoins (e.g., reward 5 MathCoins for watching an ad)
		users[userIndex].tokens += 5; // Adjust the reward amount as needed
		const user = users.find((u) => u.email === authenticatedUser.email);
		res.json({ message: 'Ad watched successfully', user: { ...user, password: undefined, tokens: user.tokens } });
	} catch (error) {
		console.error('Error:', error.message);

        // If an error occurs, roll back the deduction of tokens
        if (userIndex !== -1) {
            users[userIndex].tokens -= 5;
        }

		
        res.status(500).json({ error: 'An error occurred' });
	}
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});