const express = require("express");
const cors = require("cors");
const api = require("./routes/api");
const { connect } = require("./mongo");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

app.use(express.json());

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
      console.log(`🌐 CORS: All origins allowed (DEV MODE)`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();
