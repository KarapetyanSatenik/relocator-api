const mongoose = require("mongoose");
const colors = require("colors");
const dotenv = require("dotenv");

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: "./config.env" });
console.log(process.env.NODE_ENV);
const app = require("./app");

const port = process.env.PORT || 3000;
const DB = process.env.DATABASE_LOCAL;

mongoose
  .connect(DB)
  .then(() => console.log("DB connection successful!".yellow));

const server = app.listen(port, () => {
  console.log("server is running".cyan);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
