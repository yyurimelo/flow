import { AuthException } from "@flow/exceptions";
import jwt, { type JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (req: any, res: any, next: any) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return next(AuthException.Unauthorized());
  }

  try {
    const token = authorization.replace("Bearer ", "");

    const decoded = jwt.verify(
      token,
      JWT_SECRET!
    ) as JwtPayload;

    req.userId = decoded.userId;

    return next();
  } catch (err) {
    return next(AuthException.TokenInvalid());
  }
};

export default authMiddleware;