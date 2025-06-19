require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'intern_user',
    password: process.env.DB_PASSWORD || 'intern_password',
    database: process.env.DB_NAME || 'internship_portal',
    port: process.env.DB_PORT || 3306
});

// Connect to database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(session({
    secret: 'internship_portal_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Debug middleware for login/signup requests
app.use((req, res, next) => {
    if (req.method === 'POST' && (req.path === '/login' || req.path === '/signup')) {
        console.log('=== REQUEST DEBUG ===');
        console.log('Path:', req.path);
        console.log('Method:', req.method);
        console.log('Content-Type:', req.headers['content-type']);
        console.log('Body:', req.body);
        console.log('Body keys:', Object.keys(req.body));
        console.log('Body values:', Object.values(req.body));
        console.log('Raw body length:', JSON.stringify(req.body).length);
        console.log('=====================');
    }
    next();
});

// Set view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and image files are allowed'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

const requireRole = (role) => {
    return (req, res, next) => {
        if (req.session.userId && req.session.role === role) {
            next();
        } else {
            res.status(403).send('Access denied');
        }
    };
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'signup.html'));
});

// Enhanced login route with better debugging
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    console.log('Login attempt received:');
    console.log('- Email received:', email ? 'YES' : 'NO', email ? `(${email})` : '');
    console.log('- Password received:', password ? 'YES' : 'NO', password ? '(****)' : '');
    console.log('- Request body:', req.body);

    if (!email || !password) {
        console.log('Missing fields - Email:', !!email, 'Password:', !!password);
        return res.status(400).send(`Missing required fields. Email: ${!!email}, Password: ${!!password}`);
    }

    if (email.trim() === '' || password.trim() === '') {
        console.log('Empty fields - Email:', email, 'Password length:', password.length);
        return res.status(400).send('Email and password cannot be empty');
    }

    try {
        const query = 'SELECT * FROM users WHERE email = ?';
        db.query(query, [email], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Server error');
            }

            if (results.length === 0) {
                console.log('User not found:', email);
                return res.status(401).send('Invalid credentials');
            }

            const user = results[0];
            let isValidPassword = false;

            try {
                if (user.password.startsWith('$2b$')) {
                    // Hashed password - use bcrypt
                    isValidPassword = await bcrypt.compare(password, user.password);
                } else {
                    // Plain text password (for demo accounts)
                    isValidPassword = (password === user.password);
                }
            } catch (compareError) {
                console.error('Password comparison error:', compareError);
                return res.status(500).send('Authentication error');
            }

            if (!isValidPassword) {
                console.log('Invalid password for:', email);
                return res.status(401).send('Invalid credentials');
            }

            req.session.userId = user.id;
            req.session.role = user.role;
            req.session.email = user.email;

            console.log('Login successful:', email, 'Role:', user.role);

            if (user.role === 'company') {
                res.redirect('/company/dashboard');
            } else {
                res.redirect('/student/dashboard');
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Server error');
    }
});

// Dashboard routes
app.get('/company/dashboard', (req, res) => {
    if (!req.session.userId || req.session.role !== 'company') {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'views', 'company_dashboard.html'));
});

app.get('/student/dashboard', (req, res) => {
    if (!req.session.userId || req.session.role !== 'student') {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'views', 'student_dashboard.html'));
});

