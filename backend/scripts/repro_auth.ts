import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1'; // Wait, is it /api or /api/v1?
// index.ts says app.use('/api/auth', authRoutes);
const AUTH_URL = 'http://localhost:5000/api/auth';

async function test() {
  try {
    console.log('Testing login with admin@physioflow.com...');
    const loginRes = await axios.post(`${AUTH_URL}/login`, {
      email: 'admin@physioflow.com',
      password: 'password123'
    });
    console.log('Login success:', loginRes.data.message);
  } catch (err: any) {
    console.error('Login failed:', err.response?.status, err.response?.data);
  }

  try {
    console.log('\nTesting registration and verification...');
    const email = `test_${Date.now()}@example.com`;
    const regRes = await axios.post(`${AUTH_URL}/register`, {
      ho_ten: 'Test User',
      email: email,
      password: 'password123'
    });
    console.log('Register success:', regRes.data.message);

    // Manual verification step for testing
    console.log('\nTesting verification for:', email);
    // Note: You would normally get this from DB in the test script
  } catch (err: any) {
    console.error('Register failed:', err.response?.status, err.response?.data);
  }
}

async function verify(email: string, otp: string) {
  try {
    const res = await axios.post(`${AUTH_URL}/verify-email`, { email, otp });
    console.log('Verify success:', res.data.message);
  } catch (err: any) {
    console.error('Verify failed:', err.response?.status, err.response?.data);
  }
}

const args = process.argv.slice(2);
if (args[0] === 'verify') {
  verify(args[1], args[2]);
} else {
  test();
}
