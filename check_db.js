const Database = require('better-sqlite3');
const db = new Database('sqlite.db');
const cats = db.prepare('SELECT * FROM categories').all();
console.log(JSON.stringify(cats, null, 2));
const appsRows = db.prepare('SELECT name, category FROM apps LIMIT 5').all();
console.log(JSON.stringify(appsRows, null, 2));
db.close();
