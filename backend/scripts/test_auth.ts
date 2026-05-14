async function run() {
  try {
    console.log('Testing Login API...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@physioflow.com', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    console.log('Login Response:', loginData);

    if (!loginData.accessToken) {
      console.error('No access token returned!');
      process.exit(1);
    }

    console.log('\nTesting GetMe API...');
    const meRes = await fetch('http://localhost:5000/api/auth/me', {
      headers: { 'Authorization': `Bearer ${loginData.accessToken}` }
    });
    const meData = await meRes.json();
    console.log('GetMe Response:', meData);

    process.exit(0);
  } catch (err) {
    console.error('Test Failed:', err);
    process.exit(1);
  }
}
run();
