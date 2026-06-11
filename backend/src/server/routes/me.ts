import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/authenticate";
import { findUserById } from "../services/userService";

export const meRouter = Router();

meRouter.get("/me", authenticate, async (req: Request, res: Response) => {
  const user = await findUserById(req.auth!.userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  // Never return passwordHash or encryptedPrivateKey.
  res.json({
    email:      user.email,
    suiAddress: user.suiAddress,
    custodial:  user.custodial,
    srePoints:  user.srePoints,
  });
});
