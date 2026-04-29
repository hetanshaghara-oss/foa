const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;

const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: String,
  firstName: String,
  lastName: String,
});
const User = mongoose.model("User", userSchema);

async function run() {
  if (!MONGO_URI) throw new Error("MONGO_URI not found");
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const passwordHash = await bcrypt.hash("password123", 12);

  const users = [
    { username: "interviewer_a", email: "a@test.com", passwordHash, role: "interviewer", firstName: "Interviewer", lastName: "A" },
    { username: "interviewer_b", email: "b@test.com", passwordHash, role: "interviewer", firstName: "Interviewer", lastName: "B" },
    { username: "student_x", email: "x@test.com", passwordHash, role: "student", firstName: "Student", lastName: "X" },
  ];

  for (const u of users) {
    await User.findOneAndUpdate({ email: u.email }, u, { upsert: true, new: true });
    console.log(`User ${u.email} created/updated`);
  }

  await mongoose.disconnect();
  console.log("Disconnected");
}

run().catch(console.error);
