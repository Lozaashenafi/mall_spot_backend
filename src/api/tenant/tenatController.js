import prisma from "../../config/prismaClient.js";
import bcrypt from "bcryptjs";
import tenantSchema from "./tenantSchema.js";

export const TenatRegister = async (req, res) => {
  try {
    const { error } = tenantSchema.register.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { fullName, email, phoneNumber, password, confirmPassword, mallId } =
      req.body;
    const mallIdInt = parseInt(mallId, 10);

    if (isNaN(mallIdInt)) {
      return res.status(400).json({ message: "Invalid mall ID" });
    }

    // Check if the mall exists
    const mall = await prisma.mall.findUnique({ where: { id: mallIdInt } });
    if (!mall) {
      return res.status(404).json({ message: "Mall not found." });
    }

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      // Only update role if the user is currently a USER
      if (existingUser.role === "USER") {
        const updatedUser = await prisma.user.update({
          where: { email },
          data: {
            role: "TENANT",
            Mall: { connect: { id: mallIdInt } },
          },
        });

        return res
          .status(200)
          .json({ message: "User role updated to TENANT.", updatedUser });
      } else {
        return res
          .status(400)
          .json({ message: "User already has a different role." });
      }
    }

    // Hash the password for a new tenant
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the Tenant
    const tenant = await prisma.user.create({
      data: {
        fullName,
        email,
        phoneNumber,
        password: hashedPassword,
        role: "TENANT",
        Mall: { connect: { id: mallIdInt } },
        username: email,
      },
    });

    res
      .status(201)
      .json({ message: "Tenant registered successfully.", tenant });
  } catch (error) {
    console.error("Error registering tenant:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
export const listTenants = async (req, res) => {
  try {
    const mallIdInt = parseInt(req.params.mallId);

    if (isNaN(mallIdInt)) {
      return res.status(400).json({ message: "Invalid mall ID" });
    }

    // Check if mall exists
    const mall = await prisma.mall.findUnique({ where: { id: mallIdInt } });
    if (!mall) {
      return res.status(404).json({ message: "Mall not found." });
    }

    // Fetch all tenants in the specified mall
    const tenants = await prisma.user.findMany({
      where: {
        role: "TENANT",
        mallId: mallIdInt,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(200).json({ tenants });
  } catch (error) {
    console.error("Error fetching tenants:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
export const updateTenant = async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId, 10);
    if (isNaN(tenantId)) {
      return res.status(400).json({ message: "Invalid tenant ID" });
    }
    const { fullName, email, phoneNumber, mallId } = req.body;
    // Check if tenant exists
    const tenant = await prisma.user.findUnique({
      where: { id: tenantId, role: "TENANT" },
    });
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found." });
    }

    let mallUpdate = {};
    if (mallId) {
      const mallIdInt = parseInt(mallId, 10);
      if (isNaN(mallIdInt)) {
        return res.status(400).json({ message: "Invalid mall ID" });
      }

      const mall = await prisma.mall.findUnique({ where: { id: mallIdInt } });
      if (!mall) {
        return res.status(404).json({ message: "Mall not found." });
      }

      mallUpdate = { Mall: { connect: { id: mallIdInt } } };
    }
    // Update tenant details
    const updatedTenant = await prisma.user.update({
      where: { id: tenantId },
      data: {
        fullName,
        email,
        phoneNumber,
        ...mallUpdate,
      },
    });
    res
      .status(200)
      .json({ message: "Tenant updated successfully.", updatedTenant });
  } catch (error) {
    console.error("Error updating tenant:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