// Enhanced signup route with better debugging
app.post('/signup', async (req, res) => {
    const { email, password, role } = req.body;

    console.log('Signup attempt received:');
    console.log('- Email received:', email ? 'YES' : 'NO', email ? `(${email})` : '');
    console.log('- Password received:', password ? 'YES' : 'NO', password ? '(****)' : '');
    console.log('- Role received:', role ? 'YES' : 'NO', role ? `(${role})` : '');
    console.log('- Request body:', req.body);

    // Validate input data
    if (!email || !password || !role) {
        console.log('Missing required fields - Email:', !!email, 'Password:', !!password, 'Role:', !!role);
        return res.status(400).send(`All fields are required. Email: ${!!email}, Password: ${!!password}, Role: ${!!role}`);
    }

    if (password.length < 3) {
        return res.status(400).send('Password must be at least 3 characters');
    }

    try {
        // Check if user already exists
        const checkQuery = 'SELECT id FROM users WHERE email = ?';
        db.query(checkQuery, [email], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Server error');
            }

            if (results.length > 0) {
                return res.status(400).send('User already exists');
            }

            try {
                // Hash password with proper error handling
                const hashedPassword = await bcrypt.hash(password, 10);

                // Insert user
                const insertQuery = 'INSERT INTO users (email, password, role) VALUES (?, ?, ?)';
                db.query(insertQuery, [email, hashedPassword, role], (err, result) => {
                    if (err) {
                        console.error('Database insert error:', err);
                        return res.status(500).send('Server error');
                    }

                    const userId = result.insertId;
                    req.session.userId = userId;
                    req.session.role = role;
                    req.session.email = email;

                    console.log('User created successfully:', email);

                    if (role === 'company') {
                        res.redirect('/company/dashboard');
                    } else {
                        res.redirect('/student/dashboard');
                    }
                });
            } catch (bcryptError) {
                console.error('Bcrypt error:', bcryptError);
                return res.status(500).send('Password hashing failed');
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).send('Server error');
    }
});

// Company routes
app.get('/company/dashboard', requireAuth, requireRole('company'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'company_dashboard.html'));
});

app.get('/company/profile-setup', requireAuth, requireRole('company'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'company_signup.html'));
});

app.post('/company/profile-setup', requireAuth, requireRole('company'), (req, res) => {
    const { name, description, website, location, industry, company_size, contact_person, phone } = req.body;

    const query = `INSERT INTO companies (user_id, company_name, description, website, location, industry, company_size, contact_person, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(query, [req.session.userId, name, description, website, location, industry, company_size, contact_person, phone], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Server error');
        }
        res.redirect('/company/dashboard');
    });
});

app.get('/manage_internships', requireAuth, requireRole('company'), (req, res) => {
    const query = `SELECT i.*, c.company_name FROM internships i
    JOIN companies c ON i.company_id = c.id
    WHERE c.user_id = ?`;

    db.query(query, [req.session.userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Server error');
        }

        let html = `
        <!DOCTYPE html>
        <html>
        <head>
        <title>Manage Internships</title>
        <link rel="stylesheet" href="/css/style.css">
        </head>
        <body>
        <div class="container">
        <h2>Manage Internships</h2>
        <a href="/internships/create" class="btn btn-primary">Create New Internship</a>
        <div class="internships-list">
        `;

        results.forEach(internship => {
            html += `
            <div class="internship-card">
            <h3>${internship.title}</h3>
            <p><strong>Location:</strong> ${internship.location}</p>
            <p><strong>Type:</strong> ${internship.type}</p>
            <p><strong>Salary:</strong> $${internship.salary} ${internship.salary_type}</p>
            <p><strong>Status:</strong> ${internship.status}</p>
            <div class="actions">
            <a href="/internships/edit/${internship.id}" class="btn btn-secondary">Edit</a>
            <a href="/internships/${internship.id}/applications" class="btn btn-info">View Applications</a>
            </div>
            </div>
            `;
        });

        html += `
        </div>
        <a href="/company/dashboard" class="btn btn-secondary">Back to Dashboard</a>
        </div>
        </body>
        </html>
        `;

        res.send(html);
    });
});

// Student routes
app.get('/student/dashboard', requireAuth, requireRole('student'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'student_dashboard.html'));
});

app.get('/student/profile-setup', requireAuth, requireRole('student'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'student_signup.html'));
});

app.post('/student/profile-setup', requireAuth, requireRole('student'), (req, res) => {
    const { name, phone, university, major, year_of_study, gpa, skills } = req.body;
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ') || '';

    const query = `INSERT INTO students (user_id, first_name, last_name, phone, university, major, year_of_study, gpa, skills)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(query, [req.session.userId, firstName, lastName, phone, university, major, year_of_study, gpa, skills], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Server error');
        }
        res.redirect('/student/dashboard');
    });
});

