const { MongoClient } = require("mongodb");

let client;
let db;

async function connect(uri, dbName = "quizi") {
  if (db) return db;
  client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  db = client.db(dbName);
  await db.collection("sessions").createIndex({ sessionId: 1 }, { unique: true });
  return db;
}

function getDb() {
  if (!db) throw new Error("MongoDB not connected. Call connect(uri) first.");
  return db;
}

async function close() {
  if (client) await client.close();
  client = null;
  db = null;
}

module.exports = { connect, getDb, close };
