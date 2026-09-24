// ===== Time Management Module =====
const TIME_KEY = 'focusflow_times';
const DAILY_TARGET_KEY = 'focusflow_daily_target';
const PREVIOUS_OVERTIME_KEY = 'focusflow_previous_overtime';

let times = JSON.parse(localStorage.getItem(TIME_KEY)) || [];

function getDailyTargetHours() {
  const storedValue = Number.parseFloat(localStorage.getItem(DAILY_TARGET_KEY));
  return Number.isFinite(storedValue) && storedValue > 0 ? storedValue : 8;
}

function getPreviousOvertimeMinutes() {
  const storedValue = Number.parseFloat(localStorage.getItem(PREVIOUS_OVERTIME_KEY));
  return Number.isFinite(storedValue) ? storedValue * 60 : 0;
}

function setDailyTargetHours(hours) {
  const safeValue = Number.parseFloat(hours);
  localStorage.setItem(DAILY_TARGET_KEY, String(Number.isFinite(safeValue) && safeValue > 0 ? safeValue : 8));
}

function setPreviousOvertimeHours(hours) {
  const safeValue = Number.parseFloat(hours);
  localStorage.setItem(PREVIOUS_OVERTIME_KEY, String(Number.isFinite(safeValue) ? safeValue : 0));
}

