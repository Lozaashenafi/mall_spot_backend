import prisma from "../../config/prismaClient.js";
import { startOfYear, subYears, endOfYear } from "date-fns";

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

    // Create the last 4 years including this year
    const currentYear = new Date().getFullYear();
    const years = [0, 1, 2, 3].map((offset) => currentYear - offset).reverse();

    const revenueByYearPromises = years.map((year) => {
      const start = startOfYear(new Date(year, 0, 1));
      const end = endOfYear(start);
      return Promise.all([
        prisma.payment.aggregate({
          _sum: {
            amount: true,
          },
          where: {
            rent: {
              mallId,
            },
            paymentDate: {
              gte: start,
              lte: end,
            },
          },
        }),
        prisma.firstpayment.aggregate({
          _sum: {
            amount: true,
          },
          where: {
            paymentDate: {
              gte: start,
              lte: end,
            },
            acceptedUser: {
              mallId,
            },
          },
        }),
      ]);
    });

    const revenueByYearResults = await Promise.all(revenueByYearPromises);

    const yearlyRevenue = revenueByYearResults.map(([rent, first], index) => ({
      year: years[index],
      rent: rent._sum.amount || 0,
      firstPayment: first._sum.amount || 0,
      total: (rent._sum.amount || 0) + (first._sum.amount || 0),
    }));

    // Create the last 4 years including this year

    const rentGrowthPromises = years.map((year) => {
      const start = startOfYear(new Date(year, 0, 1));
      const end = endOfYear(start);

      return prisma.rent.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          mallId,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      });
    });

    const rentGrowthResults = await Promise.all(rentGrowthPromises);

    const yearlyRent = rentGrowthResults.map((result, index) => ({
      year: years[index],
      rentAmount: result._sum.amount || 0,
    }));

    // Now you can calculate the rent growth rate
    const rentGrowthRate = yearlyRent.map((current, idx) => {
      const previous = yearlyRent[idx - 1];
      const growth = previous
        ? ((current.rentAmount - previous.rentAmount) / previous.rentAmount) *
          100
        : 100;
      return {
        year: current.year,
        rentAmount: current.rentAmount,
        growthRate: growth.toFixed(2),
      };
    });
    return res.status(200).json({
      postCount,
      tenantCount,
      totalRevenue,
      growthRate: parseFloat(growthRate.toFixed(2)),
      occupancyPercent,
      availabilityPercent,
      totalRooms,
      yearlyRevenue,
      rentGrowthRate,
    });
  } catch (error) {
    console.error("Dashboard data error:", error);
    return res.status(500).json({
      message: "Failed to load dashboard data",
      error: error.message,
    });
  }
};
