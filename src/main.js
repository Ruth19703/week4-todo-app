import "./style.css";

// 1. Get HTML elements

const form = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskDay = document.querySelector("#task-day");
const taskPriority = document.querySelector("#task-priority");
const formError = document.querySelector("#form-error");
const taskList = document.querySelector("#task-list");
const taskCounter = document.querySelector("#task-counter");
const progressText = document.querySelector("#progress-text");
const progressBar = document.querySelector("#progress-bar");
const progressFill = document.querySelector("#progress-fill");
const emptyState = document.querySelector("#empty-state");
const emptyTitle = document.querySelector("#empty-title");
const emptyMessage = document.querySelector("#empty-message");
const clearCompletedButton = document.querySelector("#clear-completed");
const searchInput = document.querySelector("#search-input");
const filterButtons = document.querySelectorAll("[data-filter]");

// 2. Load saved tasks from localStorage

const STORAGE_KEY = "my-weekend-tasks";

let tasks = [];

try {
  const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  if (Array.isArray(savedTasks)) {
    tasks = savedTasks.filter(
      (task) =>
        task &&
        typeof task.id === "string" &&
        typeof task.text === "string" &&
        typeof task.completed === "boolean" &&
        ["Saturday", "Sunday"].includes(task.day) &&
        ["Low", "Normal", "High"].includes(task.priority)
    );
  }
} catch {
  tasks = [];
}

let currentFilter = "all";

// 3. Save tasks

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    showError("Your browser could not save tasks. Check your storage settings.");
  }
}

// Show an error message

function showError(message) {
  formError.textContent = message;
  formError.classList.remove("hidden");
}

// Hide the error message

function hideError() {
  formError.textContent = "";
  formError.classList.add("hidden");
}

// 4. Add a new task

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const text = taskInput.value.trim();

  hideError();

  // Validation: reject empty tasks
  
  if (!text) {
    showError("Please enter a task before adding it.");
    taskInput.focus();
    return;
  }

  // Validation: reject duplicate active tasks
  
  const duplicate = tasks.some(
    (task) =>
      task.text.toLowerCase() === text.toLowerCase() &&
      !task.completed
  );

  if (duplicate) {
    showError("This task already exists in your active list.");
    taskInput.focus();
    return;
  }

  const newTask = {
    id: crypto.randomUUID(),
    text: text,
    day: taskDay.value,
    priority: taskPriority.value,
    completed: false,
  };

  tasks.push(newTask);

  saveTasks();
  renderTasks();

  taskInput.value = "";
  taskDay.value = "Saturday";
  taskPriority.value = "Normal";
  taskInput.focus();
});

// 5. Complete, delete, and edit tasks

taskList.addEventListener("click", function (event) {
  const button = event.target.closest("button");

  if (!button) return;

  const taskItem = button.closest("[data-id]");

  if (!taskItem) return;

  const id = taskItem.dataset.id;
  const task = tasks.find((item) => item.id === id);

  if (!task) return;

  // Complete or uncomplete
  
  if (button.dataset.action === "toggle") {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
  }

  // Delete with confirmation
  
  if (button.dataset.action === "delete") {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.text}"?`
    );

    if (!confirmed) return;

    tasks = tasks.filter((item) => item.id !== id);

    saveTasks();
    renderTasks();
  }

  // Edit a task in place
  
  if (button.dataset.action === "edit") {
    startEditing(task, taskItem);
  }
});

// 6. Edit task without a prompt

