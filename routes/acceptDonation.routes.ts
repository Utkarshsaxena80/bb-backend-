import { Router } from "express";
import {
  acceptDonation,
  rejectDonation,
  getBloodUnits,
} from "../controllers/acceptDonation.controllers.ts";
import {
  useBloodUnit,
  allocateBloodUnits,
  markExpiredBloodUnits,
  getBloodInventory,
} from "../controllers/bloodUnit.controllers.ts";
import {
  downloadDonationCertificate,
  getDonorDonationHistory,
} from "../controllers/donationCertificate.controllers.ts";
import { authMiddleware } from "../middlewares/token.middleware.ts";

const router = Router();

// Accept a donation request and create blood unit
router.post("/accept", authMiddleware, acceptDonation);

 //router.post('/getPdf',authMiddleware,getPdf)
// Reject a donation request
router.put("/reject/:donationRequestId", authMiddleware, rejectDonation);

// Get all blood units for the authenticated blood bank
router.get("/blood-units", authMiddleware, getBloodUnits);

// Mark single blood unit as used for a patient
router.put("/blood-units/use", authMiddleware, useBloodUnit);

// Allocate multiple blood units for a patient (bulk allocation)
router.post("/blood-units/allocate", authMiddleware, allocateBloodUnits);

// Mark expired blood units
router.put("/blood-units/mark-expired", authMiddleware, markExpiredBloodUnits);

// Get blood inventory summary
router.get("/inventory", authMiddleware, getBloodInventory);

// Download donation certificate PDF (for donors)
router.get(
  "/certificate/:donationRequestId/download",
  authMiddleware,
  downloadDonationCertificate
);

// Get donor's donation history with certificate links
router.get("/my-donations", authMiddleware, getDonorDonationHistory);

export default router;
