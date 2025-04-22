import prisma from "../../config/prismaClient.js";
import { startOfYear, subYears } from "date-fns";

export const getDashboardData = async (req, res) => {
  try {
    const mallId = parseInt(req.params.mallId);

    const now = new Date();
    const startThisYear = startOfYear(now);
    const startLastYear = startOfYear(subYears(now, 1));

    // Run base queries in parallel
    const [
      postCount,
      tenantCount,
      firstPaymentRevenue,
      rentPaymentRevenue,
      thisYearRevenue,
      lastYearRevenue,
    ] = await Promise.all([
      prisma.post.count({
        where: { mallId },
      }),

      prisma.user.count({
        where: {
          mallId,
          role: "TENANT",
        },
      }),

      prisma.firstpayment.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          acceptedUser: {
            mallId,
          },
        },
      }),

      prisma.payment.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          rent: {
            mallId,
          },
        },
      }),

      prisma.payment.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          rent: {
            mallId,
          },
          paymentDate: {
            gte: startThisYear,
          },
        },
      }),

      prisma.payment.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          rent: {
            mallId,
          },
          paymentDate: {
            gte: startLastYear,
            lt: startThisYear,
          },
        },
      }),
    ]);

    const totalRevenue =
      (firstPaymentRevenue._sum.amount || 0) +
      (rentPaymentRevenue._sum.amount || 0);

    const currentRevenue = thisYearRevenue._sum.amount || 0;
    const previousRevenue = lastYearRevenue._sum.amount || 0;

    const growthRate =
      previousRevenue === 0
        ? 100
        : ((currentRevenue - previousRevenue) / previousRevenue) * 100;

    // Get room status counts
    const [totalRooms, occupiedRooms] = await Promise.all([
      prisma.rooms.count({
        where: {
          floor: {
            mallId,
          },
        },
      }),
      prisma.rooms.count({
        where: {
          status: "OCCUPIED",
          floor: {
            mallId,
          },
        },
      }),
    ]);

    const availableRooms = totalRooms - occupiedRooms;
    const occupancyPercent =
      totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    const availabilityPercent = 100 - occupancyPercent;

    return res.status(200).json({
      postCount,
      tenantCount,
      totalRevenue,
      growthRate: parseFloat(growthRate.toFixed(2)),
      occupancyPercent,
      availabilityPercent,
      totalRooms,
    });
  } catch (error) {
    console.error("Dashboard data error:", error);
    return res.status(500).json({
      message: "Failed to load dashboard data",
      error: error.message,
    });
  }
};
