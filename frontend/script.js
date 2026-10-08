'use strict';

/* =========================================================
   TalentFlow AI - Frontend Controller
   Real backend integration for the existing TalentFlow UI.
   Backend is not modified by this file.
========================================================= */

const API_BASE_URL = 'http://talentflow-alb-1048711999.us-east-1.elb.amazonaws.com';
const RESUME_API_URL = 'https://9my383mu6d.execute-api.us-east-1.amazonaws.com/resume/process';

const SESSION_KEY = 'talentflow_ai_session';
const TOKEN_KEY = 'talentflow_ai_token';
const SETTINGS_KEY = 'talentflow_ai_settings_v2';
const THEME_KEY = 'talentflow_theme';

const STAGES = ['Applied', 'Screening', 'Shortlisted', 'Interview', 'Offer', 'Hired', 'Rejected'];
const INTERVIEW_STATUSES = ['Scheduled', 'Pending', 'Completed', 'Cancelled'];

const fallbackData = {
    candidates: [],
    jobs: [],
    interviews: [],
    applications: [],
    settings: { ai: true, notifications: true, compact: false }
};

let data = {
    candidates: [],
    jobs: [],
    interviews: [],
    applications: [],
    settings: loadSettings()
};

let currentUser = loadSession();
let currentPage = 'dashboard';
let initialized = false;

function $(id) {
    return document.getElementById(id);
}

function on(id, event, handler) {
    const element = $(id);
    if (element) element.addEventListener(event, handler);
    return element;
}

function esc(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[char]));
}

