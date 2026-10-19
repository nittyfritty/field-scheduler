import { Router, type Request, type Response } from "express";
import { User } from "../models/User.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";


const router = Router();


router.get("/pending-accounts", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const pendingAccounts = await User.find({ isApproved: false });
    res.json(pendingAccounts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending accounts" });
  }
});

// admin route to approve a user account
router.post(
  "/approve-account/:userId",
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const user = await User.findById(req.params.userId);
      const approver = req.user; // Assuming the authenticated user is available in req.user
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!approver) {
        return res.status(401).json({ message: "Authentication required" });
      }
      user.isApproved = true;
      user.approvedBy = approver._id;
      user.approvedAt = new Date();
      await user.save();
      res.json({ message: "User account approved", 
        approvedBy: approver?._id,
        approvedAt: new Date() });
    } catch (error) {
      res.status(500).json({ message: "Error approving account" });
    }
  },
);

export default router;