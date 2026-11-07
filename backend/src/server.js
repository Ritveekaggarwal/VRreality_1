import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import env from "./config/env.js";
import { createContainer } from "./container.js";

const app = createApp(env, createContainer(env));

// Listen first so the host's port check passes while the database connects.
const server = app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`API listening on port ${env.PORT} (email: ${env.emailProvider})`);
});

connectDatabase(env.MONGO_URI)
  .then(() => console.log("Database connected"))
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  });

const shutdown = () => {
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
