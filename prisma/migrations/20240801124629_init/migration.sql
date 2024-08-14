-- AlterTable
ALTER TABLE `users` ADD COLUMN `resetPasswordExpires` DATETIME(3) NULL,
    ADD COLUMN `resetPasswordToken` VARCHAR(191) NULL;

-- RenameIndex
ALTER TABLE `users` RENAME INDEX `users_email_key` TO `Users_email_key`;
