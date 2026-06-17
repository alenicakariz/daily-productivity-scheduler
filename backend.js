//object
const state = {
    tasks: [],
    availableTime: 0,
    results: null
};

const maxTasks = 25; //max tasks restriction

//dom - takes html to get user input and add actions
const availableTimeInput = document.getElementById('availableTime');
const taskNameInput = document.getElementById('taskName');
const taskDurationInput = document.getElementById('taskDuration');
const taskPriorityInput = document.getElementById('taskPriority');
const addTaskBtn = document.getElementById('addTaskBtn');
const tasksList = document.getElementById('tasksList');
const optimizeBtn = document.getElementById('optimizeBtn');
const resultsContainer = document.getElementById('resultsContainer');
const resultsContent = document.getElementById('resultsContent');
const taskCountWarning = document.getElementById('taskCountWarning');

//event listeners
availableTimeInput.addEventListener('change', (e) => {
    state.availableTime = parseFloat(e.target.value) || 0;
});

addTaskBtn.addEventListener('click', addTask);
optimizeBtn.addEventListener('click', optimize);

//to use 'enter' to add task/s
taskNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

//tasks-related functions
function addTask() {
    //check max tasks limit
    if (state.tasks.length >= maxTasks) {
        taskCountWarning.style.display = 'block';
        return;
    }
    taskCountWarning.style.display = 'none';

    const name = taskNameInput.value.trim();
    const duration = parseFloat(taskDurationInput.value);
    const value = parseInt(taskPriorityInput.value);

    //validation of user input
    if (!name) {
        alert('Please enter a task name');
        return;
    }

    if (!duration || duration <= 0) {
        alert('Please enter a valid duration');
        return;
    }

    if (!value || value < 1 || value > 10) {
        alert('Please enter a priority between 1 and 10');
        return;
    }

    //add tasks to array
    const task = {
        id: Date.now(),
        name,
        duration,
        value
    };

    state.tasks.push(task);

    //clear inputs after adding
    taskNameInput.value = '';
    taskDurationInput.value = '';
    taskPriorityInput.value = '';
    taskNameInput.focus();

    //update display
    renderTasks();
    resultsContainer.style.display = 'none';
}

function removeTask(id) {
    state.tasks = state.tasks.filter(task => task.id !== id);
    renderTasks();
    resultsContainer.style.display = 'none';
    taskCountWarning.style.display = 'none';
}

function renderTasks() {
    if (state.tasks.length === 0) {
        tasksList.innerHTML = '<p class="empty-message">No tasks added yet. Add your your task/s above.</p>';
        optimizeBtn.disabled = true;
        return;
    }

    optimizeBtn.disabled = false;

    tasksList.innerHTML = state.tasks.map(task => `
        <div class="task-item">
            <div class="task-info">
                <h3>${escapeHtml(task.name)}</h3>
                <div class="task-details">
                    <span class="detail-item">
                        ${task.duration} ${task.duration === 1 ? 'hour' : 'hours'}
                    </span>
                    <span class="detail-item">
                        Priority: ${task.value}/10
                    </span>
                </div>
            </div>
            <button class="btn btn-danger" onclick="removeTask(${task.id})" title="Remove task">
                &#10006;
            </button>
        </div>
    `).join('');
}

//BRUTE-FORCE ALGORITHM 
function knapsackBruteForce(tasks, capacity) {
    const n = tasks.length;  //counts number of tasks ni user
    const totalCombinations = Math.pow(2, n); //0-1

    let maxValue = 0;
    let optimalSolutions = [];

    //tries every possible combination of taskss
    for (let i = 0; i < totalCombinations; i++) {
        const currentCombination = [];
        let totalDuration = 0;
        let totalValue = 0;

        //checks each bit to see if task is included
        for (let j = 0; j < n; j++) { 
            if (i & (1 << j)) { 
                currentCombination.push(tasks[j]); 
                totalDuration += tasks[j].duration; 
                totalValue += tasks[j].value;
            }
        }

        //check if this combination fits within capacity
        if (totalDuration <= capacity) {
            if (totalValue > maxValue) { //found a better solution
                maxValue = totalValue;
                optimalSolutions = [currentCombination]; //put in the solution and replaces others (if there are)
            } else if (totalValue === maxValue && totalValue > 0) { //found another solution with same value (tie)
                optimalSolutions.push(currentCombination); //push to the solution (added with other tied solutions)
            }
        }
    }

    return {
        maxValue,
        solutions: optimalSolutions,
        combinationsTried: totalCombinations
    };
}

// show results and optimizee
function optimize(){
    //if empty
    if (state.tasks.length === 0) {
        state.results = { maxValue: 0, solutions: [], combinationsTried: 0 };
        displayResults();
        return;
    }

    state.results = knapsackBruteForce(state.tasks, state.availableTime);
    displayResults();
}

function displayResults(){
    resultsContainer.style.display = 'block'; //show results html
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    if (state.results.solutions.length === 0) {
        resultsContent.innerHTML = `
            <div class="no-results-message">
                No valid schedule found within your available time.
            </div>
        `;
        return;
    }

    let html = `
        <div class="results-header">
            <div class="result-stat">
                <div class="result-stat-label">Maximum Productivity Value</div>
                <div class="result-stat-value">${state.results.maxValue}</div>
            </div>
            <div class="result-stat">
                <div class="result-stat-label">Combinations Tested</div>
                <div class="result-stat-value">${state.results.combinationsTried}</div>
            </div>
        </div>
    `;

    if (state.results.solutions.length === 1) {
        // single solution
        const solution = state.results.solutions[0];
        html += `
            <div class="solution">
                <div class="solution-header">Optimal Schedule:</div>
                <div class="solution-tasks">
                    ${solution.map(task => `
                        <div class="solution-task">
                            <h4>${escapeHtml(task.name)}</h4>
                            <p>${task.duration} ${task.duration === 1 ? 'hour' : 'hours'} • Priority: ${task.value}/10</p>
                        </div>
                    `).join('')}
                </div>
                <div class="solution-total">
                    Total time: ${calculateTotalTime(solution).toFixed(1)} hours of ${state.availableTime} hours
                </div>
            </div>
        `;
    } else {
        //multiple solutions (ties)
        html += `
            <div>
                <div class="solution-header">
                    Found ${state.results.solutions.length} equally optimal schedules:
                </div>
                <div class="solutions-grid">
                    ${state.results.solutions.map((solution, idx) => `
                        <div class="solution-option">
                            <div class="solution-option-header">Option ${idx + 1}</div>
                            <div class="solution-option-tasks">
                                ${solution.map(task => `
                                    <div class="solution-option-task">
                                        <h5>${escapeHtml(task.name)}</h5>
                                        <p>${task.duration} ${task.duration === 1 ? 'hour' : 'hours'} • Priority: ${task.value}/10</p>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="solution-option-total">
                                Total time: ${calculateTotalTime(solution).toFixed(1)} hours
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    resultsContent.innerHTML = html;
}

function calculateTotalTime(tasks) {
    return tasks.reduce((sum, task) => sum + task.duration, 0);
}

//security 
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

//initialization
document.addEventListener('DOMContentLoaded', () => {
    renderTasks();
    state.availableTime = parseFloat(availableTimeInput.value);
});