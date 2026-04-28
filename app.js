const APP_STORAGE_KEY = "lifeQueueDashboardStateV8";

const DEFAULT_STATE = {
  selectedQueue: "physical",
  progressRange: "daily",
  playerName: "Abdullahi",
  queueReadyText: "READY",
  settings: {
    fajrTime: "05:20",
    dhuhrTime: "13:15",
    asrTime: "17:05",
    maghribTime: "19:42",
    ishaTime: "21:20",
    height: `5'8"`,
    weight: 240,
    sleepGoal: 8
  },
  queueForms: {
    physical: {
      weightLogged: "",
      gymWent: "no",
      workoutType: "",
      calories: "",
      sleptAt: "23:30",
      wokeAt: "07:30",
      ateAfterMaghrib: "no",
      waterOz: "",
      steps: ""
    },
    deen: {
      fajr: "no",
      fajrSunnah: "no",
      dhuhr: "no",
      dhuhrSunnah: "no",
      asr: "no",
      maghrib: "no",
      maghribSunnah: "no",
      isha: "no",
      ishaSunnah: "no",
      tahajjud: "no",
      quranPages: ""
    },
    routines: {
      morningAcne: "no",
      nightAcne: "no",
      screenHours: ""
    },
    supplements: {
      iron: "no",
      zinc: "no",
      magnesium: "no",
      creatine: "no"
    }
  },
  completedSections: {
    physical: {
      weight: false,
      workout: false,
      nutrition: false,
      sleep: false,
      hydration: false
    },
    deen: {
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
      quran: false,
      tahajjud: false
    },
    routines: {
      morningAcne: false,
      nightAcne: false,
      screenHours: false
    },
    supplements: {
      iron: false,
      zinc: false,
      magnesium: false,
      creatine: false
    }
  },
  history: []
};

const QUEUE_LABELS = {
  physical: "Physical",
  deen: "Deen",
  routines: "Routines",
  supplements: "Supplements",
  queue: "Queue",
  overview: "Career",
  progress: "Progress"
};

let state = loadState();
let pendingQueueChoice = state.selectedQueue;

document.addEventListener("DOMContentLoaded", () => {
  seedYesterdayIfNeeded();
  setupNavTabs();
  setupQueuePicker();
  setupQueueActions();
  setupSettings();
  setupStaticButtons();
  setupProgressRangeButtons();
  renderAll();

  setInterval(() => {
    renderQueueLabels();
  }, 60000);

  window.addEventListener("resize", () => {
    if (document.getElementById("progress")?.classList.contains("active")) {
      renderProgressCharts();
    }
  });
});

function structuredDefault() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function loadState() {
  try {
    const raw = localStorage.getItem(APP_STORAGE_KEY);
    if (!raw) return structuredDefault();

    const parsed = JSON.parse(raw);
    const base = structuredDefault();

    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings || {}) },
      queueForms: {
        ...base.queueForms,
        ...(parsed.queueForms || {}),
        physical: { ...base.queueForms.physical, ...((parsed.queueForms || {}).physical || {}) },
        deen: { ...base.queueForms.deen, ...((parsed.queueForms || {}).deen || {}) },
        routines: { ...base.queueForms.routines, ...((parsed.queueForms || {}).routines || {}) },
        supplements: { ...base.queueForms.supplements, ...((parsed.queueForms || {}).supplements || {}) }
      },
      completedSections: {
        ...base.completedSections,
        ...(parsed.completedSections || {}),
        physical: { ...base.completedSections.physical, ...((parsed.completedSections || {}).physical || {}) },
        deen: { ...base.completedSections.deen, ...((parsed.completedSections || {}).deen || {}) },
        routines: { ...base.completedSections.routines, ...((parsed.completedSections || {}).routines || {}) },
        supplements: { ...base.completedSections.supplements, ...((parsed.completedSections || {}).supplements || {}) }
      },
      history: Array.isArray(parsed.history) ? parsed.history : []
    };
  } catch {
    return structuredDefault();
  }
}

function saveState() {
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
}

function seedYesterdayIfNeeded() {
  if (state.history.some((x) => x.id === "seed-yesterday")) return;

  state.history.unshift({
    id: "seed-yesterday",
    date: getYesterdayDateString(),
    result: "defeat",
    rrDelta: -12,
    rrRunning: 0,
    scoreline: "243.5 lb",
    kda: "11/19/1",
    weight: 243.5,
    calories: 3400,
    steps: 7476,
    screenHours: 0,
    summary: {
      gymWent: false,
      allSalah: true,
      sunnahCount: 0,
      tahajjud: true,
      quranPages: 1,
      waterOz: 64,
      sleptAt: "23:30",
      wokeAt: "04:20",
      ateAfterMaghrib: true,
      morningAcne: false,
      nightAcne: false,
      supplementsTaken: 0
    }
  });

  saveState();
}

function getYesterdayDateString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

/* NAV */

function setupNavTabs() {
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      if (target) openTab(target);
    });
  });
}

function openTab(tabId) {
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabId);
  });

  document.querySelectorAll(".nav-tab").forEach((tab) => {
    const active = tab.dataset.tab === tabId;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });

  if (tabId === "progress") {
    renderProgressCharts();
  }
}

/* QUEUE PICKER */

function setupQueuePicker() {
  const overlay = document.getElementById("queuePickerOverlay");
  const openButton = document.getElementById("openQueuePicker");
  const closeButton = document.getElementById("closeQueuePicker");

  if (!overlay) return;

  const openPicker = () => {
    pendingQueueChoice = state.selectedQueue;
    syncQueuePickerSelection();
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
  };

  const closePicker = () => {
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
  };

  openButton?.addEventListener("click", openPicker);
  closeButton?.addEventListener("click", closePicker);

  document.querySelectorAll("[data-queue-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.dataset.queueChoice;
      state.selectedQueue = selected;
      pendingQueueChoice = selected;
      saveState();
      renderQueueLabels();
      closePicker();
    });
  });

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closePicker();
  });
}

