const { db, COLLECTIONS } = require('./db');
(async () => {
  const d = await db();
  for (const c of COLLECTIONS) await d.collection(c).deleteMany({});
  const ins = (c, a) => d.collection(c).insertMany(a.map((x, i) => ({ _id: i + 1, ...x })));
  const cats = ['Starters', 'Tandoor', 'Curries', 'Biryani', 'Breads', 'Desserts', 'Drinks'];
  await ins('categories', cats.map(n => ({ name: n, active: true })));
  const menu = [
    ['Paneer Tikka', 1, 320, true, ['smoky', 'paneer'], 'Charred cottage cheese with mint chutney'], ['Chicken Seekh Kebab', 2, 380, false, ['spicy', 'grill'], 'Minced chicken skewers from the tandoor'],
    ['Butter Chicken', 3, 460, false, ['creamy', 'classic'], 'Tomato butter gravy with tandoori chicken'], ['Dal Makhani', 3, 340, true, ['slow-cooked', 'creamy'], 'Black lentils simmered overnight'],
    ['Hyderabadi Biryani', 4, 420, false, ['spicy', 'rice'], 'Dum biryani with saffron rice'], ['Veg Dum Biryani', 4, 350, true, ['rice', 'aromatic'], 'Seasonal vegetables with basmati'],
    ['Garlic Naan', 5, 90, true, ['bread', 'garlic'], 'Tandoor naan with garlic butter'], ['Gulab Jamun', 6, 140, true, ['sweet', 'warm'], 'Milk dumplings in rose syrup'],
    ['Masala Chai', 7, 80, true, ['hot', 'spiced'], 'Ginger cardamom tea'], ['Mango Lassi', 7, 150, true, ['cold', 'sweet'], 'Alphonso mango yogurt drink'],
    ['Fish Tikka', 2, 440, false, ['grill', 'coastal'], 'Ajwain-marinated fish'], ['Palak Paneer', 3, 360, true, ['greens', 'paneer'], 'Spinach gravy with paneer']];
  await ins('menu_items', menu.map(([name, categoryId, price, veg, tags, description]) => ({ name, categoryId, price, veg, tags, description, nutrition: { calories: 200 + price, protein: Math.round(price / 20) }, available: true })));
  const names = ['Aarav Shah', 'Diya Mehta', 'Rohan Iyer', 'Sana Khan', 'Kabir Rao', 'Isha Nair', 'Vihaan Joshi', 'Meera Das'];
  await ins('customers', names.map((n, i) => ({ name: n, phone: '98200000' + (10 + i), email: n.split(' ')[0].toLowerCase() + '@mail.com', loyaltyPoints: i * 40, address: { city: 'Mumbai', area: ['Bandra', 'Andheri', 'Powai', 'Juhu'][i % 4] } })));
  await ins('tables', [2, 2, 4, 4, 6, 6, 8, 4].map((s, i) => ({ number: i + 1, seats: s, status: i % 3 ? 'free' : 'occupied' })));
  await ins('staff', ['Chef Arjun:chef', 'Neha:waiter', 'Imran:waiter', 'Pooja:cashier', 'Sameer:manager', 'Ravi:delivery'].map(s => { const [name, role] = s.split(':'); return { name, role, salary: 22000 + name.length * 2500, skills: [role, 'teamwork'] }; }));
  const statuses = ['placed', 'preparing', 'served', 'paid', 'paid', 'paid', 'cancelled'];
  const orders = [];
  for (let i = 0; i < 40; i++) {
    const items = [0, 1, 2].slice(0, 1 + (i % 3)).map(k => { const m = menu[(i * 3 + k * 5) % menu.length]; return { itemId: ((i * 3 + k * 5) % menu.length) + 1, name: m[0], qty: 1 + ((i + k) % 3), price: m[2] }; });
    const total = items.reduce((s, x) => s + x.qty * x.price, 0);
    orders.push({ customerId: (i % 8) + 1, tableId: (i % 8) + 1, waiterId: 2 + (i % 2), type: ['dine-in', 'takeaway', 'delivery'][i % 3], items, total, status: statuses[i % 7], payment: { method: ['UPI', 'card', 'cash'][i % 3], paid: statuses[i % 7] === 'paid' }, createdAt: new Date(Date.now() - (i % 10) * 864e5) });
  }
  await ins('orders', orders);
  await ins('order_items', orders.flatMap((o, i) => o.items.map(x => ({ orderId: i + 1, ...x }))).slice(0, 60));
  await ins('payments', orders.filter(o => o.payment.paid).map((o, i) => ({ orderId: i + 1, amount: o.total, method: o.payment.method, paidAt: o.createdAt })));
  await ins('reservations', names.map((n, i) => ({ customerId: i + 1, tableId: i + 1, guests: 2 + (i % 5), date: new Date(Date.now() + i * 864e5), status: 'confirmed' })));
  await ins('reviews', names.map((n, i) => ({ customerId: i + 1, rating: 3 + (i % 3), comment: ['Loved the biryani', 'Great service', 'Tandoor was perfect', 'Bit slow, tasty food'][i % 4] })));
  await ins('inventory', ['Basmati Rice', 'Paneer', 'Chicken', 'Cream', 'Tomatoes', 'Saffron'].map((n, i) => ({ item: n, qty: 5 + i * 7, unit: 'kg', reorderLevel: 15, supplierId: (i % 3) + 1 })));
  await ins('suppliers', ['Fresh Farms', 'Spice Route', 'Dairy Co'].map((n, i) => ({ name: n, phone: '99000000' + i, supplies: ['produce', 'spices', 'dairy'][i] })));
  await ins('coupons', [['WELCOME10', 10], ['FEAST20', 20], ['LUNCH5', 5]].map(([code, pct]) => ({ code, percent: pct, active: true })));
  await ins('deliveries', orders.filter(o => o.type === 'delivery').slice(0, 10).map((o, i) => ({ orderId: i + 1, riderId: 6, status: ['assigned', 'on-the-way', 'delivered'][i % 3], etaMinutes: 20 + i })));
  await ins('shifts', [1, 2, 3, 4, 5, 6].map(s => ({ staffId: s, day: 'Mon', start: '11:00', end: '19:00' })));
  await ins('kitchen_tickets', orders.slice(0, 10).map((o, i) => ({ orderId: i + 1, station: ['tandoor', 'curry', 'dessert'][i % 3], state: ['queued', 'cooking', 'ready'][i % 3] })));
  await d.collection('menu_items').createIndex({ name: 'text', description: 'text', tags: 'text' });   // text index
  await d.collection('orders').createIndex({ status: 1, createdAt: -1 });                              // compound index
  console.log('Seeded restaurant_oms: ' + COLLECTIONS.length + ' collections'); process.exit();
})();
