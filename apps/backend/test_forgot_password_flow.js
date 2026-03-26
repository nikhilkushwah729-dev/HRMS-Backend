import axios from 'axios';

const BASE_URL = 'http://localhost:3333/api/auth';
const TEST_EMAIL = 'rahul.sharma@acmetech.in'; // Adjust to a valid email in your local DB
const NEW_PASSWORD = 'new_secure_password_123';

async function testForgotPasswordFlow() {
    try {
        console.log('--- Step 1: Request Forgot Password ---');
        const forgotResponse = await axios.post(`${BASE_URL}/forgot-password`, {
            email: TEST_EMAIL
        });

        console.log('Forgot Password Response:', forgotResponse.data);
        const debugToken = forgotResponse.data._debug_token;

        if (!debugToken) {
            console.error('Error: _debug_token not found in response. Ensure you are in development mode.');
            return;
        }

        console.log('\n--- Step 2: Reset Password ---');
        const resetResponse = await axios.post(`${BASE_URL}/reset-password`, {
            token: debugToken,
            password: NEW_PASSWORD
        });

        console.log('Reset Password Response:', resetResponse.data);

        console.log('\n--- Step 3: Verify Login with New Password ---');
        const loginResponse = await axios.post(`${BASE_URL}/login`, {
            email: TEST_EMAIL,
            password: NEW_PASSWORD
        });

        console.log('Login Response:', loginResponse.data);
        if (loginResponse.data.token) {
            console.log('SUCCESS: Forgot password flow verified!');
        } else {
            console.error('FAILED: Login failed after password reset.');
        }

    } catch (error) {
        console.error('Error during verification:', error.response ? error.response.data : error.message);
    }
}

testForgotPasswordFlow();