function syncQueuePickerSelection() {
  document.querySelectorAll("[data-queue-choice]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.queueChoice === pendingQueueChoice);
  });
}

/* QUEUE ACTIONS */

function setupQueueActions() {
  document.getElementById("queueNow")?.addEventListener("click", () => {
    openTab(state.selectedQueue);
  });

  document.getElementById("queueToCareer")?.addEventListener("click", (event) => {
    event.preventDefault();
    openTab("overview");
  });

  document.getElementById("queueModeButton")?.addEventListener("click", (event) => {
    event.preventDefault();
  });
}

/* SETTINGS */

function setupSettings() {
  const overlay = document.getElementById("settingsOverlay");
  const openButton = document.getElementById("openSettings");
  const closeButton = document.getElementById("closeSettings");
  const saveButton = document.getElementById("saveSettings");

  if (!overlay) return;

  const openSettings = () => {
    hydrateSettingsInputs();
    overlay.classList.remove("hidden");
  };

  const closeSettings = () => {
    overlay.classList.add("hidden");
  };

  openButton?.addEventListener("click", openSettings);
  closeButton?.addEventListener("click", closeSettings);

  saveButton?.addEventListener("click", () => {
    pullSettingsInputs();
    saveState();
    renderAll();
    closeSettings();
  });

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeSettings();
  });
}

function hydrateSettingsInputs() {
  setInputValue("fajrTime", state.settings.fajrTime);
  setInputValue("dhuhrTime", state.settings.dhuhrTime);
  setInputValue("asrTime", state.settings.asrTime);
  setInputValue("maghribTime", state.settings.maghribTime);
  setInputValue("ishaTime", state.settings.ishaTime);
  setInputValue("height", state.settings.height);
  setInputValue("weight", state.settings.weight);
  setInputValue("sleepGoal", state.settings.sleepGoal);
}

function pullSettingsInputs() {
  state.settings.fajrTime = getInputValue("fajrTime");
  state.settings.dhuhrTime = getInputValue("dhuhrTime");
  state.settings.asrTime = getInputValue("asrTime");
  state.settings.maghribTime = getInputValue("maghribTime");
  state.settings.ishaTime = getInputValue("ishaTime");
  state.settings.height = getInputValue("height");
  state.settings.weight = Number(getInputValue("weight")) || 0;
  state.settings.sleepGoal = Number(getInputValue("sleepGoal")) || 0;
}

function setupStaticButtons() {
  document.querySelector(".back-link")?.addEventListener("click", () => openTab("queue"));
}

/* PROGRESS RANGE */

function setupProgressRangeButtons() {
  document.querySelectorAll(".progress-range-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.progressRange = button.dataset.range;
      saveState();
      syncProgressRangeUI();
      renderProgressCharts();
    });
  });

  syncProgressRangeUI();
}

function syncProgressRangeUI() {
  document.querySelectorAll(".progress-range-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.range === state.progressRange);
  });
}

/* RENDER ALL */

function renderAll() {
  syncLiveHistoryFromForms();
  renderQueueLabels();
  renderPhysicalTab();
  renderDeenTab();
  renderRoutinesTab();
  renderSupplementsTab();
  renderCareerTab();
  syncProgressRangeUI();
  renderProgressCharts();
}

/* QUEUE LABELS */

function renderQueueLabels() {
  const queueLabel = QUEUE_LABELS[state.selectedQueue] || "Physical";
  const nextSalahText = getNextSalahText();

  setText("currentQueueButtonLabel", queueLabel);
  setText("bannerMessage", `Next salah: ${nextSalahText}`);
  setText("nextSalah", nextSalahText);
  setText("queueDayDoneInline", `${getDayCompletionPercent()}%`);
  setText("queuePlayerName", state.playerName);
  setText("queueCardReadyState", state.queueReadyText);
}

/* PHYSICAL */