app.get('/browse_internships', requireAuth, (req, res) => {
    const query = `SELECT i.*, c.company_name FROM internships i
    JOIN companies c ON i.company_id = c.id
    WHERE i.status = 'active' AND i.application_deadline >= CURDATE()
    ORDER BY i.created_at DESC`;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Server error');
        }

        let html = `
        <!DOCTYPE html>
        <html>
        <head>
        <title>Browse Internships</title>
        <link rel="stylesheet" href="/css/style.css">
        </head>
        <body>
        <div class="container">
        <h2>Available Internships</h2>
        <div class="internships-grid">
        `;

        results.forEach(internship => {
            html += `
            <div class="internship-card">
            <h3>${internship.title}</h3>
            <p><strong>Company:</strong> ${internship.company_name}</p>
            <p><strong>Location:</strong> ${internship.location}</p>
            <p><strong>Type:</strong> ${internship.type}</p>
            <p><strong>Duration:</strong> ${internship.duration}</p>
            <p><strong>Salary:</strong> $${internship.salary} ${internship.salary_type}</p>
            <p><strong>Deadline:</strong> ${new Date(internship.application_deadline).toLocaleDateString()}</p>
            <p class="description">${internship.description.substring(0, 150)}...</p>
            <div class="actions">
            <a href="/internships/${internship.id}" class="btn btn-primary">View Details</a>
            ${req.session.role === 'student' ? `<a href="/internships/${internship.id}/apply" class="btn btn-success">Apply</a>` : ''}
            </div>
            </div>
            `;
        });

        html += `
        </div>
        <a href="/${req.session.role}/dashboard" class="btn btn-secondary">Back to Dashboard</a>
        </div>
        </body>
        </html>
        `;

        res.send(html);
    });
});

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destroy error:', err);
            return res.status(500).send('Server error');
        }
        res.redirect('/');
    });
});

// Internship creation route
app.get('/internships/create', requireAuth, requireRole('company'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'create_internship.html'));
});

