// app.js

// --- State Management ---
const STORAGE_KEY = 'candy_habits_v1';
let habits = []; // Array of habit objects: { id, name, history: { dateStr: bool } }

function loadHabits() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        habits = JSON.parse(data);
    } else {
        // Default onboarding habits
        habits = [
            { id: Date.now(), name: 'Drink Water', history: {} },
            { id: Date.now() + 1, name: 'Read 10 Pages', history: {} }
        ];
        saveHabits();
    }
}

function saveHabits() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    renderHabits();
    updateStats();
}

// --- Date Helpers ---
function getTodayStr() {
    const today = new Date();
    return today.toISOString().split('T')[0]; // "YYYY-MM-DD"
}

// --- UI Rendering ---
const habitListEl = document.getElementById('habitList');
const dateDisplayEl = document.getElementById('currentDate');
const completionRateEl = document.getElementById('completionRate');

function updateDateDisplay() {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    dateDisplayEl.textContent = new Date().toLocaleDateString('en-US', options);
}

function renderHabits() {
    habitListEl.innerHTML = '';
    const todayStr = getTodayStr();

    habits.forEach(habit => {
        const isDone = !!habit.history[todayStr];
        const streak = calculateStreak(habit);

        const li = document.createElement('li');
        li.className = `habit-item ${isDone ? 'completed' : ''}`;
        li.innerHTML = `
            <div class="habit-info">
                <span class="habit-name">${escapeHtml(habit.name)}</span>
                <span class="habit-streak">🔥 ${streak} day streak</span>
            </div>
            <div class="habit-actions">
                <button class="delete-btn" aria-label="Delete ${habit.name}" onclick="deleteHabit(${habit.id})">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
                    </svg>
                </button>
                <button class="check-btn" aria-label="Toggle ${habit.name}" onclick="toggleHabit(${habit.id})"></button>
            </div>
        `;
        habitListEl.appendChild(li);
    });
}

function calculateStreak(habit) {
    let streak = 0;
    const sortedDates = Object.keys(habit.history).sort().reverse();
    const today = getTodayStr();

    // Check if done today (if not, streak might still be valid from yesterday)
    let checkDate = new Date();

    // Simple logic: iterate backwards day by day
    for (let i = 0; i < 365; i++) { // Max lookback
        const dateStr = checkDate.toISOString().split('T')[0];
        if (habit.history[dateStr]) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            // If it's today and not done, don't break streak yet (it's pending)
            if (dateStr === today) {
                checkDate.setDate(checkDate.getDate() - 1);
                continue;
            }
            break;
        }
    }
    return streak;
}

function updateStats() {
    const todayStr = getTodayStr();
    if (habits.length === 0) {
        completionRateEl.textContent = '0%';
        return;
    }
    const completedCount = habits.filter(h => h.history[todayStr]).length;
    const rate = Math.round((completedCount / habits.length) * 100);
    completionRateEl.textContent = `${rate}%`;

    // Update ring color/stroke (could add SVG dasharray manipulation here)
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// --- Actions ---
window.toggleHabit = function (id) {
    const habit = habits.find(h => h.id === id);
    if (habit) {
        const todayStr = getTodayStr();
        if (habit.history[todayStr]) {
            delete habit.history[todayStr];
        } else {
            habit.history[todayStr] = true;
        }
        saveHabits();

        // Trigger haptic feedback if available
        if (navigator.vibrate) navigator.vibrate(50);
    }
}

window.deleteHabit = function (id) {
    if (confirm('Are you sure you want to delete this habit?')) {
        habits = habits.filter(h => h.id !== id);
        saveHabits();
    }
}

function addHabit(name) {
    const newHabit = {
        id: Date.now(),
        name: name,
        history: {}
    };
    habits.push(newHabit);
    saveHabits();
}

// --- Modal Logic ---
const addBtn = document.getElementById('addHabitBtn');
const modalOverlay = document.getElementById('addModal');
const cancelBtn = document.getElementById('cancelAddBtn');
const saveBtn = document.getElementById('saveHabitBtn');
const inputEl = document.getElementById('newHabitInput');

addBtn.addEventListener('click', () => {
    modalOverlay.classList.add('active');
    inputEl.value = '';
    inputEl.focus();
});

function closeModal() {
    modalOverlay.classList.remove('active');
}

cancelBtn.addEventListener('click', closeModal);

saveBtn.addEventListener('click', () => {
    const name = inputEl.value.trim();
    if (name) {
        addHabit(name);
        closeModal();
    }
});

// Init
loadHabits();
updateDateDisplay();
renderHabits();
updateStats();