function renderPhysicalTab() {
  const form = state.queueForms.physical;
  const completed = state.completedSections.physical;
  const left = [];
  const right = [];

  addSection(
    completed.weight,
    left,
    right,
    `
      <section class="task-block">
        <div class="task-block-header">
          <div><span class="eyebrow">Weight</span><h3>Morning weight</h3></div>
          <button class="small-action section-done-button" type="button" data-tab="physical" data-section="weight">Done</button>
        </div>
        <div class="task-input-grid one-col">
          <label>
            <span class="field-label">Weight logged</span>
            <input id="physicalWeightLogged" type="number" step="0.1" value="${escapeHtml(form.weightLogged)}" />
          </label>
        </div>
      </section>
    `,
    renderCompletedCard("physical", "weight", "Morning weight")
  );

  addSection(
    completed.workout,
    left,
    right,
    `
      <section class="task-block">
        <div class="task-block-header">
          <div><span class="eyebrow">Gym</span><h3>Workout check</h3></div>
          <button class="small-action section-done-button" type="button" data-tab="physical" data-section="workout">Done</button>
        </div>
        <div class="task-input-grid">
          <label>
            <span class="field-label">Did you go gym?</span>
            <select id="physicalGymWent">
              <option value="no" ${form.gymWent === "no" ? "selected" : ""}>No</option>
              <option value="yes" ${form.gymWent === "yes" ? "selected" : ""}>Yes</option>
            </select>
          </label>
          ${
            form.gymWent === "yes"
              ? `
            <label>
              <span class="field-label">What did you hit?</span>
              <input id="physicalWorkoutType" type="text" value="${escapeHtml(form.workoutType)}" placeholder="Push, Pull, Legs..." />
            </label>
          `
              : ""
          }
        </div>
      </section>
    `,
    renderCompletedCard("physical", "workout", "Workout check")
  );

  addSection(
    completed.nutrition,
    left,
    right,
    `
      <section class="task-block">
        <div class="task-block-header">
          <div><span class="eyebrow">Nutrition</span><h3>Calories</h3></div>
          <button class="small-action section-done-button" type="button" data-tab="physical" data-section="nutrition">Done</button>
        </div>
        <div class="task-input-grid one-col">
          <label>
            <span class="field-label">Calories</span>
            <input id="physicalCalories" type="number" value="${escapeHtml(form.calories)}" />
          </label>
        </div>
      </section>
    `,
    renderCompletedCard("physical", "nutrition", "Calories")
  );

  addSection(
    completed.sleep,
    left,
    right,
    `
      <section class="task-block">
        <div class="task-block-header">
          <div><span class="eyebrow">Sleep</span><h3>Sleep log</h3></div>
          <button class="small-action section-done-button" type="button" data-tab="physical" data-section="sleep">Done</button>
        </div>
        <div class="task-input-grid">
          <label>
            <span class="field-label">Slept at</span>
            <input id="physicalSleptAt" type="time" value="${escapeHtml(form.sleptAt)}" />
          </label>
          <label>
            <span class="field-label">Woke up at</span>
            <input id="physicalWokeAt" type="time" value="${escapeHtml(form.wokeAt)}" />
          </label>
          <div>
            <span class="field-label">Hours slept</span>
            <div class="auto-sleep-output"><strong>${calculateSleepHours(form.sleptAt, form.wokeAt)}</strong></div>
          </div>
          <label>
            <span class="field-label">Ate after Maghrib?</span>
            <select id="physicalAteAfterMaghrib">
              <option value="no" ${form.ateAfterMaghrib === "no" ? "selected" : ""}>No</option>
              <option value="yes" ${form.ateAfterMaghrib === "yes" ? "selected" : ""}>Yes</option>
            </select>
          </label>
        </div>
      </section>
    `,
    renderCompletedCard("physical", "sleep", "Sleep log")
  );

  addSection(
    completed.hydration,
    left,
    right,
    `
      <section class="task-block">
        <div class="task-block-header">
          <div><span class="eyebrow">Hydration</span><h3>Water and steps</h3></div>
          <button class="small-action section-done-button" type="button" data-tab="physical" data-section="hydration">Done</button>
        </div>
        <div class="task-input-grid">
          <label>
            <span class="field-label">Water drank (oz)</span>
            <input id="physicalWaterOz" type="number" value="${escapeHtml(form.waterOz)}" />
          </label>
          <label>
            <span class="field-label">Steps</span>
            <input id="physicalSteps" type="number" value="${escapeHtml(form.steps)}" />
          </label>
        </div>
      </section>
    `,
    renderCompletedCard("physical", "hydration", "Water and steps")
  );

  setHtml("physicalTaskStack", left.length ? left.join("") : renderEmptyLeft("Physical"));
  setHtml("physicalCompletedStack", right.length ? right.join("") : renderEmptyRight());

  wirePhysicalInputs();
  wireSectionButtons("physical");
}

/* DEEN */

function renderDeenTab() {
  const form = state.queueForms.deen;
  const completed = state.completedSections.deen;
  const left = [];
  const right = [];

  renderPrayerSection("fajr", "Fajr", "fajrSunnah", "Fajr Sunnah", left, right, form, completed);
  renderPrayerSection("dhuhr", "Dhuhr", "dhuhrSunnah", "Dhuhr Sunnah", left, right, form, completed);
  renderPrayerSection("asr", "Asr", null, null, left, right, form, completed);
  renderPrayerSection("maghrib", "Maghrib", "maghribSunnah", "Maghrib Sunnah", left, right, form, completed);
  renderPrayerSection("isha", "Isha", "ishaSunnah", "Isha Sunnah", left, right, form, completed);

  addSection(
    completed.quran,
    left,
    right,
    `
      <section class="task-block">
        <div class="task-block-header">
          <div><span class="eyebrow">Quran</span><h3>Quran progress</h3></div>
          <button class="small-action section-done-button" type="button" data-tab="deen" data-section="quran">Done</button>
        </div>
        <div class="task-input-grid one-col">
          <label>
            <span class="field-label">Pages completed today</span>
            <input id="deenQuranPages" type="number" value="${escapeHtml(form.quranPages)}" />
          </label>
        </div>
      </section>
    `,
    renderCompletedCard("deen", "quran", "Quran progress")
  );

  addSection(
    completed.tahajjud,
    left,
    right,
    `
      <section class="task-block">
        <div class="task-block-header">
          <div><span class="eyebrow">Night worship</span><h3>Tahajjud</h3></div>
          <button class="small-action section-done-button" type="button" data-tab="deen" data-section="tahajjud">Done</button>
        </div>
        <div class="task-input-grid one-col">
          <label>
            <span class="field-label">Did you pray Tahajjud?</span>
            <select id="deenTahajjud">
              <option value="no" ${form.tahajjud === "no" ? "selected" : ""}>No</option>
              <option value="yes" ${form.tahajjud === "yes" ? "selected" : ""}>Yes</option>
            </select>
          </label>
        </div>
      </section>
    `,
    renderCompletedCard("deen", "tahajjud", "Tahajjud")
  );

  setHtml("deenTaskStack", left.length ? left.join("") : renderEmptyLeft("Deen"));
  setHtml("deenCompletedStack", right.length ? right.join("") : renderEmptyRight());

  wireDeenInputs();
  wireSectionButtons("deen");
}

