CREATE DATABASE internship_portal;
USE internship_portal;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255),
  password VARCHAR(255),
  role ENUM('student', 'company')
);
