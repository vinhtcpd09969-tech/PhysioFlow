const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:password@localhost:5432/office_care' });

const appointmentRepository = new (require('../dist/repositories/appointment.repository').default.__proto__.constructor)();

client.connect()
  .then(async () => {
    const res = await appointmentRepository.getBookedSlots('2026-07-05', undefined, '0398655532', 30);
    console.log('Booked Slots output:', res);
    client.end();
  })
  .catch(e => {
    console.error(e);
    client.end();
  });
