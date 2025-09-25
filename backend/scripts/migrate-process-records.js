const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'shangyin.db');
const db = new sqlite3.Database(dbPath);

function getColumns(table) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${table});`, (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map(r => r.name));
    });
  });
}

function run(sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, err => err ? reject(err) : resolve());
  });
}

(async () => {
  try {
    console.log('DB:', dbPath);
    const table = 'process_records';
    const cols = await getColumns(table);
    console.log('Before columns:', cols);

    const addIfMissing = async (name, type, def) => {
      if (!cols.includes(name)) {
        const defaultClause = def !== undefined ? ` DEFAULT ${def}` : '';
        const sql = `ALTER TABLE ${table} ADD COLUMN ${name} ${type}${defaultClause};`;
        console.log('ALTER:', sql);
        await run(sql);
      }
    };

    // Columns to ensure
    await addIfMissing('employeeId', 'INTEGER NOT NULL', 0);
    await addIfMissing('contractId', 'INTEGER NOT NULL', 0);
    await addIfMissing('contractProductId', 'INTEGER NOT NULL', 0);
    await addIfMissing('processId', 'INTEGER NOT NULL', 0);
    await addIfMissing('quantity', 'INTEGER NOT NULL', 1);
    // legacy actualTime -> ensure new field actualTimeMinutes
    await addIfMissing('actualTimeMinutes', 'INTEGER NOT NULL', 0);
    await addIfMissing('payRateSnapshot', 'NUMERIC NOT NULL', 0);
    await addIfMissing('payRateUnitSnapshot', "TEXT NOT NULL", `'perItem'`);
    await addIfMissing('payAmount', 'NUMERIC NOT NULL', 0);
    await addIfMissing('notes', 'TEXT', undefined);
    // status may already exist; ensure default set not possible via ALTER easily in sqlite

    // Indexes
    await run(`CREATE INDEX IF NOT EXISTS idx_pr_contractProduct_process ON ${table}(contractProductId, processId);`);
    await run(`CREATE INDEX IF NOT EXISTS idx_pr_employee_createdAt ON ${table}(employeeId, createdAt);`);
    await run(`CREATE INDEX IF NOT EXISTS idx_pr_contract ON ${table}(contractId);`);

    const colsAfter = await getColumns(table);
    console.log('After columns:', colsAfter);
    console.log('Migration completed.');
    db.close();
  } catch (e) {
    console.error('Migration error:', e);
    db.close();
    process.exit(1);
  }
})();
