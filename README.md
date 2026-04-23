# 🚀 Personal Portfolio & Project Management Web App

![Preview](public/images/my-photo.png) 
*(Replace with actual screenshot link later)*

A modern, high-performance personal portfolio website integrated with a full-stack project management system. Built to showcase technical skills, work experience, and a dynamic collection of projects. Designed with a premium **Indigo & Emerald** color palette, advanced **Glassmorphism**, and seamless **Framer-style Page Transitions**.

## ✨ Key Features

### 🎨 Stunning UI/UX Design
- **Glassmorphism UI**: Beautiful frosted-glass effects on the sticky navbar, cards, and floating toast notifications.
- **Persistent Dark Mode**: Seamlessly switch between Light and Dark themes, with preferences saved locally.
- **Framer-Style Transitions**: Smooth page entry and exit animations built entirely with Vanilla CSS & JS—giving it a high-end SPA (Single Page Application) feel.
- **Interactive Elements**: Custom CSS scrollbars, smooth image zoom on hover, and continuous infinite marquee scrolling for the tech stack.
- **Floating Toast Notifications**: Modern, self-dismissing success and error alerts.
- **Skeleton Loading**: Visual placeholders for images while they load to prevent layout shifts.

### ⚙️ Robust Backend & Functionality
- **Full CRUD System**: Create, Read, Update, and Delete projects directly from the dashboard.
- **Dynamic Project Filtering**: Filter your projects instantly by technologies (e.g., React, Node.js) with smooth layout animations.
- **Image Uploads**: Secure and efficient local file storage for project thumbnails using `multer`.
- **Authentication**: Secure login system with hashed passwords and session management (Admin access restricted to owner).
- **PostgreSQL Database**: Relational database architecture mapping Projects, Users, and Technologies.

---

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3 (Vanilla + Custom Variables)
- Handlebars (`hbs`) Templating Engine
- Bootstrap 5 (Grid System & Utilities)
- Plus Jakarta Sans Typography

**Backend:**
- Node.js & Express.js
- Express-Session & Express-Flash (State & Messaging)
- Multer (File Uploads)
- Bcrypt (Password Hashing)

**Database:**
- PostgreSQL (`pg`)

---

## 📂 Database Schema

Before running the application, ensure your PostgreSQL database is set up with the following tables:

```sql
-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- 2. Projects Table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT NOT NULL,
    image VARCHAR(255),
    repository VARCHAR(255),
    live_demo VARCHAR(255)
);

-- 3. Technologies Table
CREATE TABLE technologies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- 4. Project-Technologies Relation (Many-to-Many)
CREATE TABLE project_technologies (
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    technology_id INT REFERENCES technologies(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, technology_id)
);
```

> **Note:** Make sure to populate the `technologies` table with values like 'Node Js', 'React Js', 'Next Js', 'TypeScript', etc., before creating projects.

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [PostgreSQL](https://www.postgresql.org/) (v13+)

### 2. Installation

Clone the repository and install the dependencies:
```bash
git clone https://github.com/nouvalrizqy05-ui/your-repo-name.git
cd your-repo-name
npm install
```

### 3. Database Configuration
Open `index.js` and update the `pool` configuration with your local PostgreSQL credentials:
```javascript
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'personal_web',
    password: 'YourPasswordHere',
    port: 5432,
});
```

### 4. Run the Application
Start the Express server:
```bash
npm start
# OR
node index.js
```
The application will be running at `http://localhost:3000`!

---

## 🔒 Authentication Note

For security reasons, this portfolio uses a **single-admin architecture**. Registration is intentionally disabled, and the login system is hardcoded for the owner's email (`personalweb@gmail.com`). If you wish to use this as a template, simply update the email and password hash in the database, or re-enable the registration route in `index.js`.

---

## 👨‍💻 Author

**Muhammad Nouval Ar-Rizqy**
- LinkedIn: [Nouval Ar-Rizqy](https://www.linkedin.com/in/muhammad-nouval-ar-rizqy-9ba777378)
- GitHub: [@nouvalrizqy05-ui](https://github.com/nouvalrizqy05-ui)
- Telegram: [@NouvalRizqy](https://t.me/+6287714498129)

*Designed with ❤️ in West Java, Indonesia.*
