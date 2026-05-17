const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://vishesh_db_user:W3QF7cjxBpvm9Vx7@cluster0.ar2uq6y.mongodb.net/";
const client = new MongoClient(uri);
async function run() {
  try {
    await client.connect();
    console.log("Connected successfully to server");
  } catch (err) {
    console.error("Connection error:", err);
  } finally {
    await client.close();
  }
}
run();
