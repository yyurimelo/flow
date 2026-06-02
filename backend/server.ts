import express from "express"
import { createServer } from "http"
import { initSocket } from "./infra/socket"
import { errorHandler } from "./middleware/error"
import auth from "./routes/auth"
import notifications from "./routes/notifications"
import user from "./routes/users"
import { connectRedis } from "./infra/redis"

const app = express()
app.use(express.json())

app.use("/api/users", user)
app.use("/api/auth", auth)
app.use("/api/notifications", notifications)
app.use(errorHandler)

async function bootstrap() {
  await connectRedis()
  
  const httpServer = createServer(app)
  await initSocket(httpServer)

  httpServer.listen(3000, () => console.log("Server started"))
}

bootstrap()