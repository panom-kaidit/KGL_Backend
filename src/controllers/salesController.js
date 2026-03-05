const mongoose = require("mongoose");
const Sale = require("../models/sales");

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

exports.getAgentDashboardSummary = async (req, res) => {
  try {
    // Only Sales-agents may access this endpoint
    if (req.user.role !== "Sales-agent") {
      return res.status(403).json({ message: "Access denied" });
    }

    const agentId = new mongoose.Types.ObjectId(req.user.id);

    // --- Date helpers (server-computed, never trusted from client) ---
    const now = new Date();

    // Today as "YYYY-MM-DD"
    const todayStr = now.toISOString().split("T")[0];

    // Start of the current ISO week (Monday) as "YYYY-MM-DD"
    const dayOfWeek = now.getDay(); // 0 = Sun … 6 = Sat
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysFromMonday);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    // --- Single aggregation with $facet (one round-trip to MongoDB) ---
    const [result] = await Sale.aggregate([
      // Scope everything to this agent only
      { $match: { recordedBy: agentId } },

      {
        $facet: {

          // 1. Today's totals
          todayStats: [
            { $match: { date: todayStr } },
            {
              $group: {
                _id: null,
                todaySales: { $sum: { $ifNull: ["$amountPaid", 0] } },
                contacts: { $addToSet: "$contact" }
              }
            },
            {
              $project: {
                _id: 0,
                todaySales: 1,
                // Exclude null / empty contacts from the unique count
                customersToday: {
                  $size: {
                    $filter: {
                      input: "$contacts",
                      cond: {
                        $and: [
                          { $ne: ["$$this", null] },
                          { $ne: ["$$this", ""] }
                        ]
                      }
                    }
                  }
                }
              }
            }
          ],

          // 2. This week's totals (Monday → now)
          weekStats: [
            { $match: { date: { $gte: weekStartStr, $lte: todayStr } } },
            {
              $group: {
                _id: null,
                weeklySales: { $sum: { $ifNull: ["$amountPaid", 0] } },
                contacts: { $addToSet: "$contact" }
              }
            },
            {
              $project: {
                _id: 0,
                weeklySales: 1,
                weeklyCustomers: {
                  $size: {
                    $filter: {
                      input: "$contacts",
                      cond: {
                        $and: [
                          { $ne: ["$$this", null] },
                          { $ne: ["$$this", ""] }
                        ]
                      }
                    }
                  }
                }
              }
            }
          ],

          // 3. Best day (all-time highest cash sales day for this agent)
          bestDayStats: [
            { $match: { amountPaid: { $gt: 0 } } },
            {
              $group: {
                _id: "$date",
                total: { $sum: "$amountPaid" }
              }
            },
            { $sort: { total: -1 } },
            { $limit: 1 }
          ]
        }
      }
    ]);

    // --- Shape the response ---
    const today = result.todayStats[0] || { todaySales: 0, customersToday: 0 };
    const week  = result.weekStats[0]  || { weeklySales: 0, weeklyCustomers: 0 };

    let bestDay = { day: "N/A", amount: 0 };
    if (result.bestDayStats.length > 0) {
      const best = result.bestDayStats[0];
      // Parse the stored "YYYY-MM-DD" string in UTC to avoid timezone day-shift
      const d = new Date(`${best._id}T00:00:00Z`);
      bestDay = {
        day: DAY_NAMES[d.getUTCDay()],
        amount: best.total
      };
    }

    return res.status(200).json({
      todaySales:      today.todaySales,
      customersToday:  today.customersToday,
      weeklySales:     week.weeklySales,
      weeklyCustomers: week.weeklyCustomers,
      bestDay
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
