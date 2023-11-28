let isLoginSuccessful = false;
let isLoggedIn = false;
let isRegisterSuccessful = false;
let isVerificationSuccessful = false;

function adjustTextareaHeight() {
	const textarea = document.getElementById('problem-input');
	textarea.style.height = 'auto'; // Reset height to auto to recalculate scrollHeight
	textarea.style.height = (textarea.scrollHeight) + 'px';
}

// Call the adjustTextareaHeight function on page load
window.onload = function () {
	adjustTextareaHeight();
};

function openLoginPopup() {
	document.getElementById('login-popup').style.display = 'block';
	document.getElementById('Register-popup').style.display = 'none';
}

function closeLoginPopup() {
	document.getElementById('login-popup').style.display = 'none';
	// Reset the flag when the popup is closed
	isLoginSuccessful = false;
}

function openRegisterPopup() {
	document.getElementById('Register-popup').style.display = 'block';
	document.getElementById('login-popup').style.display = 'none';
}

function closeRegisterPopup() {
	document.getElementById('Register-popup').style.display = 'none';
	// Reset the flag when the popup is closed
	isRegisterSuccessful = false;
}

function openVerifyPopup() {
	document.getElementById('Verification-popup').style.display = 'block';
}

function closeVerifyPopup() {
	document.getElementById('Verification-popup').style.display = 'none';
	// Reset the flag when the popup is closed
	isVerificationSuccessful = false;
}

function SuccessLogin() {
	document.getElementById('login-popup').style.display = 'none';
}

function SuccessRegister() {
	document.getElementById('Register-popup').style.display = 'none';
}

function SuccessVerify() {
	document.getElementById('Verification-popup').style.display = 'none';
}

function Verify() {
    const firstName = document.getElementById('First_Name').value;
    const lastName = document.getElementById('Last_Name').value;
	const verificationCode = document.getElementById('verificationCode').value;
	const email = document.getElementById('E-Mail').value;
	const password3 = document.getElementById('password2').value;
	const userInfoElement1 = document.getElementById('user-info');
	
	// Send credentials to the server for duplicate check
	fetch('https://mathbot-5zr7.onrender.com/verify', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ firstName, lastName, email, password3, verificationCode }),
	})
	.then(response => response.json())
	.then(data => {
		if (data.message === 'Verification successful') {
			// Successful login
			isLoggedIn = true;
			isLoginSuccessful = true;
			// Successful login, close the popup
			SuccessVerify();
			SuccessRegister();
			// Show the Logout button
			// Successful login, close the popup
			const { user } = data;
            userInfoElement.textContent = `${data.user.firstName} logged in. Tokens:${data.user.tokens}`;
			document.getElementById('logout-btn').style.display = 'block';
			// Hide the Login button
			document.getElementById('login-button').style.display = 'none';
			document.getElementById('register-btn').style.display = 'none';
		} else if (data.message === 'Email already registered') {
			document.getElementById('EmailDuplicate').style.display = 'block';
		} else if (data.message === 'Passwords do not match') {
			document.getElementById('PasswordsDifferent').style.display = 'block';
		} else if (data.message === 'Email does not exist') {
			document.getElementById('EmailDoesNotExist').style.display = 'block';
		}
	})
	.catch(error => {
		console.error('Error:', error);
		alert('An error occurred during registration');
	});
}

