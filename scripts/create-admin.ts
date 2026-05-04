import { readDb } from '../src/services/demo-db';

const admin = readDb().users.find((user) => user.role === 'admin');
console.log(admin ? `Admin: ${admin.email}` : 'No admin found.');
