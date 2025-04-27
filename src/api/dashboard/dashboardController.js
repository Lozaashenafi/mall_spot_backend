import prisma from "../../config/prismaClient.js";
import { startOfYear, subYears, endOfYear } from "date-fns";

export const getDashboardData = async (req, res) => {
  try {
    const mallId = parseInt(req.params.mallId);

    const now = new Date();
    const startThisYear = startOfYear(now);
    const startLastYear = startOfYear(subYears(now, 1));

    const [
      postCount,
      tenantCount,
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

    const totalRevenue = rentPaymentRevenue._sum.amount || 0;
    const currentRevenue = thisYearRevenue._sum.amount || 0;
    const previousRevenue = lastYearRevenue._sum.amount || 0;

    const growthRate =
      previousRevenue === 0
        ? 100
        : ((currentRevenue - previousRevenue) / previousRevenue) * 100;

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

    const currentYear = new Date().getFullYear();
    const years = [0, 1, 2, 3].map((offset) => currentYear - offset).reverse();

    const revenueByYearPromises = years.map((year) => {
      const start = startOfYear(new Date(year, 0, 1));
      const end = endOfYear(start);
      return prisma.payment.aggregate({
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
      });
    });

    const revenueByYearResults = await Promise.all(revenueByYearPromises);

    const yearlyRevenue = revenueByYearResults.map((result, index) => ({
      year: years[index],
      rent: result._sum.amount || 0,
      total: result._sum.amount || 0,
    }));

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
export const getAdminDashbordData = async (req, res) => {
  try {
    // Total malls and users
    const totalMalls = await prisma.mall.count();
    const totalUsers = await prisma.user.count();

    // Subscription revenue (all time)
    const totalSubscriptionRevenueResult = await prisma.subscription.aggregate({
      _sum: { price: true },
    });

    const totalSubscriptionRevenue =
      totalSubscriptionRevenueResult._sum.price || 0;

    // Get current year
    const currentYear = new Date().getFullYear();

    // Mall registrations in last 4 years
    const mallRegistrations = await Promise.all(
      Array.from({ length: 4 }).map(async (_, index) => {
        const year = currentYear - index;
        const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

        const count = await prisma.mall.count({
          where: {
            createdAt: {
              gte: startOfYear,
              lte: endOfYear,
            },
          },
        });

        return { year, count };
      })
    );

    // Subscription revenue per year for last 4 years
    const subscriptionRevenue = await Promise.all(
      Array.from({ length: 4 }).map(async (_, index) => {
        const year = currentYear - index;
        const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

        const revenueResult = await prisma.subscription.aggregate({
          _sum: { price: true },
          where: {
            createdAt: {
              gte: startOfYear,
              lte: endOfYear,
            },
          },
        });

        return { year, revenue: revenueResult._sum.price || 0 };
      })
    );

    // Remove the post count query with mallId, as it’s not required for admin dashboard
    const totalPosts = await prisma.post.count();

    res.json({
      totalMalls,
      totalUsers,
      totalSubscriptionRevenue,
      mallRegistrations: mallRegistrations.reverse(),
      subscriptionRevenue: subscriptionRevenue.reverse(),
      totalPosts, // Add the totalPosts data to the response
    });
  } catch (error) {
    console.error("Admin Dashboard Error:", error);
    res.status(500).json({ message: "Something went wrong!" });
  }
};
