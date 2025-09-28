const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'shangyin.db');
const db = new sqlite3.Database(dbPath);

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) return reject(err);
    resolve(this);
  });
});

const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) return reject(err);
    resolve(rows);
  });
});

(async () => {
  try {
    console.log('Using database:', dbPath);
    const tableInfo = await all('PRAGMA table_info(process_records);');
    const hasSnapshot = tableInfo.some((column) => column.name === 'employeeNameSnapshot');
    const employeeIdColumn = tableInfo.find((column) => column.name === 'employeeId');
    const requiresRebuild = !hasSnapshot || (employeeIdColumn && employeeIdColumn.notnull === 1);

    if (!requiresRebuild) {
      console.log('process_records already satisfies snapshot requirements.');
      db.close();
      return;
    }

    console.log('Applying process_records snapshot migration...');
    await run('BEGIN TRANSACTION');

    const createSql = `CREATE TABLE process_records_tmp (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeId INTEGER,
      employeeNameSnapshot TEXT NOT NULL DEFAULT '',
      contractId INTEGER NOT NULL,
      contractProductId INTEGER NOT NULL,
      processId INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      actualTimeMinutes INTEGER NOT NULL DEFAULT 0,
      payRateSnapshot NUMERIC NOT NULL DEFAULT 0,
      payRateUnitSnapshot TEXT NOT NULL DEFAULT 'perItem',
      payAmount NUMERIC NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'completed',
      notes TEXT,
      createdAt DATETIME,
      updatedAt DATETIME
    );`;
    await run(createSql);

    let snapshotExpr;
    if (hasSnapshot) {
      snapshotExpr = "COALESCE(employeeNameSnapshot, (SELECT name FROM employees WHERE employees.id = process_records.employeeId), '')";
    } else {
      snapshotExpr = "COALESCE((SELECT name FROM employees WHERE employees.id = process_records.employeeId), '')";
    }

    const insertSql = `INSERT INTO process_records_tmp (
      id, employeeId, employeeNameSnapshot, contractId, contractProductId, processId,
      quantity, actualTimeMinutes, payRateSnapshot, payRateUnitSnapshot,
      payAmount, status, notes, createdAt, updatedAt
    )
    SELECT
      id,
      employeeId,
      ${snapshotExpr} AS employeeNameSnapshot,
      contractId,
      contractProductId,
      processId,
      quantity,
      actualTimeMinutes,
      payRateSnapshot,
      payRateUnitSnapshot,
      payAmount,
      COALESCE(status, 'completed') AS status,
      notes,
      createdAt,
      updatedAt
    FROM process_records;`;
    await run(insertSql);

    await run('DROP TABLE process_records;');
    await run('ALTER TABLE process_records_tmp RENAME TO process_records;');

    await run('CREATE INDEX IF NOT EXISTS idx_pr_contractProduct_process ON process_records(contractProductId, processId);');
    await run('CREATE INDEX IF NOT EXISTS idx_pr_employee_createdAt ON process_records(employeeId, createdAt);');
    await run('CREATE INDEX IF NOT EXISTS idx_pr_contract ON process_records(contractId);');

    await run('COMMIT');
    console.log('Migration completed successfully.');
    db.close();
  } catch (error) {
    console.error('Migration failed:', error);
    try {
      await run('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Rollback failed:', rollbackErr);
    }
    db.close();
    process.exit(1);
  }
})();