function renderPrayerSection(key, label, sunnahKey, sunnahLabel, left, right, form, completed) {
  addSection(
    completed[key],
    left,
    right,
    `
      <section class="task-block">
        <div class="task-block-header">
          <div><span class="eyebrow">Salah</span><h3>${label}</h3></div>
          <button class="small-action section-done-button" type="button" data-tab="deen" data-section="${key}">Done</button>
        </div>
        <div class="task-input-grid ${sunnahKey && form[key] === "yes" ? "" : "one-col"}">
          <label>
            <span class="field-label">Prayed ${label}?</span>
            <select class="deen-salah-select" data-key="${key}">
              <option value="no" ${form[key] === "no" ? "selected" : ""}>No</option>
              <option value="yes" ${form[key] === "yes" ? "selected" : ""}>Yes</option>
            </select>
          </label>
          ${
            sunnahKey && form[key] === "yes"
              ? `
            <label>
              <span class="field-label">Prayed ${sunnahLabel}?</span>
              <select class="deen-sunnah-select" data-key="${sunnahKey}">
                <option value="no" ${form[sunnahKey] === "no" ? "selected" : ""}>No</option>
                <option value="yes" ${form[sunnahKey] === "yes" ? "selected" : ""}>Yes</option>
              </select>
            </label>
          `
              : ""
          }
        </div>
      </section>
    `,
    renderCompletedCard("deen", key, label)
  );
}

/* ROUTINES */

function renderRoutinesTab() {
  const form = state.queueForms.routines;
  const completed = state.completedSections.routines;
  const left = [];
  const right = [];

  addSection(
    completed.morningAcne,
    left,
    right,
    `
      <section class="task-block">
        <div class="task-block-header">
          <div><span class="eyebrow">Routine</span><h3>Morning acne treatment</h3></div>
          <button class="small-action section-done-button" type="button" data-tab="routines" data-section="morningAcne">Done</button>
        </div>
        <div class="task-input-grid one-col">
          <label>
            <span class="field-label">Did you do it?</span>
            <select id="routinesMorningAcne">
              <option value="no" ${form.morningAcne === "no" ? "selected" : ""}>No</option>
              <option value="yes" ${form.morningAcne === "yes" ? "selected" : ""}>Yes</option>
            </select>
          </label>
        </div>
      </section>
    `,
    renderCompletedCard("routines", "morningAcne", "Morning acne treatment")
  );

  addSection(
    completed.nightAcne,
    left,
    right,
    `
      <section class="task-block">
        <div class="task-block-header">
          <div><span class="eyebrow">Routine</span><h3>Night acne treatment</h3></div>
          <button class="small-action section-done-button" type="button" data-tab="routines" data-section="nightAcne">Done</button>
        </div>
        <div class="task-input-grid one-col">
          <label>
            <span class="field-label">Did you do it?</span>
            <select id="routinesNightAcne">
              <option value="no" ${form.nightAcne === "no" ? "selected" : ""}>No</option>
              <option value="yes" ${form.nightAcne === "yes" ? "selected" : ""}>Yes</option>
            </select>
          </label>
        </div>
      </section>
    `,
    renderCompletedCard("routines", "nightAcne", "Night acne treatment")
  );

  addSection(
    completed.screenHours,
    left,
    right,
    `
      <section class="task-block">
        <div class="task-block-header">
          <div><span class="eyebrow">Focus</span><h3>Screen time</h3></div>
          <button class="small-action section-done-button" type="button" data-tab="routines" data-section="screenHours">Done</button>
        </div>
        <div class="task-input-grid one-col">
          <label>
            <span class="field-label">Hours on phone</span>
            <input id="routinesScreenHours" type="number" step="0.1" value="${escapeHtml(form.screenHours)}" />
          </label>
        </div>
      </section>
    `,
    renderCompletedCard("routines", "screenHours", "Screen time")
  );

  setHtml("routinesTaskStack", left.length ? left.join("") : renderEmptyLeft("Routines"));
  setHtml("routinesCompletedStack", right.length ? right.join("") : renderEmptyRight());

  bindSelect("routinesMorningAcne", state.queueForms.routines, "morningAcne");
  bindSelect("routinesNightAcne", state.queueForms.routines, "nightAcne");
  bindInput("routinesScreenHours", state.queueForms.routines, "screenHours", true);
  wireSectionButtons("routines");
}

/* SUPPLEMENTS */

function renderSupplementsTab() {
  const form = state.queueForms.supplements;
  const completed = state.completedSections.supplements;
  const left = [];
  const right = [];

  renderSupplement("iron", "Iron", form, completed, left, right);
  renderSupplement("zinc", "Zinc", form, completed, left, right);
  renderSupplement("magnesium", "Magnesium", form, completed, left, right);
  renderSupplement("creatine", "Creatine", form, completed, left, right);

  setHtml("supplementsTaskStack", left.length ? left.join("") : renderEmptyLeft("Supplements"));
  setHtml("supplementsCompletedStack", right.length ? right.join("") : renderEmptyRight());

  bindSelect("supplementsIron", state.queueForms.supplements, "iron");
  bindSelect("supplementsZinc", state.queueForms.supplements, "zinc");
  bindSelect("supplementsMagnesium", state.queueForms.supplements, "magnesium");
  bindSelect("supplementsCreatine", state.queueForms.supplements, "creatine");
  wireSectionButtons("supplements");
}

function renderSupplement(key, label, form, completed, left, right) {
  addSection(
    completed[key],
    left,
    right,
    `
      <section class="task-block">
        <div class="task-block-header">
          <div><span class="eyebrow">Supplements</span><h3>${label}</h3></div>
          <button class="small-action section-done-button" type="button" data-tab="supplements" data-section="${key}">Done</button>
        </div>
        <div class="task-input-grid one-col">
          <label>
            <span class="field-label">Did you take it?</span>
            <select id="supplements${capitalize(key)}">
              <option value="no" ${form[key] === "no" ? "selected" : ""}>No</option>
              <option value="yes" ${form[key] === "yes" ? "selected" : ""}>Yes</option>
            </select>
          </label>
        </div>
      </section>
    `,
    renderCompletedCard("supplements", key, label)
  );
}

/* SHARED HELPERS FOR TASKS */

