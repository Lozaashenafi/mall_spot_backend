import prisma from "../../config/prismaClient.js";
import fs from "fs";
import path from "path";
import { addMonths, differenceInDays, isBefore } from "date-fns";

import { io } from "../../../app.js";
// const sendNotification = async (userId, message, type) => {
//   try {
//     await prisma.notification.create({
//       data: {
//         userId,
//         message,
//         type,
//         status: "UNREAD",
//       },
//     });
//   } catch (error) {
//     console.error("Error sending notification:", error);
//     throw new Error("Failed to send notification."); // Throw a custom error with a message
//   }
// };
export const pay = async (req, res) => {
  try {
    let { rentId, amount, paymentDate } = req.body;

    if (!rentId || !amount || !paymentDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    rentId = parseInt(rentId, 10);
    if (isNaN(rentId)) {
      return res.status(400).json({ message: "rentId must be a valid number" });
    }

    const payment = await prisma.payment.create({
      data: {
        rentId,
        amount,
        paymentDate: new Date(paymentDate),
      },
    });
    // Emit the notification to the post owner (who is the user associated with the post)
    io.to(`user-${acceptedUser.post.userId}`).emit("First Payment", {
      id: request.id, // Use the ID of the created request
      message: `User ${acceptedUser.user.username} has registered as a tenant and made their first payment.`, // Your notification message
      user: {
        userId: acceptedUser.user.id,
        userName: acceptedUser.user.username,
        userPhone: acceptedUser.user.phone,
      },
    });
    res.status(201).json({
      message: "Payment Successful",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getPaymentsByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    const rents = await prisma.rent.findMany({
      where: {
        userId: parseInt(userId),
      },
      include: {
        room: true, // Include room details
        payments: true, // Include payments
      },
    });

    if (rents.length === 0) {
      return res.status(404).json({ message: "No rents found for this user" });
    }

    // Flatten the structure into a combined response
    const detailedPayments = rents.flatMap((rent) =>
      rent.payments.map((payment) => ({
        payment,
        rent: {
          id: rent.id,
          amount: rent.amount,
          agreementFile: rent.agreementFile,
          createdAt: rent.createdAt,
          updatedAt: rent.updatedAt,
          mallId: rent.mallId,
          paymentDuration: rent.PaymentDuration,
        },
        room: rent.room,
      }))
    );

    res.status(200).json(detailedPayments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Failed to fetch payment details" });
  }
};
export const checkRentPayments = async (req, res) => {
  const currentDate = new Date();
  const { userId } = req.params;

  try {
    const rent = await prisma.rent.findFirst({
      where: {
        userId: parseInt(userId),
      },
      include: {
        payments: true,
        room: true,
      },
    });

    if (!rent) {
      return res.status(404).json({ message: "Rent not found" });
    }

    const nextPaymentDate = addMonths(
      new Date(rent.createdAt),
      rent.PaymentDuration
    );
    const daysLeft = differenceInDays(nextPaymentDate, currentDate);
    const totalPayment = rent.amount * rent.PaymentDuration;

    const rentDetails = {
      rentId: rent.id,
      userId: rent.userId,
      nextPaymentDate: nextPaymentDate.toISOString(),
      daysLeft,
      totalPaymentAmount: totalPayment,
    };

    if (daysLeft <= 15 && daysLeft > 0) {
      const message = `Your rent payment is due in ${daysLeft} days. Please ensure timely payment.`;
      await sendNotification(rent.userId, message, "ALERT");
    }

    if (daysLeft <= 0 && rent.payments.length === 0) {
      const message = `Your payment is overdue! Please make the payment immediately to avoid penalties.`;
      await sendNotification(rent.userId, message, "ALERT");
    }

    return res.status(200).json(rentDetails);
  } catch (error) {
    console.error("Error fetching rent payments:", error);
    return res.status(500).json({ message: "Internal Server Error" });
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
export const makeFirstPayment = async (req, res) => {
  try {
    const { acceptedUserId, amount, paymentDate } = req.body;

    if (!acceptedUserId) {
      return res.status(400).json({ error: "acceptedUserId is required" });
    }

    // Step 1: Find acceptedUser
    const acceptedUser = await prisma.acceptedUser.findUnique({
      where: { id: parseInt(acceptedUserId) },
      include: {
        user: true,
        mall: true,
        post: {
          include: {
            room: true,
          },
        },
      },
    });

    if (!acceptedUser) {
      return res.status(404).json({ error: "acceptedUser not found" });
    }

    const {
      userId,
      mallId,
      paymentDuration,
      post,
      ownerName,
      ownerPhone,
      paymentDateLimit,
    } = acceptedUser;
    const roomId = post.roomId;
    const amountFloat = parseFloat(amount);

    // Step 2: Create Firstpayment
    await prisma.firstpayment.create({
      data: {
        acceptedUserId: parseInt(acceptedUserId),
        amount: amountFloat,
        paymentDate: new Date(paymentDate),
      },
    });

    // Step 3: Update User Role
    await prisma.user.update({
      where: { id: userId },
      data: {
        role: "TENANT",
        mallId: mallId,
      },
    });

    // Step 4: Update Room Status
    await prisma.rooms.update({
      where: { id: roomId },
      data: {
        status: "OCCUPIED",
      },
    });

    // Step 5: Fetch Agreement Template
    const agreement = await prisma.agreement.findFirst({
      where: { mallId },
    });

    if (!agreement) {
      return res
        .status(404)
        .json({ error: "Agreement template not found for this mall" });
    }

    const templatePath = path.join(process.cwd(), agreement.agreementFile);
    const templateText = fs.readFileSync(templatePath, "utf-8");

    // Step 6: Replace placeholders
    const today = new Date();
    const agreementDate = today.toLocaleDateString();
    const leaseStartDate = today.toLocaleDateString();
    const leaseEndDate = new Date(
      today.setMonth(today.getMonth() + paymentDuration)
    ).toLocaleDateString();
    const rentDueDate = new Date(paymentDate).getDate();
    const tenantName = acceptedUser.user.fullName;
    const tenantAddress = acceptedUser.user.phoneNumber || "N/A";
    const propertyAddress = acceptedUser.mall.address || "N/A";

    const finalAgreement = templateText
      .replace(/{agreement_date}/g, agreementDate)
      .replace(/{landlord_name}/g, ownerName)
      .replace(/{landlord_address}/g, ownerPhone)
      .replace(/{tenant_name}/g, tenantName)
      .replace(/{tenant_address}/g, tenantAddress)
      .replace(/{property_address}/g, propertyAddress)
      .replace(/{lease_start_date}/g, leaseStartDate)
      .replace(/{lease_end_date}/g, leaseEndDate)
      .replace(/{rent_amount}/g, amountFloat.toString())
      .replace(/{rent_due_date}/g, rentDueDate.toString())
      .replace(/{payment_method}/g, "Bank Transfer")
      .replace(/{security_deposit}/g, amountFloat.toString())
      .replace(/{notice_period}/g, "30");

    // Step 7: Save agreement as a plain text file
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

    const newAgreementFilename = `rental_agreement_${userId}_${Date.now()}.txt`;
    const newAgreementPath = path.join(uploadsDir, newAgreementFilename);

    // Write the final agreement content as plain text
    fs.writeFileSync(newAgreementPath, finalAgreement, "UTF-8");

    // This is the relative path you'll store in the DB
    const relativeAgreementPath = path.join("uploads", newAgreementFilename);

    const existingRent = await prisma.rent.findUnique({
      where: {
        roomId: roomId,
      },
    });

    if (existingRent) {
      return res.status(400).json({
        error: "A rent record already exists for this room.",
      });
    }

    // Step 8: Create Rent Record
    await prisma.rent.create({
      data: {
        userId,
        roomId,
        mallId,
        amount: amountFloat,
        PaymentDuration: paymentDuration,
        agreementFile: relativeAgreementPath,
      },
    });
    // Emit the notification to the post owner (who is the user associated with the post)
    io.to(`user-${acceptedUser.post.userId}`).emit("First Payment", {
      id: request.id, // Use the ID of the created request
      message: `User ${acceptedUser.user.username} has registered as a tenant and made their first payment.`, // Your notification message
      user: {
        userId: acceptedUser.user.id,
        userName: acceptedUser.user.username,
        userPhone: acceptedUser.user.phone,
      },
    });
    return res.status(201).json({
      message:
        "Payment processed and Rent created successfully with agreement.",
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getFirstPayments = async (req, res) => {
  try {
    const { mallId } = req.params;
    if (!mallId) {
      return res.status(400).json({ message: "Mall ID is required" });
    }

    const firstPayments = await prisma.firstpayment.findMany({
      where: {
        acceptedUser: {
          mallId: Number(mallId),
        },
      },
      include: {
        acceptedUser: {
          include: {
            user: true,
          },
        },
      },
    });

    res.json(firstPayments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const nextPaymentDays = async (req, res) => {
  const { userId } = req.params;

  try {
    const rent = await prisma.rent.findFirst({
      where: { userId: parseInt(userId) },
      include: { payments: true },
    });

    if (!rent) {
      return res.status(404).json({ message: "Rent not found" });
    }

    // Get the latest payment by sorting payments
    const latestPayment = rent.payments.sort(
      (a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)
    )[0];

    const baseDate = latestPayment
      ? new Date(latestPayment.paymentDate)
      : new Date(rent.createdAt);

    const nextPaymentDate = addMonths(baseDate, rent.PaymentDuration);
    const daysLeft = differenceInDays(nextPaymentDate, new Date());

    let message;
    if (daysLeft > 0) {
      message = `${daysLeft} day(s) left until next payment`;
    } else {
      message = `Payment is overdue by ${Math.abs(daysLeft)} day(s)`;
    }

    res.status(200).json({
      message,
      nextPaymentDate,
      lastPaymentDate: latestPayment?.paymentDate || rent.createdAt,
    });
  } catch (error) {
    console.error("Error fetching next payment days:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getPaymentInfoByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    const rents = await prisma.rent.findMany({
      where: { userId: parseInt(userId) },
      include: {
        payments: true,
        room: true,
        user: true,
      },
    });

    if (rents.length === 0) {
      return res.status(404).json({ message: "No rents found for this user" });
    }

    const acceptedUser = await prisma.acceptedUser.findUnique({
      where: { userId: parseInt(userId) },
      include: {
        Firstpayment: true,
      },
    });
    const firstPayment = acceptedUser ? acceptedUser.Firstpayment : [];

    const paymentInfo = rents.map((rent) => {
      return {
        rentId: rent.id,
        roomId: rent.roomId,
        userName: rent.user.username,
        email: rent.user.email,
        amount: rent.amount,
        paymentDuration: rent.PaymentDuration,
        payments: rent.payments,
        firstPayment: firstPayment,
      };
    });

    res.status(200).json(paymentInfo);
  } catch (error) {
    console.error("Error fetching payment info:", error);
    res.status(500).json({ message: "Failed to fetch payment info" });
  }
};
