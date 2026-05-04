import express from "express";
import bcrypt from "bcrypt"
import { PrismaClient } from "../generated/prisma/client.ts"

const prisma = new PrismaClient()
const router = express.Router()

router.post("/", async (req, res) => {

  try {
    const user = req.body

    const salt = await bcrypt.genSalt(6)
    const hasPassword = await bcrypt.hash(user.password, salt)

    const response = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: hasPassword,
      }
    })

    res.status(201).json(response)
  } catch (err) {

  }


})

export default router
