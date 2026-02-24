-- Create Database
CREATE DATABASE IF NOT EXISTS eventrax_db;
USE eventrax_db;

-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: eventrax_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `accessories`
--

DROP TABLE IF EXISTS `accessories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `accessories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sub_event_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `unit_cost` decimal(10,2) DEFAULT 0.00,
  `total_cost` decimal(10,2) GENERATED ALWAYS AS (`quantity` * `unit_cost`) STORED,
  `status` enum('available','in-use','damaged') DEFAULT 'available',
  PRIMARY KEY (`id`),
  KEY `sub_event_id` (`sub_event_id`),
  CONSTRAINT `accessories_ibfk_1` FOREIGN KEY (`sub_event_id`) REFERENCES `sub_events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accessories`
--

/* No data for `accessories` */
UNLOCK TABLES;

--
-- Table structure for table `admin_logs`
--

DROP TABLE IF EXISTS `admin_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `target_type` varchar(50) NOT NULL,
  `target_id` int(11) NOT NULL,
  `details` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `admin_logs_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_logs`
--

/* No data for `admin_logs` */
UNLOCK TABLES;

--
-- Table structure for table `announcement_reads`
--

DROP TABLE IF EXISTS `announcement_reads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `announcement_reads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `announcement_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `read_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_announcement` (`user_id`,`announcement_id`),
  KEY `announcement_id` (`announcement_id`),
  CONSTRAINT `announcement_reads_ibfk_1` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `announcement_reads_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcement_reads`
--

/* No data for `announcement_reads` */
UNLOCK TABLES;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `content` text NOT NULL,
  `created_by` int(11) NOT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `sub_event_id` int(11) DEFAULT NULL,
  `target_audience` varchar(100) DEFAULT 'all',
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `fk_sub_event` (`sub_event_id`),
  CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sub_event` FOREIGN KEY (`sub_event_id`) REFERENCES `sub_events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