function formatDurationMinutes(totalMinutes) {
  const absMinutes = Math.abs(totalMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

function formatSignedDuration(totalMinutes) {
  if (totalMinutes === 0) return '0h 00m';
  const sign = totalMinutes > 0 ? '+' : '-';
  return `${sign}${formatDurationMinutes(totalMinutes)}`;
}

function getBreakMinutes(totalMinutes) {
  if (totalMinutes <= 0) return 0;

  let pauseMinutes = 0;

  if (totalMinutes >= 6 * 60) {
    pauseMinutes += 30;
  }

  const extraPauseThreshold = 9 * 60 + 30;
  if (totalMinutes > extraPauseThreshold) {
    pauseMinutes += Math.min(15, totalMinutes - extraPauseThreshold);
  }

  return pauseMinutes;
}

function calculateDurationMinutes(start, end) {
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  return Math.max((eH * 60 + eM) - (sH * 60 + sM), 0);
}

function calculateEffectiveWorkingMinutes(start, end) {
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);

  const startMinutes = sH * 60 + sM;
  const endMinutes = eH * 60 + eM;
  const cutoffMinutes = 6 * 60 + 30;
  const effectiveStartMinutes = Math.max(startMinutes, cutoffMinutes);

  return Math.max(endMinutes - effectiveStartMinutes, 0);
}

function calculateNetWorkingMinutes(start, end) {
  const effectiveMinutes = calculateEffectiveWorkingMinutes(start, end);
  const pauseMinutes = getBreakMinutes(effectiveMinutes);
  return Math.max(effectiveMinutes - pauseMinutes, 0);
}

function saveTimes() {
  localStorage.setItem(TIME_KEY, JSON.stringify(times));
}

function calculateDailySummary() {
  const dailyMap = new Map();

  times.forEach((entry) => {
    if (!entry?.date) return;
    const rawMinutes = calculateDurationMinutes(entry.start, entry.end);
    const dayMinutes = dailyMap.get(entry.date) || 0;
    dailyMap.set(entry.date, dayMinutes + rawMinutes);
  });

  const dailyTargetMinutes = getDailyTargetHours() * 60;

  return [...dailyMap.entries()]
    .map(([date, totalMinutes]) => {
      const countedMinutes = times
        .filter((entry) => entry.date === date)
        .reduce((sum, entry) => sum + calculateEffectiveWorkingMinutes(entry.start, entry.end), 0);
      const pauseMinutes = getBreakMinutes(countedMinutes);
      const netMinutes = Math.max(countedMinutes - pauseMinutes, 0);

      return {
        date,
        totalMinutes,
        pauseMinutes,
        netMinutes,
        targetMinutes: dailyTargetMinutes,
        diffMinutes: netMinutes - dailyTargetMinutes
      };
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getCurrentBalanceMinutes() {
  return calculateDailySummary().reduce((sum, entry) => sum + entry.diffMinutes, 0);
}

function renderSummary() {
  const totalBalanceEl = document.getElementById('totalBalance');
  const previousBalanceEl = document.getElementById('previousBalance');
  const currentBalanceEl = document.getElementById('currentBalance');

  if (!totalBalanceEl || !previousBalanceEl || !currentBalanceEl) return;

  const previousMinutes = getPreviousOvertimeMinutes();
  const currentMinutes = getCurrentBalanceMinutes();
  const totalMinutes = previousMinutes + currentMinutes;

  previousBalanceEl.textContent = formatSignedDuration(previousMinutes);
  currentBalanceEl.textContent = formatSignedDuration(currentMinutes);
  totalBalanceEl.textContent = formatSignedDuration(totalMinutes);

  const dailyTargetInput = document.getElementById('dailyTargetInput');
  const previousOvertimeInput = document.getElementById('previousOvertimeInput');

  if (dailyTargetInput) dailyTargetInput.value = String(getDailyTargetHours());
  if (previousOvertimeInput) previousOvertimeInput.value = String(Math.round((previousMinutes / 60) * 100) / 100);
}

function renderDailySummary() {
  const tbody = document.querySelector('#timesTable tbody');
  if (!tbody) return;

  const rows = calculateDailySummary();
  tbody.innerHTML = '';

  if (rows.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="8" style="opacity: 0.5; text-align: center;">Noch keine Tagesübersicht vorhanden</td>';
    tbody.appendChild(tr);
    return;
  }

  const timeRows = times.map((time) => {
    const rawMinutes = calculateDurationMinutes(time.start, time.end);
    const effectiveMinutes = calculateEffectiveWorkingMinutes(time.start, time.end);
    const pauseMinutes = getBreakMinutes(effectiveMinutes);
    const netMinutes = calculateNetWorkingMinutes(time.start, time.end);
    const targetMinutes = getDailyTargetHours() * 60;
    const diffMinutes = netMinutes - targetMinutes;
    return { time, rawMinutes: effectiveMinutes, pauseMinutes, netMinutes, targetMinutes, diffMinutes };
  });

  timeRows.forEach(({ time, rawMinutes, pauseMinutes, netMinutes, targetMinutes, diffMinutes }) => {
    const tr = document.createElement('tr');
    const deltaClass = diffMinutes >= 0 ? 'delta-positive' : 'delta-negative';
    tr.innerHTML = `
      <td>${formatDate(time.date)}</td>
      <td>${time.start}</td>
      <td>${time.end}</td>
      <td>${formatDurationMinutes(rawMinutes)}</td>
      <td>${formatDurationMinutes(pauseMinutes)}</td>
      <td>${formatDurationMinutes(netMinutes)}</td>
      <td>${formatDurationMinutes(targetMinutes)}</td>
      <td class="${deltaClass}">${formatSignedDuration(diffMinutes)}</td>
      <td>
        <button class="btn-delete" onclick="deleteTime(${time.id})" title="Löschen">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function addTime(time) {
  if (!time.date || !time.start || !time.end) {
    alert('Bitte alle Felder ausfüllen!');
    return false;
  }

  if (time.start >= time.end) {
    alert('Startzeit muss vor Endzeit liegen!');
    return false;
  }

  times.push({
    id: Date.now(),
    date: time.date,
    start: time.start,
    end: time.end
  });

  times.sort((a, b) => new Date(b.date) - new Date(a.date));
  saveTimes();
  renderAll();
  return true;
}

function deleteTime(id) {
  if (!confirm('Diese Zeit wirklich löschen?')) return;
  times = times.filter((t) => t.id !== id);
  saveTimes();
  renderAll();
}

function renderTimes() {
  const tbody = document.querySelector('#timesTable tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (times.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="9" style="opacity: 0.5; text-align: center;">Keine Zeiten gespeichert</td>';
    tbody.appendChild(tr);
    return;
  }

  times.forEach((time) => {
    const rawMinutes = calculateDurationMinutes(time.start, time.end);
    const pauseMinutes = getBreakMinutes(rawMinutes);
    const effectiveMinutes = rawMinutes - pauseMinutes;
    const targetMinutes = getDailyTargetHours() * 60;
    const diffMinutes = effectiveMinutes - targetMinutes;
    const tr = document.createElement('tr');
    const deltaClass = diffMinutes >= 0 ? 'delta-positive' : 'delta-negative';
    tr.innerHTML = `
      <td>${formatDate(time.date)}</td>
      <td>${time.start}</td>
      <td>${time.end}</td>
      <td>${formatDurationMinutes(rawMinutes)}</td>
      <td>${formatDurationMinutes(pauseMinutes)}</td>
      <td>${formatDurationMinutes(effectiveMinutes)}</td>
      <td>${formatDurationMinutes(targetMinutes)}</td>
      <td class="${deltaClass}">${formatSignedDuration(diffMinutes)}</td>
      <td>
        <button class="btn-delete" onclick="deleteTime(${time.id})" title="Löschen">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function setupColumnResizing() {
  const table = document.getElementById('timesTable');
  if (!table) return;

  const headers = Array.from(table.querySelectorAll('th'));
  headers.forEach((header, index) => {
    if (header.querySelector('.resize-handle')) return;

    const handle = document.createElement('span');
    handle.className = 'resize-handle';
    handle.dataset.index = String(index);
    header.appendChild(handle);

    handle.addEventListener('mousedown', (event) => {
      const startX = event.clientX;
      const currentWidth = header.getBoundingClientRect().width;
      const tableMinWidth = 100;

      const onMove = (moveEvent) => {
        const nextWidth = Math.max(tableMinWidth, currentWidth + (moveEvent.clientX - startX));
        header.style.width = `${nextWidth}px`;
        const cells = Array.from(table.querySelectorAll('tr')).map((row) => row.children[index]).filter(Boolean);
        cells.forEach((cell) => {
          cell.style.width = `${nextWidth}px`;
        });
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    handle.addEventListener('dblclick', () => {
      const columnCells = Array.from(table.querySelectorAll('tr')).map((row) => row.children[index]).filter(Boolean);
      const longest = columnCells.reduce((max, cell) => {
        const content = cell.textContent.trim();
        const width = content ? content.length * 8 + 28 : 80;
        return Math.max(max, width);
      }, 100);
      header.style.width = `${Math.max(longest, 100)}px`;
      columnCells.forEach((cell) => {
        cell.style.width = `${Math.max(longest, 100)}px`;
      });
    });
  });
}

function renderAll() {
  renderTimes();
  renderDailySummary();
  renderSummary();
  setupColumnResizing();
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('de-DE', { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' });
}

function clearTimes() {
  if (!confirm('Alle gespeicherten Zeiten wirklich löschen?')) return;
  times = [];
  saveTimes();
  renderAll();
}

class ThemeManager {
  constructor() {
    this.dark = localStorage.getItem('theme-dark') !== 'false';
    this.init();
  }

  init() {
    this.applyTheme();
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) toggle.addEventListener('click', () => this.toggle());
  }

  toggle() {
    this.dark = !this.dark;
    localStorage.setItem('theme-dark', this.dark);
    this.applyTheme();
  }

  applyTheme() {
    document.body.classList.toggle('light', !this.dark);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.collapsible-card .collapsible-header').forEach((header) => {
    const card = header.closest('.collapsible-card');
    if (!card) return;

    header.addEventListener('click', () => {
      const isCollapsed = card.classList.toggle('collapsed');
      header.setAttribute('aria-expanded', String(!isCollapsed));
    });
  });

  renderAll();

  const form = document.getElementById('timeForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const newTime = {
        date: document.getElementById('dateInput').value,
        start: document.getElementById('startInput').value,
        end: document.getElementById('endInput').value
      };

      if (addTime(newTime)) {
        form.reset();
      }
    });
  }

  const balanceSettingsForm = document.getElementById('balanceSettingsForm');
  if (balanceSettingsForm) {
    balanceSettingsForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const dailyTargetInput = document.getElementById('dailyTargetInput');
      const previousOvertimeInput = document.getElementById('previousOvertimeInput');

      if (dailyTargetInput) setDailyTargetHours(dailyTargetInput.value);
      if (previousOvertimeInput) setPreviousOvertimeHours(previousOvertimeInput.value);

      renderAll();
    });
  }

  const themeManager = new ThemeManager();
  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) clearBtn.addEventListener('click', clearTimes);

  window.addEventListener('storage', (event) => {
    if (event.key === TIME_KEY || event.key === DAILY_TARGET_KEY || event.key === PREVIOUS_OVERTIME_KEY) {
      times = JSON.parse(localStorage.getItem(TIME_KEY)) || [];
      renderAll();
    }
  });
});