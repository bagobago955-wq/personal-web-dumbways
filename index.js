const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const session = require('express-session');
const flash = require('express-flash');
const bcrypt = require('bcrypt');
const multer = require('multer'); // Import Multer
const fs = require('fs'); // Import File System

const app = express();
const port = 3000;

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'rahasia-negara-sangat-rahasia',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 2 } 
}));
app.use(flash());

app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

// Setup Database Connection
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'personal_web',
    password: 'Jakarta123',
    port: 5432,
});

// ==========================================
// KONFIGURASI MULTER (UPLOAD IMAGE)
// ==========================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images') // Folder penyimpanan
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Nama file unik
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Validasi Ukuran: Maksimal 2MB
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        // Validasi Tipe File
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
            return cb(new Error('Hanya file gambar (JPG, JPEG, PNG) yang diizinkan!'));
        }
        cb(null, true);
    }
});

// Wrapper Middleware untuk menangani Error Multer dengan Flash Message
const uploadMiddleware = (req, res, next) => {
    const uploadSingle = upload.single('uploadImage');
    
    uploadSingle(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            req.flash('error', 'Ukuran file terlalu besar! Maksimal 2MB.');
            return res.redirect(req.originalUrl); 
        } else if (err) {
            req.flash('error', err.message);
            return res.redirect(req.originalUrl); 
        }
        next();
    });
};

function getDuration(start, end) {
    let startDate = new Date(start);
    let endDate = new Date(end);
    let diffDays = Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24));
    let diffMonths = Math.floor(diffDays / 30);
    return diffMonths > 0 ? `${diffMonths} Bulan` : `${diffDays} Hari`;
}

function requireAuth(req, res, next) {
    if (!req.session.user) {
        req.flash('error', 'Silakan login terlebih dahulu untuk mengakses fitur ini.');
        return res.redirect('/login');
    }
    next();
}

// ==========================================
// AUTHENTICATION ROUTES (Single Admin Only)
// ==========================================
// Disable registration
app.get('/register', (req, res) => {
    req.flash('error', 'Registrasi tidak tersedia. Hanya admin yang dapat login.');
    res.redirect('/login');
});
app.post('/register', (req, res) => {
    req.flash('error', 'Registrasi tidak tersedia.');
    res.redirect('/login');
});

app.get('/login', (req, res) => res.render('login'));
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Cek apakah email ada di database
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            req.flash('error', 'Email atau password salah!');
            return res.redirect('/login');
        }

        const user = result.rows[0];

        // Verifikasi password dengan bcrypt
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            req.flash('error', 'Email atau password salah!');
            return res.redirect('/login');
        }

        // Login berhasil
        req.session.user = { id: user.id, name: user.name, email: user.email };
        req.flash('success', `Selamat datang, ${user.name}!`);
        res.redirect('/');
    } catch (error) { 
        console.error(error); 
        req.flash('error', 'Error server saat login.'); 
        res.redirect('/login'); 
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => { res.redirect('/'); });
});

// ==========================================
// PROJECT ROUTES (CRUD dengan Multer)
// ==========================================
app.get('/', async (req, res) => {
    try {
        const query = `
            SELECT p.*, u.name as author, array_agg(t.name) as technologies
            FROM projects p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN project_technologies pt ON p.id = pt.project_id
            LEFT JOIN technologies t ON pt.technology_id = t.id
            GROUP BY p.id, u.name ORDER BY p.id DESC LIMIT 3;
        `;
        const result = await pool.query(query);
        const projects = result.rows.map(project => ({
            ...project,
            duration: getDuration(project.start_date, project.end_date),
            technologies: project.technologies[0] === null ? [] : project.technologies,
            isOwner: req.session.user && req.session.user.id === project.user_id
        }));
        res.render('index', { projects });
    } catch (error) { console.error(error); res.render('index', { projects: [] }); }
});
app.get('/contact', (req, res) => res.render('contact'));

// READ: List Project
app.get('/my-project', async (req, res) => {
    try {
        const query = `
            SELECT p.*, u.name as author, array_agg(t.name) as technologies
            FROM projects p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN project_technologies pt ON p.id = pt.project_id
            LEFT JOIN technologies t ON pt.technology_id = t.id
            GROUP BY p.id, u.name ORDER BY p.id DESC;
        `;
        const result = await pool.query(query);
        const projects = result.rows.map(project => ({
            ...project,
            duration: getDuration(project.start_date, project.end_date),
            technologies: project.technologies[0] === null ? [] : project.technologies,
            isOwner: req.session.user && req.session.user.id === project.user_id
        }));
        res.render('my-project', { projects });
    } catch (error) { res.status(500).send("Error"); }
});

