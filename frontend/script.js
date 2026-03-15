// ==================== КОНСТАНТЫ И НАСТРОЙКИ ====================
const API_BASE = 'http://localhost:8000/api/'; // замените на ваш адрес бэкенда

// ==================== ХРАНИЛИЩЕ ТОКЕНОВ И ПОЛЬЗОВАТЕЛЯ ====================
function setTokens(access, refresh) {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
}

function getAccessToken() {
    return localStorage.getItem('access_token');
}

function clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
}

// Декодирование JWT (простое, без проверки подписи)
function parseJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

function getUserFromToken() {
    const token = getAccessToken();
    if (!token) return null;
    return parseJWT(token);
}

// ==================== УПРАВЛЕНИЕ СТРАНИЦАМИ (ROUTING) ====================
const pages = {
    login: document.getElementById('login-page'),
    dashboard: document.getElementById('dashboard-page'),
    profile: document.getElementById('profile-page'),
    admin: document.getElementById('admin-page')
};

function showPage(pageId) {
    Object.values(pages).forEach(p => p.classList.remove('active'));
    pages[pageId].classList.add('active');
    // Обновить навигацию при смене страницы
    renderNavigation();
}

// Перенаправление на основе токена
function checkAuthAndRedirect() {
    const user = getUserFromToken();
    if (user) {
        if (window.location.hash === '#/login') {
            window.location.hash = '#/dashboard';
        }
        showPage('dashboard');
    } else {
        if (window.location.hash && window.location.hash !== '#/login') {
            window.location.hash = '#/login';
        }
        showPage('login');
    }
}

// Обработка хеша
function handleHashChange() {
    const hash = window.location.hash.slice(1) || '/dashboard';
    const user = getUserFromToken();

    if (!user && hash !== '/login') {
        window.location.hash = '/login';
        return;
    }
    if (user) {
        if (hash === '/login') {
            window.location.hash = '/dashboard';
            return;
        }
        if (hash === '/admin' && user.role !== 'admin') {
            window.location.hash = '/dashboard';
            return;
        }
    }

    switch (hash) {
        case '/login':
            showPage('login');
            break;
        case '/dashboard':
            showPage('dashboard');
            break;
        case '/profile':
            showPage('profile');
            loadProfile();
            break;
        case '/admin':
            showPage('admin');
            break;
        default:
            window.location.hash = user ? '/dashboard' : '/login';
    }
}

// ==================== НАВИГАЦИЯ ====================
function renderNavigation() {
    const nav = document.getElementById('navigation');
    const user = getUserFromToken();
    let html = '';
    if (user) {
        html = `
        <a href="#/dashboard">Дашборд</a>
        <a href="#/profile">Профиль</a>
        ${user.role === 'admin' ? '<a href="#/admin">Админка</a>' : ''}
        <button id="logout-btn">Выйти</button>
        `;
    } else {
        html = `<a href="#/login">Вход</a>`;
    }
    nav.innerHTML = html;

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            clearTokens();
            window.location.hash = '/login';
            showPage('login');
        });
    }
}

