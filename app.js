/**
 * PocketGoals Application Logic
 * Vanilla JS, LocalStorage, Mobile Web-App Features
 */

// ============== STATE ==============
let accounts = [];
let activeAccountId = null;

// Active Account Pointers
let balance = 0;
let streak = 0;
let lastLoginDate = null;
let goals = [];

// ============== DOM ELEMENTS ==============
// Header
const balanceEl = document.getElementById('total-balance');
const streakEl = document.getElementById('streak-counter');
const settingsBtn = document.getElementById('settings-btn');

// Main Container
const goalsListEl = document.getElementById('goals-list');
const addGoalBtn = document.getElementById('add-goal-btn');

// Numpad Modal
const numpadModal = document.getElementById('numpad-modal');
const numpadDisplay = document.getElementById('numpad-display');
const numpadTitle = document.getElementById('numpad-title');
const keys = document.querySelectorAll('.num-key');
const btnClear = document.getElementById('num-clear');
const btnBack = document.getElementById('num-back');
const btnConfirm = document.getElementById('num-confirm');
const btnClose = document.getElementById('num-close');

// New Goal Modal
const newGoalModal = document.getElementById('new-goal-modal');
const goalNameInput = document.getElementById('goal-name');
const goalTargetInput = document.getElementById('goal-target');
const goalEmojiInput = document.getElementById('goal-emoji');
const btnSaveGoal = document.getElementById('save-goal');
const btnCancelGoal = document.getElementById('cancel-goal');

// Settings Modal
const settingsModal = document.getElementById('settings-modal');
const accountSelector = document.getElementById('account-selector');
const btnNewAccount = document.getElementById('new-account-btn');
const btnDeleteData = document.getElementById('delete-data-btn');
const btnCloseSettings = document.getElementById('close-settings');

// Session Flow State
let currentAmount = '0';
let activeGoalId = null;
let activeAction = 'add'; // 'add' or 'sub'

// ============== INITIALIZATION ==============
function init() {
    loadData();
    checkStreak();
    renderGoals();
    updateHeader();
    setupEventListeners();
}

function loadData() {
    const data = JSON.parse(localStorage.getItem('pocketGoalsAccountsData'));
    if (data && data.accounts && data.accounts.length > 0) {
        accounts = data.accounts;
        activeAccountId = data.activeAccountId || accounts[0].id;
    } else {
        // Migration from previous version or First time
        const legacyData = JSON.parse(localStorage.getItem('pocketGoalsData'));
        accounts = [{
            id: 'account_' + Date.now(),
            name: 'Principal',
            balance: legacyData ? legacyData.balance : 0,
            streak: legacyData ? legacyData.streak : 0,
            lastLoginDate: legacyData ? legacyData.lastLoginDate : null,
            goals: legacyData ? legacyData.goals : []
        }];
        activeAccountId = accounts[0].id;
        if (legacyData) {
            localStorage.removeItem('pocketGoalsData');
        }
    }

    syncActiveAccountState();
}

function syncActiveAccountState() {
    const activeAccount = accounts.find(a => a.id === activeAccountId);
    if (activeAccount) {
        balance = activeAccount.balance || 0;
        streak = activeAccount.streak || 0;
        lastLoginDate = activeAccount.lastLoginDate || null;
        goals = activeAccount.goals || [];
    }
}

function saveData() {
    const activeAccount = accounts.find(a => a.id === activeAccountId);
    if (activeAccount) {
        activeAccount.balance = balance;
        activeAccount.streak = streak;
        activeAccount.lastLoginDate = lastLoginDate;
        activeAccount.goals = goals;
    }

    localStorage.setItem('pocketGoalsAccountsData', JSON.stringify({
        accounts,
        activeAccountId
    }));
}

function checkStreak() {
    const today = new Date().toDateString();
    if (lastLoginDate !== today) {
        if (lastLoginDate) {
            const last = new Date(lastLoginDate);
            const now = new Date();
            const diffTime = Math.abs(now - last);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                streak++; // Consecutive day
            } else if (diffDays > 1) {
                streak = 1; // Streak broken
            }
        } else {
            streak = 1; // First time
        }
        lastLoginDate = today;
        saveData();
    }
}

