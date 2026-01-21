const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// ==================
// DB CONFIG
// ==================
function buildDbConfig() {
  const host = process.env.DB_HOST || "localhost";
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASS || "";
  const database = process.env.DB_NAME || "final_project";
  const port = Number(process.env.DB_PORT || 3306);

  // SSL (Aiven בדרך כלל דורש)
  const sslEnabled = String(process.env.DB_SSL || "").toLowerCase() === "true";

  // אם שמנו Secret File ב-Render בשם ca.pem
  const caPath = process.env.DB_CA_PATH || "/etc/secrets/ca.pem";

  let ssl;
  if (sslEnabled) {
    // אם יש קובץ CA - נשתמש בו. אם לא, עדיין ננסה SSL בסיסי.
    if (fs.existsSync(caPath)) {
      ssl = { ca: fs.readFileSync(caPath, "utf8") };
    } else {
      ssl = { rejectUnauthorized: true };
    }
  }

  return { host, user, password, database, port, ssl };
}

async function withConn(fn) {
  const conn = await mysql.createConnection(buildDbConfig());
  try {
    return await fn(conn);
  } finally {
    await conn.end();
  }
}

// ==================
// HEALTH CHECK
// ==================
app.get("/api/health", async (req, res) => {
  try {
    await withConn(async (conn) => {
      await conn.execute("SELECT 1");
    });
    res.json({ ok: true, db: true });
  } catch (err) {
    res.json({ ok: true, db: false, db_error: err.message });
  }
});

// ==================
// PARTICIPANTS
// ==================
app.get("/api/participants", (req, res) => {
  res.json([
    { id: 1, full_name: "שירה זכרי" },
    { id: 2, full_name: "הודיה אסתר זכרי" },
  ]);
});

// ==================
// BOOKS
// ==================
app.get("/api/books", async (req, res) => {
  try {
    const rows = await withConn(async (conn) => {
      const [r] = await conn.execute(`
        SELECT
          b.product_id,
          b.title,
          b.number_of_pages,
          b.author_id,
          p.price
        FROM book b
        JOIN product p ON p.product_id = b.product_id
        ORDER BY b.product_id
      `);
      return r;
    });

    res.json(rows);
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: "DB_QUERY_FAILED",
      message: err.message,
    });
  }
});

// ==================
// SERVER
// ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
