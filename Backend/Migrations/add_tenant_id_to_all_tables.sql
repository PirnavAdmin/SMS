-- SQL Migration Script: Ensure TenantId exists on all tables in MySQL
-- Run this on the MySQL server if tables were created before multi-tenancy.

DELIMITER $$

DROP PROCEDURE IF EXISTS AddTenantIdColumn$$

CREATE PROCEDURE AddTenantIdColumn()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE tbl_name VARCHAR(255);
    DECLARE cur CURSOR FOR 
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_TYPE = 'BASE TABLE'
          AND TABLE_NAME NOT LIKE '__efmigrations%';
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO tbl_name;
        IF done THEN
            LEAVE read_loop;
        END IF;

        IF NOT EXISTS (
            SELECT 1 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = tbl_name 
              AND COLUMN_NAME = 'TenantId'
        ) THEN
            SET @sql = CONCAT('ALTER TABLE `', tbl_name, '` ADD COLUMN `TenantId` VARCHAR(64) NULL DEFAULT \'tenant-default\';');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;

            SET @update_sql = CONCAT('UPDATE `', tbl_name, '` SET `TenantId` = \'tenant-default\' WHERE `TenantId` IS NULL;');
            PREPARE stmt_update FROM @update_sql;
            EXECUTE stmt_update;
            DEALLOCATE PREPARE stmt_update;
        END IF;
    END LOOP;

    CLOSE cur;
END$$

DELIMITER ;

CALL AddTenantIdColumn();
DROP PROCEDURE IF EXISTS AddTenantIdColumn;
