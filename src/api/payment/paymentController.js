import prisma from "../../config/prismaClient.js";
export const pay = async (req, res) => {
  try {
    const { rentId, amount, paymentDate } = req.body;

    // Validate input
    if (!rentId || !amount || !paymentDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const payment = await prisma.payment.create({
      data: {
        rentId,
        amount,
        paymentDate: new Date(paymentDate),
      },
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const getPayments = async (req, res) => {
  try {
    const { mallId } = req.query;

    if (!mallId) {
      return res.status(400).json({ message: "Mall ID is required" });
    }

    const payments = await prisma.payment.findMany({
      where: {
        rent: {
          user: {
            mallId: Number(mallId),
          },
        },
      },
      include: { rent: true },
    });

    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const paymentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await prisma.payment.findUnique({
      where: { id: Number(id) },
      include: { rent: true },
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