app.post('/internships/create', requireAuth, requireRole('company'), (req, res) => {
    const {
        title, description, location, type, duration, salary, salary_type,
        required_skills, qualifications, responsibilities, application_deadline,
        start_date, positions_available, status
    } = req.body;

    // Get company ID
    const getCompanyQuery = 'SELECT id FROM companies WHERE user_id = ?';
    db.query(getCompanyQuery, [req.session.userId], (err, companyResults) => {
        if (err || companyResults.length === 0) {
            console.error('Company not found:', err);
            return res.status(500).send('Company not found');
        }

        const companyId = companyResults[0].id;

        const insertQuery = `
        INSERT INTO internships (
            company_id, title, description, location, type, duration,
            salary, salary_type, required_skills, qualifications,
            responsibilities, application_deadline, start_date,
            positions_available, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            companyId, title, description, location, type, duration,
            salary, salary_type, required_skills, qualifications,
            responsibilities, application_deadline, start_date,
            positions_available || 1, status || 'active'
        ];

        db.query(insertQuery, values, (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Error creating internship');
            }
            res.redirect('/manage_internships');
        });
    });
});

// Edit internship routes
app.get('/internships/edit/:id', requireAuth, requireRole('company'), (req, res) => {
    const internshipId = req.params.id;

    const query = `
    SELECT i.*, c.user_id
    FROM internships i
    JOIN companies c ON i.company_id = c.id
    WHERE i.id = ?
    `;

    db.query(query, [internshipId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).send('Internship not found');
        }

        const internship = results[0];

        // Check if this company owns the internship
        if (internship.user_id !== req.session.userId) {
            return res.status(403).send('Access denied');
        }

        // Return edit form with pre-filled data
        // This would be a separate edit form HTML file
        res.send('Edit form would go here with pre-filled data');
    });
});

// Delete internship route
app.post('/internships/delete/:id', requireAuth, requireRole('company'), (req, res) => {
    const internshipId = req.params.id;

    const query = `
    DELETE i FROM internships i
    JOIN companies c ON i.company_id = c.id
    WHERE i.id = ? AND c.user_id = ?
    `;

    db.query(query, [internshipId, req.session.userId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Error deleting internship');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Internship not found or access denied');
        }

        res.redirect('/manage_internships');
    });
});

// View internship details route
app.get('/internships/:id', (req, res) => {
    const internshipId = req.params.id;

    const query = `
    SELECT i.*, c.company_name, c.description as company_description,
    c.website, c.location as company_location, c.industry
    FROM internships i
    JOIN companies c ON i.company_id = c.id
    WHERE i.id = ? AND i.status = 'active'
    `;

    db.query(query, [internshipId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).send('Internship not found');
        }

        const internship = results[0];

        // Generate detailed view HTML
        const detailsHtml = `
        <!DOCTYPE html>
        <html>
        <head>
        <title>${internship.title} - ${internship.company_name}</title>
        <link rel="stylesheet" href="/css/style.css">
        </head>
        <body>
        <div class="container">
        <h2>${internship.title}</h2>
        <h3>${internship.company_name}</h3>

        <div style="margin: 2rem 0;">
        <p><strong>Location:</strong> ${internship.location}</p>
        <p><strong>Type:</strong> ${internship.type}</p>
        <p><strong>Duration:</strong> ${internship.duration}</p>
        <p><strong>Salary:</strong> ${internship.salary} ${internship.salary_type}</p>
        <p><strong>Application Deadline:</strong> ${new Date(internship.application_deadline).toLocaleDateString()}</p>
        </div>

        <div style="margin: 2rem 0;">
        <h4>Description</h4>
        <p>${internship.description}</p>
        </div>

        <div style="margin: 2rem 0;">
        <h4>Required Skills</h4>
        <p>${internship.required_skills}</p>
        </div>

        ${internship.qualifications ? `
            <div style="margin: 2rem 0;">
            <h4>Qualifications</h4>
            <p>${internship.qualifications}</p>
            </div>
            ` : ''}

            ${internship.responsibilities ? `
                <div style="margin: 2rem 0;">
                <h4>Responsibilities</h4>
                <p>${internship.responsibilities}</p>
                </div>
                ` : ''}

                <div style="margin: 2rem 0;">
                ${req.session.role === 'student' ?
                    `<a href="/internships/${internship.id}/apply" class="btn btn-primary">Apply for this Internship</a>` :
                    ''}
                    <a href="/browse_internships" class="btn btn-secondary">Back to Browse</a>
                    </div>
                    </div>
                    </body>
                    </html>
                    `;

                    res.send(detailsHtml);
    });
});

// Application routes
app.get('/internships/:id/apply', requireAuth, requireRole('student'), (req, res) => {
    const internshipId = req.params.id;

    // Check if student already applied
    const checkQuery = `
    SELECT a.id FROM applications a
    JOIN students s ON a.student_id = s.id
    WHERE s.user_id = ? AND a.internship_id = ?
    `;

    db.query(checkQuery, [req.session.userId, internshipId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Server error');
        }

        if (results.length > 0) {
            return res.send('You have already applied for this internship.');
        }

        // Show application form
        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
        <title>Apply for Internship</title>
        <link rel="stylesheet" href="/css/style.css">
        </head>
        <body>
        <div class="container">
        <h2>Apply for Internship</h2>
        <form method="POST" action="/internships/${internshipId}/apply" enctype="multipart/form-data">
        <div style="margin-bottom: 1rem;">
        <label for="coverLetter">Cover Letter:</label>
        <textarea name="cover_letter" id="coverLetter" rows="5" style="width: 100%; padding: 0.5rem;" required></textarea>
        </div>

        <div style="margin-bottom: 1rem;">
        <label for="resume">Upload Resume (PDF):</label>
        <input type="file" name="resume" id="resume" accept=".pdf" style="width: 100%; padding: 0.5rem;">
        </div>

        <div style="margin-bottom: 1rem;">
        <button type="submit" class="btn btn-primary">Submit Application</button>
        <a href="/internships/${internshipId}" class="btn btn-secondary">Cancel</a>
        </div>
        </form>
        </div>
        </body>
        </html>
        `);
    });
});

