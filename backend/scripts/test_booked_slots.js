const http = require('http');

const url = 'http://localhost:5001/api/client/appointments/booked-slots?date=2026-07-04&phone=0398655532&duration=15&dichVuId=c1000000-0000-0000-0000-000000000101';
console.log('Fetching:', url);

http.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Raw data:', data);
    }
  });
}).on('error', (err) => {
  console.error('Error:', err);
});
