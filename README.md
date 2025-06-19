# 🌐 Internship Management Portal

A comprehensive web application for managing internship opportunities, connecting students with companies. Built with Node.js, Express, and MySQL.

## 🚀 Quick Start Guide

Choose your operating system below for detailed setup instructions:

- [🪟 Windows Setup](#-windows-setup)
- [🍎 macOS Setup](#-macos-setup) 
- [🐧 Ubuntu Linux Setup](#-ubuntu-linux-setup)

---

## 📋 System Requirements

| Component | Minimum Version | Recommended |
|-----------|----------------|-------------|
| Node.js | v14.0.0 | v18.0.0+ |
| MySQL | v8.0 | v8.0+ |
| RAM | 4GB | 8GB+ |
| Storage | 1GB free space | 2GB+ |

---

# 🪟 Windows Setup

## Step 1: Install Prerequisites

### Install Node.js
1. Visit [nodejs.org](https://nodejs.org)
2. Download the **LTS version** for Windows
3. Run the installer and follow the setup wizard
4. **Important**: Check "Add to PATH" during installation

### Install MySQL
1. Visit [MySQL Downloads](https://dev.mysql.com/downloads/installer/)
2. Download **MySQL Installer for Windows**
3. Run installer and choose **Developer Default**
4. Set a root password (remember this!)
5. Complete the installation

### Verify Installation
Open **Command Prompt** or **PowerShell** and run:
```cmd
node --version
npm --version
mysql --version
```

## Step 2: Clone and Setup Project

```cmd
# Clone the repository
git clone https://github.com/yourusername/internship-portal.git
cd internship-portal

# Install dependencies
npm install
```

## Step 3: Database Setup

```cmd
# Start MySQL service (if not running)
net start mysql80

# Connect to MySQL
mysql -u root -p

# In MySQL prompt, run:
SOURCE schema.sql;
exit
```

## Step 4: Configuration

Create `.env` file in project root:
```cmd
# Create .env file
echo. > .env
```

Edit `.env` with Notepad and add:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=internship_portal
DB_PORT=3306
```

## Step 5: Run the Application

```cmd
# Start the server
npm start

# Alternative
node server.js
```

Visit: `http://localhost:3000`

### Windows Troubleshooting

**Port 3000 already in use:**
```cmd
# Find and kill process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

**MySQL connection issues:**
```cmd
# Restart MySQL service
net stop mysql80
net start mysql80
```

---

# 🍎 macOS Setup

## Step 1: Install Prerequisites

### Install Homebrew (if not installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Install Node.js
```bash
# Using Homebrew
brew install node

# Or download from nodejs.org
```

### Install MySQL
```bash
# Using Homebrew
brew install mysql

# Start MySQL service
brew services start mysql

# Secure installation
mysql_secure_installation
```

### Verify Installation
```bash
node --version
npm --version
mysql --version
```

## Step 2: Clone and Setup Project

```bash
# Clone the repository
git clone https://github.com/yourusername/internship-portal.git
cd internship-portal

# Install dependencies
npm install
```

## Step 3: Database Setup

```bash
# Connect to MySQL
mysql -u root -p

# In MySQL prompt:
SOURCE schema.sql;
exit
```

## Step 4: Configuration

```bash
# Create .env file
touch .env

# Edit with your preferred editor
nano .env
# or
code .env
```

Add to `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=internship_portal
DB_PORT=3306
```

## Step 5: Run the Application

```bash
# Start the server
npm start

# Alternative
node server.js
```

Visit: `http://localhost:3000`

### macOS Troubleshooting

**Permission denied errors:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

**MySQL won't start:**
```bash
# Restart MySQL
brew services restart mysql

# Check MySQL status
brew services list | grep mysql
```

**Port 3000 in use:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
```

---

# 🐧 Ubuntu Linux Setup

## Step 1: Update System

```bash
# Update package list
sudo apt update && sudo apt upgrade -y
```

## Step 2: Install Prerequisites

### Install Node.js
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Install MySQL
```bash
# Install MySQL Server
sudo apt install mysql-server -y

# Secure installation
sudo mysql_secure_installation

# Start and enable MySQL
sudo systemctl start mysql
sudo systemctl enable mysql
```

### Install Git (if not installed)
```bash
sudo apt install git -y
```

## Step 3: Configure MySQL

```bash
# Connect to MySQL
sudo mysql -u root -p

# Create database user (optional but recommended)
CREATE USER 'intern_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON internship_portal.* TO 'intern_user'@'localhost';
FLUSH PRIVILEGES;
exit
```

## Step 4: Clone and Setup Project

```bash
# Clone the repository
git clone https://github.com/yourusername/internship-portal.git
cd internship-portal

# Install dependencies
npm install
```

## Step 5: Database Setup

```bash
# Import database schema
mysql -u root -p < schema.sql

# Or if using custom user:
mysql -u intern_user -p < schema.sql
```

## Step 6: Configuration

```bash
# Create .env file
nano .env
```

Add to `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=internship_portal
DB_PORT=3306

# Or if using custom user:
# DB_USER=intern_user
```

## Step 7: Run the Application

```bash
# Start the server
npm start

# Run in background (optional)
nohup node server.js > app.log 2>&1 &
```

Visit: `http://localhost:3000`

### Ubuntu Troubleshooting

**Permission denied on port 3000:**
```bash
# Use a different port (add to .env)
echo "PORT=8080" >> .env
```

**MySQL authentication issues:**
```bash
# Fix MySQL authentication
sudo mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
exit
```

**Node.js version issues:**
```bash
# Install specific Node.js version using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

---

## 🧪 Demo Credentials

Test the application with these demo accounts:

### Company Account:
- **Email**: `admin@techcorp.com`
- **Password**: `Demo123!`

### Student Account:
- **Email**: `john.doe@student.edu`
- **Password**: `Demo123!`

---

## 🎯 Features Overview

### 👨‍🎓 For Students:
- ✅ Browse internship opportunities
- ✅ Apply with resume upload
- ✅ Track application status
- ✅ Manage profile and skills

### 🏢 For Companies:
- ✅ Post internship listings
- ✅ Review student applications
- ✅ Dashboard with real-time analytics
- ✅ Manage company profile

---

## 📁 Project Structure

```
internship-portal/
├── server.js              # Main application server
├── package.json           # Project dependencies
├── schema.sql             # Database schema
├── .env                   # Environment variables (create this)
├── views/                 # HTML templates
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   └── ...
├── public/                # Static assets
│   ├── css/style.css
│   ├── js/form-validation.js
│   └── uploads/           # File uploads
└── README.md
```

---

## 🔧 Common Issues & Solutions

### Database Connection Failed
```bash
# Check MySQL is running
# Windows:
net start mysql80

# macOS:
brew services start mysql

# Ubuntu:
sudo systemctl start mysql
```

### Port Already in Use
Change the port in your `.env` file:
```env
PORT=8080
```

### Module Not Found Errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### File Upload Issues
Ensure uploads directory exists:
```bash
mkdir -p public/uploads
chmod 755 public/uploads  # Linux/macOS only
```

---

## 🚀 Development vs Production

### Development Mode
```bash
# Install nodemon for auto-restart
npm install -g nodemon

# Run in development mode
nodemon server.js
```

### Production Deployment
```bash
# Set environment
export NODE_ENV=production  # Linux/macOS
set NODE_ENV=production     # Windows

# Use PM2 for process management
npm install -g pm2
pm2 start server.js --name "internship-portal"
```

---

## 📞 Support

If you encounter issues:

1. **Check the troubleshooting section** for your OS above
2. **Verify all prerequisites** are installed correctly
3. **Check server logs** for error messages
4. **Ensure MySQL is running** and accessible
5. **Verify .env configuration** is correct

### Getting Help
- 📧 Email: your.email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/internship-portal/issues)
- 📚 Documentation: Check this README thoroughly

---

## 📄 License

This project is for educational purposes as part of CSIT128 - University of Wollongong in Dubai.

---

**🎓 Built for CSIT128 Assignment 2 - Spring 2025**
