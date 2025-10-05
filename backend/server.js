
const express = require("express");
const cors = require("cors");
const api = require("./routes/api");
const { connect } = require("./mongo");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

const allowed = [process.env.FRONTEND_ORIGIN || "http://localhost:5173", "http://localhost:4173"];
app.use(cors({
  origin: function (origin, cb) {
    if (!origin || allowed.indexOf(origin) !== -1) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  }
}));

app.use("/api", api);

app.get("/health", (req, res) => res.json({ ok: true }));

async function start() {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
  try {
    await connect(MONGO_URI, process.env.MONGO_DBNAME || "quizi");
    app.listen(PORT, () => console.log(`API listening on ${PORT}`));
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