// CREATE: Simpan Project + Foto
app.post('/my-project', requireAuth, uploadMiddleware, async (req, res) => {
    try {
        const { projectName, startDate, endDate, description, technologies, repository, live_demo } = req.body;
        if (!projectName || !startDate || !endDate || !description) throw new Error("Input tidak lengkap");
        
        let techArray = technologies ? (Array.isArray(technologies) ? technologies : [technologies]) : [];
        const userId = req.session.user.id; 
        
        // Cek jika ada file yang diupload, simpan path-nya. Jika tidak ada, gunakan default.
        const image = req.file ? `/images/${req.file.filename}` : "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80";

        const projectResult = await pool.query(
            `INSERT INTO projects (user_id, name, start_date, end_date, description, image, repository, live_demo) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [userId, projectName, startDate, endDate, description, image, repository || null, live_demo || null]
        );
        const newProjectId = projectResult.rows[0].id;

        if (techArray.length > 0) {
            const techIdsQuery = await pool.query('SELECT id FROM technologies WHERE name = ANY($1::varchar[])', [techArray]);
            for (let tech of techIdsQuery.rows) {
                await pool.query('INSERT INTO project_technologies (project_id, technology_id) VALUES ($1, $2)', [newProjectId, tech.id]);
            }
        }
        req.flash('success', 'Project berhasil ditambahkan!');
        res.redirect('/my-project');
    } catch (error) { console.error(error); req.flash('error', 'Gagal menambahkan project!'); res.redirect('/my-project'); }
});

// READ DETAIL
app.get('/project/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT p.*, u.name as author, array_agg(t.name) as technologies
            FROM projects p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN project_technologies pt ON p.id = pt.project_id
            LEFT JOIN technologies t ON pt.technology_id = t.id
            WHERE p.id = $1 GROUP BY p.id, u.name;
        `, [id]);
        if (result.rows.length === 0) return res.status(404).send("Project tidak ditemukan");

        const project = result.rows[0];
        project.duration = getDuration(project.start_date, project.end_date);
        project.technologies = project.technologies[0] === null ? [] : project.technologies;
        res.render('project-detail', { project });
    } catch (error) { res.status(500).send("Error"); }
});

// DELETE: Hapus Data + File Fisik Image
app.post('/delete-project/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const checkOwner = await pool.query('SELECT user_id, image FROM projects WHERE id = $1', [id]);
        
        if(checkOwner.rows[0].user_id !== req.session.user.id) {
            req.flash('error', 'Anda tidak memiliki hak!'); return res.redirect('/my-project');
        }

        // Hapus file fisik gambar jika gambar tersebut berada di folder lokal (/images/...)
        const imagePath = checkOwner.rows[0].image;
        if (imagePath && imagePath.startsWith('/images/')) {
            const absolutePath = path.join(__dirname, 'public', imagePath);
            fs.unlink(absolutePath, (err) => {
                if (err) console.error("Gagal menghapus file lama:", err);
            });
        }

        await pool.query('DELETE FROM projects WHERE id = $1', [id]);
        req.flash('success', 'Project beserta gambarnya berhasil dihapus!');
        res.redirect('/my-project');
    } catch (error) { console.error(error); res.redirect('/my-project'); }
});

// UPDATE VIEW
app.get('/edit-project/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT p.*, array_agg(t.name) as technologies
            FROM projects p LEFT JOIN project_technologies pt ON p.id = pt.project_id LEFT JOIN technologies t ON pt.technology_id = t.id
            WHERE p.id = $1 GROUP BY p.id
        `, [id]);
        if(result.rows.length === 0) return res.status(404).send("Data tidak ditemukan");
        const project = result.rows[0];

        if(project.user_id !== req.session.user.id) { req.flash('error', 'Akses ditolak!'); return res.redirect('/my-project'); }
        
        project.technologies = project.technologies[0] === null ? [] : project.technologies;
        project.start_date_formatted = project.start_date.toISOString().split('T')[0];
        project.end_date_formatted = project.end_date.toISOString().split('T')[0];
        res.render('edit-project', { project });
    } catch (error) { res.redirect('/my-project'); }
});

// UPDATE PROSES: Update Data + Timpa File Image
app.post('/edit-project/:id', requireAuth, uploadMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { projectName, startDate, endDate, description, technologies, repository, live_demo } = req.body;
        
        const checkOwner = await pool.query('SELECT user_id, image FROM projects WHERE id = $1', [id]);
        if(checkOwner.rows[0].user_id !== req.session.user.id) { req.flash('error', 'Akses ditolak!'); return res.redirect('/my-project'); }

        let queryParams = [projectName, startDate, endDate, description, repository || null, live_demo || null, id];
        let updateQuery = 'UPDATE projects SET name = $1, start_date = $2, end_date = $3, description = $4, repository = $5, live_demo = $6 WHERE id = $7';

        // Jika user upload gambar baru
        if (req.file) {
            const newImage = `/images/${req.file.filename}`;
            updateQuery = 'UPDATE projects SET name = $1, start_date = $2, end_date = $3, description = $4, repository = $5, live_demo = $6, image = $8 WHERE id = $7';
            queryParams.push(newImage);

            // Hapus gambar lama dari server untuk menghemat memori
            const oldImage = checkOwner.rows[0].image;
            if (oldImage && oldImage.startsWith('/images/')) {
                fs.unlink(path.join(__dirname, 'public', oldImage), (err) => {
                    if (err) console.error("Gagal menghapus file lama:", err);
                });
            }
        }

        await pool.query(updateQuery, queryParams);
        await pool.query('DELETE FROM project_technologies WHERE project_id = $1', [id]);
        
        let techArray = technologies ? (Array.isArray(technologies) ? technologies : [technologies]) : [];
        if (techArray.length > 0) {
            const techIdsQuery = await pool.query('SELECT id FROM technologies WHERE name = ANY($1::varchar[])', [techArray]);
            for (let tech of techIdsQuery.rows) {
                await pool.query('INSERT INTO project_technologies (project_id, technology_id) VALUES ($1, $2)', [id, tech.id]);
            }
        }
        req.flash('success', 'Project berhasil diupdate!');
        res.redirect('/my-project');
    } catch (error) { res.redirect('/my-project'); }
});

app.listen(port, () => console.log(`Server berjalan di http://localhost:${port}`));