function startEditing(task, taskItem) {
  const name = taskItem.querySelector(".task-name");
  const oldText = task.text;

  const input = document.createElement("input");
  input.type = "text";
  input.value = oldText;
  input.maxLength = 120;
  input.className = "edit-input";
  input.setAttribute("aria-label", "Edit task name");

  name.replaceWith(input);
  input.focus();
  input.select();

  const actions = taskItem.querySelector(".task-actions");
  actions.classList.add("hidden");

  const editor = document.createElement("div");
  editor.className = "mt-3 flex gap-2";

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.textContent = "Save";
  saveButton.className =
    "rounded-lg bg-green-800 px-3 py-2 text-sm font-medium text-white";
  saveButton.dataset.action = "save-edit";

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.textContent = "Cancel";
  cancelButton.className =
    "rounded-lg bg-stone-100 px-3 py-2 text-sm font-medium text-stone-700";
  cancelButton.dataset.action = "cancel-edit";

  editor.append(saveButton, cancelButton);
  taskItem.append(editor);

  function finishEditing(save) {
  if (save) {
    const newText = input.value.trim();

    // Clear any previous validation error
    
    input.setCustomValidity("");

    if (!newText) {
      input.setCustomValidity("Task name cannot be empty.");
      input.reportValidity();
      input.focus();
      return;
    }

      const duplicate = tasks.some(
        (item) =>
          item.id !== task.id &&
          item.text.toLowerCase() === newText.toLowerCase() &&
          !item.completed
      );

      if (duplicate) {
        input.setCustomValidity("An active task with this name already exists.");
        input.reportValidity();
        input.focus();
        return;
      }

      task.text = newText;
      saveTasks();
    }

    renderTasks();
  }

  saveButton.addEventListener("click", () => finishEditing(true));
  cancelButton.addEventListener("click", () => finishEditing(false));

  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      finishEditing(true);
    }

    if (event.key === "Escape") {
      finishEditing(false);
    }
  });
}

// 7. Remove all completed tasks

clearCompletedButton.addEventListener("click", function () {
  const completedTasks = tasks.filter((task) => task.completed);

  if (completedTasks.length === 0) {
    window.alert("There are no completed tasks to clear.");
    return;
  }

  const confirmed = window.confirm(
    `Clear all ${completedTasks.length} completed task(s)?`
  );

  if (!confirmed) return;

  tasks = tasks.filter((task) => !task.completed);

  saveTasks();
  renderTasks();
});

// 8. Filter tasks

filterButtons.forEach((button) => {
  button.addEventListener("click", function () {
    currentFilter = button.dataset.filter;

    filterButtons.forEach((item) => {
      const selected = item === button;

      item.setAttribute("aria-pressed", String(selected));
      item.classList.toggle("bg-green-800", selected);
      item.classList.toggle("text-white", selected);
      item.classList.toggle("bg-stone-100", !selected);
      item.classList.toggle("text-stone-700", !selected);
    });

    renderTasks();
  });
});

// Extra feature: search

searchInput.addEventListener("input", renderTasks);

// Helper: create an element safely

function makeElement(tag, className, text) {
  const element = document.createElement(tag);

  element.className = className;
  element.textContent = text;

  return element;
}

// Helper: create an action button

function makeButton(text, action, className, label) {
  const button = makeElement("button", className, text);

  button.type = "button";
  button.dataset.action = action;
  button.setAttribute("aria-label", label);

  return button;
}

// 9. Render the tasks