function addSection(isDone, left, right, leftHtml, rightHtml) {
  if (isDone) right.push(rightHtml);
  else left.push(leftHtml);
}

function renderCompletedCard(tab, section, label) {
  return `
    <div class="completed-item">
      <div class="completed-copy">
        <span class="completed-title">${label}</span>
        <p>Marked complete for today.</p>
      </div>
      <button class="secondary-action section-undo-button" type="button" data-tab="${tab}" data-section="${section}">
        Undo
      </button>
    </div>
  `;
}

function renderEmptyLeft(label) {
  return `
    <div class="task-block">
      <div class="task-block-header">
        <div>
          <span class="eyebrow">${label}</span>
          <h3>Everything done</h3>
        </div>
      </div>
      <p class="support-copy">You cleared everything in this tab for today.</p>
    </div>
  `;
}

function renderEmptyRight() {
  return `
    <div class="task-block">
      <div class="task-block-header">
        <div>
          <span class="eyebrow">Completion</span>
          <h3>Nothing completed yet</h3>
        </div>
      </div>
      <p class="support-copy">Finished sections will move here. Undo sends them back left.</p>
    </div>
  `;
}

/* WIRES */

function wirePhysicalInputs() {
  const form = state.queueForms.physical;

  document.getElementById("physicalGymWent")?.addEventListener("change", (e) => {
    form.gymWent = e.target.value;
    syncLiveHistoryFromForms();
    saveState();
    renderPhysicalTab();
    renderCareerTab();
    renderProgressCharts();
    openTab("physical");
  });

  bindInput("physicalWeightLogged", form, "weightLogged", true);
  bindInput("physicalWorkoutType", form, "workoutType");
  bindInput("physicalCalories", form, "calories", true);
  bindInput("physicalSleptAt", form, "sleptAt", true);
  bindInput("physicalWokeAt", form, "wokeAt", true);
  bindSelect("physicalAteAfterMaghrib", form, "ateAfterMaghrib");
  bindInput("physicalWaterOz", form, "waterOz", true);
  bindInput("physicalSteps", form, "steps", true);
}

function wireDeenInputs() {
  const form = state.queueForms.deen;

  document.querySelectorAll(".deen-salah-select").forEach((select) => {
    select.addEventListener("change", (e) => {
      const key = e.target.dataset.key;
      form[key] = e.target.value;
      syncLiveHistoryFromForms();
      saveState();
      renderDeenTab();
      renderCareerTab();
      openTab("deen");
    });
  });

  document.querySelectorAll(".deen-sunnah-select").forEach((select) => {
    select.addEventListener("change", (e) => {
      const key = e.target.dataset.key;
      form[key] = e.target.value;
      syncLiveHistoryFromForms();
      saveState();
      renderCareerTab();
    });
  });

  bindInput("deenQuranPages", form, "quranPages", true);
  bindSelect("deenTahajjud", form, "tahajjud");
}

function bindInput(id, obj, key, refreshViews = false) {
  const el = document.getElementById(id);
  el?.addEventListener("input", (e) => {
    obj[key] = e.target.value;
    syncLiveHistoryFromForms();
    saveState();

    if (refreshViews) {
      renderCareerTab();
      renderProgressCharts();
      if (id === "physicalSleptAt" || id === "physicalWokeAt") {
        renderPhysicalTab();
        openTab("physical");
      }
    }
  });
}

function bindSelect(id, obj, key) {
  const el = document.getElementById(id);
  el?.addEventListener("change", (e) => {
    obj[key] = e.target.value;
    syncLiveHistoryFromForms();
    saveState();
    renderCareerTab();
  });
}

function wireSectionButtons(tabId) {
  document.querySelectorAll(`#${tabId} .section-done-button`).forEach((button) => {
    button.addEventListener("click", () => {
      const section = button.dataset.section;
      state.completedSections[tabId][section] = true;
      syncLiveHistoryFromForms();
      saveState();
      renderAll();
      openTab(tabId);
    });
  });

  document.querySelectorAll(`#${tabId} .section-undo-button`).forEach((button) => {
    button.addEventListener("click", () => {
      const section = button.dataset.section;
      state.completedSections[tabId][section] = false;
      syncLiveHistoryFromForms();
      saveState();
      renderAll();
      openTab(tabId);
    });
  });
}

/* HISTORY */

function syncLiveHistoryFromForms() {
  const today = getTodayDateString();
  const summary = summarizeCurrentDay();

  state.history = state.history.filter((x) => x.id !== "live-today" && x.date !== today);

  const historyWithoutToday = [...state.history].sort((a, b) => b.date.localeCompare(a.date));
  const previousRR = historyWithoutToday.length ? Number(historyWithoutToday[0].rrRunning || 0) : 0;
  const rrRunning = Math.max(0, previousRR + summary.rrDelta);

  const liveEntry = {
    id: "live-today",
    date: today,
    result: summary.result,
    rrDelta: summary.rrDelta,
    rrRunning,
    scoreline: `${summary.weight || 0} lb`,
    kda: `${summary.requiredDone}/${summary.requiredTotal}/${summary.optionalDone}`,
    weight: summary.weight,
    calories: summary.calories,
    steps: summary.steps,
    screenHours: summary.screenHours,
    summary
  };

  state.history.unshift(liveEntry);
  state.history.sort((a, b) => b.date.localeCompare(a.date));
}

