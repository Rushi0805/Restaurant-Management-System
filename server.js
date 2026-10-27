const express = require('express');
const { db, COLLECTIONS, oid } = require('./db');
const app = express(); app.use(express.json()); app.use(express.static('public'));
let D; const col = c => { if (!COLLECTIONS.includes(c)) throw new Error('Unknown collection'); return D.collection(c); };
const revive = o => JSON.parse(JSON.stringify(o), (k, v) => (typeof v === 'string' && /^\d{4}-\d\d-\d\dT/.test(v)) ? new Date(v) : v);
const wrap = f => (q, s) => f(q, s).catch(e => s.status(400).json({ error: e.message }));

// ---------- Reports: aggregation pipelines ----------
app.get('/api/reports/top-items', wrap(async (q, s) => s.json(await D.collection('orders').aggregate([
  { $match: { status: { $in: ['served', 'paid'] } } }, { $unwind: '$items' },
  { $group: { _id: '$items.name', qty: { $sum: '$items.qty' }, revenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } } } },
  { $sort: { revenue: -1 } }, { $limit: 6 }, { $project: { _id: 0, item: '$_id', qty: 1, revenue: 1 } }]).toArray())));
app.get('/api/reports/daily-revenue', wrap(async (q, s) => s.json(await D.collection('orders').aggregate([
  { $match: { status: 'paid' } },
  { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
  { $sort: { _id: 1 } }, { $project: { _id: 0, day: '$_id', revenue: 1, orders: 1, avgOrder: { $round: [{ $divide: ['$revenue', '$orders'] }, 0] } } }]).toArray())));
app.get('/api/reports/customer-spend', wrap(async (q, s) => s.json(await D.collection('orders').aggregate([
  { $match: { status: { $ne: 'cancelled' } } },
  { $group: { _id: '$customerId', spent: { $sum: '$total' }, orders: { $sum: 1 } } }, { $sort: { spent: -1 } }, { $limit: 5 },
  { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'c' } },
  { $project: { _id: 0, customer: { $arrayElemAt: ['$c.name', 0] }, spent: 1, orders: 1 } }]).toArray())));
app.get('/api/reports/status-counts', wrap(async (q, s) => s.json(await D.collection('orders').aggregate([
  { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$total' } } }, { $sort: { count: -1 } }, { $project: { _id: 0, status: '$_id', count: 1, value: 1 } }]).toArray())));

// ---------- Search: text index on menu ----------
app.get('/api/search/menu', wrap(async (q, s) => {
  const f = {}; const { text, veg, minPrice, maxPrice } = q.query;
  if (text) f.$text = { $search: text };
  if (veg) f.veg = veg === 'true';
  if (minPrice || maxPrice) f.price = { ...(minPrice && { $gte: +minPrice }), ...(maxPrice && { $lte: +maxPrice }) };
  s.json(await col('menu_items').find(f, { projection: { name: 1, price: 1, veg: 1, tags: 1, description: 1 } }).sort({ price: 1 }).limit(+q.query.limit || 20).toArray());
}));

// ---------- Array handling on orders ----------
app.post('/api/orders/:id/items', wrap(async (q, s) => {
  const it = q.body;
  await col('orders').updateOne({ _id: oid(q.params.id) }, { $push: { items: it }, $inc: { total: it.qty * it.price } }); s.json({ ok: true });
}));
app.delete('/api/orders/:id/items/:name', wrap(async (q, s) => {
  await col('orders').updateOne({ _id: oid(q.params.id) }, { $pull: { items: { name: q.params.name } } });
  const o = await col('orders').findOne({ _id: oid(q.params.id) });
  await col('orders').updateOne({ _id: o._id }, { $set: { total: o.items.reduce((t, x) => t + x.qty * x.price, 0) } }); s.json({ ok: true });
}));

// ---------- Generic CRUD with filter / projection / sort / limit ----------
// GET /api/orders?filter={"total":{"$gt":500},"$or":[...]}&fields=status,total&sort=-total&limit=10
app.get('/api/:c', wrap(async (q, s) => {
  const { filter, fields, sort, limit } = q.query; let cur = col(q.params.c).find(filter ? revive(JSON.parse(filter)) : {});
  if (fields) cur = cur.project(Object.fromEntries(fields.split(',').map(f => [f, 1])));
  if (sort) cur = cur.sort({ [sort.replace('-', '')]: sort[0] === '-' ? -1 : 1 });
  s.json(await cur.limit(Math.min(+limit || 50, 200)).toArray());
}));
app.post('/api/:c', wrap(async (q, s) => {
  const last = await col(q.params.c).find({}, { projection: { _id: 1 } }).sort({ _id: -1 }).limit(1).toArray();
  const r = await col(q.params.c).insertOne({ _id: (typeof last[0]?._id === 'number' ? last[0]._id : 0) + 1, ...revive(q.body) }); s.status(201).json(r);
}));
app.put('/api/:c/:id', wrap(async (q, s) => { const { _id, ...b } = revive(q.body); s.json(await col(q.params.c).updateOne({ _id: oid(q.params.id) }, { $set: b })); }));
app.delete('/api/:c/:id', wrap(async (q, s) => s.json(await col(q.params.c).deleteOne({ _id: oid(q.params.id) }))));

db().then(d => { D = d; app.listen(3000, () => console.log('Restaurant OMS → http://localhost:3000')); });
