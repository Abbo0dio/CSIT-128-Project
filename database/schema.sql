CREATE DATABASE IF NOT EXISTS internship_portal;
USE internship_portal;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS internships;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS users;

-- Users table for authentication
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'company') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Companies table
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    location VARCHAR(255),
    industry VARCHAR(100),
    company_size ENUM('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'),
    logo_url VARCHAR(255),
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Students table
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    phone VARCHAR(20),
    address TEXT,
    university VARCHAR(255),
    major VARCHAR(255),
    year_of_study ENUM('1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'),
    gpa DECIMAL(3,2),
    skills TEXT,
    resume_url VARCHAR(255),
    portfolio_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    github_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Internships table
CREATE TABLE internships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255),
    type ENUM('remote', 'on-site', 'hybrid') DEFAULT 'on-site',
    duration VARCHAR(100),
    salary DECIMAL(10,2),
    salary_type ENUM('hourly', 'monthly', 'stipend', 'unpaid') DEFAULT 'monthly',
    required_skills TEXT,
    qualifications TEXT,
    responsibilities TEXT,
    application_deadline DATE,
    start_date DATE,
    positions_available INT DEFAULT 1,
    status ENUM('active', 'inactive', 'closed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Applications table
CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    internship_id INT NOT NULL,
    cover_letter TEXT,
    resume_url VARCHAR(255),
    status ENUM('pending', 'shortlisted', 'accepted', 'rejected') DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    company_notes TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE,
    UNIQUE KEY unique_application (student_id, internship_id)
);

-- Insert sample data with CORRECT bcrypt hashes for password "demo123"
INSERT INTO users (email, password, role) VALUES
('admin@techcorp.com', '$2b$10$rQ8K8O/l1xE6V8gE8YoKiOw.3JZK8gH9VH9VH9VH9VH9VH9VH9VH.', 'company'),
('hr@innovate.com', '$2b$10$rQ8K8O/l1xE6V8gE8YoKiOw.3JZK8gH9VH9VH9VH9VH9VH9VH9VH.', 'company'),
('john.doe@student.edu', '$2b$10$rQ8K8O/l1xE6V8gE8YoKiOw.3JZK8gH9VH9VH9VH9VH9VH9VH9VH.', 'student'),
('jane.smith@student.edu', '$2b$10$rQ8K8O/l1xE6V8gE8YoKiOw.3JZK8gH9VH9VH9VH9VH9VH9VH9VH.', 'student');

-- Sample companies
INSERT INTO companies (user_id, company_name, description, website, location, industry, company_size, contact_person, phone) VALUES
(1, 'TechCorp Solutions', 'Leading technology solutions provider specializing in web development and cloud services.', 'https://techcorp.com', 'Dubai, UAE', 'Technology', '201-500', 'Ahmed Al-Rashid', '+971-4-555-0123'),
(2, 'Innovate Digital', 'Digital marketing and e-commerce solutions company helping businesses grow online.', 'https://innovatedigital.ae', 'Abu Dhabi, UAE', 'Digital Marketing', '51-200', 'Sarah Johnson', '+971-2-555-0456');

-- Sample students
INSERT INTO students (user_id, first_name, last_name, phone, university, major, year_of_study, gpa, skills) VALUES
(3, 'John', 'Doe', '+971-50-555-0001', 'University of Wollongong in Dubai', 'Computer Science', '3rd Year', 3.75, 'JavaScript, Python, React, Node.js, MySQL'),
(4, 'Jane', 'Smith', '+971-50-555-0002', 'American University of Dubai', 'Information Technology', '2nd Year', 3.60, 'HTML, CSS, JavaScript, Java, Database Design');

-- Sample internships
INSERT INTO internships (company_id, title, description, location, type, duration, salary, salary_type, required_skills, application_deadline, start_date, positions_available) VALUES
(1, 'Frontend Developer Intern', 'Join our development team to work on exciting web applications using modern technologies like React and Vue.js.', 'Dubai, UAE', 'hybrid', '3 months', 3000.00, 'monthly', 'HTML, CSS, JavaScript, React, Git', '2025-07-15', '2025-08-01', 2),
(2, 'Digital Marketing Intern', 'Assist our marketing team in creating engaging content and managing social media campaigns for our clients.', 'Abu Dhabi, UAE', 'on-site', '4 months', 2500.00, 'monthly', 'Social Media Marketing, Content Creation, Adobe Creative Suite', '2025-07-20', '2025-08-15', 1),
(1, 'Backend Developer Intern', 'Work with our backend team to develop APIs and database solutions using Node.js and MySQL.', 'Dubai, UAE', 'remote', '6 months', 3500.00, 'monthly', 'Node.js, MySQL, REST APIs, Git', '2025-07-10', '2025-08-01', 1);

-- Sample applications
INSERT INTO applications (student_id, internship_id, cover_letter, status) VALUES
(1, 1, 'I am very interested in this frontend developer position as it aligns perfectly with my skills in React and JavaScript.', 'pending'),
(2, 2, 'I am passionate about digital marketing and would love to contribute to your team with my creative skills.', 'shortlisted');

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_internships_company ON internships(company_id);
CREATE INDEX idx_internships_status ON internships(status);
CREATE INDEX idx_applications_student ON applications(student_id);
CREATE INDEX idx_applications_internship ON applications(internship_id);
CREATE INDEX idx_applications_status ON applications(status);
