import mongoose from "mongoose";

const DB_URL = "mongodb+srv://angel478:vJt9WN9XtZaee0VF@cluster0.zmt3m.mongodb.net/angel478";

async function clearEvents() {
  try {
    console.log("Connecting to the database...");
    await mongoose.connect(DB_URL);
    console.log("Connected successfully.");

    console.log("Deleting all events...");
    const db = mongoose.connection.db;
    if (!db) {
        throw new Error("DB connection not established");
    }
    const result = await db.collection("events").deleteMany({});
    
    console.log(`Deleted ${result.deletedCount} events.`);
  } catch (error) {
    console.error("Error deleting events:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

clearEvents();
