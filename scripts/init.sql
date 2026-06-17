-- ==========================================
-- ZQCMS 数据库初始化脚本 (v2 — 多站点支持)
-- 通过 bash scripts/setup-db.sh 自动执行
-- ==========================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `zqcms`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER IF NOT EXISTS 'zqcms'@'localhost' IDENTIFIED BY 'zqcms_pass_2024';
GRANT ALL PRIVILEGES ON `zqcms`.* TO 'zqcms'@'localhost';
FLUSH PRIVILEGES;

USE `zqcms`;

-- ==========================================
-- 1. 站点表（替代旧 SiteSettings）
-- ==========================================
CREATE TABLE IF NOT EXISTS `Site` (
  `id`              INT           NOT NULL AUTO_INCREMENT,
  `name`            VARCHAR(191)  NOT NULL,
  `slug`            VARCHAR(191)  NOT NULL,
  `domain`          VARCHAR(191)  NOT NULL,
  `isDefault`       TINYINT(1)    NOT NULL DEFAULT 0,
  `description`     TEXT          NULL,
  `logo`            VARCHAR(191)  NULL,
  `favicon`         VARCHAR(191)  NULL,
  `primaryColor`    VARCHAR(191)  NOT NULL DEFAULT '#3B82F6',
  `contactEmail`    VARCHAR(191)  NULL,
  `contactPhone`    VARCHAR(191)  NULL,
  `address`         VARCHAR(191)  NULL,
  `socialLinks`     JSON          NULL,
  `footerText`      TEXT          NULL,
  `copyright`       VARCHAR(191)  NULL,
  `gaId`            VARCHAR(191)  NULL,
  `isActive`        TINYINT(1)    NOT NULL DEFAULT 1,
  `createdAt`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Site_slug_key` (`slug`),
  UNIQUE INDEX `Site_domain_key` (`domain`),
  INDEX `Site_domain_idx` (`domain`),
  INDEX `Site_slug_idx` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 2. 多级导航目录（加 siteId）
-- ==========================================
CREATE TABLE IF NOT EXISTS `Category` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `siteId`      INT           NOT NULL,
  `name`        VARCHAR(191)  NOT NULL,
  `slug`        VARCHAR(191)  NOT NULL,
  `description` TEXT          NULL,
  `icon`        VARCHAR(191)  NULL,
  `sortOrder`   INT           NOT NULL DEFAULT 0,
  `isVisible`   TINYINT(1)    NOT NULL DEFAULT 1,
  `parentId`    INT           NULL,
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Category_siteId_slug_key` (`siteId`, `slug`),
  INDEX `Category_siteId_sortOrder_idx` (`siteId`, `sortOrder`),
  INDEX `Category_siteId_parentId_idx` (`siteId`, `parentId`),
  CONSTRAINT `Category_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 3. 用户（全局管理员）
-- ==========================================
CREATE TABLE IF NOT EXISTS `User` (
  `id`        VARCHAR(191)  NOT NULL,
  `email`     VARCHAR(191)  NOT NULL,
  `password`  VARCHAR(191)  NOT NULL,
  `name`      VARCHAR(191)  NULL,
  `role`      ENUM('ADMIN', 'EDITOR') NOT NULL DEFAULT 'EDITOR',
  `createdAt` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 4. 文章（加 siteId）
-- ==========================================
CREATE TABLE IF NOT EXISTS `Post` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `siteId`      INT           NOT NULL,
  `title`       VARCHAR(191)  NOT NULL,
  `slug`        VARCHAR(191)  NOT NULL,
  `content`     LONGTEXT      NOT NULL,
  `excerpt`     TEXT          NULL,
  `coverImage`  VARCHAR(191)  NULL,
  `status`      ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `sortOrder`   INT           NOT NULL DEFAULT 0,
  `categoryId`  INT           NOT NULL,
  `authorId`    VARCHAR(191)  NOT NULL,
  `seoTitle`    VARCHAR(191)  NULL,
  `seoDesc`     TEXT          NULL,
  `viewCount`   INT           NOT NULL DEFAULT 0,
  `isFeatured`  TINYINT(1)    NOT NULL DEFAULT 0,
  `publishedAt` DATETIME(3)   NULL,
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Post_siteId_categoryId_slug_key` (`siteId`, `categoryId`, `slug`),
  INDEX `Post_siteId_sortOrder_idx` (`siteId`, `sortOrder`),
  INDEX `Post_siteId_categoryId_status_sortOrder_idx` (`siteId`, `categoryId`, `status`, `sortOrder`),
  INDEX `Post_slug_status_idx` (`slug`, `status`),
  CONSTRAINT `Post_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Post_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Post_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 5. 标签（全局）
-- ==========================================
CREATE TABLE IF NOT EXISTS `Tag` (
  `id`   INT          NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Tag_name_key` (`name`),
  UNIQUE INDEX `Tag_slug_key` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 6. 文章-标签关联
-- ==========================================
CREATE TABLE IF NOT EXISTS `PostTag` (
  `postId` INT NOT NULL,
  `tagId`  INT NOT NULL,
  PRIMARY KEY (`postId`, `tagId`),
  CONSTRAINT `PostTag_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PostTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 7. 首页区块（加 siteId）
-- ==========================================
CREATE TABLE IF NOT EXISTS `PageBlock` (
  `id`        INT           NOT NULL AUTO_INCREMENT,
  `siteId`    INT           NOT NULL,
  `pageType`  VARCHAR(191)  NOT NULL,
  `blockType` ENUM('HERO','FEATURES','CTA','POST_LIST','CATEGORY_LIST','FAQ','MARKDOWN','TESTIMONIALS','CONTACT','DIVIDER') NOT NULL,
  `title`     VARCHAR(191)  NULL,
  `config`    JSON          NOT NULL DEFAULT ('{}'),
  `sortOrder` INT           NOT NULL DEFAULT 0,
  `isVisible` TINYINT(1)    NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `PageBlock_siteId_pageType_sortOrder_idx` (`siteId`, `pageType`, `sortOrder`),
  CONSTRAINT `PageBlock_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 8. 媒体文件（加 siteId）
-- ==========================================
CREATE TABLE IF NOT EXISTS `Media` (
  `id`        INT           NOT NULL AUTO_INCREMENT,
  `siteId`    INT           NOT NULL,
  `filename`  VARCHAR(191)  NOT NULL,
  `url`       VARCHAR(191)  NOT NULL,
  `mimeType`  VARCHAR(191)  NOT NULL,
  `size`      INT           NOT NULL,
  `altText`   VARCHAR(191)  NULL,
  `createdAt` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `Media_siteId_idx` (`siteId`),
  CONSTRAINT `Media_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 9. Prisma 迁移记录
-- ==========================================
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
  `id`                    VARCHAR(36)  NOT NULL,
  `checksum`              VARCHAR(64)  NOT NULL,
  `finished_at`           DATETIME(3)  NULL,
  `migration_name`        VARCHAR(255) NOT NULL,
  `logs`                  TEXT         NULL,
  `rolled_back_at`        DATETIME(3)  NULL,
  `started_at`            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count`   INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 10. 初始化默认站点
-- ==========================================
INSERT INTO `Site` (`name`, `slug`, `domain`, `isDefault`, `description`, `primaryColor`, `contactEmail`, `footerText`, `copyright`)
VALUES ('默认站点', 'default', 'localhost', 1, 'ZQCMS 默认站点', '#3B82F6', 'hello@zqcms.com', '用技术让内容管理更简单', '© 2026 ZQCMS. All rights reserved.')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ==========================================
-- 11. 初始化管理员
--    邮箱: admin@zqcms.com  密码: admin123
-- ==========================================
INSERT INTO `User` (`id`, `email`, `password`, `name`, `role`)
VALUES ('cm_default_admin', 'admin@zqcms.com',
        '$2a$10$GWn.BHHa/Zl7Uv.zOF8NsO9kgbP5CEqB4if2ix4NnZ.MRBjEfnv6m',
        '管理员', 'ADMIN')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

-- ==========================================
-- 完成
-- ==========================================
SELECT '✅ ZQCMS 数据库初始化完成 (多站点)' AS status;
SELECT '   管理员: admin@zqcms.com / admin123' AS info;
SELECT '   默认站点: localhost (slug=default)' AS site;
