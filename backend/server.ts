import express from "express"
import user from "./routes/user"

const app = express()
app.use(express.json())

app.use("/api/user", user)

app.listen(3000, () => console.log("Server started"))
