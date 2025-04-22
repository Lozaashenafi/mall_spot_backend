import prisma from "../../config/prismaClient.js";

export const getDashboardData = async (req, res) => {
  const mallId = parseInt(req.params.mallId);

  const [postCount, tenantCount, firstPaymentRevenue, rentPaymentRevenue] =
    await Promise.all([
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
    ]);

  const totalRevenue =
    (firstPaymentRevenue._sum.amount || 0) +
    (rentPaymentRevenue._sum.amount || 0);

  // Calculate growth rate (current year vs previous year)
  const now = new Date();
  const startThisYear = startOfYear(now);
  const startLastYear = startOfYear(subYears(now, 1));

  const [thisYearRevenue, lastYearRevenue] = await Promise.all([
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

  const currentRevenue = thisYearRevenue._sum.amount || 0;
  const previousRevenue = lastYearRevenue._sum.amount || 0;

  const growthRate =
    previousRevenue === 0
      ? 100
      : ((currentRevenue - previousRevenue) / previousRevenue) * 100;

  return {
    postCount,
    tenantCount,
    totalRevenue,
    growthRate: parseFloat(growthRate.toFixed(2)),
  };
};
