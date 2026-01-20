const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
app.use(cors());
app.use(express.json());

// ---- שינוי אחד שאת תעשי עוד רגע: שם משתמש/סיסמה/DB ----
const DB_CONFIG = {
  host: "localhost",
  user: "root",
  password: "",        // אם יש לך סיסמה ל-root, תכתבי פה
  database: "final_project"
};

// בדיקת חיים
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "final_project_api" });
});

// מחזיר את "רשימת ספרים" מתוך MySQL
// חשוב: זה חייב להתאים לשאילתה שעבד לך ב-Workbench
app.get("/api/books", async (req, res) => {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);

    const [rows] = await conn.execute(`
      SELECT
        b.product_id,
        b.title,
        b.number_of_pages,
        b.author_id,
        p.price
      FROM Book b
      JOIN Product p ON p.product_id = b.product_id
      ORDER BY b.product_id;
    `);

    await conn.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: "DB_QUERY_FAILED",
      message: err.message
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});