// ==================== API ВЫЗОВЫ ====================
async function apiRequest(endpoint, options = {}) {
    const url = API_BASE + endpoint;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    const token = getAccessToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, {
        ...options,
        headers
    });
    if (response.status === 401) {
        clearTokens();
        window.location.hash = '/login';
        showPage('login');
        throw new Error('Сессия истекла');
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка ${response.status}`);
    }
    return response.json();
}

// Логин
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = '';
    try {
        const data = await apiRequest('token/', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        setTokens(data.access, data.refresh);
        window.location.hash = '/dashboard';
        showPage('dashboard');
    } catch (err) {
        errorEl.textContent = err.message;
    }
});

// Загрузка профиля
async function loadProfile() {
    try {
        const data = await apiRequest('profile/');
        document.getElementById('profile-firstname').textContent = data.first_name;
        document.getElementById('profile-lastname').textContent = data.last_name;
        document.getElementById('profile-username').textContent = data.username;
        document.getElementById('profile-role').textContent = data.role === 'admin' ? 'Администратор' : 'Пользователь';
    } catch (err) {
        console.error('Ошибка загрузки профиля', err);
    }
}

// Создание пользователя (админ)
document.getElementById('create-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('new-username').value;
    const first_name = document.getElementById('new-firstname').value;
    const last_name = document.getElementById('new-lastname').value;
    const password = document.getElementById('new-password').value;
    const role = document.getElementById('new-role').value;
    const errorEl = document.getElementById('admin-error');
    const successEl = document.getElementById('admin-success');
    errorEl.textContent = '';
    successEl.textContent = '';

    try {
        await apiRequest('register/', {
            method: 'POST',
            body: JSON.stringify({ username, first_name, last_name, password, role })
        });
        successEl.textContent = 'Пользователь успешно создан';
        document.getElementById('create-user-form').reset();
    } catch (err) {
        errorEl.textContent = err.message;
    }
});

// Загрузка файла и получение метрик
document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    if (!file) return;

    const errorEl = document.getElementById('upload-error');
    const successEl = document.getElementById('upload-success');
    const uploadBtn = document.getElementById('upload-btn');
    errorEl.textContent = '';
    successEl.textContent = '';
    uploadBtn.disabled = true;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const token = getAccessToken();
        const response = await fetch(API_BASE + 'upload/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        if (!response.ok) {
            throw new Error(`Ошибка ${response.status}`);
        }
        const data = await response.json();
        displayMetrics(data);
        document.getElementById('metrics-section').style.display = 'block';
        successEl.textContent = 'Анализ выполнен';
    } catch (err) {
        errorEl.textContent = err.message;
    } finally {
        uploadBtn.disabled = false;
    }
});

// ==================== ОТОБРАЖЕНИЕ ГРАФИКОВ ====================
let charts = {};

function displayMetrics(data) {
    document.getElementById('accuracy-value').textContent = data.accuracy.toFixed(4);
    document.getElementById('loss-value').textContent = data.loss.toFixed(4);

    // Уничтожить предыдущие графики
    Object.values(charts).forEach(chart => chart.destroy());
    charts = {};

    // 1. История обучения
    const historyCtx = document.getElementById('history-chart').getContext('2d');
    charts.history = new Chart(historyCtx, {
        type: 'line',
        data: {
            labels: data.history.epoch,
            datasets: [
                { label: 'Точность (обуч)', data: data.history.accuracy, borderColor: '#8884d8', yAxisID: 'y' },
                               { label: 'Точность (вал)', data: data.history.val_accuracy, borderColor: '#82ca9d', yAxisID: 'y' },
                               { label: 'Потери (обуч)', data: data.history.loss, borderColor: '#ff7300', yAxisID: 'y1' },
                               { label: 'Потери (вал)', data: data.history.val_loss, borderColor: '#ff0000', yAxisID: 'y1' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Точность' } },
                y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Потери' } }
            }
        }
    });

    // 2. Количество записей каждого класса (обучение)
    const classCountCtx = document.getElementById('class-count-chart').getContext('2d');
    const classCountData = data.class_counts_train;
    charts.classCount = new Chart(classCountCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(classCountData),
                                  datasets: [{
                                      label: 'Количество',
                                      data: Object.values(classCountData),
                                  backgroundColor: '#8884d8'
                                  }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });

    // 3. Точность по каждому тестовому образцу (точечный)
    const testAccCtx = document.getElementById('test-accuracy-chart').getContext('2d');
    const testData = data.test_accuracy_per_sample;
    const scatterData = testData.map((val, idx) => ({ x: idx, y: val }));
    charts.testAccuracy = new Chart(testAccCtx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Точность',
                data: scatterData,
                backgroundColor: '#8884d8',
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Индекс образца' } },
                y: { beginAtZero: true, max: 1.1, title: { display: true, text: 'Точность' } }
            }
        }
    });

    // 4. Топ-5 классов (валидация)
    const top5Ctx = document.getElementById('top5-chart').getContext('2d');
    const top5Data = data.class_counts_valid; // уже топ-5
    charts.top5 = new Chart(top5Ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(top5Data),
                            datasets: [{
                                label: 'Количество',
                                data: Object.values(top5Data),
                            backgroundColor: '#82ca9d'
                            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { beginAtZero: true } }
        }
    });
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
window.addEventListener('load', () => {
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
});