function register() {
    const firstName = document.getElementById('First_Name').value;
    const lastName = document.getElementById('Last_Name').value;
    const email = document.getElementById('E-Mail').value;
    const password1 = document.getElementById('password1').value;
    const password2 = document.getElementById('password2').value;
	
	// Validate first and last name
    if (!firstName || !lastName) {
        // Display an error message for missing first or last name
        document.getElementById('MissingName').style.display = 'block';
        return;
    } else {
		document.getElementById('MissingName').style.display = 'none';
	}
	
	// Validate email format using a regular expression
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        // Display an error message for invalid email format
        document.getElementById('EmailDoesNotExist').style.display = 'block';
        return;
    } else {
        document.getElementById('EmailDoesNotExist').style.display = 'none';
	}

    // Add password complexity requirements
    const passwordRequirementsRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRequirementsRegex.test(password1)) {
        // Password does not meet complexity requirements
        document.getElementById('PasswordComplexity').style.display = 'block';
        return;
    } else {
        document.getElementById('PasswordComplexity').style.display = 'none';
	}

    // Send credentials to the server for duplicate check
    fetch('https://mathbot-5zr7.onrender.com/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, lastName, email, password1, password2 }),
    })
    .then(response => {
        if (response.ok) {
            // Successful registration, close the popup or redirect as needed
            document.getElementById('PasswordsDifferent').style.display = 'none';
            document.getElementById('EmailDuplicate').style.display = 'none';
            document.getElementById('EmailDoesNotExist').style.display = 'none';
            document.getElementById('PasswordComplexity').style.display = 'none';
            document.getElementById('MissingName').style.display = 'none';
            openVerifyPopup();
        } else {
            // Handle registration errors
            return response.json().then(data => {
                if (response.status === 409) {
                    // Email already registered
                    document.getElementById('EmailDuplicate').style.display = 'block';
                    document.getElementById('PasswordsDifferent').style.display = 'none';
                } else if (response.status === 400) {
                    // Passwords do not match
                    document.getElementById('PasswordsDifferent').style.display = 'block';
                    document.getElementById('EmailDuplicate').style.display = 'none';
                } else {
                    // Handle other status codes
                    throw new Error(`Unexpected response: ${response.status}`);
                }
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred during registration');
    });
}


function login() {
	const email = document.getElementById('username').value;
	const password = document.getElementById('password').value;
	let userInfoElement = document.getElementById('user-info');

	// Send credentials to the server for validation
	fetch('https://mathbot-5zr7.onrender.com/login', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ email, password }),
	})
	.then(response => response.json())
	.then(data => {
		if (data.message === 'Login successful') {
			// Successful login
			isLoggedIn = true;
			isLoginSuccessful = true;
			// Successful login, close the popup
			const { user } = data;
            userInfoElement.textContent = `${user.firstName} logged in. Tokens: ${user.tokens}`;
			SuccessLogin();
			// Successful login, close the popup
			document.getElementById('login-popup').style.display = 'none';
			// Show the Logout button
			document.getElementById('user-info').style.display = 'block';
			document.getElementById('logout-btn').style.display = 'block';
			// Hide the Login button
			document.getElementById('login-button').style.display = 'none';
			document.getElementById('register-btn').style.display = 'none';
		} else {
			alert('Invalid username or password');
		}
	})
	.catch(error => {
		console.error('Error:', error);
		alert('An error occurred during login');
	});
}

function logout() {
	// Log out the user
	isLoggedIn = false;
	// Hide the Logout button
	document.getElementById('logout-btn').style.display = 'none';
	document.getElementById('user-info').style.display = 'none';
	// Clear the problem input
	document.getElementById('problem-input').value = '';
	// Show the Login button
	document.getElementById('register-btn').style.display = 'block';
	document.getElementById('login-button').style.display = 'block';
}

function submitProblem() {
	if (!isLoggedIn) {
		// User is not logged in, show the login popup
		openLoginPopup();
		return;
	}
	if (isLoggedIn && isLoginSuccessful) {
		const input = document.getElementById('problem-input').value;
		const result = document.getElementById('result');
		const status = document.getElementById('status');
		const solveButton = document.getElementById('solveButton');
		const userInfoElement2 = document.getElementById('user-info');

		const prompt = `Solve the following math problem: ${input}`;

		// Display 'Calculation in progress' message
		status.innerHTML = 'Calculation in progress...';

		// Disable the Solve button to prevent multiple submissions
		solveButton.disabled = true;

		fetch('https://mathbot-5zr7.onrender.com/solve', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ problem: prompt }),
		})
		.then((response) => response.json())
		.then((data) => {
			// Display the result
			result.innerHTML = `Solution: ${data.solution}`;
			// Update the user's token balance
			//updateTokenBalance(data.tokens); // Assuming the server sends back the updated token balance
			// Clear the 'Calculation in progress' message
			status.innerHTML = '';
		})
		.catch((error) => {
			console.error('Error:', error);
			result.innerHTML = 'An error occurred. Please try again.';
			// Clear the 'Calculation in progress' message
			status.innerHTML = '';
		})
		.finally(() => {
			// Enable the Solve button after the request is complete
			solveButton.disabled = false;
		});
	}
}

// Function to update the user's token balance in the UI
/*function updateTokenBalance(newBalance) {
	let userInfoElement = document.getElementById('user-info');
	if (userInfoElement) {
		userInfoElement.textContent = `${user.firstName} logged in. Tokens: ${newBalance}`;
	}
}*/

/*function testServer() {
	const result = document.getElementById('result');
	const status = document.getElementById('status');

	// Display 'Testing server' message
	status.innerHTML = 'Testing server...';

	fetch('https://mathbot-5zr7.onrender.com/test')
		.then(response => response.json())
		.then(data => {
			console.log(data); // This should log the actual object received from the server
			// Clear the 'Testing server' message
			status.innerHTML = '';
		})
		.catch(error => {
			console.error('Error:', error);
			// Clear the 'Testing server' message
			status.innerHTML = '';
		});
}*/