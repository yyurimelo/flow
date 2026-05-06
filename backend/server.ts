import express from "express"
import user from "./routes/users"
import auth from "./routes/auth"

const app = express()
app.use(express.json())

app.use("/api/users", user)
app.use("/api/auth", auth)

app.listen(3000, () => console.log("Server started"))