function summarizeCurrentDay() {
  const p = state.queueForms.physical;
  const d = state.queueForms.deen;
  const r = state.queueForms.routines;
  const s = state.queueForms.supplements;

  const requiredChecks = [
    Number(p.weightLogged) > 0,
    p.gymWent === "yes",
    Number(p.calories) > 0,
    !!p.sleptAt && !!p.wokeAt,
    Number(p.waterOz) > 0,
    Number(p.steps) > 0,
    d.fajr === "yes",
    d.dhuhr === "yes",
    d.asr === "yes",
    d.maghrib === "yes",
    d.isha === "yes",
    Number(d.quranPages) > 0,
    r.morningAcne === "yes",
    r.nightAcne === "yes",
    Number(r.screenHours) > 0,
    s.iron === "yes",
    s.zinc === "yes",
    s.magnesium === "yes",
    s.creatine === "yes"
  ];

  const optionalChecks = [
    d.fajrSunnah === "yes",
    d.dhuhrSunnah === "yes",
    d.maghribSunnah === "yes",
    d.ishaSunnah === "yes",
    d.tahajjud === "yes"
  ];

  const requiredDone = requiredChecks.filter(Boolean).length;
  const requiredTotal = requiredChecks.length;
  const optionalDone = optionalChecks.filter(Boolean).length;
  const missed = requiredTotal - requiredDone;

  const result = missed === 0 ? "victory" : "defeat";
  const rrDelta = missed === 0 ? 18 : -Math.min(18, Math.max(1, missed));

  return {
    requiredDone,
    requiredTotal,
    optionalDone,
    result,
    rrDelta,
    weight: parseStoredMetric(p.weightLogged),
    calories: parseStoredMetric(p.calories),
    steps: parseStoredMetric(p.steps),
    screenHours: parseStoredMetric(r.screenHours, { allowZero: true }),
    gymWent: p.gymWent === "yes",
    allSalah: d.fajr === "yes" && d.dhuhr === "yes" && d.asr === "yes" && d.maghrib === "yes" && d.isha === "yes",
    sunnahCount: optionalChecks.slice(0, 4).filter(Boolean).length,
    tahajjud: d.tahajjud === "yes",
    quranPages: parseStoredMetric(d.quranPages, { allowZero: true }),
    waterOz: parseStoredMetric(p.waterOz, { allowZero: true }),
    sleptAt: p.sleptAt,
    wokeAt: p.wokeAt,
    ateAfterMaghrib: p.ateAfterMaghrib === "yes",
    morningAcne: r.morningAcne === "yes",
    nightAcne: r.nightAcne === "yes",
    supplementsTaken: Object.values(s).filter((x) => x === "yes").length
  };
}

function parseStoredMetric(value, options = {}) {
  const n = Number(value);
  if (Number.isFinite(n)) return n;
  return options.allowZero ? 0 : 0;
}

/* CAREER */

function renderCareerTab() {
  const shell = document.getElementById("careerShell");
  if (!shell) return;

  const history = [...state.history].sort((a, b) => b.date.localeCompare(a.date));
  const currentRR = history.length ? Number(history[0].rrRunning || 0) : 0;
  const rankName = getRankName(currentRR);
  const rrInTier = currentRR % 100;
  const fillPercent = Math.max(0, Math.min(100, rrInTier));

  shell.innerHTML = `
    <div class="career-rank-icon-wrap">
      <img class="rank-image" src="./assets/iron1.png" alt="Rank icon" />
    </div>
    <h2 class="career-rank-name">${rankName}</h2>
    <div class="career-rank-bar-wrap">
      <div class="career-rank-bar">
        <div class="career-rank-bar-fill" style="width:${fillPercent}%"></div>
      </div>
      <div class="career-rank-bar-labels">
        <span>Rank rating</span>
        <strong>${rrInTier}/100</strong>
      </div>
    </div>
    <div class="career-match-filter">
      <div class="career-filter-pill">All modes</div>
    </div>
    <div class="career-match-list">
      ${history.map(renderHistoryRow).join("")}
    </div>
  `;
}

function renderHistoryRow(item) {
  const win = item.result === "victory";
  const rrText = `${item.rrDelta > 0 ? "+" : ""}${item.rrDelta}`;
  return `
    <div class="career-match-row ${win ? "win" : "loss"}">
      <div class="career-match-main">
        <div class="career-kda">${item.kda}</div>
        <div class="career-score">${formatCareerDate(item.date)} · RR ${rrText}</div>
      </div>
      <div class="career-result">${win ? "Victory" : "Defeat"}</div>
      <div class="career-scoreline">${item.scoreline}</div>
    </div>
  `;
}

/* PROGRESS - WEIGHT ONLY */

function renderProgressCharts() {
  const range = state.progressRange || "daily";
  const weightSeries = buildSeriesFromHistory("weight", range).filter(item => item.value > 0);

  renderWeightSummary(weightSeries);
  drawWeightOnlyChart("weightChart", weightSeries);
}

function renderWeightSummary(series) {
  const current = series.length ? series[series.length - 1].value : 0;
  const start = series.length ? series[0].value : 0;
  const goal = 220;
  const totalChange = series.length ? current - start : 0;
  const toGoal = current ? current - goal : 0;
  const percent = start ? ((start - current) / start) * 100 : 0;

  setText("weightCurrentBig", current ? current.toFixed(1) : "0.0");
  setText("weightStartBig", start ? start.toFixed(1) : "0.0");
  setText("weightGoalBig", goal.toFixed(1));
  setText("weightLossBig", Math.abs(totalChange).toFixed(1));
  setText("weightLossPercent", `${Math.abs(percent).toFixed(1)}%`);
  setText("weightToGoal", Math.max(0, toGoal).toFixed(1));
  setText("weightToGoalFooter", Math.max(0, toGoal).toFixed(1));

  const streak = getWeightLoggingStreak();
  setText("bestWeightStreak", String(streak));

  const avgPerWeek = getAverageLossPerWeek(series);
  setText("avgLossWeek", avgPerWeek.toFixed(2));

  setText("goalDateEstimate", estimateGoalDate(current, goal, avgPerWeek));
}

