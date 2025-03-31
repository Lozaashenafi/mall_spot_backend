-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `role` ENUM('ADMIN', 'USER', 'TENANT', 'MALL_OWNER') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_idx`(`email`),
    INDEX `User_username_idx`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Mall` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mallName` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `totalFloors` INTEGER NOT NULL,
    `totalRooms` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Mall_mallName_key`(`mallName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Post` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mallId` INTEGER NOT NULL,
    `roomId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `price` DOUBLE NULL,
    `bidDeposit` DOUBLE NULL,
    `userId` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'INVISIBLE') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Post_title_idx`(`title`),
    INDEX `Post_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PostImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `postId` INTEGER NOT NULL,
    `imageURL` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bid` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `postId` INTEGER NOT NULL,
    `bidAmount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Bid_userId_idx`(`userId`),
    INDEX `Bid_postId_idx`(`postId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Deposit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bidId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Winner` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bidId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `winningAmount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Winner_bidId_key`(`bidId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `type` ENUM('BID', 'MESSAGE', 'SYSTEM', 'ALERT') NOT NULL,
    `status` ENUM('UNREAD', 'READ', 'ARCHIVED') NOT NULL DEFAULT 'UNREAD',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Floor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mallId` INTEGER NOT NULL,
    `floorNumber` INTEGER NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rentId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `paymentDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Profile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `profileImage` VARCHAR(191) NULL,
    `bio` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Profile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Agreement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mallId` INTEGER NOT NULL,
    `agreementFile` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Rent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `roomId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Rent_roomId_key`(`roomId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Rooms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mallId` INTEGER NOT NULL,
    `floorId` INTEGER NOT NULL,
    `roomNumber` VARCHAR(191) NOT NULL,
    `size` DOUBLE NOT NULL,
    `price` DOUBLE NOT NULL,
    `status` ENUM('AVAILABLE', 'OCCUPIED', 'UNDER_MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
    `categoryId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Rooms_roomNumber_idx`(`roomNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `categoryName` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Mall` ADD CONSTRAINT `Mall_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_mallId_fkey` FOREIGN KEY (`mallId`) REFERENCES `Mall`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostImage` ADD CONSTRAINT `PostImage_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bid` ADD CONSTRAINT `Bid_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bid` ADD CONSTRAINT `Bid_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Deposit` ADD CONSTRAINT `Deposit_bidId_fkey` FOREIGN KEY (`bidId`) REFERENCES `Bid`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Deposit` ADD CONSTRAINT `Deposit_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Winner` ADD CONSTRAINT `Winner_bidId_fkey` FOREIGN KEY (`bidId`) REFERENCES `Bid`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Winner` ADD CONSTRAINT `Winner_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Floor` ADD CONSTRAINT `Floor_mallId_fkey` FOREIGN KEY (`mallId`) REFERENCES `Mall`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_rentId_fkey` FOREIGN KEY (`rentId`) REFERENCES `Rent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Profile` ADD CONSTRAINT `Profile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Agreement` ADD CONSTRAINT `Agreement_mallId_fkey` FOREIGN KEY (`mallId`) REFERENCES `Mall`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rent` ADD CONSTRAINT `Rent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rent` ADD CONSTRAINT `Rent_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rooms` ADD CONSTRAINT `Rooms_mallId_fkey` FOREIGN KEY (`mallId`) REFERENCES `Mall`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rooms` ADD CONSTRAINT `Rooms_floorId_fkey` FOREIGN KEY (`floorId`) REFERENCES `Floor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rooms` ADD CONSTRAINT `Rooms_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
