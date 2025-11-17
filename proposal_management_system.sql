-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 12, 2025 at 06:01 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12
SET
  SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

START TRANSACTION;

SET
  time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */
;

/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */
;

/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */
;

/*!40101 SET NAMES utf8mb4 */
;

--
-- Database: `proposal_management_system`
--
-- --------------------------------------------------------
--
-- Table structure for table `activity_logs`
--
CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `action` text NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------
--
-- Table structure for table `criteria`
--
CREATE TABLE `criteria` (
  `id` int(11) NOT NULL,
  `rubric_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `weight` int(11) DEFAULT 1,
  `max_score` int(11) DEFAULT 5
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------
--
-- Table structure for table `departments`
--
CREATE TABLE `departments` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `code` varchar(20) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------
--
-- Table structure for table `endorsements`
--
CREATE TABLE `endorsements` (
  `id` int(11) NOT NULL,
  `proposal_id` int(11) NOT NULL,
  `rdec_id` int(11) NOT NULL,
  `decision` enum('Endorsed', 'Needs Revision', 'Rejected') NOT NULL,
  `conditions` text DEFAULT NULL,
  `decided_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------
--
-- Table structure for table `evaluations`
--
CREATE TABLE `evaluations` (
  `id` int(11) NOT NULL,
  `proposal_id` int(11) NOT NULL,
  `evaluator_id` int(11) NOT NULL,
  `rubric_id` int(11) NOT NULL,
  `total_score` int(11) DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `evaluated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------
--
-- Table structure for table `evaluation_scores`
--
CREATE TABLE `evaluation_scores` (
  `id` int(11) NOT NULL,
  `evaluation_id` int(11) NOT NULL,
  `criterion_id` int(11) NOT NULL,
  `score` int(11) NOT NULL,
  `feedback` text DEFAULT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------
--
-- Table structure for table `funded_projects`
--
CREATE TABLE `funded_projects` (
  `id` int(11) NOT NULL,
  `proposal_id` int(11) NOT NULL,
  `project_leader_id` int(11) NOT NULL,
  `funding_date` date DEFAULT NULL,
  `status` enum('Ongoing', 'Completed', 'On Hold') DEFAULT 'Ongoing',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------
--
-- Table structure for table `notifications`
--
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------
--
-- Table structure for table `project_reports`
--
CREATE TABLE `project_reports` (
  `id` int(11) NOT NULL,
  `funded_id` int(11) NOT NULL,
  `report_file_url` varchar(255) NOT NULL,
  `summary` text DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------
--
-- Table structure for table `proposals`
--
CREATE TABLE `proposals` (
  `id` int(11) NOT NULL,
  `proponent_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum(
    'Submitted',
    'Screening',
    'Needs Revision',
    'Under Evaluation',
    'Endorsed',
    'Rejected',
    'Funded',
    'Completed'
  ) DEFAULT 'Submitted',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------
--
-- Table structure for table `proposal_versions`
--
CREATE TABLE `proposal_versions` (
  `id` int(11) NOT NULL,
  `proposal_id` int(11) NOT NULL,
  `file_url` varchar(255) NOT NULL,
  `notes` text DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------
--
-- Table structure for table `rubrics`
--
CREATE TABLE `rubrics` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------
--
-- Table structure for table `users`
--
CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` text NOT NULL,
  `role` enum(
    'Proponent',
    'R&D',
    'Evaluator',
    'RDEC',
    'ProjectLeader',
    'Admin'
  ) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

--
-- Indexes for dumped tables
--
CREATE TABLE `sessions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `token` CHAR(64) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  `revoked_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_sessions_token` (`token`),
  KEY `idx_sessions_user_id` (`user_id`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

--
-- Indexes for table `activity_logs`
--
ALTER TABLE
  `activity_logs`
ADD
  PRIMARY KEY (`id`),
ADD
  KEY `fk_logs_user` (`user_id`);

--
-- Indexes for table `criteria`
--
ALTER TABLE
  `criteria`
ADD
  PRIMARY KEY (`id`),
ADD
  KEY `fk_criteria_rubric` (`rubric_id`);

--
-- Indexes for table `departments`
--
ALTER TABLE
  `departments`
ADD
  PRIMARY KEY (`id`),
ADD
  UNIQUE KEY `name` (`name`),
ADD
  UNIQUE KEY `code` (`code`);

--
-- Indexes for table `endorsements`
--
ALTER TABLE
  `endorsements`
ADD
  PRIMARY KEY (`id`),
ADD
  KEY `fk_endorsement_proposal` (`proposal_id`),
ADD
  KEY `fk_endorsement_user` (`rdec_id`);

--
-- Indexes for table `evaluations`
--
ALTER TABLE
  `evaluations`
ADD
  PRIMARY KEY (`id`),
ADD
  KEY `fk_eval_proposal` (`proposal_id`),
ADD
  KEY `fk_eval_user` (`evaluator_id`),
ADD
  KEY `fk_eval_rubric` (`rubric_id`);

--
-- Indexes for table `evaluation_scores`
--
ALTER TABLE
  `evaluation_scores`
ADD
  PRIMARY KEY (`id`),
ADD
  KEY `fk_scores_eval` (`evaluation_id`),
ADD
  KEY `fk_scores_criterion` (`criterion_id`);

--
-- Indexes for table `funded_projects`
--
ALTER TABLE
  `funded_projects`
ADD
  PRIMARY KEY (`id`),
ADD
  KEY `fk_funded_proposal` (`proposal_id`),
ADD
  KEY `fk_funded_user` (`project_leader_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE
  `notifications`
ADD
  PRIMARY KEY (`id`),
ADD
  KEY `fk_notifications_user` (`user_id`);

--
-- Indexes for table `project_reports`
--
ALTER TABLE
  `project_reports`
ADD
  PRIMARY KEY (`id`),
ADD
  KEY `fk_report_funded` (`funded_id`);

--
-- Indexes for table `proposals`
--
ALTER TABLE
  `proposals`
ADD
  PRIMARY KEY (`id`),
ADD
  KEY `fk_proposals_proponent` (`proponent_id`),
ADD
  KEY `fk_proposals_department` (`department_id`);

--
-- Indexes for table `proposal_versions`
--
ALTER TABLE
  `proposal_versions`
ADD
  PRIMARY KEY (`id`),
ADD
  KEY `fk_versions_proposal` (`proposal_id`);

--
-- Indexes for table `rubrics`
--
ALTER TABLE
  `rubrics`
ADD
  PRIMARY KEY (`id`),
ADD
  KEY `fk_rubrics_user` (`created_by`);

--
-- Indexes for table `users`
--
ALTER TABLE
  `users`
ADD
  PRIMARY KEY (`id`),
ADD
  UNIQUE KEY `idx_users_email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--
--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE
  `activity_logs`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `criteria`
--
ALTER TABLE
  `criteria`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE
  `departments`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `endorsements`
--
ALTER TABLE
  `endorsements`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `evaluations`
--
ALTER TABLE
  `evaluations`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `evaluation_scores`
--
ALTER TABLE
  `evaluation_scores`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `funded_projects`
--
ALTER TABLE
  `funded_projects`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE
  `notifications`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project_reports`
--
ALTER TABLE
  `project_reports`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `proposals`
--
ALTER TABLE
  `proposals`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `proposal_versions`
--
ALTER TABLE
  `proposal_versions`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rubrics`
--
ALTER TABLE
  `rubrics`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE
  `users`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--
--
-- Constraints for table `activity_logs`
--
ALTER TABLE
  `activity_logs`
ADD
  CONSTRAINT `fk_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `criteria`
--
ALTER TABLE
  `criteria`
ADD
  CONSTRAINT `fk_criteria_rubric` FOREIGN KEY (`rubric_id`) REFERENCES `rubrics` (`id`);

--
-- Constraints for table `endorsements`
--
ALTER TABLE
  `endorsements`
ADD
  CONSTRAINT `fk_endorsement_proposal` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`),
ADD
  CONSTRAINT `fk_endorsement_user` FOREIGN KEY (`rdec_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `evaluations`
--
ALTER TABLE
  `evaluations`
ADD
  CONSTRAINT `fk_eval_proposal` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`),
ADD
  CONSTRAINT `fk_eval_rubric` FOREIGN KEY (`rubric_id`) REFERENCES `rubrics` (`id`),
ADD
  CONSTRAINT `fk_eval_user` FOREIGN KEY (`evaluator_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `evaluation_scores`
--
ALTER TABLE
  `evaluation_scores`
ADD
  CONSTRAINT `fk_scores_criterion` FOREIGN KEY (`criterion_id`) REFERENCES `criteria` (`id`),
ADD
  CONSTRAINT `fk_scores_eval` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`);

--
-- Constraints for table `funded_projects`
--
ALTER TABLE
  `funded_projects`
ADD
  CONSTRAINT `fk_funded_proposal` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`),
ADD
  CONSTRAINT `fk_funded_user` FOREIGN KEY (`project_leader_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE
  `notifications`
ADD
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `project_reports`
--
ALTER TABLE
  `project_reports`
ADD
  CONSTRAINT `fk_report_funded` FOREIGN KEY (`funded_id`) REFERENCES `funded_projects` (`id`);

--
-- Constraints for table `proposals`
--
ALTER TABLE
  `proposals`
ADD
  CONSTRAINT `fk_proposals_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`),
ADD
  CONSTRAINT `fk_proposals_proponent` FOREIGN KEY (`proponent_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `proposal_versions`
--
ALTER TABLE
  `proposal_versions`
ADD
  CONSTRAINT `fk_versions_proposal` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`);

--
-- Constraints for table `rubrics`
--
ALTER TABLE
  `rubrics`
ADD
  CONSTRAINT `fk_rubrics_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */
;

/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */
;

/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */
;