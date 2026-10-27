const { MongoClient, ObjectId } = require('mongodb');
const URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';   // same string you paste in Compass
const client = new MongoClient(URI);
const COLLECTIONS = ['categories', 'menu_items', 'customers', 'tables', 'staff', 'orders', 'order_items', 'payments', 'reservations', 'reviews', 'inventory', 'suppliers', 'coupons', 'deliveries', 'shifts', 'kitchen_tickets'];
const oid = x => /^\d+$/.test(x) ? +x : new ObjectId(x);
async function db() { await client.connect(); return client.db('restaurant_oms'); }
module.exports = { db, COLLECTIONS, oid };
