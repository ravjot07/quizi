const express = require("express");
const cors = require("cors");
const api = require("./routes/api");
const { connect } = require("./mongo");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4173",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn(`🚫 Blocked CORS request from: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.use("/api", api);

app.get("/health", (req, res) => res.json({ status: "ok", time: new Date() }));

async function start() {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
  const DB_NAME = process.env.MONGO_DBNAME || "quizi";

  try {
    await connect(MONGO_URI, DB_NAME);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Backend API running on port ${PORT}`);
      console.log(`✅ MongoDB connected at ${MONGO_URI}/${DB_NAME}`);
      console.log(`🌐 CORS Allowed Origins:`, allowedOrigins);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();