app.post('/internships/:id/apply', requireAuth, requireRole('student'), upload.single('resume'), (req, res) => {
    const internshipId = req.params.id;
    const { cover_letter } = req.body;
    const resumeUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Get student ID
    const getStudentQuery = 'SELECT id FROM students WHERE user_id = ?';
    db.query(getStudentQuery, [req.session.userId], (err, studentResults) => {
        if (err || studentResults.length === 0) {
            console.error('Student not found:', err);
            return res.status(500).send('Student profile not found');
        }

        const studentId = studentResults[0].id;

        const insertQuery = `
        INSERT INTO applications (student_id, internship_id, cover_letter, resume_url, status)
        VALUES (?, ?, ?, ?, 'pending')
        `;

        db.query(insertQuery, [studentId, internshipId, cover_letter, resumeUrl], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Error submitting application');
            }

            res.send(`
            <div style="text-align: center; padding: 2rem;">
            <h2>Application Submitted Successfully!</h2>
            <p>Your application has been sent to the company. You can track its status in your dashboard.</p>
            <a href="/student/dashboard" class="btn btn-primary">Go to Dashboard</a>
            </div>
            `);
        });
    });
});

// Student applications route
app.get('/student/applications', requireAuth, requireRole('student'), (req, res) => {
    const query = `
    SELECT a.*, i.title, i.location, i.type, i.salary, i.salary_type,
    c.company_name, a.applied_at, a.status
    FROM applications a
    JOIN students s ON a.student_id = s.id
    JOIN internships i ON a.internship_id = i.id
    JOIN companies c ON i.company_id = c.id
    WHERE s.user_id = ?
    ORDER BY a.applied_at DESC
    `;

    db.query(query, [req.session.userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Server error');
        }

        let html = `
        <!DOCTYPE html>
        <html>
        <head>
        <title>My Applications</title>
        <link rel="stylesheet" href="/css/style.css">
        </head>
        <body>
        <div class="container">
        <h2>My Applications</h2>
        `;

        if (results.length === 0) {
            html += '<p>You haven\'t applied for any internships yet.</p>';
        } else {
            results.forEach(app => {
                html += `
                <div class="internship-card" style="margin-bottom: 1rem;">
                <h3>${app.title}</h3>
                <p><strong>Company:</strong> ${app.company_name}</p>
                <p><strong>Location:</strong> ${app.location}</p>
                <p><strong>Applied:</strong> ${new Date(app.applied_at).toLocaleDateString()}</p>
                <p><strong>Status:</strong> <span class="status status-${app.status}">${app.status}</span></p>
                </div>
                `;
            });
        }

        html += `
        <a href="/student/dashboard" class="btn btn-secondary">Back to Dashboard</a>
        </div>
        </body>
        </html>
        `;

        res.send(html);
    });
});

