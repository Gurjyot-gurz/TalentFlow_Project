CREATE DATABASE IF NOT EXISTS talentflow;

USE talentflow;

-- ==========================================
-- USERS
-- ==========================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    role ENUM('admin', 'recruiter', 'interviewer')
        DEFAULT 'recruiter',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- ==========================================
-- CANDIDATES
-- ==========================================

CREATE TABLE IF NOT EXISTS candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(200) NOT NULL,

    email VARCHAR(255) NOT NULL,

    role VARCHAR(150) NOT NULL,

    experience VARCHAR(100),

    score INT DEFAULT 0,

    stage ENUM(
        'Applied',
        'Screening',
        'Shortlisted',
        'Interview',
        'Offer',
        'Hired',
        'Rejected'
    ) DEFAULT 'Applied',

    applied_date DATE,

    source VARCHAR(100),

    resume_s3_key VARCHAR(500),
    resume_processing_status ENUM(
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
) DEFAULT 'PENDING',

    created_by INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_candidate_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ==========================================
-- JOBS
-- ==========================================

CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(200) NOT NULL,

    department VARCHAR(150) NOT NULL,

    location VARCHAR(200),

    type ENUM(
        'Full-time',
        'Part-time',
        'Contract',
        'Internship'
    ) DEFAULT 'Full-time',

    status ENUM(
        'Open',
        'Closed'
    ) DEFAULT 'Open',

    created_by INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_job_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ==========================================
-- APPLICATIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,

    candidate_id INT NOT NULL,

    job_id INT NOT NULL,

    status ENUM(
        'Applied',
        'Screening',
        'Shortlisted',
        'Interview',
        'Offer',
        'Hired',
        'Rejected'
    ) DEFAULT 'Applied',

    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_application_candidate
        FOREIGN KEY (candidate_id)
        REFERENCES candidates(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_application_job
        FOREIGN KEY (job_id)
        REFERENCES jobs(id)
        ON DELETE CASCADE,

    UNIQUE(candidate_id, job_id)
);


-- ==========================================
-- INTERVIEWS
-- ==========================================

CREATE TABLE IF NOT EXISTS interviews (
    id INT AUTO_INCREMENT PRIMARY KEY,

    candidate_id INT NOT NULL,

    application_id INT,

    interviewer_id INT,

    interview_date DATE NOT NULL,

    interview_time VARCHAR(50) NOT NULL,

    status ENUM(
        'Scheduled',
        'Pending',
        'Completed',
        'Cancelled'
    ) DEFAULT 'Scheduled',

    meeting_link VARCHAR(500),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_interview_candidate
        FOREIGN KEY (candidate_id)
        REFERENCES candidates(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_interview_application
        FOREIGN KEY (application_id)
        REFERENCES applications(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_interview_interviewer
        FOREIGN KEY (interviewer_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);