function initials(name) {
    return String(name || 'Admin')
        .trim()
        .split(/\s+/)
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function fmtDate(value) {
    if (!value) return '—';

    const raw = String(value).slice(0, 10);
    const date = new Date(`${raw}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function fmtDateTime(date, time) {
    return `${fmtDate(date)}${time ? ` · ${esc(time)}` : ''}`;
}

function normalizeCandidate(candidate) {
    return {
        id: Number(candidate.id),
        name: candidate.name || 'Unnamed Candidate',
        email: candidate.email || '',
        role: candidate.role || 'Candidate',
        experience: candidate.experience || '—',
        score: Number(candidate.score || 0),
        stage: candidate.stage || 'Applied',
        applied: candidate.applied || candidate.applied_date || candidate.created_at || '',
        source: candidate.source || 'Website',
        resume_s3_key: candidate.resume_s3_key || '',
        resume_processing_status: candidate.resume_processing_status || ''
    };
}

function normalizeJob(job) {
    return {
        id: Number(job.id),
        title: job.title || 'Untitled Job',
        department: job.department || 'General',
        location: job.location || 'Not specified',
        type: job.type || 'Full-time',
        status: job.status || 'Open',
        applicants: Number(job.applicants || 0)
    };
}

function normalizeInterview(interview) {
    return {
        id: Number(interview.id),
        candidateId: Number(
            interview.candidate_id ||
            interview.candidateId ||
            0
        ),
        candidate:
            interview.candidate_name ||
            interview.candidate ||
            'Candidate',
        role:
            interview.candidate_role ||
            interview.role ||
            'Candidate',
        applicationId:
            interview.application_id ||
            interview.applicationId ||
            null,
        interviewerId:
            interview.interviewer_id ||
            interview.interviewerId ||
            null,
        interviewer:
            interview.interviewer_name ||
            interview.interviewer ||
            'Interviewer not assigned',
        date:
            interview.interview_date ||
            interview.date ||
            '',
        time:
            interview.interview_time ||
            interview.time ||
            '',
        status:
            interview.status ||
            'Scheduled',
        link:
            interview.meeting_link ||
            interview.link ||
            ''
    };
}

function normalizeApplication(application) {
    return {
        id: Number(application.id),
        candidateId: Number(application.candidate_id || 0),
        candidateName: application.candidate_name || '',
        jobId: Number(application.job_id || 0),
        jobTitle: application.job_title || '',
        status: application.status || 'Applied',
        appliedAt: application.applied_at || ''
    };
}

function loadSettings() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(SETTINGS_KEY) || 'null'
        );

        return {
            ...fallbackData.settings,
            ...(saved || {})
        };
    } catch {
        return {
            ...fallbackData.settings
        };
    }
}

function saveSettings() {
    localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(data.settings)
    );
}

function loadSession() {
    try {
        const raw =
            localStorage.getItem(SESSION_KEY) ||
            sessionStorage.getItem(SESSION_KEY);

        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function storeSession(user, remember) {
    const value = JSON.stringify(user);

    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);

    (
        remember
            ? localStorage
            : sessionStorage
    ).setItem(SESSION_KEY, value);

    currentUser = user;
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);

    currentUser = null;
}

function showToast(message, type = 'info') {
    const container = $('toastContainer');

    if (!container) {
        return;
    }

    const toast = document.createElement('div');

    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3200);
}

function setButtonLoading(
    button,
    loading,
    loadingText = 'Saving...'
) {
    if (!button) {
        return;
    }

    if (loading) {
        button.dataset.originalText = button.textContent;
        button.disabled = true;
        button.textContent = loadingText;
    } else {
        button.disabled = false;

        button.textContent =
            button.dataset.originalText ||
            button.textContent;

        delete button.dataset.originalText;
    }
}

/* =========================================================
   API
========================================================= */

async function apiRequest(endpoint, options = {}) {
    const token =
        localStorage.getItem(TOKEN_KEY) ||
        sessionStorage.getItem(TOKEN_KEY) ||
        '';

    const headers = new Headers(
        options.headers || {}
    );

    const isFormData =
        typeof FormData !== 'undefined' &&
        options.body instanceof FormData;

    if (
        !isFormData &&
        options.body &&
        !headers.has('Content-Type')
    ) {
        headers.set(
            'Content-Type',
            'application/json'
        );
    }

    if (token) {
        headers.set(
            'Authorization',
            `Bearer ${token}`
        );
    }

    let response;

    try {
        response = await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );
    } catch (error) {
        throw new Error(
            'Unable to reach the TalentFlow backend. Make sure the ALB/backend is available.'
        );
    }

    let payload = {};

    const contentType =
        response.headers.get('content-type') || '';

    try {
        if (
            contentType.includes(
                'application/json'
            )
        ) {
            payload = await response.json();
        } else {
            const text = await response.text();

            payload = text
                ? { message: text }
                : {};
        }
    } catch {
        payload = {};
    }

    if (response.status === 401) {
        clearSession();
        showAuthentication();

        throw new Error(
            'Your session has expired. Please sign in again.'
        );
    }

    if (!response.ok) {
        throw new Error(
            payload.message ||
            payload.error ||
            `Request failed with status ${response.status}.`
        );
    }

    return payload;
}

async function loadBackendData({ silent = false } = {}) {
    const results =
        await Promise.allSettled([
            apiRequest('/api/candidates'),
            apiRequest('/api/jobs'),
            apiRequest('/api/interviews'),
            apiRequest('/api/applications')
        ]);

    let loaded = 0;

    if (results[0].status === 'fulfilled') {
        const value = results[0].value;

        const rows =
            Array.isArray(value)
                ? value
                : value.candidates ||
                  value.data;

        if (Array.isArray(rows)) {
            data.candidates =
                rows.map(normalizeCandidate);

            loaded++;
        }
    }

    if (results[1].status === 'fulfilled') {
        const value = results[1].value;

        const rows =
            Array.isArray(value)
                ? value
                : value.jobs ||
                  value.data;

        if (Array.isArray(rows)) {
            data.jobs =
                rows.map(normalizeJob);

            loaded++;
        }
    }

    if (results[2].status === 'fulfilled') {
        const value = results[2].value;

        const rows =
            Array.isArray(value)
                ? value
                : value.interviews ||
                  value.data;

        if (Array.isArray(rows)) {
            data.interviews =
                rows.map(normalizeInterview);

            loaded++;
        }
    }

    if (results[3].status === 'fulfilled') {
        const value = results[3].value;

        const rows =
            Array.isArray(value)
                ? value
                : value.applications ||
                  value.data;

        if (Array.isArray(rows)) {
            data.applications =
                rows.map(normalizeApplication);

            loaded++;
        }
    }

    renderAll();

    if (!silent) {
        if (loaded === 4) {
            showToast(
                'TalentFlow data synced with AWS.',
                'success'
            );
        } else if (loaded > 0) {
            showToast(
                'Some TalentFlow data could not be loaded.',
                'info'
            );
        }
    }

    return loaded;
}

/* =========================================================
   AUTH
========================================================= */

function setAuthMode(mode) {
    $('loginPanel')?.classList.toggle(
        'hidden',
        mode !== 'login'
    );

    $('registerPanel')?.classList.toggle(
        'hidden',
        mode !== 'register'
    );
}

function showApplication() {
    $('authScreen')?.classList.add('hidden');
    $('app')?.classList.remove('hidden');

    updateUserUI();
}

function showAuthentication() {
    $('app')?.classList.add('hidden');
    $('authScreen')?.classList.remove('hidden');

    setAuthMode('login');
}

function updateUserUI() {
    const user = currentUser || {};

    const name =
        user.name ||
        `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        'Admin';

    const email =
        user.email ||
        'admin@talentflowai.com';

    if ($('sidebarUserName')) {
        $('sidebarUserName').textContent = name;
    }

    if ($('sidebarUserEmail')) {
        $('sidebarUserEmail').textContent = email;
    }

    if ($('sidebarAvatar')) {
        $('sidebarAvatar').textContent =
            initials(name);
    }

    if ($('welcomeName')) {
        $('welcomeName').textContent =
            name.split(/\s+/)[0];
    }
}

function initAuth() {
    on(
        'showRegister',
        'click',
        () => setAuthMode('register')
    );

    on(
        'showLogin',
        'click',
        () => setAuthMode('login')
    );

    document
        .querySelectorAll('.password-toggle')
        .forEach(button => {
            button.addEventListener(
                'click',
                () => {
                    const input =
                        $(button.dataset.target);

                    if (!input) {
                        return;
                    }

                    const visible =
                        input.type === 'password';

                    input.type =
                        visible
                            ? 'text'
                            : 'password';

                    button.textContent =
                        visible
                            ? 'Hide'
                            : 'Show';
                }
            );
        });

    on(
        'forgotPassword',
        'click',
        () => {
            showToast(
                'Password reset is not exposed by the current backend.',
                'info'
            );
        }
    );

    on(
        'loginForm',
        'submit',
        async event => {
            event.preventDefault();

            const email =
                $('loginEmail')?.value.trim();

            const password =
                $('loginPassword')?.value || '';

            const remember =
                $('rememberMe')?.checked ?? true;

            const button =
                $('loginForm')?.querySelector(
                    'button[type="submit"]'
                );

            if (!email || !password) {
                return showToast(
                    'Enter your email and password.',
                    'error'
                );
            }

            setButtonLoading(
                button,
                true,
                'Signing in...'
            );

            try {
                const result =
                    await apiRequest(
                        '/api/auth/login',
                        {
                            method: 'POST',
                            body: JSON.stringify({
                                email,
                                password
                            })
                        }
                    );

                if (!result.token) {
                    throw new Error(
                        'Login response did not contain a token.'
                    );
                }

                localStorage.setItem(
                    TOKEN_KEY,
                    result.token
                );

                const user =
                    result.user || {
                        email,
                        name:
                            email.split('@')[0]
                    };

                storeSession(
                    {
                        ...user,
                        name:
                            user.name ||
                            `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    },
                    remember
                );

                showApplication();

                await loadBackendData({
                    silent: true
                });

                showToast(
                    'Welcome back to TalentFlow AI.',
                    'success'
                );
            } catch (error) {
                showToast(
                    error.message ||
                    'Login failed.',
                    'error'
                );
            } finally {
                setButtonLoading(
                    button,
                    false
                );
            }
        }
    );

    on(
        'registerForm',
        'submit',
        async event => {
            event.preventDefault();

            const firstName =
                $('registerFirstName')
                    ?.value.trim();

            const lastName =
                $('registerLastName')
                    ?.value.trim();

            const email =
                $('registerEmail')
                    ?.value.trim();

            const password =
                $('registerPassword')
                    ?.value || '';

            const confirmPassword =
                $('registerConfirmPassword')
                    ?.value || '';

            const button =
                $('registerForm')?.querySelector(
                    'button[type="submit"]'
                );

            if (
                password !==
                confirmPassword
            ) {
                return showToast(
                    'Passwords do not match.',
                    'error'
                );
            }

            if (password.length < 6) {
                return showToast(
                    'Password must be at least 6 characters.',
                    'error'
                );
            }

            setButtonLoading(
                button,
                true,
                'Creating account...'
            );

            try {
                const result =
                    await apiRequest(
                        '/api/auth/register',
                        {
                            method: 'POST',
                            body: JSON.stringify({
                                firstName,
                                lastName,
                                email,
                                password
                            })
                        }
                    );

                if (result.token) {
                    localStorage.setItem(
                        TOKEN_KEY,
                        result.token
                    );

                    const user =
                        result.user || {
                            firstName,
                            lastName,
                            email
                        };

                    storeSession(
                        {
                            ...user,
                            name:
                                `${user.firstName || firstName} ${user.lastName || lastName}`.trim()
                        },
                        true
                    );

                    showApplication();

                    await loadBackendData({
                        silent: true
                    });

                    showToast(
                        'Account created successfully.',
                        'success'
                    );
                } else {
                    setAuthMode('login');

                    if ($('loginEmail')) {
                        $('loginEmail').value =
                            email;
                    }

                    showToast(
                        result.message ||
                        'Account created. Please sign in.',
                        'success'
                    );
                }
            } catch (error) {
                showToast(
                    error.message ||
                    'Registration failed.',
                    'error'
                );
            } finally {
                setButtonLoading(
                    button,
                    false
                );
            }
        }
    );

    if (
        currentUser &&
        (
            localStorage.getItem(
                TOKEN_KEY
            ) ||
            sessionStorage.getItem(
                TOKEN_KEY
            )
        )
    ) {
        showApplication();
    } else {
        showAuthentication();
    }
}

/* =========================================================
   NAVIGATION
========================================================= */

const pageTitles = {
    dashboard: 'Recruitment Dashboard',
    candidates: 'Candidates',
    jobs: 'Job Openings',
    interviews: 'Scheduled Interviews',
    pipeline: 'Candidate Pipeline',
    analytics: 'Recruitment Analytics',
    settings: 'Settings'
};

function closeMobileSidebar() {
    $('sidebar')?.classList.remove(
        'open'
    );

    $('sidebarOverlay')?.classList.remove(
        'active'
    );
}

function navigate(page) {
    if (!pageTitles[page]) {
        return;
    }

    currentPage = page;

    document
        .querySelectorAll('.page')
        .forEach(section => {
            section.classList.toggle(
                'active',
                section.id === `page-${page}`
            );
        });

    document
        .querySelectorAll(
            '.nav-item[data-page]'
        )
        .forEach(button => {
            button.classList.toggle(
                'active',
                button.dataset.page === page
            );
        });

    if ($('pageTitle')) {
        $('pageTitle').textContent =
            pageTitles[page];
    }

    closeMobileSidebar();
    renderAll();
}

function initNavigation() {
    document
        .querySelectorAll(
            '.nav-item[data-page]'
        )
        .forEach(button => {
            button.addEventListener(
                'click',
                () =>
                    navigate(
                        button.dataset.page
                    )
            );
        });

    document
        .querySelectorAll(
            '[data-page-link]'
        )
        .forEach(button => {
            button.addEventListener(
                'click',
                () =>
                    navigate(
                        button.dataset.pageLink
                    )
            );
        });

    on(
        'mobileMenu',
        'click',
        () => {
            $('sidebar')?.classList.toggle(
                'open'
            );

            $('sidebarOverlay')?.classList.toggle(
                'active'
            );
        }
    );

    on(
        'sidebarOverlay',
        'click',
        closeMobileSidebar
    );

    on(
        'logoutButton',
        'click',
        () => {
            closeModal();
            clearSession();
            showAuthentication();

            showToast(
                'You have been signed out.',
                'success'
            );
        }
    );
}

/* =========================================================
   RENDERING
========================================================= */

function renderStats() {
    const candidates =
        data.candidates;

    if ($('totalCandidates')) {
        $('totalCandidates').textContent =
            candidates.length;
    }

    if ($('shortlistedCandidates')) {
        $('shortlistedCandidates').textContent =
            candidates.filter(
                c =>
                    [
                        'Shortlisted',
                        'Interview',
                        'Offer'
                    ].includes(c.stage)
            ).length;
    }

    if ($('totalInterviews')) {
        $('totalInterviews').textContent =
            data.interviews.filter(
                i =>
                    i.status !==
                    'Cancelled'
            ).length;
    }

    if ($('totalHired')) {
        $('totalHired').textContent =
            candidates.filter(
                c =>
                    c.stage === 'Hired'
            ).length;
    }

    if ($('interviewNavCount')) {
        $('interviewNavCount').textContent =
            data.interviews.filter(
                i =>
                    i.status !==
                    'Cancelled'
            ).length;
    }
}

function renderDashboard() {
    const interviewContainer =
        $('dashboardInterviews');

    if (interviewContainer) {
        const upcoming =
            [...data.interviews]
                .filter(
                    i =>
                        i.status !==
                        'Cancelled'
                )
                .sort(
                    (a, b) =>
                        `${a.date} ${a.time}`.localeCompare(
                            `${b.date} ${b.time}`
                        )
                )
                .slice(0, 4);

        interviewContainer.innerHTML =
            upcoming.length
                ? upcoming
                    .map(
                        interview => `
            <div class="interview-card">
                <div class="interview-info">
                    <h4>${esc(interview.candidate)}</h4>
                    <p>${esc(interview.role)} · ${esc(interview.interviewer)}</p>
                </div>
                <div class="interview-date">
                    <strong>${fmtDate(interview.date)}</strong>
                    <span>${esc(interview.time)} · ${esc(interview.status)}</span>
                </div>
            </div>
        `
                    )
                    .join('')
                : `
                    <div class="empty-state">
                        <p>No upcoming interviews.</p>
                    </div>
                `;
    }

    const recent =
        $('recentCandidateBody');

    if (recent) {
        recent.innerHTML =
            data.candidates
                .slice(0, 5)
                .map(
                    candidate => `
            <tr>
                <td>
                    <strong>${esc(candidate.name)}</strong>
                    <br>
                    <small>${esc(candidate.email)}</small>
                </td>
                <td>${esc(candidate.role)}</td>
                <td>
                    <strong>${Number(candidate.score) || 0}%</strong>
                </td>
                <td>
                    <span class="badge badge-blue">
                        ${esc(candidate.stage)}
                    </span>
                </td>
                <td>${fmtDate(candidate.applied)}</td>
                <td>
                    <button
                        type="button"
                        class="link-button"
                        data-candidate-id="${esc(candidate.id)}"
                    >
                        View
                    </button>
                </td>
            </tr>
        `
                )
                .join('') ||
            `
                <tr>
                    <td
                        colspan="6"
                        class="empty-cell"
                    >
                        No candidates available.
                    </td>
                </tr>
            `;
    }
}

function getCandidateFilters() {
    return {
        query:
            (
                $('candidateSearch')
                    ?.value || ''
            )
                .trim()
                .toLowerCase(),

        status:
            $('candidateStatusFilter')
                ?.value || 'all',

        role:
            $('candidateRoleFilter')
                ?.value || 'all',

        sort:
            $('candidateSort')
                ?.value || 'recent'
    };
}

function renderCandidates() {
    const filters =
        getCandidateFilters();

    let candidates =
        data.candidates.filter(
            candidate => {
                const search =
                    `${candidate.name} ${candidate.email} ${candidate.role} ${candidate.experience} ${candidate.source}`
                        .toLowerCase();

                return (
                    (
                        !filters.query ||
                        search.includes(
                            filters.query
                        )
                    ) &&
                    (
                        filters.status ===
                            'all' ||
                        candidate.stage ===
                            filters.status
                    ) &&
                    (
                        filters.role ===
                            'all' ||
                        candidate.role ===
                            filters.role
                    )
                );
            }
        );

    if (
        filters.sort ===
        'score'
    ) {
        candidates.sort(
            (a, b) =>
                b.score - a.score
        );
    } else if (
        filters.sort ===
        'name'
    ) {
        candidates.sort(
            (a, b) =>
                a.name.localeCompare(
                    b.name
                )
        );
    } else {
        candidates.sort(
            (a, b) =>
                String(
                    b.applied
                ).localeCompare(
                    String(
                        a.applied
                    )
                )
        );
    }

    if ($('candidateResultCount')) {
        $('candidateResultCount').textContent =
            `${candidates.length} candidate${candidates.length === 1 ? '' : 's'}`;
    }

    const body =
        $('candidateTableBody');

    if (!body) {
        return;
    }

    body.innerHTML =
        candidates
            .map(
                candidate => `
        <tr>
            <td>
                <strong>${esc(candidate.name)}</strong>
                <br>
                <small>${esc(candidate.email)}</small>
            </td>
            <td>${esc(candidate.role)}</td>
            <td>${esc(candidate.experience)}</td>
            <td>
                <strong>${candidate.score}%</strong>
            </td>
            <td>
                <span class="badge badge-blue">
                    ${esc(candidate.stage)}
                </span>
            </td>
            <td>${fmtDate(candidate.applied)}</td>
            <td>
                <button
                    type="button"
                    class="link-button"
                    data-candidate-id="${esc(candidate.id)}"
                >
                    View
                </button>
            </td>
        </tr>
    `
            )
            .join('') ||
        `
        <tr>
            <td
                colspan="7"
                class="empty-cell"
            >
                No candidates match the current filters.
            </td>
        </tr>
        `;
}

function renderJobs() {
    const container = $('jobsGrid');
    if (!container) return;

    container.innerHTML = data.jobs.map(job => `
        <article class="job-card">
            <div class="job-card-header">
                <div><span class="section-kicker">${esc(job.department)}</span><h3>${esc(job.title)}</h3></div>
                <span class="badge ${job.status === 'Open' ? 'badge-green' : 'badge-gray'}">${esc(job.status)}</span>
            </div>
            <p>${esc(job.location)} · ${esc(job.type)}</p>
            <div class="job-meta"><span class="badge badge-blue">${job.applicants} applicants</span></div>
            <div class="job-card-footer">
                <span>Position #${esc(job.id)}</span>
                <div class="job-actions">
                    <button type="button" class="link-button" data-job-id="${esc(job.id)}">View & Manage</button>
                    ${String(job.status).toLowerCase() === 'open' ? `<button type="button" class="apply-button" data-apply-job-id="${esc(job.id)}">Apply Now</button>` : ''}
                </div>
            </div>
        </article>
    `).join('') || `
        <div class="empty-state"><div class="empty-state-icon">▣</div><strong>No open jobs yet</strong><p>Create a job opening to make it available here.</p></div>
    `;
}
function renderInterviews() {
    const today =
        new Date()
            .toISOString()
            .slice(0, 10);

    const active =
        data.interviews.filter(
            i =>
                i.status !==
                'Cancelled'
        );

    const weekEnd =
        new Date();

    weekEnd.setDate(
        weekEnd.getDate() + 7
    );

    if ($('todayInterviews')) {
        $('todayInterviews').textContent =
            active.filter(
                i =>
                    i.date ===
                    today
            ).length;
    }

    if ($('weekInterviews')) {
        $('weekInterviews').textContent =
            active.filter(i => {
                const d =
                    new Date(
                        `${i.date}T00:00:00`
                    );

                return (
                    !Number.isNaN(
                        d.getTime()
                    ) &&
                    d >=
                        new Date(
                            `${today}T00:00:00`
                        ) &&
                    d <=
                        weekEnd
                );
            }).length;
    }

    if ($('pendingInterviews')) {
        $('pendingInterviews').textContent =
            active.filter(
                i =>
                    i.status ===
                    'Pending'
            ).length;
    }

    const container =
        $('interviewList');

    if (!container) {
        return;
    }

    const sorted =
        [...data.interviews].sort(
            (a, b) =>
                `${a.date} ${a.time}`.localeCompare(
                    `${b.date} ${b.time}`
                )
        );

    container.innerHTML =
        sorted
            .map(
                interview => `
        <div class="interview-card">
            <div class="interview-info">
                <h4>
                    ${esc(interview.candidate)}
                </h4>

                <p>
                    ${esc(interview.role)}
                    ·
                    ${esc(interview.interviewer)}
                </p>

                <p>
                    ${fmtDate(interview.date)}
                    ·
                    ${esc(interview.time)}
                </p>
            </div>

            <div class="interview-date">
                <strong>
                    ${esc(interview.status)}
                </strong>

                <button
                    type="button"
                    class="link-button"
                    data-interview-id="${esc(interview.id)}"
                >
                    Open
                </button>
            </div>
        </div>
    `
            )
            .join('') ||
        `
        <div class="empty-state">
            <p>No interviews scheduled.</p>
        </div>
        `;
}

function renderPipeline() {
    const board =
        $('pipelineBoard');

    if (!board) {
        return;
    }

    board.innerHTML =
        STAGES
            .filter(
                stage =>
                    stage !==
                    'Rejected'
            )
            .map(stage => {
                const candidates =
                    data.candidates.filter(
                        candidate =>
                            candidate.stage ===
                            stage
                    );

                return `
            <div class="pipeline-column">
                <div class="pipeline-column-header">
                    <strong>
                        ${esc(stage)}
                    </strong>

                    <span>
                        ${candidates.length}
                    </span>
                </div>

                <div class="pipeline-cards">
                    ${
                        candidates
                            .map(
                                candidate => `
                        <button
                            type="button"
                            class="pipeline-card"
                            data-candidate-id="${esc(candidate.id)}"
                        >
                            <strong>
                                ${esc(candidate.name)}
                            </strong>

                            <p>
                                ${esc(candidate.role)}
                            </p>

                            <span class="badge badge-purple">
                                AI ${candidate.score}%
                            </span>
                        </button>
                    `
                            )
                            .join('') ||
                        `
                        <span class="pipeline-count">
                            No candidates
                        </span>
                        `
                    }
                </div>
            </div>
        `;
            })
            .join('');
}

function renderAnalytics() {
    const total =
        data.candidates.length;

    const stages =
        STAGES;

    const funnel =
        $('funnelChart');

    if (funnel) {
        funnel.innerHTML = `
            <div class="chart-bar">
                ${stages
                    .map(stage => {
                        const count =
                            data.candidates.filter(
                                c =>
                                    c.stage ===
                                    stage
                            ).length;

                        const height =
                            total
                                ? Math.max(
                                      6,
                                      Math.round(
                                          (count /
                                              total) *
                                              100
                                      )
                                  )
                                : 6;

                        return `
                            <div class="chart-bar-item">
                                <span class="chart-bar-value">
                                    ${count}
                                </span>

                                <div
                                    class="chart-bar-fill"
                                    style="height:${height}%"
                                ></div>

                                <span class="chart-bar-label">
                                    ${esc(stage)}
                                </span>
                            </div>
                        `;
                    })
                    .join('')}
            </div>
        `;
    }

    const sources = {};

    data.candidates.forEach(
        candidate => {
            const source =
                candidate.source ||
                'Unknown';

            sources[source] =
                (
                    sources[source] ||
                    0
                ) + 1;
        }
    );

    const sourceChart =
        $('sourceChart');

    if (sourceChart) {
        const entries =
            Object.entries(
                sources
            ).sort(
                (a, b) =>
                    b[1] - a[1]
            );

        sourceChart.innerHTML =
            entries.length
                ? `
            <div class="chart-bar">
                ${entries
                    .map(
                        ([source, count]) => {
                            const height =
                                total
                                    ? Math.max(
                                          6,
                                          Math.round(
                                              (count /
                                                  total) *
                                                  100
                                          )
                                      )
                                    : 6;

                            return `
                                <div class="chart-bar-item">
                                    <span class="chart-bar-value">
                                        ${count}
                                    </span>

                                    <div
                                        class="chart-bar-fill"
                                        style="height:${height}%"
                                    ></div>

                                    <span class="chart-bar-label">
                                        ${esc(source)}
                                    </span>
                                </div>
                            `;
                        }
                    )
                    .join('')}
            </div>
        `
                : `
            <div class="empty-state">
                <p>No source data yet.</p>
            </div>
        `;
    }
}

function renderSettings() {
    if ($('settingAI')) {
        $('settingAI').checked =
            Boolean(
                data.settings.ai
            );
    }

    if ($('settingNotifications')) {
        $('settingNotifications').checked =
            Boolean(
                data.settings.notifications
            );
    }

    if ($('settingCompact')) {
        $('settingCompact').checked =
            Boolean(
                data.settings.compact
            );
    }

    document.body.classList.toggle(
        'compact-tables',
        Boolean(
            data.settings.compact
        )
    );
}

function populateRoleFilter() {
    const select =
        $('candidateRoleFilter');

    if (!select) {
        return;
    }

    const previous =
        select.value;

    const roles =
        [
            ...new Set(
                data.candidates
                    .map(
                        c =>
                            c.role
                    )
                    .filter(Boolean)
            )
        ].sort();

    select.innerHTML =
        '<option value="all">All positions</option>' +
        roles
            .map(
                role =>
                    `<option value="${esc(role)}">${esc(role)}</option>`
            )
            .join('');

    select.value =
        roles.includes(
            previous
        )
            ? previous
            : 'all';
}

function renderApplications() {
    const body = $('applicationTableBody');
    if (!body) return;

    const applications = [...data.applications].sort((a,b) =>
        String(b.appliedAt || '').localeCompare(String(a.appliedAt || ''))
    );

    if ($('applicationResultCount')) {
        $('applicationResultCount').textContent =
            `${applications.length} application${applications.length === 1 ? '' : 's'}`;
    }

    body.innerHTML = applications.map(app => `
        <tr>
            <td><strong>#${esc(app.id || '—')}</strong></td>
            <td><strong>${esc(app.candidateName || 'Unknown candidate')}</strong></td>
            <td>${esc(app.jobTitle || 'Unknown job')}</td>
            <td><span class="badge ${String(app.status).toLowerCase() === 'rejected' ? 'badge-red' : String(app.status).toLowerCase() === 'hired' ? 'badge-green' : 'badge-blue'} application-status">${esc(app.status || 'Applied')}</span></td>
            <td>${fmtDate(app.appliedAt)}</td>
        </tr>
    `).join('') || `
        <tr><td colspan="5" class="empty-cell">No applications yet. Open Job Openings and use Apply Now.</td></tr>
    `;
}

function renderAll() {
    renderStats();
    renderDashboard();
    populateRoleFilter();
    renderCandidates();
    renderJobs();
    renderApplications();
    renderInterviews();
    renderPipeline();
    renderAnalytics();
    renderSettings();
}

/* =========================================================
   MODALS
========================================================= */

function openModal(
    kicker,
    title,
    body
) {
    const overlay =
        $('modalOverlay');

    if (!overlay) {
        return;
    }

    $('modalKicker').textContent =
        kicker;

    $('modalTitle').textContent =
        title;

    $('modalBody').innerHTML =
        body;

    overlay.classList.add(
        'active'
    );

    document.body.classList.add(
        'modal-open'
    );
}

function closeModal() {
    $('modalOverlay')?.classList.remove(
        'active'
    );

    document.body.classList.remove(
        'modal-open'
    );
}

async function openCandidate(id) {
    let candidate =
        data.candidates.find(
            c =>
                Number(c.id) ===
                Number(id)
        );

    if (!candidate) {
        return;
    }

    try {
        const fresh =
            await apiRequest(
                `/api/candidates/${id}`
            );

        candidate =
            normalizeCandidate(
                fresh
            );

        const index =
            data.candidates.findIndex(
                c =>
                    Number(c.id) ===
                    Number(id)
            );

        if (index >= 0) {
            data.candidates[index] =
                candidate;
        }
    } catch {
        /*
         * Existing list data is enough
         * to display the profile.
         */
    }

    const hasResume =
        Boolean(
            candidate.resume_s3_key
        );

    const resumeStatus =
        candidate.resume_processing_status ||
        (
            hasResume
                ? 'Uploaded'
                : 'Not uploaded'
        );

    openModal(
        'CANDIDATE PROFILE',
        candidate.name,
        `
        <div class="detail-grid">
            <div>
                <span class="detail-label">
                    Email
                </span>

                <strong>
                    ${esc(candidate.email)}
                </strong>
            </div>

            <div>
                <span class="detail-label">
                    Position
                </span>

                <strong>
                    ${esc(candidate.role)}
                </strong>
            </div>

            <div>
                <span class="detail-label">
                    Experience
                </span>

                <strong>
                    ${esc(candidate.experience)}
                </strong>
            </div>

            <div>
                <span class="detail-label">
                    AI Match
                </span>

                <strong>
                    ${candidate.score}%
                </strong>
            </div>

            <div>
                <span class="detail-label">
                    Stage
                </span>

                <strong>
                    ${esc(candidate.stage)}
                </strong>
            </div>

            <div>
                <span class="detail-label">
                    Source
                </span>

                <strong>
                    ${esc(candidate.source)}
                </strong>
            </div>

            <div>
                <span class="detail-label">
                    Resume
                </span>

                <strong>
                    ${esc(resumeStatus)}
                </strong>
            </div>
        </div>

        <div class="modal-divider"></div>

        <form
            class="modal-form"
            id="candidateUpdateForm"
        >
            <div>
                <label for="candidateStageEdit">
                    Pipeline Stage
                </label>

                <select
                    id="candidateStageEdit"
                >
                    ${STAGES
                        .map(
                            stage =>
                                `<option value="${stage}" ${
                                    stage ===
                                    candidate.stage
                                        ? 'selected'
                                        : ''
                                }>${stage}</option>`
                        )
                        .join('')}
                </select>
            </div>

            <button
                type="submit"
                class="primary-button"
                id="saveCandidateStage"
            >
                Save Stage
            </button>
        </form>

        <div class="modal-divider"></div>

        <form
            class="modal-form"
            id="resumeUploadForm"
        >
            <div>
                <label for="candidateResume">
                    Resume (PDF/DOC/DOCX)
                </label>

                <input
                    id="candidateResume"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                >
            </div>

            <button
                type="submit"
                class="secondary-button"
                id="uploadResumeButton"
            >
                Upload Resume
            </button>
        </form>

        ${
            hasResume
                ? `
                    <button
                        type="button"
                        class="link-button modal-link-button"
                        id="viewResumeButton"
                    >
                        Open Resume
                    </button>
                `
                : ''
        }
    `
    );

    on(
        'candidateUpdateForm',
        'submit',
        async event => {
            event.preventDefault();

            const button =
                $('saveCandidateStage');

            setButtonLoading(
                button,
                true,
                'Updating...'
            );

            try {
                await apiRequest(
                    `/api/candidates/${id}/stage`,
                    {
                        method: 'PATCH',
                        body: JSON.stringify({
                            stage:
                                $('candidateStageEdit')
                                    .value
                        })
                    }
                );

                await loadBackendData({
                    silent: true
                });

                closeModal();

                showToast(
                    'Candidate stage updated.',
                    'success'
                );
            } catch (error) {
                showToast(
                    error.message,
                    'error'
                );
            } finally {
                setButtonLoading(
                    button,
                    false
                );
            }
        }
    );

    on(
        'resumeUploadForm',
        'submit',
        async event => {
            event.preventDefault();

            const file =
                $('candidateResume')
                    ?.files?.[0];

            if (!file) {
                return showToast(
                    'Select a resume first.',
                    'error'
                );
            }

            const formData =
                new FormData();

            formData.append(
                'resume',
                file
            );

            const button =
                $('uploadResumeButton');

            setButtonLoading(
                button,
                true,
                'Uploading...'
            );

            try {
                const result =
                    await apiRequest(
                        `/api/candidates/${id}/resume`,
                        {
                            method: 'POST',
                            body: formData
                        }
                    );

                closeModal();

                await loadBackendData({
                    silent: true
                });

                showToast(
                    result.message ||
                    'Resume uploaded successfully.',
                    'success'
                );
            } catch (error) {
                showToast(
                    error.message,
                    'error'
                );
            } finally {
                setButtonLoading(
                    button,
                    false
                );
            }
        }
    );

    on(
        'viewResumeButton',
        'click',
        async () => {
            try {
                const result =
                    await apiRequest(
                        `/api/candidates/${id}/resume`
                    );

                if (result.url) {
                    window.open(
                        result.url,
                        '_blank',
                        'noopener,noreferrer'
                    );
                } else {
                    showToast(
                        'Resume URL was not returned.',
                        'error'
                    );
                }
            } catch (error) {
                showToast(
                    error.message,
                    'error'
                );
            }
        }
    );
}

async function addCandidate() {
    openModal(
        'TALENT POOL',
        'Add Candidate',
        `
        <form
            class="modal-form"
            id="candidateCreateForm"
        >
            <div>
                <label for="newName">
                    Full Name
                </label>

                <input
                    id="newName"
                    required
                >
            </div>

            <div>
                <label for="newEmail">
                    Email
                </label>

                <input
                    type="email"
                    id="newEmail"
                    required
                >
            </div>

            <div>
                <label for="newRole">
                    Position
                </label>

                <input
                    id="newRole"
                    required
                >
            </div>

            <div>
                <label for="newExperience">
                    Experience
                </label>

                <input
                    id="newExperience"
                    placeholder="e.g. 2 years"
                >
            </div>

            <div>
                <label for="newSource">
                    Source
                </label>

                <select id="newSource">
                    <option>Website</option>
                    <option>LinkedIn</option>
                    <option>Referral</option>
                    <option>Indeed</option>
                    <option>Other</option>
                </select>
            </div>

            <div>
                <label for="newScore">
                    AI Match
                </label>

                <input
                    id="newScore"
                    type="number"
                    min="0"
                    max="100"
                    value="0"
                >
            </div>

            <div>
                <label for="newResume">
                    Resume (optional)
                </label>

                <input
                    id="newResume"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                >
            </div>

            <button
                type="submit"
                class="primary-button"
                id="createCandidateButton"
            >
                Add Candidate
            </button>
        </form>
    `
    );

    on(
        'candidateCreateForm',
        'submit',
        async event => {
            event.preventDefault();

            const button =
                $('createCandidateButton');

            setButtonLoading(
                button,
                true,
                'Creating...'
            );

            try {
                const result =
                    await apiRequest(
                        '/api/candidates',
                        {
                            method: 'POST',
                            body: JSON.stringify({
                                name:
                                    $('newName')
                                        .value
                                        .trim(),

                                email:
                                    $('newEmail')
                                        .value
                                        .trim(),

                                role:
                                    $('newRole')
                                        .value
                                        .trim(),

                                experience:
                                    $('newExperience')
                                        .value
                                        .trim() ||
                                    null,

                                score:
                                    Math.max(
                                        0,
                                        Math.min(
                                            100,
                                            Number(
                                                $('newScore')
                                                    .value
                                            ) || 0
                                        )
                                    ),

                                stage:
                                    'Applied',

                                applied:
                                    new Date()
                                        .toISOString()
                                        .slice(
                                            0,
                                            10
                                        ),

                                source:
                                    $('newSource')
                                        .value
                            })
                        }
                    );

                const candidateId =
                    Number(
                        result.id ||
                        result.candidate?.id
                    );

                const file =
                    $('newResume')
                        ?.files?.[0];

                if (
                    file &&
                    candidateId
                ) {
                    const formData =
                        new FormData();

                    formData.append(
                        'resume',
                        file
                    );

                    await apiRequest(
                        `/api/candidates/${candidateId}/resume`,
                        {
                            method: 'POST',
                            body: formData
                        }
                    );
                }

                closeModal();

                await loadBackendData({
                    silent: true
                });

                showToast(
                    file
                        ? 'Candidate and resume added successfully.'
                        : 'Candidate added successfully.',
                    'success'
                );
            } catch (error) {
                showToast(
                    error.message,
                    'error'
                );
            } finally {
                setButtonLoading(
                    button,
                    false
                );
            }
        }
    );
}

async function addJob() {
    openModal(
        'RECRUITMENT',
        'Create Job',
        `
        <form
            class="modal-form"
            id="jobCreateForm"
        >
            <div>
                <label for="jobTitle">
                    Job Title
                </label>

                <input
                    id="jobTitle"
                    required
                >
            </div>

            <div>
                <label for="jobDept">
                    Department
                </label>

                <input
                    id="jobDept"
                    required
                >
            </div>

            <div>
                <label for="jobLocation">
                    Location
                </label>

                <input
                    id="jobLocation"
                    placeholder="e.g. Remote / Delhi NCR"
                >
            </div>

            <div>
                <label for="jobType">
                    Type
                </label>

                <select id="jobType">
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                </select>
            </div>

            <button
                type="submit"
                class="primary-button"
                id="createJobButton"
            >
                Create Job
            </button>
        </form>
    `
    );

    on(
        'jobCreateForm',
        'submit',
        async event => {
            event.preventDefault();

            const button =
                $('createJobButton');

            setButtonLoading(
                button,
                true,
                'Creating...'
            );

            try {
                await apiRequest(
                    '/api/jobs',
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            title:
                                $('jobTitle')
                                    .value
                                    .trim(),

                            department:
                                $('jobDept')
                                    .value
                                    .trim(),

                            location:
                                $('jobLocation')
                                    .value
                                    .trim(),

                            type:
                                $('jobType')
                                    .value
                        })
                    }
                );

                closeModal();

                await loadBackendData({
                    silent: true
                });

                showToast(
                    'Job opening created successfully.',
                    'success'
                );
            } catch (error) {
                showToast(
                    error.message,
                    'error'
                );
            } finally {
                setButtonLoading(
                    button,
                    false
                );
            }
        }
    );
}

async function openApplyJob(id) {
    const job = data.jobs.find(item => Number(item.id) === Number(id));
    if (!job) return;
    if (String(job.status).toLowerCase() !== 'open') { showToast('This job is not currently open for applications.','error'); return; }

    const email = String(currentUser?.email || '').trim().toLowerCase();
    const existingCandidate = data.candidates.find(c => String(c.email || '').trim().toLowerCase() === email);

    if (existingCandidate) {
        openModal('JOB APPLICATION',`Apply for ${job.title}`,`
            <div class="detail-grid">
                <div><span class="detail-label">Candidate</span><strong>${esc(existingCandidate.name)}</strong></div>
                <div><span class="detail-label">Email</span><strong>${esc(existingCandidate.email)}</strong></div>
                <div><span class="detail-label">Position</span><strong>${esc(job.title)}</strong></div>
                <div><span class="detail-label">Location</span><strong>${esc(job.location)}</strong></div>
            </div>
            <p class="muted-note">Your existing candidate profile will be used for this application.</p>
            <form class="modal-form" id="applyExistingCandidateForm"><button type="submit" class="primary-button" id="applyExistingButton">Submit Application</button></form>
        `);

        on('applyExistingCandidateForm','submit',async event=>{
            event.preventDefault(); const button=$('applyExistingButton'); setButtonLoading(button,true,'Applying...');
            try {
                await apiRequest('/api/applications',{method:'POST',body:JSON.stringify({candidateId:Number(existingCandidate.id),jobId:Number(job.id)})});
                closeModal(); await loadBackendData({silent:true}); showToast(`Application submitted for ${job.title}.`,'success');
            } catch(error) { showToast(error.message || 'Unable to submit application.','error'); }
            finally { setButtonLoading(button,false); }
        });
        return;
    }

    openModal('JOB APPLICATION',`Apply for ${job.title}`,`
        <p class="muted-note" style="margin-top:0;margin-bottom:14px;">We need a candidate profile before submitting your first application. Your account email will be used for the profile.</p>
        <form class="modal-form" id="newApplicantForm">
            <div><label for="applicantName">Full Name</label><input id="applicantName" value="${esc(currentUser?.name || '')}" required></div>
            <div><label for="applicantEmail">Email</label><input id="applicantEmail" value="${esc(currentUser?.email || '')}" type="email" readonly></div>
            <div><label for="applicantExperience">Experience</label><input id="applicantExperience" placeholder="e.g. Fresher, 1 year, 2 years"></div>
            <div><label for="applicantResume">Resume (optional)</label><input id="applicantResume" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"></div>
            <button type="submit" class="primary-button" id="submitNewApplicationButton">Create Profile & Apply</button>
        </form>
    `);

    on('newApplicantForm','submit',async event=>{
        event.preventDefault(); const button=$('submitNewApplicationButton'); const name=$('applicantName').value.trim(); const experience=$('applicantExperience').value.trim(); const resume=$('applicantResume')?.files?.[0];
        if(!name){showToast('Please enter your full name.','error');return;}
        setButtonLoading(button,true,'Creating profile...');
        try {
            const result=await apiRequest('/api/candidates',{method:'POST',body:JSON.stringify({name,email:currentUser.email,role:job.title,experience:experience||null,score:0,stage:'Applied',applied:new Date().toISOString().slice(0,10),source:'Website'})});
            const candidateId=Number(result.id || result.candidate?.id);
            if(!candidateId) throw new Error('Candidate profile was created, but the backend did not return a candidate ID.');
            if(resume){setButtonLoading(button,true,'Uploading resume...');const formData=new FormData();formData.append('resume',resume);await apiRequest(`/api/candidates/${candidateId}/resume`,{method:'POST',body:formData});}
            setButtonLoading(button,true,'Submitting application...');
            await apiRequest('/api/applications',{method:'POST',body:JSON.stringify({candidateId,jobId:Number(job.id)})});
            closeModal(); await loadBackendData({silent:true}); showToast(`Application submitted for ${job.title}.`,'success');
        } catch(error){showToast(error.message || 'Unable to submit application.','error');}
        finally{setButtonLoading(button,false);}
    });
}

function openJob(id) {
    const job =
        data.jobs.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!job) {
        return;
    }

    const candidateOptions =
        data.candidates.length
            ? data.candidates
                .map(
                    candidate =>
                        `<option value="${esc(candidate.id)}">${esc(candidate.name)} — ${esc(candidate.role)}</option>`
                )
                .join('')
            : `
                <option value="">
                    No candidates available
                </option>
            `;

    openModal(
        'JOB OPENING',
        job.title,
        `
        <div class="detail-grid">
            <div>
                <span class="detail-label">
                    Department
                </span>

                <strong>
                    ${esc(job.department)}
                </strong>
            </div>

            <div>
                <span class="detail-label">
                    Location
                </span>

                <strong>
                    ${esc(job.location)}
                </strong>
            </div>

            <div>
                <span class="detail-label">
                    Type
                </span>

                <strong>
                    ${esc(job.type)}
                </strong>
            </div>

            <div>
                <span class="detail-label">
                    Status
                </span>

                <strong>
                    ${esc(job.status)}
                </strong>
            </div>

            <div>
                <span class="detail-label">
                    Applicants
                </span>

                <strong>
                    ${job.applicants}
                </strong>
            </div>
        </div>

        <div class="modal-divider"></div>

        <form
            class="modal-form"
            id="applicationCreateForm"
        >
            <div>
                <label for="applicationCandidate">
                    Add Existing Candidate to this Job
                </label>

                <select
                    id="applicationCandidate"
                    ${
                        data.candidates.length
                            ? ''
                            : 'disabled'
                    }
                >
                    ${candidateOptions}
                </select>
            </div>

            <button
                type="submit"
                class="primary-button"
                id="createApplicationButton"
                ${
                    data.candidates.length
                        ? ''
                        : 'disabled'
                }
            >
                Create Application
            </button>
        </form>
    `
    );

    on(
        'applicationCreateForm',
        'submit',
        async event => {
            event.preventDefault();

            const candidateId =
                Number(
                    $('applicationCandidate')
                        .value
                );

            const button =
                $('createApplicationButton');

            if (!candidateId) {
                return showToast(
                    'Select a candidate.',
                    'error'
                );
            }

            setButtonLoading(
                button,
                true,
                'Adding...'
            );

            try {
                await apiRequest(
                    '/api/applications',
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            candidateId,
                            jobId: job.id
                        })
                    }
                );

                closeModal();

                await loadBackendData({
                    silent: true
                });

                showToast(
                    'Candidate added to job.',
                    'success'
                );
            } catch (error) {
                showToast(
                    error.message,
                    'error'
                );
            } finally {
                setButtonLoading(
                    button,
                    false
                );
            }
        }
    );
}

function scheduleInterview() {
    if (!data.candidates.length) {
        showToast(
            'Add a candidate before scheduling an interview.',
            'error'
        );

        return;
    }

    const candidateOptions =
        data.candidates
            .map(
                candidate =>
                    `<option value="${esc(candidate.id)}">${esc(candidate.name)} — ${esc(candidate.role)}</option>`
            )
            .join('');

    const jobApplications =
        data.applications;

    openModal(
        'INTERVIEW MANAGEMENT',
        'Schedule Interview',
        `
        <form
            class="modal-form"
            id="interviewCreateForm"
        >
            <div>
                <label for="intCandidate">
                    Candidate
                </label>

                <select id="intCandidate">
                    ${candidateOptions}
                </select>
            </div>

            <div>
                <label for="intApplication">
                    Application (optional)
                </label>

                <select id="intApplication">
                    <option value="">
                        No application selected
                    </option>

                    ${jobApplications
                        .map(
                            app =>
                                `<option value="${esc(app.id)}">${esc(app.candidateName)} → ${esc(app.jobTitle)}</option>`
                        )
                        .join('')}
                </select>
            </div>

            <div>
                <label for="intDate">
                    Date
                </label>

                <input
                    type="date"
                    id="intDate"
                    required
                >
            </div>

            <div>
                <label for="intTime">
                    Time
                </label>

                <input
                    type="time"
                    id="intTime"
                    required
                >
            </div>

            <div>
                <label for="intMeetingLink">
                    Meeting Link (optional)
                </label>

                <input
                    type="url"
                    id="intMeetingLink"
                    placeholder="https://meet.google.com/..."
                >
            </div>

            <button
                type="submit"
                class="primary-button"
                id="createInterviewButton"
            >
                Schedule Interview
            </button>
        </form>
    `
    );

    on(
        'interviewCreateForm',
        'submit',
        async event => {
            event.preventDefault();

            const button =
                $('createInterviewButton');

            const candidateId =
                Number(
                    $('intCandidate')
                        .value
                );

            const applicationId =
                Number(
                    $('intApplication')
                        .value
                ) || null;

            const interviewDate =
                $('intDate').value;

            const interviewTime =
                $('intTime').value;

            const meetingLink =
                $('intMeetingLink')
                    .value
                    .trim();

            setButtonLoading(
                button,
                true,
                'Scheduling...'
            );

            try {
                await apiRequest(
                    '/api/interviews',
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            candidateId,
                            applicationId,
                            interviewerId:
                                currentUser?.id ||
                                null,
                            interviewDate,
                            interviewTime,
                            meetingLink
                        })
                    }
                );

                /*
                 * Keep the candidate pipeline
                 * synchronized with the interview.
                 */
                try {
                    await apiRequest(
                        `/api/candidates/${candidateId}/stage`,
                        {
                            method: 'PATCH',
                            body: JSON.stringify({
                                stage:
                                    'Interview'
                            })
                        }
                    );
                } catch (
                    stageError
                ) {
                    console.warn(
                        'Interview created but candidate stage could not be updated:',
                        stageError
                    );
                }

                closeModal();

                await loadBackendData({
                    silent: true
                });

                showToast(
                    'Interview scheduled successfully.',
                    'success'
                );
            } catch (error) {
                showToast(
                    error.message,
                    'error'
                );
            } finally {
                setButtonLoading(
                    button,
                    false
                );
            }
        }
    );
}

async function openInterview(id) {
    const interview =
        data.interviews.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!interview) {
        return;
    }

    openModal(
        'INTERVIEW DETAILS',
        interview.candidate,
        `
        <div class="detail-grid">
            <div>
                <span class="detail-label">
                    Candidate
                </span>

                <strong>
                    ${esc(interview.candidate)}
                </strong>
            </div>

            <div>
                <span class="detail-label">
                    Position
                </span>

                <strong>
                    ${esc(interview.role)}
                </strong>
            </div>

            <div>
                <span class="detail-label">
                    Date
                </span>

                <strong>
                    ${fmtDate(interview.date)}
                </strong>
            </div>

            <div>
                <span class="detail-label">
                    Time
                </span>

                <strong>
                    ${esc(interview.time)}
                </strong>
            </div>

            <div>
                <span class="detail-label">
                    Interviewer
                </span>

                <strong>
                    ${esc(interview.interviewer)}
                </strong>
            </div>

            <div>
                <span class="detail-label">
                    Status
                </span>

                <strong>
                    ${esc(interview.status)}
                </strong>
            </div>
        </div>

        <div class="modal-divider"></div>

        <form
            class="modal-form"
            id="interviewStatusForm"
        >
            <div>
                <label for="interviewStatusEdit">
                    Update Status
                </label>

                <select
                    id="interviewStatusEdit"
                >
                    ${INTERVIEW_STATUSES
                        .map(
                            status =>
                                `<option value="${status}" ${
                                    status ===
                                    interview.status
                                        ? 'selected'
                                        : ''
                                }>${status}</option>`
                        )
                        .join('')}
                </select>
            </div>

            <button
                type="submit"
                class="primary-button"
                id="saveInterviewStatus"
            >
                Save Status
            </button>
        </form>

        ${
            interview.link
                ? `
                    <a
                        class="secondary-button modal-link-button"
                        href="${esc(interview.link)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Open Meeting
                    </a>
                `
                : `
                    <p class="muted-note">
                        No meeting link was provided.
                    </p>
                `
        }
    `
    );

    on(
        'interviewStatusForm',
        'submit',
        async event => {
            event.preventDefault();

            const button =
                $('saveInterviewStatus');

            setButtonLoading(
                button,
                true,
                'Updating...'
            );

            try {
                await apiRequest(
                    `/api/interviews/${id}/status`,
                    {
                        method: 'PATCH',
                        body: JSON.stringify({
                            status:
                                $('interviewStatusEdit')
                                    .value
                        })
                    }
                );

                closeModal();

                await loadBackendData({
                    silent: true
                });

                showToast(
                    'Interview status updated.',
                    'success'
                );
            } catch (error) {
                showToast(
                    error.message,
                    'error'
                );
            } finally {
                setButtonLoading(
                    button,
                    false
                );
            }
        }
    );
}

/* =========================================================
   INSIGHTS / NOTIFICATIONS / SETTINGS
========================================================= */

function generateInsight() {
    if (!data.settings.ai) { showToast('Hiring Insights are disabled in Settings.','error'); return; }
    const total=data.candidates.length; const applications=data.applications.length;
    const average=total?Math.round(data.candidates.reduce((sum,c)=>sum+Number(c.score||0),0)/total):0;
    const highMatch=data.candidates.filter(c=>Number(c.score||0)>=85).length;
    const interviews=data.interviews.filter(i=>i.status==='Scheduled'||i.status==='Pending').length;
    const hired=data.candidates.filter(c=>c.stage==='Hired').length;
    let recommendation;
    if(!total&&!applications) recommendation='There is not enough hiring activity yet. Create a job opening and submit an application to start generating useful recruitment insights.';
    else if(!applications) recommendation=`${total} candidate${total===1?'':'s'} ${total===1?'is':'are'} in the talent pool, but no application records exist yet. Open Job Openings and use Apply Now to create the first application.`;
    else if(highMatch) recommendation=`${highMatch} candidate${highMatch===1?'':'s'} currently have an 85%+ match score. Review those candidates first.`;
    else recommendation=`${applications} application${applications===1?'':'s'} are recorded. Keep candidate stages and interview outcomes updated to make the pipeline more informative.`;
    if(interviews) recommendation+=` ${interviews} interview${interviews===1?' is':'s are'} currently scheduled or pending.`;
    if(hired) recommendation+=` ${hired} candidate${hired===1?' has':'s have'} reached the Hired stage.`;
    const topCandidate=[...data.candidates].sort((a,b)=>Number(b.score||0)-Number(a.score||0))[0];
    if($('aiInsightContent')) $('aiInsightContent').innerHTML=`<p class="ai-main-text"><strong>Hiring data analysis:</strong> ${esc(recommendation)}</p><div class="insight-metrics"><span><strong>${total}</strong> Candidates</span><span><strong>${applications}</strong> Applications</span><span><strong>${average}%</strong> Avg Match</span><span><strong>${interviews}</strong> Active Interviews</span>${topCandidate?`<span><strong>${esc(topCandidate.name)}</strong> Top Match</span>`:''}</div>`;
    showToast('Hiring insights generated from current backend data.','success');
}
function initActions() {
    document.addEventListener(
        'click',
        event => {
            const action =
                event.target.closest(
                    '[data-action]'
                )?.dataset.action;

            if (
                action ===
                'add-candidate'
            ) {
                addCandidate();
            }

            if (
                action ===
                'add-job'
            ) {
                addJob();
            }

            if (
                action ===
                'schedule-interview'
            ) {
                scheduleInterview();
            }

            const candidateButton =
                event.target.closest(
                    '[data-candidate-id]'
                );

            if (candidateButton) {
                openCandidate(
                    Number(
                        candidateButton
                            .dataset
                            .candidateId
                    )
                );
            }

            const jobButton =
                event.target.closest(
                    '[data-job-id]'
                );

            if (jobButton) {
                openJob(
                    Number(
                        jobButton
                            .dataset
                            .jobId
                    )
                );
            }

            const applyJobButton = event.target.closest('[data-apply-job-id]');
            if (applyJobButton) {
                openApplyJob(Number(applyJobButton.dataset.applyJobId));
            }

            const interviewButton =
                event.target.closest(
                    '[data-interview-id]'
                );

            if (interviewButton) {
                openInterview(
                    Number(
                        interviewButton
                            .dataset
                            .interviewId
                    )
                );
            }
        }
    );

    on(
        'modalClose',
        'click',
        closeModal
    );

    on(
        'modalOverlay',
        'click',
        event => {
            if (
                event.target ===
                $('modalOverlay')
            ) {
                closeModal();
            }
        }
    );

    on(
        'themeToggle',
        'click',
        () => {
            const dark =
                document.body.classList.toggle(
                    'dark-mode'
                );

            localStorage.setItem(
                THEME_KEY,
                dark
                    ? 'dark'
                    : 'light'
            );

            showToast(
                `${
                    dark
                        ? 'Dark'
                        : 'Light'
                } theme enabled.`
            );
        }
    );

    on(
        'notificationButton',
        'click',
        event => {
            event.stopPropagation();

            $('notificationPanel')
                ?.classList.toggle(
                    'hidden'
                );

            if ($('notificationDot')) {
                $('notificationDot').style.display =
                    'none';
            }
        }
    );

    on(
        'notificationPanel',
        'click',
        event =>
            event.stopPropagation()
    );

    on(
        'clearNotifications',
        'click',
        () => {
            if (
                $('notificationList')
            ) {
                $('notificationList')
                    .innerHTML = `
                    <div class="notification-item">
                        <div class="notification-icon">
                            ✓
                        </div>

                        <div>
                            <strong>
                                All caught up
                            </strong>

                            <p>
                                No new notifications.
                            </p>
                        </div>
                    </div>
                `;
            }
        }
    );

    on(
        'generateInsight',
        'click',
        generateInsight
    );

    on(
        'globalSearch',
        'input',
        event => {
            const query =
                event.target.value.trim();

            if (query) {
                navigate(
                    'candidates'
                );

                if (
                    $('candidateSearch')
                ) {
                    $('candidateSearch')
                        .value =
                        query;
                }
            }

            renderCandidates();
        }
    );

    [
        'candidateSearch',
        'candidateStatusFilter',
        'candidateRoleFilter',
        'candidateSort'
    ].forEach(id => {
        on(
            id,
            'input',
            renderCandidates
        );

        on(
            id,
            'change',
            renderCandidates
        );
    });

    on(
        'settingAI',
        'change',
        event => {
            data.settings.ai =
                event.target.checked;

            saveSettings();

            showToast(
                `AI insights ${
                    event.target.checked
                        ? 'enabled'
                        : 'disabled'
                }.`,
                'success'
            );
        }
    );

    on(
        'settingNotifications',
        'change',
        event => {
            data.settings.notifications =
                event.target.checked;

            saveSettings();

            showToast(
                `Notifications ${
                    event.target.checked
                        ? 'enabled'
                        : 'disabled'
                }.`,
                'success'
            );
        }
    );

    on(
        'settingCompact',
        'change',
        event => {
            data.settings.compact =
                event.target.checked;

            saveSettings();

            renderSettings();

            showToast(
                `Compact tables ${
                    event.target.checked
                        ? 'enabled'
                        : 'disabled'
                }.`,
                'success'
            );
        }
    );

    on(
        'resetData',
        'click',
        async () => {
            if (
                !window.confirm(
                    'Clear local UI preferences and refresh data from the backend?'
                )
            ) {
                return;
            }

            localStorage.removeItem(
                SETTINGS_KEY
            );

            data.settings =
                loadSettings();

            await loadBackendData({
                silent: false
            });

            showToast(
                'Frontend settings reset and backend data refreshed.',
                'success'
            );
        }
    );

    document.addEventListener(
        'click',
        event => {
            const panel =
                $('notificationPanel');

            const button =
                $('notificationButton');

            if (
                panel &&
                button &&
                !panel.contains(
                    event.target
                ) &&
                !button.contains(
                    event.target
                )
            ) {
                panel.classList.add(
                    'hidden'
                );
            }
        }
    );

    document.addEventListener(
        'keydown',
        event => {
            if (
                event.key ===
                'Escape'
            ) {
                closeModal();
                closeMobileSidebar();

                $('notificationPanel')
                    ?.classList.add(
                        'hidden'
                    );
            }
        }
    );
}

function applySavedTheme() {
    document.body.classList.toggle(
        'dark-mode',
        localStorage.getItem(
            THEME_KEY
        ) === 'dark'
    );
}

async function boot() {
    if (initialized) {
        return;
    }

    initialized = true;

    applySavedTheme();

    initAuth();
    initNavigation();
    initActions();

    renderAll();

    const token =
        localStorage.getItem(TOKEN_KEY) ||
        sessionStorage.getItem(TOKEN_KEY);

    if (!currentUser || !token) {
        clearSession();
        showAuthentication();
        return;
    }

    showApplication();

    await loadBackendData({
        silent: true
    });
}

document.addEventListener(
    'DOMContentLoaded',
    boot
);