// Company manage applications route
app.get('/manage_applications', requireAuth, requireRole('company'), (req, res) => {
    const query = `
    SELECT a.*, i.title as internship_title, s.first_name, s.last_name,
    s.university, s.major, s.year_of_study, u.email, a.applied_at
    FROM applications a
    JOIN internships i ON a.internship_id = i.id
    JOIN companies c ON i.company_id = c.id
    JOIN students s ON a.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE c.user_id = ?
    ORDER BY a.applied_at DESC
    `;

    db.query(query, [req.session.userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Server error');
        }

        let html = `
        <!DOCTYPE html>
        <html>
        <head>
        <title>Manage Applications</title>
        <link rel="stylesheet" href="/css/style.css">
        </head>
        <body>
        <div class="container">
        <h2>Manage Applications</h2>
        `;

        if (results.length === 0) {
            html += '<p>No applications received yet.</p>';
        } else {
            results.forEach(app => {
                html += `
                <div class="internship-card" style="margin-bottom: 1rem;">
                <h3>${app.first_name} ${app.last_name}</h3>
                <p><strong>Applied for:</strong> ${app.internship_title}</p>
                <p><strong>University:</strong> ${app.university}</p>
                <p><strong>Major:</strong> ${app.major} (${app.year_of_study})</p>
                <p><strong>Email:</strong> ${app.email}</p>
                <p><strong>Applied:</strong> ${new Date(app.applied_at).toLocaleDateString()}</p>
                <p><strong>Status:</strong> <span class="status status-${app.status}">${app.status}</span></p>

                <div style="margin-top: 1rem;">
                <h4>Cover Letter:</h4>
                <p style="background: #f5f5f5; padding: 1rem; border-radius: 4px;">${app.cover_letter}</p>
                </div>

                <div style="margin-top: 1rem;">
                ${app.resume_url ? `<a href="${app.resume_url}" target="_blank" class="btn btn-info">View Resume</a>` : ''}
                <form method="POST" action="/applications/${app.id}/update-status" style="display: inline;">
                <select name="status" onchange="this.form.submit()" style="padding: 0.5rem;">
                <option value="pending" ${app.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="shortlisted" ${app.status === 'shortlisted' ? 'selected' : ''}>Shortlisted</option>
                <option value="accepted" ${app.status === 'accepted' ? 'selected' : ''}>Accepted</option>
                <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                </select>
                </form>
                </div>
                </div>
                `;
            });
        }

        html += `
        <a href="/company/dashboard" class="btn btn-secondary">Back to Dashboard</a>
        </div>
        </body>
        </html>
        `;

        res.send(html);
    });
});

// Update application status
app.post('/applications/:id/update-status', requireAuth, requireRole('company'), (req, res) => {
    const applicationId = req.params.id;
    const { status } = req.body;

    const updateQuery = `
    UPDATE applications a
    JOIN internships i ON a.internship_id = i.id
    JOIN companies c ON i.company_id = c.id
    SET a.status = ?
    WHERE a.id = ? AND c.user_id = ?
    `;

    db.query(updateQuery, [status, applicationId, req.session.userId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Error updating status');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Application not found or access denied');
        }

        res.redirect('/manage_applications');
    });
});

// API Routes for AJAX requests
app.get('/api/internships', (req, res) => {
    const query = `SELECT i.*, c.company_name FROM internships i
    JOIN companies c ON i.company_id = c.id
    WHERE i.status = 'active'`;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Server error' });
        }
        res.json(results);
    });
});

// API route for dashboard stats
app.get('/api/student/stats', requireAuth, requireRole('student'), (req, res) => {
    const statsQuery = `
    SELECT
    COUNT(*) as total_applications,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted_count,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_count
        FROM applications a
        JOIN students s ON a.student_id = s.id
        WHERE s.user_id = ?
        `;

        db.query(statsQuery, [req.session.userId], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Server error' });
            }

            res.json(results[0] || {
                total_applications: 0,
                pending_count: 0,
                shortlisted_count: 0,
                accepted_count: 0
            });
        });
});

// API route for company stats
app.get('/api/company/stats', requireAuth, requireRole('company'), (req, res) => {
    const statsQuery = `
    SELECT
    COUNT(DISTINCT i.id) as active_internships,
        COUNT(a.id) as total_applications,
        SUM(CASE WHEN a.status = 'pending' THEN 1 ELSE 0 END) as pending_applications,
        SUM(CASE WHEN a.status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted_applications
        FROM companies c
        LEFT JOIN internships i ON c.id = i.company_id AND i.status = 'active'
        LEFT JOIN applications a ON i.id = a.internship_id
        WHERE c.user_id = ?
        `;

        db.query(statsQuery, [req.session.userId], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Server error' });
            }

            res.json(results[0] || {
                active_internships: 0,
                total_applications: 0,
                pending_applications: 0,
                shortlisted_applications: 0
            });
        });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).send('Something went wrong!');
});

// 404 handler
app.use((req, res) => {
    res.status(404).send('Page not found');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Visit http://localhost:3000 to access the application');
});