/* No data for `announcements` */
UNLOCK TABLES;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `is_announcement` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `sub_event_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `fk_chat_sub_event` (`sub_event_id`),
  CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_sub_event` FOREIGN KEY (`sub_event_id`) REFERENCES `sub_events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

/* No data for `chat_messages` */
UNLOCK TABLES;

--
-- Table structure for table `event_applications`
--

DROP TABLE IF EXISTS `event_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `event_applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_id` int(11) NOT NULL,
  `creator_id` int(11) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `message` text DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `creator_id` (`creator_id`),
  KEY `reviewed_by` (`reviewed_by`),
  CONSTRAINT `event_applications_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_applications_ibfk_2` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_applications_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_applications`
--

/* No data for `event_applications` */
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `poster` varchar(255) DEFAULT NULL,
  `banner` varchar(255) DEFAULT NULL,
  `venue` varchar(150) DEFAULT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `status` enum('upcoming','ongoing','completed') DEFAULT 'upcoming',
  `budget` decimal(10,2) DEFAULT 0.00,
  `creator_id` int(11) NOT NULL,
  `assigned_creator_id` int(11) DEFAULT NULL,
  `creator_instructions` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `creator_id` (`creator_id`),
  KEY `fk_events_assigned_creator` (`assigned_creator_id`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_events_assigned_creator` FOREIGN KEY (`assigned_creator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

/* No data for `events` */
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `expenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `quantity` int(11) DEFAULT 1,
  `description` text DEFAULT NULL,
  `sub_event_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `created_by` (`created_by`),
  KEY `fk_expense_sub_event` (`sub_event_id`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_expense_sub_event` FOREIGN KEY (`sub_event_id`) REFERENCES `sub_events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

/* No data for `expenses` */
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) DEFAULT 'info',
  `link` varchar(500) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (6,5,'New Task Assigned','You have been assigned a new task: Complete the plan','task_assigned','/student/tasks',0,'2026-02-05 21:27:47'),(15,16,'🔑 Team Lead Access Granted','You have been assigned as a Team Lead for \"opening ceremony\".\n\nLogin Credentials (valid for this event only):\nUsername: active_tl_SA42@eventrax.com\nPassword: z4enipq8!\n\nPlease save these details.','system','/team/sub-events/2',0,'2026-02-06 00:01:00'),(18,16,'🔑 Team Lead Access Granted','You have been assigned as a Team Lead for \"opening ceremony\".\n\nLogin Credentials (valid for this event only):\nUsername: active_tl_U38X@eventrax.com\nPassword: 1d40hoox!\n\nPlease save these details.','system','/team/sub-events/2',0,'2026-02-06 00:29:36');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prizes`
--

DROP TABLE IF EXISTS `prizes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `prizes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_id` int(11) NOT NULL,
  `position` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `value` decimal(10,2) DEFAULT 0.00,
  `winner_id` int(11) DEFAULT NULL,
  `winner_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `winner_section` varchar(100) DEFAULT NULL,
  `winner_usn` varchar(50) DEFAULT NULL,
  `sub_event_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `fk_prize_sub_event` (`sub_event_id`),
  CONSTRAINT `fk_prize_sub_event` FOREIGN KEY (`sub_event_id`) REFERENCES `sub_events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `prizes_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prizes`
--

/* No data for `prizes` */
UNLOCK TABLES;

--
-- Table structure for table `registrations`
--

DROP TABLE IF EXISTS `registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `registrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_id` int(11) NOT NULL,
  `sub_event_id` int(11) DEFAULT NULL,
  `student_id` int(11) NOT NULL,
  `status` enum('pending','confirmed','attended','cancelled') DEFAULT 'confirmed',
  `registered_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_registration` (`event_id`,`student_id`),
  KEY `student_id` (`student_id`),
  KEY `fk_reg_sub_event` (`sub_event_id`),
  CONSTRAINT `fk_reg_sub_event` FOREIGN KEY (`sub_event_id`) REFERENCES `sub_events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `registrations_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `registrations_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registrations`
--

/* No data for `registrations` */
UNLOCK TABLES;

--
-- Table structure for table `sub_event_chat`
--

DROP TABLE IF EXISTS `sub_event_chat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sub_event_chat` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sub_event_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_name` varchar(100) NOT NULL,
  `message` text NOT NULL,
  `is_anonymous` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `sub_event_id` (`sub_event_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `sub_event_chat_ibfk_1` FOREIGN KEY (`sub_event_id`) REFERENCES `sub_events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sub_event_chat_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sub_event_chat`
--

/* No data for `sub_event_chat` */
UNLOCK TABLES;

--
-- Table structure for table `sub_event_registrations`
--

DROP TABLE IF EXISTS `sub_event_registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sub_event_registrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `sub_event_id` int(11) NOT NULL,
  `status` enum('registered','cancelled','attended') DEFAULT 'registered',
  `registered_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_registration` (`student_id`,`sub_event_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_sub_event` (`sub_event_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `sub_event_registrations_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sub_event_registrations_ibfk_2` FOREIGN KEY (`sub_event_id`) REFERENCES `sub_events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sub_event_registrations`
--

/* No data for `sub_event_registrations` */
UNLOCK TABLES;

--
-- Table structure for table `sub_events`
--

DROP TABLE IF EXISTS `sub_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sub_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_id` int(11) NOT NULL,
  `creator_id` int(11) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `proposed_start` datetime DEFAULT NULL,
  `proposed_end` datetime DEFAULT NULL,
  `menu` text DEFAULT NULL,
  `finalized` tinyint(1) DEFAULT 0,
  `venue` varchar(150) DEFAULT NULL,
  `team_lead_id` int(11) DEFAULT NULL,
  `expected_time` int(11) DEFAULT NULL COMMENT 'in minutes',
  `actual_time` int(11) DEFAULT NULL COMMENT 'in minutes',
  `status` enum('upcoming','ongoing','completed') DEFAULT 'upcoming',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `unique_code` varchar(20) DEFAULT NULL,
  `team_lead_contact` varchar(20) DEFAULT NULL,
  `section` varchar(100) DEFAULT NULL,
  `budget` decimal(10,2) DEFAULT 0.00,
  `banner_url` varchar(500) DEFAULT NULL,
  `lead_instructions` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `team_lead_id` (`team_lead_id`),
  KEY `creator_id` (`creator_id`),
  CONSTRAINT `sub_events_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sub_events_ibfk_2` FOREIGN KEY (`team_lead_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sub_events_ibfk_3` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sub_events`
--

LOCK TABLES `sub_events` WRITE;
/*!40000 ALTER TABLE `sub_events` DISABLE KEYS */;
INSERT INTO `sub_events` VALUES (2,2,8,'opening ceremony','band party openinig','2026-01-15 19:00:00','2026-02-16 02:00:00',NULL,NULL,NULL,0,'audi',14,60,NULL,'upcoming','2026-01-31 12:51:29','SE-CD042D','9198080801','',1000.00,'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',NULL);
/*!40000 ALTER TABLE `sub_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_announcements`
--

DROP TABLE IF EXISTS `team_announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `team_announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sub_event_id` int(11) NOT NULL,
  `created_by` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sub_event_id` (`sub_event_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `team_announcements_ibfk_1` FOREIGN KEY (`sub_event_id`) REFERENCES `sub_events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `team_announcements_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_announcements`
--

LOCK TABLES `team_announcements` WRITE;
/*!40000 ALTER TABLE `team_announcements` DISABLE KEYS */;
/*!40000 ALTER TABLE `team_announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_lead_assignments`
--

DROP TABLE IF EXISTS `team_lead_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `team_lead_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `sub_event_id` int(11) NOT NULL,
  `assigned_by` int(11) NOT NULL,
  `role` enum('lead','co-lead') DEFAULT 'lead',
  `status` enum('active','inactive') DEFAULT 'active',
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_assignment` (`user_id`,`sub_event_id`),
  KEY `sub_event_id` (`sub_event_id`),
  KEY `assigned_by` (`assigned_by`),
  CONSTRAINT `team_lead_assignments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `team_lead_assignments_ibfk_2` FOREIGN KEY (`sub_event_id`) REFERENCES `sub_events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `team_lead_assignments_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_lead_assignments`
--

LOCK TABLES `team_lead_assignments` WRITE;
/*!40000 ALTER TABLE `team_lead_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `team_lead_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_lead_credentials`
--

DROP TABLE IF EXISTS `team_lead_credentials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `team_lead_credentials` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `sub_event_id` int(11) NOT NULL,
  `credential_id` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `credential_id` (`credential_id`),
  KEY `user_id` (`user_id`),
  KEY `sub_event_id` (`sub_event_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `team_lead_credentials_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `team_lead_credentials_ibfk_2` FOREIGN KEY (`sub_event_id`) REFERENCES `sub_events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `team_lead_credentials_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_lead_credentials`
--

LOCK TABLES `team_lead_credentials` WRITE;
/*!40000 ALTER TABLE `team_lead_credentials` DISABLE KEYS */;
/*!40000 ALTER TABLE `team_lead_credentials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_tasks`
--

DROP TABLE IF EXISTS `team_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `team_tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sub_event_id` int(11) DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `assigned_by` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `deadline` datetime DEFAULT NULL,
  `status` enum('pending','in_progress','completed','overdue') DEFAULT 'pending',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assigned_to` (`assigned_to`),
  KEY `assigned_by` (`assigned_by`),
  KEY `fk_team_tasks_sub_event` (`sub_event_id`),
  CONSTRAINT `fk_team_tasks_sub_event` FOREIGN KEY (`sub_event_id`) REFERENCES `sub_events` (`id`) ON DELETE SET NULL,
  CONSTRAINT `team_tasks_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `team_tasks_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_tasks`
--

/* No data for `team_tasks` */
UNLOCK TABLES;

--
-- Table structure for table `teamlead_applications`
--

DROP TABLE IF EXISTS `teamlead_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `teamlead_applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `sub_event_id` int(11) NOT NULL,
  `message` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `feedback` text DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_application` (`user_id`,`sub_event_id`),
  KEY `sub_event_id` (`sub_event_id`),
  KEY `reviewed_by` (`reviewed_by`),
  CONSTRAINT `teamlead_applications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `teamlead_applications_ibfk_2` FOREIGN KEY (`sub_event_id`) REFERENCES `sub_events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `teamlead_applications_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teamlead_applications`
--

/* No data for `teamlead_applications` */
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','creator','teamlead','student') NOT NULL,
  `status` enum('pending','active','suspended') DEFAULT 'active',
  `institution` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (8,'System Admin','admin@eventrax.com','$2y$10$Qvp7agwT.8X0UgzsbPxpeup3fouCrs0G.i1wfMBB/WS/rNsB0DtP2','admin','active','Eventrax HQ',NULL,'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin3','2026-01-30 11:19:35','2026-02-05 22:45:05',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `volunteer_applications`
--

DROP TABLE IF EXISTS `volunteer_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `volunteer_applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sub_event_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `message` text DEFAULT NULL,
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_application` (`sub_event_id`,`student_id`),
  KEY `student_id` (`student_id`),
  KEY `reviewed_by` (`reviewed_by`),
  CONSTRAINT `volunteer_applications_ibfk_1` FOREIGN KEY (`sub_event_id`) REFERENCES `sub_events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `volunteer_applications_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `volunteer_applications_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `volunteer_applications`
--

/* No data for `volunteer_applications` */
UNLOCK TABLES;

--
-- Table structure for table `volunteer_removals`
--

DROP TABLE IF EXISTS `volunteer_removals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `volunteer_removals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `volunteer_id` int(11) NOT NULL,
  `sub_event_id` int(11) NOT NULL,
  `removed_by` int(11) NOT NULL,
  `reason` text NOT NULL,
  `removed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `volunteer_id` (`volunteer_id`),
  KEY `sub_event_id` (`sub_event_id`),
  KEY `removed_by` (`removed_by`),
  CONSTRAINT `volunteer_removals_ibfk_1` FOREIGN KEY (`volunteer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `volunteer_removals_ibfk_2` FOREIGN KEY (`sub_event_id`) REFERENCES `sub_events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `volunteer_removals_ibfk_3` FOREIGN KEY (`removed_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `volunteer_removals`
--

LOCK TABLES `volunteer_removals` WRITE;
/*!40000 ALTER TABLE `volunteer_removals` DISABLE KEYS */;
/*!40000 ALTER TABLE `volunteer_removals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `volunteers`
--

DROP TABLE IF EXISTS `volunteers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `volunteers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sub_event_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` varchar(100) DEFAULT 'General',
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `sub_event_id` (`sub_event_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `volunteers_ibfk_1` FOREIGN KEY (`sub_event_id`) REFERENCES `sub_events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `volunteers_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `volunteers`
--

/* No data for `volunteers` */
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-23 21:00:04

