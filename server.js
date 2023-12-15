const express = require('express');
const cors = require('cors');
const axios = require('axios');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const app = express();
const port = 10000; // Update with your desired port

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

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
app.use(cookieParser());

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

// Middleware to check if the user is already registered
const checkDuplicateUser = async (req, res, next) => {
    const { email } = req.body;
	
	try {
		await client.connect();
 
		const db = client.db("Mathbot");
		const collection = db.collection("MathbotUsers");
		const creds = await collection.findOne( { email: email } );
	
		if (creds) {
            return res.status(409).json({ error: 'Email already registered' });
		}
	} catch (error) {
        res.status(500).json({ error: 'An error occurred' });
    } finally {
        // Ensure that the client will close when you finish/error
        await client.close();
    }
    next();
};

// Middleware to check if passwords are the same
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
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
		await client.connect();
 
		const db = client.db("Mathbot");
		const collection = db.collection("MathbotUsers");
		const creds = await collection.findOne( { email: email, password: password } );
	
		if (creds) {
			// Search for the user information in the "MathbotUserInfo" collection
            const userInfoCollection = db.collection("MathbotUserInfo");
            const userInfo = await userInfoCollection.findOne({ email });
			
			if (userInfo) {
				// Create a token with user information
                const token = jwt.sign({ email, firstName: userInfo.firstName }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

				// Set cookies with the token
                res.cookie('token', token, { maxAge: 3600000, httpOnly: true });
                res.cookie('email', email, { maxAge: 3600000, httpOnly: true });
				
				// Update the user document in the "MathbotUserInfo" collection with the new token
                await userInfoCollection.updateOne({ email }, { $set: { JWTtoken: [token] } });
                
                res.json({ message: 'Login successful', user: { email, firstName: userInfo.firstName, tokens: userInfo.tokens }	});
            } else {
                // Handle case where user information is not found
                res.status(500).json({ error: 'User information not found' });
            }
        } else {
            // Handle case where credentials are not found
            res.status(401).json({ error: 'Invalid credentials' });
        }
	} catch (error) {
        console.error('Login error:', error); // Add this line for detailed error logging
        res.status(500).json({ error: 'An error occurred during login' });
    } finally {
        // Ensure that the client will close when you finish/error
        await client.close();
    }
});

// Logout endpoint
app.post('/logout', (req, res) => {
    authenticatedUser = null;
	// Clear cookies on logout
    res.clearCookie('email');
    res.clearCookie('firstName');
	
	// Clear Token out of mongoDB also
	
    res.json({ message: 'Logout successful' });
});

// Registration endpoint
app.post('/register', checkDuplicateUser, checkPassword, sendVerificationEmail, (req, res) => {	
    res.json({ message: 'Register successful' });
});