// ============== RENDER ENGINE ==============
function updateHeader() {
    balanceEl.textContent = `$${balance.toLocaleString('en-US')}`;
    streakEl.textContent = `${streak} día${streak !== 1 ? 's' : ''}`;
}

function renderGoals() {
    goalsListEl.innerHTML = '';

    if (goals.length === 0) {
        goalsListEl.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); margin-top: 40px; font-size: 0.95rem;">
                No tienes metas activas.<br>¡Crea una y empieza a ahorrar!
            </div>
        `;
        return;
    }

    goals.forEach((goal, index) => {
        const percent = Math.min((goal.current ? (goal.current / goal.target) * 100 : 0), 100);
        const isComplete = percent >= 100;

        const card = document.createElement('div');
        card.className = 'goal-card glass-card';
        card.style.animationDelay = `${index * 0.1}s`;

        card.innerHTML = `
            <div class="goal-header">
                <div class="goal-info">
                    <div class="goal-emoji">${goal.emoji || '🎯'}</div>
                    <div>
                        <div class="goal-name">${goal.name}</div>
                        <div class="goal-amounts">$${(goal.current || 0).toLocaleString('en-US')} / $${goal.target.toLocaleString('en-US')}</div>
                    </div>
                </div>
                <div class="goal-controls">
                    <button class="control-btn sub" aria-label="Restar">-</button>
                    <button class="control-btn add" aria-label="Sumar">+</button>
                </div>
            </div>
            <div class="progress-container">
                <div class="progress-bar ${isComplete ? 'complete' : ''}" style="width: ${percent}%"></div>
            </div>
        `;

        const btnSub = card.querySelector('.control-btn.sub');
        const btnAdd = card.querySelector('.control-btn.add');

        btnSub.addEventListener('click', () => openNumpad(goal.id, 'sub'));
        btnAdd.addEventListener('click', () => openNumpad(goal.id, 'add'));

        goalsListEl.appendChild(card);
    });
}

function renderAccountSelector() {
    accountSelector.innerHTML = '';
    accounts.forEach(acc => {
        const option = document.createElement('option');
        option.value = acc.id;
        option.textContent = acc.name;
        if (acc.id === activeAccountId) option.selected = true;
        accountSelector.appendChild(option);
    });
}

// ============== ACCOUNT ACTIONS ==============
function switchAccount(id) {
    activeAccountId = id;
    syncActiveAccountState();
    checkStreak();
    updateHeader();
    renderGoals();
    saveData();
}

function createNewAccount(name) {
    const newId = 'account_' + Date.now();
    accounts.push({
        id: newId,
        name: name,
        balance: 0,
        streak: 0,
        lastLoginDate: null,
        goals: []
    });
    activeAccountId = newId;
    syncActiveAccountState();
    checkStreak();
    saveData();
    renderAccountSelector();
    updateHeader();
    renderGoals();
}

function deleteCurrentAccountData() {
    goals = [];
    balance = 0;
    streak = 0;
    lastLoginDate = null;
    saveData();
    updateHeader();
    renderGoals();
}

// ============== HAPTICS ==============
function vibrate(ms = 50) {
    if (navigator.vibrate) {
        navigator.vibrate(ms);
    }
}

// ============== NUMPAD LOGIC ==============
function openNumpad(id, action) {
    vibrate();
    activeGoalId = id;
    activeAction = action;
    currentAmount = '0';
    updateNumpadDisplay();

    const goal = goals.find(g => g.id === id);
    const actionText = action === 'add' ? 'Añadir a' : 'Restar de';
    numpadTitle.textContent = `${actionText} ${goal.name}`;

    if (action === 'add') {
        numpadDisplay.classList.remove('subtext');
        btnConfirm.textContent = 'Añadir';
        btnConfirm.classList.remove('danger');
    } else {
        numpadDisplay.classList.add('subtext');
        btnConfirm.textContent = 'Extraer';
        btnConfirm.classList.add('danger');
    }

    numpadModal.classList.add('active');
}

function updateNumpadDisplay() {
    const num = parseInt(currentAmount, 10) || 0;
    const sign = (activeAction === 'sub' && num > 0) ? '-' : '';
    numpadDisplay.textContent = `${sign}$${num.toLocaleString('en-US')}`;
}

function handleNumpadInput(val) {
    if (currentAmount === '0') {
        if (val !== '0') {
            currentAmount = val;
        }
    } else if (currentAmount.length < 8) {
        currentAmount += val;
    }
    updateNumpadDisplay();
}

function closeModals() {
    numpadModal.classList.remove('active');
    newGoalModal.classList.remove('active');
    settingsModal.classList.remove('active');
    activeGoalId = null;

    goalNameInput.blur();
    goalTargetInput.blur();
    goalEmojiInput.blur();
}

// ============== EVENT LISTENERS ==============
function setupEventListeners() {
    // Settings logic
    settingsBtn.addEventListener('click', () => {
        vibrate();
        renderAccountSelector();
        settingsModal.classList.add('active');
    });

    btnCloseSettings.addEventListener('click', () => {
        vibrate();
        closeModals();
    });

    accountSelector.addEventListener('change', (e) => {
        vibrate(30);
        switchAccount(e.target.value);
    });

    btnNewAccount.addEventListener('click', () => {
        vibrate(30);
        const name = prompt("Nombre de la nueva cuenta:");
        if (name && name.trim()) {
            createNewAccount(name.trim());
        }
    });

    btnDeleteData.addEventListener('click', () => {
        vibrate([60, 60]);
        const activeName = accounts.find(a => a.id === activeAccountId).name;
        if (confirm("¿Estás seguro de que quieres borrar TODOS LOS DATOS de tu cuenta '" + activeName + "'? (Se perderá el saldo y metas)")) {
            deleteCurrentAccountData();
            closeModals();
        }
    });

    // Numpad Numbers
    keys.forEach(key => {
        key.addEventListener('click', (e) => {
            vibrate(30);
            handleNumpadInput(e.target.textContent);
        });
    });

    btnBack.addEventListener('click', () => {
        vibrate(30);
        if (currentAmount.length > 1) {
            currentAmount = currentAmount.slice(0, -1);
        } else {
            currentAmount = '0';
        }
        updateNumpadDisplay();
    });

    btnClear.addEventListener('click', () => {
        vibrate(30);
        currentAmount = '0';
        updateNumpadDisplay();
    });

    btnClose.addEventListener('click', () => {
        vibrate();
        closeModals();
    });

    btnConfirm.addEventListener('click', () => {
        vibrate(60);
        const amount = parseInt(currentAmount, 10);

        if (amount > 0 && activeGoalId !== null) {
            const goal = goals.find(g => g.id === activeGoalId);
            if (activeAction === 'add') {
                goal.current += amount;
                balance += amount;
            } else if (activeAction === 'sub') {
                goal.current = Math.max(0, goal.current - amount);
                balance = Math.max(0, balance - amount);
            }
            saveData();
            updateHeader();
            renderGoals();
        }
        closeModals();
    });

    addGoalBtn.addEventListener('click', () => {
        vibrate();
        newGoalModal.classList.add('active');
    });

    btnCancelGoal.addEventListener('click', () => {
        vibrate();
        closeModals();
        goalNameInput.value = '';
        goalTargetInput.value = '';
        goalEmojiInput.value = '';
    });

    btnSaveGoal.addEventListener('click', () => {
        vibrate(60);
        const name = goalNameInput.value.trim();
        const targetStr = goalTargetInput.value.trim();
        const target = parseInt(targetStr, 10);
        const emoji = goalEmojiInput.value.trim() || '🎯';

        if (name && !isNaN(target) && target > 0) {
            goals.push({
                id: Date.now(),
                name,
                target,
                current: 0,
                emoji
            });
            saveData();
            renderGoals();
            closeModals();

            goalNameInput.value = '';
            goalTargetInput.value = '';
            goalEmojiInput.value = '';
        } else {
            vibrate([50, 50, 50]);
        }
    });

    document.querySelectorAll('.numpad-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModals();
            }
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
