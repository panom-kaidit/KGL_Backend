const express       = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRole  = require("../middlewares/rbaMiddleware");
const procurementController = require("../controllers/procurementController");

const router = express.Router();

// POST — create procurement record (Manager only)
router.post(
  "/",
  authMiddleware,
  authorizeRole("Manager"),
  procurementController.createProcurement
);

// FIXED (BACK-01): GET all records was accessible to any authenticated user,
// including Sales-agents. All records from all branches were returned without
// any branch filter, relying on the client to filter (easily bypassed).
// Now restricted to Manager and Director, with server-side branch filtering.
router.get(
  "/",
  authMiddleware,
  authorizeRole(["Manager", "Director"]),
  procurementController.getAllProcurement
);

// GET single record — Manager or Director only
router.get(
  "/:id",
  authMiddleware,
  authorizeRole(["Manager", "Director"]),
  procurementController.getProcurementById
);

// PUT update record — Manager only
router.put(
  "/:id",
  authMiddleware,
  authorizeRole("Manager"),
  procurementController.updateProcurement
);

// DELETE record — Manager only
router.delete(
  "/:id",
  authMiddleware,
  authorizeRole("Manager"),
  procurementController.deleteProcurement
);

module.exports = router;
