-- Tabel Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk mempercepat pencarian user berdasarkan email
CREATE INDEX idx_users_email ON users(email);

-- Tabel Technologies
CREATE TABLE technologies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Tabel Projects (Relasi 1-to-Many dari Users)
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user
        FOREIGN KEY(user_id) 
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Index untuk filter project berdasarkan pemiliknya
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Tabel Pivot: Project_Technologies (Relasi Many-to-Many)
CREATE TABLE project_technologies (
    project_id INT NOT NULL,
    technology_id INT NOT NULL,
    PRIMARY KEY (project_id, technology_id),
    CONSTRAINT fk_project
        FOREIGN KEY(project_id) 
        REFERENCES projects(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_technology
        FOREIGN KEY(technology_id) 
        REFERENCES technologies(id)
        ON DELETE CASCADE
);

INSERT INTO users (name, email, password) VALUES 
('Muhammad Nouval Ar-Rizqy', 'bagobago955@gmail.com', 'Jakarta123'),
('Nadzifah', 'nadzfhrg@gmail.com', 'NARAGA22');

INSERT INTO technologies (name) VALUES 
('Node Js'), ('Next Js'), ('React Js'), ('TypeScript'), ('Express Js');

INSERT INTO projects (user_id, name, start_date, end_date, description, image) VALUES 
(1, 'EduAdmin Platform', '2026-04-01', '2026-06-01', 'AI-based administration tool to streamline workflows for teachers.', 'eduadmin.jpg'),
(1, 'Prodify Ecosystem', '2025-12-01', '2026-03-01', 'All-in-one student productivity ecosystem featuring an Eisenhower Matrix.', 'prodify.jpg');

INSERT INTO project_technologies (project_id, technology_id) VALUES 
(1, 1), (1, 3), (1, 4),
(2, 2), (2, 3), (2, 4);