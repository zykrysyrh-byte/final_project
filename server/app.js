const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();

/**
 * CORS:
 * מאפשר גם ל-GitHub Pages וגם ללוקאלי.
 * אם תרצי להקשיח עוד - אפשר לשים origin ספציפי.
 */
app.use(cors());
app.use(express.json());

/**
 * DB CONFIG:
 * בלוקאלי: defaults
 * ב-Render: Environment Variables
 */
const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "final_project",
  port: Number(process.env.DB_PORT || 3306),
  // אם יש לך DB אונליין שמחייב SSL:
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined
};

async function withConn(fn) {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    return await fn(conn);
  } finally {
    await conn.end();
  }
}

/** ✅ בדיקה הכי פשוטה שהשרת חי */
app.get("/api/ping", (req, res) => {
  res.json({ ok: true, message: "pong" });
});

/** ✅ בדיקה גם ל-DB */
app.get("/api/health", async (req, res) => {
  try {
    const dbOk = await withConn(async (conn) => {
      await conn.execute("SELECT 1");
      return true;
    }).catch(() => false);

    res.json({ ok: true, db: dbOk });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

/** ✅ משתתפות — קבוע */
app.get("/api/participants", (req, res) => {
  res.json([
    { id: 1, full_name: "שירה זכרי" },
    { id: 2, full_name: "הודיה אסתר זכרי" }
  ]);
});

/** ✅ ספרים — מה-DB */
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
      message: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
