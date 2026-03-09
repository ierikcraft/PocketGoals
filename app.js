/**
 * PocketGoals Application Logic
 * Vanilla JS, LocalStorage, Mobile Web-App Features
 */

// ============== STATE ==============
let balance = 0;
let streak = 0;
let lastLoginDate = null;
let goals = [];

// ============== DOM ELEMENTS ==============
// Header
const balanceEl = document.getElementById('total-balance');
const streakEl = document.getElementById('streak-counter');

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
    const data = JSON.parse(localStorage.getItem('pocketGoalsData'));
    if (data) {
        balance = data.balance || 0;
        streak = data.streak || 0;
        lastLoginDate = data.lastLoginDate || null;
        goals = data.goals || [];
    } else {
        // Mock first-time data to demonstrate design
        goals = [
            { id: 1, name: 'Viaje a Tokio', target: 3500, current: 800, emoji: '✈️' },
            { id: 2, name: 'Setup Gamer', target: 1200, current: 1200, emoji: '🖥️' }
        ];
        balance = 2000;
        checkStreak(); // Will initialize to 1
        saveData();
    }
}

function saveData() {
    localStorage.setItem('pocketGoalsData', JSON.stringify({
        balance,
        streak,
        lastLoginDate,
        goals
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
        const percent = Math.min((goal.current / goal.target) * 100, 100);
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
                        <div class="goal-amounts">$${goal.current.toLocaleString('en-US')} / $${goal.target.toLocaleString('en-US')}</div>
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

        // Attach listeners directly
        const btnSub = card.querySelector('.control-btn.sub');
        const btnAdd = card.querySelector('.control-btn.add');

        btnSub.addEventListener('click', () => openNumpad(goal.id, 'sub'));
        btnAdd.addEventListener('click', () => openNumpad(goal.id, 'add'));

        goalsListEl.appendChild(card);
    });
}

// ============== HAPTICS ==============
function vibrate(ms = 50) {
    if (navigator.vibrate) {
        // Haptic feedback for interactions
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
    
    // Theming according to action
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
    // We visually display minus sign if action is subtract but number > 0
    const sign = (activeAction === 'sub' && num > 0) ? '-' : '';
    numpadDisplay.textContent = `${sign}$${num.toLocaleString('en-US')}`;
}

function handleNumpadInput(val) {
    if (currentAmount === '0') {
        if (val !== '0') {
            currentAmount = val;
        }
    } else if (currentAmount.length < 8) { // max 8 digits logic
        currentAmount += val;
    }
    updateNumpadDisplay();
}

function closeModals() {
    numpadModal.classList.remove('active');
    newGoalModal.classList.remove('active');
    activeGoalId = null;
    
    // Defocus inputs if keyboard was up
    goalNameInput.blur();
    goalTargetInput.blur();
    goalEmojiInput.blur();
}

// ============== EVENT LISTENERS ==============
function setupEventListeners() {
    // Numpad Numbers
    keys.forEach(key => {
        key.addEventListener('click', (e) => {
            vibrate(30); // Lighter vibrate for num pad
            handleNumpadInput(e.target.textContent);
        });
    });

    // Backspace
    btnBack.addEventListener('click', () => {
        vibrate(30);
        if (currentAmount.length > 1) {
            currentAmount = currentAmount.slice(0, -1);
        } else {
            currentAmount = '0';
        }
        updateNumpadDisplay();
    });

    // Clear All
    btnClear.addEventListener('click', () => {
        vibrate(30);
        currentAmount = '0';
        updateNumpadDisplay();
    });

    btnClose.addEventListener('click', () => {
        vibrate();
        closeModals();
    });

    // Numpad Confirm
    btnConfirm.addEventListener('click', () => {
        vibrate(60); // Stronger vibrate for confirmation
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

    // Add User Goal Action
    addGoalBtn.addEventListener('click', () => {
        vibrate();
        newGoalModal.classList.add('active');
    });

    btnCancelGoal.addEventListener('click', () => {
        vibrate();
        closeModals();
        // clear forms
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
            
            // Empty
            goalNameInput.value = '';
            goalTargetInput.value = '';
            goalEmojiInput.value = '';
        } else {
            // Give a little buzz alert if input fails
            vibrate([50, 50, 50]);
        }
    });

    // Close Modals when touching overlay outside the container
    document.querySelectorAll('.numpad-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModals();
            }
        });
    });
}

// Put it all together when DOM loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
