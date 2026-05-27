import app from "./app.js";
import { connectDB } from "./configs/db.js";
import { env } from "./configs/envalid.js";

const start = async () => {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
  });
};
start();
