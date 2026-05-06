import express from "express"
import user from "./routes/users"

const app = express()
app.use(express.json())

app.use("/api/users", user)

app.listen(3000, () => console.log("Server started"))