function renderTasks() {
  taskList.replaceChildren();

  const searchTerm = searchInput.value.trim().toLowerCase();

  const visibleTasks = tasks.filter((task) => {
    const matchesFilter =
      currentFilter === "all" ||
      (currentFilter === "active" && !task.completed) ||
      (currentFilter === "completed" && task.completed);

    const matchesSearch = task.text.toLowerCase().includes(searchTerm);

    return matchesFilter && matchesSearch;
  });

  visibleTasks.forEach((task) => {
    const item = document.createElement("li");

    item.dataset.id = task.id;
    item.className =
      "task-item rounded-xl border border-stone-200 p-4";

    if (task.completed) {
      item.classList.add("is-completed");
    }

    const row = document.createElement("div");
    row.className = "flex items-start gap-3";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.dataset.action = "toggle";
    checkbox.setAttribute("aria-label", `Complete ${task.text}`);
    checkbox.className = "mt-1 h-5 w-5 shrink-0 accent-green-800";

    const details = document.createElement("div");
    details.className = "min-w-0 flex-1";

    const name = makeElement(
      "span",
      "task-name font-medium text-stone-800",
      task.text
    );

    const metadata = document.createElement("div");
    metadata.className = "mt-2 flex flex-wrap items-center gap-2";

    const dayBadge = makeElement(
      "span",
      "rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-700",
      task.day
    );

    const priorityClass =
      task.priority === "High"
        ? "bg-red-100 text-red-800"
        : task.priority === "Low"
          ? "bg-blue-100 text-blue-800"
          : "bg-amber-100 text-amber-800";

    const priorityBadge = makeElement(
      "span",
      `rounded-full px-2.5 py-1 text-xs ${priorityClass}`,
      `${task.priority} priority`
    );

    metadata.append(dayBadge, priorityBadge);
    details.append(name, metadata);

    const actions = document.createElement("div");
    actions.className = "task-actions flex shrink-0 gap-2";

    const editButton = makeButton(
      "Edit",
      "edit",
      "rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-700 hover:bg-stone-200",
      `Edit ${task.text}`
    );

    const deleteButton = makeButton(
      "Delete",
      "delete",
      "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100",
      `Delete ${task.text}`
    );

    actions.append(editButton, deleteButton);
    row.append(checkbox, details, actions);
    item.append(row);
    taskList.append(item);
  });

  // Empty-state messages
  
  if (visibleTasks.length === 0) {
    emptyState.classList.remove("hidden");

    if (tasks.length === 0) {
      emptyTitle.textContent = "Your weekend is a blank page!";
      emptyMessage.textContent = "Add your first task and make a plan.";
    } else if (searchTerm) {
      emptyTitle.textContent = "No matching tasks";
      emptyMessage.textContent = "Try another search word.";
    } else if (currentFilter === "active") {
      emptyTitle.textContent = "All caught up!";
      emptyMessage.textContent = "You have no active tasks right now.";
    } else if (currentFilter === "completed") {
      emptyTitle.textContent = "Nothing completed yet";
      emptyMessage.textContent = "Finish a task and it will appear here.";
    } else {
      emptyTitle.textContent = "No tasks to show";
      emptyMessage.textContent = "Add a task to start planning.";
    }
  } else {
    emptyState.classList.add("hidden");
  }

  // Task counter
  const remaining = tasks.filter((task) => !task.completed).length;
  const total = tasks.length;
  const completed = total - remaining;

  taskCounter.textContent =
    `${remaining} ${remaining === 1 ? "task" : "tasks"} remaining`;

  // Progress bar
  const percentage =
    total === 0 ? 0 : Math.round((completed / total) * 100);

  progressText.textContent = `${completed} of ${total} completed`;
  progressBar.setAttribute("aria-valuenow", String(percentage));
  progressFill.style.width = `${percentage}%`;

  clearCompletedButton.disabled = completed === 0;
}

// Show saved tasks when the app opens
renderTasks();

taskList.addEventListener("change", function (event) {
  if (event.target.dataset.action !== "toggle") return;

  const taskItem = event.target.closest("[data-id]");
  if (!taskItem) return;

  const task = tasks.find(
    (item) => item.id === taskItem.dataset.id
  );

  if (!task) return;

  task.completed = event.target.checked;

  saveTasks();
  renderTasks();
});



// WEEKEND GOALS FEATURE

const goalInput = document.querySelector("#goalInput");
const saveGoalBtn = document.querySelector("#saveGoalBtn");
const goalProgress = document.querySelector("#goalProgress");
const goalProgressBar = document.querySelector("#goalProgressBar");
const goalMessage = document.querySelector("#goalMessage");

// Load the saved goal or use 5 as the default
let weekendGoal = Number(localStorage.getItem("weekendGoal")) || 5;

goalInput.value = weekendGoal;

// Save a new goal
saveGoalBtn.addEventListener("click", function () {
  const newGoal = Number(goalInput.value);

  if (!Number.isInteger(newGoal) || newGoal < 1) {
    goalInput.setCustomValidity("Enter a whole number greater than 0.");
    goalInput.reportValidity();
    return;
  }

  goalInput.setCustomValidity("");

  weekendGoal = newGoal;

  localStorage.setItem("weekendGoal", weekendGoal);

  updateGoalProgress();
});

// Update goal progress
function updateGoalProgress() {
  const completedTasks = tasks.filter(function (task) {
    return task.completed;
  }).length;

  const percentage = Math.min(
    (completedTasks / weekendGoal) * 100,
    100
  );

  goalProgress.textContent =
    `${completedTasks} of ${weekendGoal} tasks completed`;

  goalProgressBar.style.width = `${percentage}%`;

  if (completedTasks >= weekendGoal) {
    goalMessage.textContent =
      "🎉 You did it! Enjoy your weekend!";
  } else {
    goalMessage.textContent =
      `${weekendGoal - completedTasks} more tasks to reach your goal.`;
  }
}

// Show the goal progress when the app opens
updateGoalProgress();
