# Masala Ledger – Restaurant Order Management (Node + Express + MongoDB)

## Run
1. Start MongoDB locally and open **Compass** → connect to `mongodb://127.0.0.1:27017`
2. `npm install`
3. `npm run seed`   (creates database `restaurant_oms`, 16 collections, indexes)
4. `npm start`  → http://localhost:3000
(Atlas? `MONGO_URI="mongodb+srv://..." npm start`)

## Requirement map
- 16 collections: see db.js
- CRUD: generic `GET/POST/PUT/DELETE /api/:collection` (Manage data tab)
- Logical + comparison filters: `$and/$or`, `$gt/$lt/$in` (Order filters tab)
- Projection + limit: `fields=` and `limit=` query params
- Array/document handling: orders.items[] ($push/$pull), nested payment{}, menu nutrition{}
- Aggregations ($match,$group,$sort,$project, plus $unwind/$lookup): /api/reports/*
- Indexes: text index on menu_items(name,description,tags); compound index orders(status,createdAt)
- Text search: /api/search/menu?text=biryani
