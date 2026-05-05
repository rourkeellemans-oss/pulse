import { GarminConnect } from 'garmin-connect';

const client = new GarminConnect({
  username: 'YOUR_GARMIN_EMAIL',
  password: 'YOUR_GARMIN_PASSWORD'
});

await client.login();
console.log('✅ Logged in to Garmin!');

// Print all available methods
const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(client)).filter(n => n.startsWith('get'));
console.log('Available methods:', methods);