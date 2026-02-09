// ===== Time Management Module =====
const TIME_KEY = 'focusflow_times';
let times = JSON.parse(localStorage.getItem(TIME_KEY)) || [];

/**
 * Speichert Zeiten im localStorage
 */
function saveTimes() {
  localStorage.setItem(TIME_KEY, JSON.stringify(times));
}

/**
 * Fügt eine neue Zeit hinzu
 * @param {Object} time - {date: string, start: string, end: string}
 * @returns {boolean} - true wenn erfolgreich, false wenn ungültig
 */
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
  
  // Sortiere nach Datum (neueste zuerst)
  times.sort((a, b) => new Date(b.date) - new Date(a.date));
  saveTimes();
  return true;
}

/**
 * Löscht eine Zeit nach ID
 * @param {number} id - Die ID der Zeit
 */
function deleteTime(id) {
  if (!confirm('Diese Zeit wirklich löschen?')) return;
  times = times.filter(t => t.id !== id);
  saveTimes();
  renderTimes();
}

/**
 * Rendert alle gespeicherten Zeiten in der Tabelle
 */
function renderTimes() {
  const tbody = document.querySelector('#timesTable tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (times.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="4" style="opacity: 0.5; text-align: center;">Keine Zeiten gespeichert</td>';
    tbody.appendChild(tr);
    return;
  }
  
  times.forEach(time => {
    const tr = document.createElement('tr');
    const dauer = calculateDuration(time.start, time.end);
    tr.innerHTML = `
      <td>${formatDate(time.date)}</td>
      <td>${time.start}</td>
      <td>${time.end}</td>
      <td>
        <button class="btn-delete" onclick="deleteTime(${time.id})" title="Löschen">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Berechnet die Dauer zwischen Start- und Endzeit
 * @param {string} start - Startzeit (HH:MM)
 * @param {string} end - Endzeit (HH:MM)
 * @returns {string} - Dauer im Format "0h 0m"
 */
function calculateDuration(start, end) {
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  const diffMinutes = (eH * 60 + eM) - (sH * 60 + sM);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours}h ${minutes}m`;
}

/**
 * Formatiert ein Datum (YYYY-MM-DD) zu lesbarem Format
 * @param {string} dateStr - Datum als String (YYYY-MM-DD)
 * @returns {string} - Formatiertes Datum
 */
function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('de-DE', { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' });
}

/**
 * Löscht alle gespeicherten Zeiten
 */
function clearTimes() {
  if (!confirm('Alle gespeicherten Zeiten wirklich löschen?')) return;
  times = [];
  saveTimes();
  renderTimes();
}

// =========================
// Theme Management
// =========================
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  renderTimes();
  
  // Form submission
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
        renderTimes();
      }
    });
  }
  
  // Initialize theme manager and clear button
  const themeManager = new ThemeManager();
  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) clearBtn.addEventListener('click', clearTimes);
  
  // Listen for storage changes from other tabs/windows (e.g., index.html)
  window.addEventListener('storage', (event) => {
    if (event.key === TIME_KEY) {
      // Reload times from localStorage and re-render table
      times = JSON.parse(localStorage.getItem(TIME_KEY)) || [];
      renderTimes();
    }
  });
});