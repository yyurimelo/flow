import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export class TokenService {
  generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET!, {
      expiresIn: "1d",
    });
  }
}
