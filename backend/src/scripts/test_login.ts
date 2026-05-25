import axios from 'axios';

async function main() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@officecare.com',
      password: '123456'
    });
    console.log('Login successful! Response data:');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    console.error('Error logging in:', err.response?.data || err.message);
  }
}

main();
