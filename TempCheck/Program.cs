using System;
using System.Data;
using MySqlConnector;

class Program
{
    static void Main()
    {
        string connStr = "Server=127.0.0.1;Port=3306;Database=sms_new;User=root;Password=root;";
        try
        {
            using var conn = new MySqlConnection(connStr);
            conn.Open();
            Console.WriteLine("Connected to database successfully.");

            // 1. Drop the table if it exists (but disable FK checks)
            using (var cmd = new MySqlCommand("SET FOREIGN_KEY_CHECKS=0; DROP TABLE IF EXISTS academic_years; SET FOREIGN_KEY_CHECKS=1;", conn))
            {
                cmd.ExecuteNonQuery();
                Console.WriteLine("Dropped academic_years if existed.");
            }

            try {
                using (var cmd = new MySqlCommand("ALTER TABLE students DROP FOREIGN KEY FK_students_academic_years_academic_year_id;", conn)) {
                    cmd.ExecuteNonQuery();
                    Console.WriteLine("Dropped FK from students.");
                }
            } catch(Exception) {
                // Ignore if it doesn't exist or is named differently
            }
            try {
                using (var cmd = new MySqlCommand("ALTER TABLE students DROP FOREIGN KEY FK_students_academic_years_AcademicYearId;", conn)) {
                    cmd.ExecuteNonQuery();
                    Console.WriteLine("Dropped FK_students_academic_years_AcademicYearId from students.");
                }
            } catch(Exception) { }

            // 2. Create the table
            string createTableSql = @"
                SET FOREIGN_KEY_CHECKS=0;
                CREATE TABLE IF NOT EXISTS `academic_years` (
                    `academic_year_id` int NOT NULL AUTO_INCREMENT,
                    `academic_year_name` varchar(20) NOT NULL,
                    `start_date` date NOT NULL,
                    `end_date` date NOT NULL,
                    `is_current` tinyint(1) NOT NULL,
                    `is_active` tinyint(1) NOT NULL,
                    `is_deleted` tinyint(1) NOT NULL,
                    `created_at` datetime(6) NOT NULL,
                    `updated_at` datetime(6) NULL,
                    PRIMARY KEY (`academic_year_id`)
                ) CHARACTER SET=utf8mb4;
                SET FOREIGN_KEY_CHECKS=1;";
            
            using (var cmd = new MySqlCommand(createTableSql, conn))
            {
                cmd.ExecuteNonQuery();
                Console.WriteLine("Created academic_years table.");
            }

            try {
                using (var cmd = new MySqlCommand("ALTER TABLE students ADD CONSTRAINT FK_students_academic_years_academic_year_id FOREIGN KEY (AcademicYearId) REFERENCES academic_years(academic_year_id);", conn)) {
                    cmd.ExecuteNonQuery();
                    Console.WriteLine("Re-added FK to students.");
                }
            } catch(Exception ex) {
                Console.WriteLine("Could not re-add FK: " + ex.Message);
            }

            // 3. Verify
            using (var cmd = new MySqlCommand("SHOW TABLES LIKE 'academic_years';", conn))
            {
                using var reader = cmd.ExecuteReader();
                if (reader.HasRows)
                {
                    Console.WriteLine("SUCCESS: academic_years is now in the database.");
                }
                else
                {
                    Console.WriteLine("ERROR: academic_years STILL missing.");
                }
            }
        }
        catch(Exception ex)
        {
            Console.WriteLine("Exception: " + ex.ToString());
        }
    }
}
