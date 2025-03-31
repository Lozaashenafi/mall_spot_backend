/*
  Warnings:

  - You are about to drop the column `userId` on the `mall` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Agreement_mallId_fkey` ON `agreement`;

-- DropIndex
DROP INDEX `Deposit_bidId_fkey` ON `deposit`;

-- DropIndex
DROP INDEX `Deposit_userId_fkey` ON `deposit`;

-- DropIndex
DROP INDEX `Floor_mallId_fkey` ON `floor`;

-- DropIndex
DROP INDEX `Mall_userId_fkey` ON `mall`;

-- DropIndex
DROP INDEX `Notification_userId_fkey` ON `notification`;

-- DropIndex
DROP INDEX `Payment_rentId_fkey` ON `payment`;

-- DropIndex
DROP INDEX `Post_mallId_fkey` ON `post`;

-- DropIndex
DROP INDEX `Post_roomId_fkey` ON `post`;

-- DropIndex
DROP INDEX `PostImage_postId_fkey` ON `postimage`;

-- DropIndex
DROP INDEX `Rent_userId_fkey` ON `rent`;

-- DropIndex
DROP INDEX `Rooms_categoryId_fkey` ON `rooms`;

-- DropIndex
DROP INDEX `Rooms_floorId_fkey` ON `rooms`;

-- DropIndex
DROP INDEX `Rooms_mallId_fkey` ON `rooms`;

-- DropIndex
DROP INDEX `Winner_userId_fkey` ON `winner`;

-- AlterTable
ALTER TABLE `mall` DROP COLUMN `userId`;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `mallId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_mallId_fkey` FOREIGN KEY (`mallId`) REFERENCES `Mall`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
