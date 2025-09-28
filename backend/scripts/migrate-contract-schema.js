const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'shangyin.db');
const db = new sqlite3.Database(dbPath);

const run = (sql) => new Promise((resolve, reject) => {
  db.run(sql, (err) => (err ? reject(err) : resolve()));
});

const getTableInfo = (table) => new Promise((resolve, reject) => {
  db.all(`PRAGMA table_info(${table});`, (err, rows) => {
    if (err) return reject(err);
    resolve(rows);
  });
});

(async () => {
  try {
    console.log('Using database:', dbPath);

    const contractColumns = (await getTableInfo('contract_records')).map((col) => col.name);
    const contractProductsColumns = (await getTableInfo('contract_products')).map((col) => col.name);

    const addContractColumn = async (name, definition) => {
      if (!contractColumns.includes(name)) {
        const sql = `ALTER TABLE contract_records ADD COLUMN ${name} ${definition};`;
        console.log('ALTER', sql);
        await run(sql);
      }
    };

    const addContractProductColumn = async (name, definition) => {
      if (!contractProductsColumns.includes(name)) {
        const sql = `ALTER TABLE contract_products ADD COLUMN ${name} ${definition};`;
        console.log('ALTER', sql);
        await run(sql);
      }
    };

    await addContractColumn('isNewWoodBox', 'INTEGER NOT NULL DEFAULT 0');
    for (let i = 1; i <= 10; i += 1) {
      await addContractColumn(`clause${i}`, 'TEXT');
    }

    await addContractProductColumn('productType', "TEXT");
    await addContractProductColumn('deliveryDeadline', "TEXT");

    console.log('Migration completed.');
    db.close();
  } catch (error) {
    console.error('Migration failed:', error);
    db.close();
    process.exit(1);
  }
})();