function buildSeriesFromHistory(key, range) {
  const sorted = [...state.history]
    .filter(item => Number(item[key]) > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (range === "daily") {
    return sorted.slice(-90).map((item) => ({
      label: shortDateLabel(item.date),
      rawDate: item.date,
      value: num(item[key])
    }));
  }

  if (range === "weekly") {
    const map = new Map();

    sorted.forEach((item) => {
      const weekKey = getWeekKey(item.date);
      if (!map.has(weekKey)) map.set(weekKey, []);
      map.get(weekKey).push(num(item[key]));
    });

    return Array.from(map.entries())
      .slice(-24)
      .map(([label, values]) => ({
        label,
        rawDate: label,
        value: average(values)
      }));
  }

  const monthMap = new Map();

  sorted.forEach((item) => {
    const monthKey = item.date.slice(0, 7);
    if (!monthMap.has(monthKey)) monthMap.set(monthKey, []);
    monthMap.get(monthKey).push(num(item[key]));
  });

  return Array.from(monthMap.entries())
    .slice(-12)
    .map(([monthKey, values]) => ({
      label: monthShortLabel(monthKey),
      rawDate: monthKey,
      value: average(values)
    }));
}

function drawWeightOnlyChart(id, series) {
  const canvas = document.getElementById(id);
  if (!canvas) return;

  const tooltip = document.getElementById("weightChartTooltip");
  const wrap = canvas.parentElement;
  const rect = wrap.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  const width = Math.max(760, Math.floor(rect.width - 4));
  const height = Math.min(420, Math.max(280, wrap.clientHeight || 420));

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const leftPad = 56;
  const rightPad = 26;
  const topPad = 32;
  const bottomPad = 56;
  const chartWidth = width - leftPad - rightPad;
  const chartHeight = height - topPad - bottomPad;

  if (!series.length) {
    ctx.fillStyle = "rgba(236,248,252,0.7)";
    ctx.font = "16px Inter";
    ctx.fillText("No weight data yet", leftPad, 60);
    return;
  }

  const values = series.map(p => p.value);
  const movingAvgValues = series.map((_, i) => {
    const start = Math.max(0, i - 6);
    const slice = series.slice(start, i + 1).map(p => p.value);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });

  const allValues = [...values, ...movingAvgValues, 220];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const pad = Math.max(1.2, (max - min) * 0.15);
  const yMin = Math.max(0, min - pad);
  const yMax = max + pad;
  const yRange = Math.max(1, yMax - yMin);

  const xStep = chartWidth / Math.max(1, series.length - 1);

  const points = series.map((p, i) => ({
    ...p,
    x: leftPad + i * xStep,
    y: topPad + (1 - (p.value - yMin) / yRange) * chartHeight
  }));

  const avgPoints = movingAvgValues.map((v, i) => ({
    x: leftPad + i * xStep,
    y: topPad + (1 - (v - yMin) / yRange) * chartHeight,
    value: v
  }));

  const goal = 220;
  const goalY = topPad + (1 - (goal - yMin) / yRange) * chartHeight;

  function drawBase() {
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;

    for (let i = 0; i < 7; i++) {
      const y = topPad + i * (chartHeight / 6);
      ctx.beginPath();
      ctx.moveTo(leftPad, y);
      ctx.lineTo(width - rightPad, y);
      ctx.stroke();
    }

    const verticalCount = Math.min(series.length, 16);
    for (let i = 0; i < verticalCount; i++) {
      const x = leftPad + i * (chartWidth / Math.max(1, verticalCount - 1));
      ctx.beginPath();
      ctx.moveTo(x, topPad);
      ctx.lineTo(x, height - bottomPad);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(233,240,245,0.82)";
    ctx.font = "14px Inter";
    for (let i = 0; i < 7; i++) {
      const val = yMax - i * (yRange / 6);
      const y = topPad + i * (chartHeight / 6);
      ctx.fillText(val.toFixed(1), 8, y + 4);
    }

    ctx.textAlign = "center";
    const labelStep = Math.ceil(series.length / 7);
    series.forEach((p, i) => {
      if (i % labelStep !== 0 && i !== series.length - 1) return;
      ctx.fillStyle = "rgba(233,240,245,0.82)";
      ctx.font = "14px Inter";
      ctx.fillText(p.label, p.x, height - 18);
    });
    ctx.textAlign = "left";

    ctx.setLineDash([10, 8]);
    ctx.strokeStyle = "rgba(103,255,225,0.58)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftPad, goalY);
    ctx.lineTo(width - rightPad, goalY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(103,255,225,0.9)";
    ctx.font = "bold 14px Inter";
    const goalText = `GOAL: ${goal.toFixed(1)} LB`;
    const goalBoxW = ctx.measureText(goalText).width + 18;
    ctx.strokeStyle = "rgba(103,255,225,0.45)";
    ctx.strokeRect(width - goalBoxW - 6, goalY - 16, goalBoxW, 28);
    ctx.fillText(goalText, width - goalBoxW + 4, goalY + 3);

    ctx.strokeStyle = "rgba(230,236,242,0.54)";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    avgPoints.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    ctx.strokeStyle = "#67ffe1";
    ctx.lineWidth = 3;
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    points.forEach((p) => {
      ctx.fillStyle = "#67ffe1";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });

    const last = points[points.length - 1];
    if (last) {
      ctx.strokeStyle = "#67ffe1";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(last.x + 18, last.y - 18);
      ctx.stroke();

      const valueText = `${last.value.toFixed(1)} LB`;
      const dateText = last.label.toUpperCase();
      const boxX = Math.min(width - 126, last.x + 18);
      const boxY = Math.max(topPad + 6, last.y - 72);

      ctx.fillStyle = "rgba(9,14,20,0.96)";
      ctx.strokeStyle = "rgba(103,255,225,0.48)";
      ctx.beginPath();
      ctx.rect(boxX, boxY, 118, 62);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#67ffe1";
      ctx.font = "bold 26px Rajdhani";
      ctx.fillText(valueText, boxX + 10, boxY + 28);

      ctx.fillStyle = "rgba(236,248,252,0.8)";
      ctx.font = "14px Inter";
      ctx.fillText(dateText, boxX + 10, boxY + 48);
    }
  }

  drawBase();

  canvas.onmousemove = (event) => {
    const bounds = canvas.getBoundingClientRect();
    const mx = event.clientX - bounds.left;
    const my = event.clientY - bounds.top;

    let hit = -1;
    points.forEach((p, i) => {
      const dx = mx - p.x;
      const dy = my - p.y;
      if (Math.sqrt(dx * dx + dy * dy) <= 12) hit = i;
    });

    drawBase();

    if (hit === -1) {
      tooltip?.classList.add("hidden");
      return;
    }

    const p = points[hit];

    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x, topPad);
    ctx.lineTo(p.x, height - bottomPad);
    ctx.stroke();

    ctx.fillStyle = "#041019";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#67ffe1";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    ctx.stroke();

    if (tooltip) {
      tooltip.innerHTML = `
        <strong>${p.value.toFixed(1)} LB</strong>
        <span>${p.label}</span>
      `;
      tooltip.style.left = `${p.x}px`;
      tooltip.style.top = `${p.y}px`;
      tooltip.classList.remove("hidden");
    }
  };

  canvas.onmouseleave = () => {
    tooltip?.classList.add("hidden");
    drawBase();
  };
}

function getWeightLoggingStreak() {
  const items = [...state.history]
    .filter(item => Number(item.weight) > 0)
    .sort((a, b) => b.date.localeCompare(a.date));

  let streak = 0;
  let cursor = new Date();

  for (const item of items) {
    const expected = cursor.toISOString().slice(0, 10);
    if (item.date === expected) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streak === 0) {
      cursor.setDate(cursor.getDate() - 1);
      if (item.date === cursor.toISOString().slice(0, 10)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return streak;
}

function getAverageLossPerWeek(series) {
  if (series.length < 2) return 0;
  const first = series[0].value;
  const last = series[series.length - 1].value;
  const change = first - last;
  const weeks = Math.max(1, series.length / 7);
  return change / weeks;
}

function estimateGoalDate(current, goal, avgPerWeek) {
  if (!current || current <= goal) return "REACHED";
  if (!avgPerWeek || avgPerWeek <= 0) return "--";

  const poundsLeft = current - goal;
  const weeksNeeded = poundsLeft / avgPerWeek;
  const daysNeeded = Math.ceil(weeksNeeded * 7);

  const d = new Date();
  d.setDate(d.getDate() + daysNeeded);

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).toUpperCase();
}

/* HELPERS */

function formatCareerDate(dateString) {
  const d = new Date(`${dateString}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function average(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function shortDateLabel(dateString) {
  const d = new Date(`${dateString}T12:00:00`);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

function monthShortLabel(monthKey) {
  const [y, m] = monthKey.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(undefined, { month: "short" });
}

function getWeekKey(dateString) {
  const start = startOfWeek(new Date(`${dateString}T12:00:00`));
  return `${String(start.getMonth() + 1).padStart(2, "0")}/${String(start.getDate()).padStart(2, "0")}`;
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}

function getRankName(rr) {
  if (rr >= 700) return "Diamond 1";
  if (rr >= 600) return "Platinum 1";
  if (rr >= 500) return "Gold 1";
  if (rr >= 400) return "Silver 1";
  if (rr >= 300) return "Bronze 1";
  return "Iron 1";
}

function getDayCompletionPercent() {
  const total = getTotalSectionCount();
  return total ? Math.round((getCompletedSectionCount() / total) * 100) : 0;
}

function getCompletedSectionCount() {
  return Object.values(state.completedSections).reduce(
    (sum, group) => sum + Object.values(group).filter(Boolean).length,
    0
  );
}

function getTotalSectionCount() {
  return Object.values(state.completedSections).reduce(
    (sum, group) => sum + Object.keys(group).length,
    0
  );
}

function getNextSalahText() {
  const prayers = [
    { key: "fajr", time: state.settings.fajrTime },
    { key: "dhuhr", time: state.settings.dhuhrTime },
    { key: "asr", time: state.settings.asrTime },
    { key: "maghrib", time: state.settings.maghribTime },
    { key: "isha", time: state.settings.ishaTime }
  ];

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (const prayer of prayers) {
    const prayerMinutes = parseTimeToMinutes(prayer.time);
    if (prayerMinutes !== null && prayerMinutes > nowMinutes) {
      return `${formatPrayerLabel(prayer.key)} in ${formatMinutesLeft(prayerMinutes - nowMinutes)}`;
    }
  }

  const fajr = parseTimeToMinutes(state.settings.fajrTime);
  if (fajr === null) return "Set prayer times";
  return `Fajr in ${formatMinutesLeft(24 * 60 - nowMinutes + fajr)}`;
}

function parseTimeToMinutes(str) {
  if (!str || !str.includes(":")) return null;
  const [h, m] = str.split(":").map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m;
}

function formatPrayerLabel(key) {
  return {
    fajr: "Fajr",
    dhuhr: "Dhuhr",
    asr: "Asr",
    maghrib: "Maghrib",
    isha: "Isha"
  }[key] || key;
}

function formatMinutesLeft(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function calculateSleepHours(sleptAt, wokeAt) {
  if (!sleptAt || !wokeAt) return "0.0 h";

  const [sh, sm] = String(sleptAt).split(":").map(Number);
  const [wh, wm] = String(wokeAt).split(":").map(Number);
  if ([sh, sm, wh, wm].some(Number.isNaN)) return "0.0 h";

  let s = sh * 60 + sm;
  let w = wh * 60 + wm;
  if (w <= s) w += 24 * 60;

  return `${((w - s) / 60).toFixed(1)} h`;
}

function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function getInputValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setHtml(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = value;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}