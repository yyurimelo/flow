import express from "express"
import user from "./routes/users"
import auth from "./routes/auth"
import notifications from "./routes/notifications"
import { errorHandler } from "./middleware/error"

const app = express()
app.use(express.json())


app.use("/api/users", user)
app.use("/api/auth", auth)
app.use("/api/notifications", notifications)

app.use(errorHandler);

app.listen(3000, () => console.log("Server started"))