app.post('/verify', async (req, res) => {
    try {
        console.log('Verification request received:', req.body);

        const { firstName, lastName, email, password3, verificationCode } = req.body;
        const password = password3;
		const newUser = {
			email: email,
			password: password
		};
		const newUserInfo = {
			email: email,
			firstName: firstName,
			lastName: lastName,
			tokens: 10,
			ad_free: false
		};

        console.log('Verification data:', { firstName, lastName, email, password, verificationCode });

        const matchingEntry = tempVerify.find(entry => entry.email === email && entry.verificationCode === verificationCode);

        if (!matchingEntry) {
            console.log('Invalid verification code');
            return res.status(401).json({ error: 'Invalid verification code' });
        }

        // Remove the matching entry from the temporary verification array
        tempVerify = tempVerify.filter(entry => entry.email !== email);
	
		await client.connect();
 
		const db = client.db("Mathbot");
		const collection = db.collection("MathbotUsers");
		const collection2 = db.collection("MathbotUserInfo");

		const result = await collection.insertOne(newUser);
		const result2 = await collection2.insertOne(newUserInfo);
		
		const token = jwt.sign({ email, firstName }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
		
		// Set cookies with the token
		res.cookie('token', token, { maxAge: 3600000, httpOnly: true });
		res.cookie('email', email, { maxAge: 3600000, httpOnly: true });
		
		// Update the user document in the "MathbotUserInfo" collection with the new token
		await collection2.updateOne({ email }, { $set: { JWTtoken: [token] } });

        // Log the verification success
        console.log(`Verification successful for ${email}`);
		
		const user = await collection2.findOne({ email });
		
        res.json({ message: 'Verification successful', user: {...user, JWTtoken: undefined} });
    } catch (error) {
        console.error('Error during verification:', error);

        // Log the error details
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
		// Ensure that the client will close when you finish/error
        await client.close();
	}
});

app.post('/solve', async (req, res) => {
    const problem = req.body;
    const email = req.cookies.email;
	
    try {
        await client.connect();
        const db = client.db("Mathbot");
        const collection = db.collection("MathbotUserInfo");
        const user = await collection.findOne({ email: email });
        // Check if the user has enough tokens
        if (!user || user.tokens <= 0) {
            return res.status(510).json({ error: 'Insufficient tokens' });
        }

        // Deduct tokens from the user
        const updatedTokens = await deductTokens(collection, email, 1);
		
        // Make the request to OpenAI
        const response = await makeOpenAIRequest(problem);

        // Process the OpenAI response
        const solution = processResponse(response.data);

        // Return the solution and the updated token balance
        res.json({ solution, tokens: updatedTokens });
    } catch (error) {
        console.error('Error:', error.message);

        // If an error occurs, roll back the deduction of tokens
        if (user) {
            await deductTokens(collection, email, -1);
        }

        res.status(500).json({ error: 'An error occurred' });
    } finally {
        // Ensure that the client will close when you finish/error
        await client.close();
    }
});

async function deductTokens(collection, email, amount) {
    // Deduct tokens from the user
    const user = await collection.findOne({ email: email });

    if (!user || user.tokens + amount < 0) {
        throw new Error('Invalid token deduction');
    }

    user.tokens -= amount;

    await collection.updateOne(
        { email: email },
        { $set: { tokens: user.tokens } }
    );

    return user.tokens;
}

async function makeOpenAIRequest(problem) {
    // Make the request to OpenAI
	console.log(problem);
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
	console.log(response);
	return response;
}

// Update your backend API endpoint for watching an ad
app.post('/watch-ad', async (req, res) => {
    const email = req.cookies.email;
	
	try {
		await client.connect();
		const db = client.db("Mathbot");
		const collection = db.collection("MathbotUserInfo");
		const user = await collection.findOne( { email: email } );

		// Increment the user's MathCoins (e.g., reward 5 MathCoins for watching an ad)
		user.tokens += 5; // Adjust the reward amount as needed
		
		await collection.updateOne(
            { email: email },
            { $set: { tokens: user.tokens } }
        );
		
		res.json({ user: { tokens: user.tokens } });
	} catch (error) {
		console.error('Error:', error.message);

        // If an error occurs, roll back the deduction of tokens
        if (user) {
            user.tokens -= 5;
			await collection.updateOne(
                { email: email },
                { $set: { tokens: user.tokens } }
            );
        }

        res.status(500).json({ error: 'An error occurred' });
	} finally {
		// Ensure that the client will close when you finish/error
        await client.close();
	}
});

// Update your backend API endpoint for watching an ad
app.post('/checkLoggedIn', async (req, res) => {
	try {
		const email = req.cookies.email;
		const JWTtoken = req.cookies.token;	
		
		jwt.verify(JWTtoken, process.env.JWT_SECRET_KEY, async (err, decoded) => {
            if (err) {
                // Token verification failed
                return res.status(401).json({ error: 'Unauthorized' });
            } else {
				await client.connect();
				const db = client.db("Mathbot");
				const collection = db.collection("MathbotUserInfo");
				const user = await collection.findOne( { email } );
				if (user) {
					res.json({ isLoggedIn: true, user: { firstName: user.firstName, tokens: user.tokens } });
				} else {
					res.json({ isLoggedIn: false });
				}
			}
		});
	} catch (error) {
		res.status(500).json({ error: 'Internal Server Error' });
	} finally {
		// Ensure that the client will close when you finish/error
        await client.close();
	}
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});