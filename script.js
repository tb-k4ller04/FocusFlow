// =========================
// Password Protection
// =========================
const CORRECT_PASSWORD = 'Grafik.karte5090';

function checkPassword() {
  const input = document.getElementById('passwordInput').value;
  if (input === CORRECT_PASSWORD) {
    document.getElementById('passwordModal').style.display = 'none';
    document.body.style.overflow = 'auto';
  } else {
    document.getElementById('passwordError').style.display = 'block';
    document.getElementById('passwordInput').value = '';
  }
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
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggle());
    }
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

// =========================
// Quote Management
// =========================
class QuoteManager {
  constructor() {
    this.quotes = [
      'Fortschritt ist besser als Perfektion.',
      'Fokus ist eine Superkraft.',
      'Disziplin schlägt Motivation.',
      'Heute zählt.',
      'Kleine Schritte, große Wirkung.',
      'Jede erledigte Aufgabe zählt.',
      'Start jetzt, nicht morgen.'
    ];
    this.init();
  }
  
  init() {
    this.showNewQuote();
    setInterval(() => this.showNewQuote(), 10000);
  }
  
  showNewQuote() {
    const quoteElement = document.getElementById('quote');
    if (!quoteElement) return;
    const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
    quoteElement.textContent = randomQuote;
  }
}

// =========================
// To-Do List Management
// =========================
class TodoManager {
  constructor() {
    this.TODO_KEY = 'focusflow_todos';
    this.todos = JSON.parse(localStorage.getItem(this.TODO_KEY)) || [];
    this.init();
  }
  
  init() {
    const todoForm = document.getElementById('todoForm');
    if (todoForm) {
      todoForm.addEventListener('submit', (e) => this.handleAddTodo(e));
    }
    this.render();
  }
  
  handleAddTodo(e) {
    e.preventDefault();
    const title = document.getElementById('todoTitle')?.value.trim();
    if (!title) {
      alert('Bitte einen Titel eingeben!');
      return;
    }
    
    const desc = document.getElementById('todoDesc')?.value.trim() || '';
    const urgency = document.getElementById('todoUrgency')?.value || 'Mittel';
    const due = document.getElementById('todoDue')?.value || '';
    const author = document.getElementById('todoAuthor')?.value || 'Unbekannt';
    
    this.add({ title, desc, urgency, due, author, done: false });
    document.getElementById('todoForm').reset();
  }
  
  add(todo) {
    this.todos.push(todo);
    this.save();
    this.render();
  }
  
  finish(index) {
    if (this.todos[index]) {
      this.todos[index].done = true;
      this.save();
      this.render();
    }
  }
  
  edit(index) {
    const todo = this.todos[index];
    if (!todo) return;
    
    document.getElementById('todoTitle').value = todo.title;
    document.getElementById('todoDesc').value = todo.desc;
    this.delete(index);
  }
  
  delete(index) {
    this.todos.splice(index, 1);
    this.save();
    this.render();
  }
  
  clearDone() {
    if (!confirm('Alle erledigten Aufgaben löschen?')) return;
    this.todos = this.todos.filter(t => !t.done);
    this.save();
    this.render();
  }
  
  save() {
    localStorage.setItem(this.TODO_KEY, JSON.stringify(this.todos));
  }
  
  render() {
    const list = document.getElementById('todoList');
    if (!list) return;
    
    list.innerHTML = '';
    const activeTodos = this.todos.filter(t => !t.done);
    
    if (activeTodos.length === 0) {
      list.innerHTML = '<li style="opacity: 0.5; text-align: center;">Keine aktiven Aufgaben</li>';
      return;
    }
    
    activeTodos.forEach((todo, index) => {
      const allIndex = this.todos.indexOf(todo);
      const li = document.createElement('li');
      li.innerHTML = `
        <div>
          <strong>${todo.title}</strong> <span style="color: var(--accent);">(${todo.urgency})</span>
          <p style="margin: 0.5rem 0; opacity: 0.8;">${todo.desc}</p>
          <small>Fällig: ${todo.due || '-'} | Von: ${todo.author}</small>
        </div>
      `;
      
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.gap = '0.5rem';
      
      const finishBtn = document.createElement('button');
      finishBtn.textContent = '✓';
      finishBtn.className = 'btn-delete';
      finishBtn.addEventListener('click', () => this.finish(allIndex));
      
      const editBtn = document.createElement('button');
      editBtn.textContent = '✏️';
      editBtn.className = 'btn-delete';
      editBtn.addEventListener('click', () => this.edit(allIndex));
      
      buttonContainer.appendChild(finishBtn);
      buttonContainer.appendChild(editBtn);
      li.appendChild(buttonContainer);
      list.appendChild(li);
    });
  }
}

// =========================
// Time Management
// =========================
class TimeManager {
  constructor() {
    this.TIME_KEY = 'focusflow_times';
    this.times = JSON.parse(localStorage.getItem(this.TIME_KEY)) || [];
    this.init();
  }
  
  init() {
    const clockInBtn = document.getElementById('clockInBtn');
    const clockOutBtn = document.getElementById('clockOutBtn');
    const showTimesBtn = document.getElementById('showTimesBtn');
    
    if (clockInBtn) clockInBtn.addEventListener('click', () => this.clockIn());
    if (clockOutBtn) clockOutBtn.addEventListener('click', () => this.clockOut());
    if (showTimesBtn) showTimesBtn.addEventListener('click', () => {
      const w = window.open('zeiten.html', '_blank');
      try { if (w) w.opener = null; } catch (e) { /* ignore */ }
    });
  }
  
  clockIn() {
    const now = new Date();
    this.times.push({
      id: Date.now(),
      date: now.toISOString().split('T')[0], // store as YYYY-MM-DD for portability
      start: now.toTimeString().slice(0,8), // HH:MM:SS
      end: ''
    });
    this.save();
  }
  
  clockOut() {
    for (let i = this.times.length - 1; i >= 0; i--) {
      if (!this.times[i].end) {
        const now = new Date();
        this.times[i].end = now.toTimeString().slice(0,8);
        this.save();
        return;
      }
    }
    // no active stamp found
  }
  
  save() {
    localStorage.setItem(this.TIME_KEY, JSON.stringify(this.times));
    // notify listeners that times changed
    try { document.dispatchEvent(new CustomEvent('timesUpdated')); } catch (e) { }
  }
}

// =========================
// Timer Management
// =========================
class TimerManager {
  constructor() {
    this.timerInterval = null;
    this.timerSeconds = 0;
    this.init();
  }
  
  init() {
    const startBtn = document.getElementById('startTimerBtn');
    const resetBtn = document.getElementById('resetTimerBtn');
    
    if (startBtn) startBtn.addEventListener('click', () => this.start());
    if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
  }
  
  start() {
    if (this.timerInterval) {
      alert('Timer ist bereits gestartet!');
      return;
    }
    
    const hours = parseInt(document.getElementById('hours')?.value) || 0;
    const minutes = parseInt(document.getElementById('minutes')?.value) || 0;
    const seconds = parseInt(document.getElementById('seconds')?.value) || 0;
    
    if (hours === 0 && minutes === 0 && seconds === 0) {
      alert('Bitte Zeit eingeben!');
      return;
    }
    
    this.timerSeconds = hours * 3600 + minutes * 60 + seconds;
    const mode = document.getElementById('timerMode')?.value || 'countdown';
    
    this.timerInterval = setInterval(() => {
      if (mode === 'stopwatch') {
        this.timerSeconds++;
      } else {
        this.timerSeconds--;
        if (this.timerSeconds < 0) {
          this.reset();
          alert('Zeit abgelaufen!');
          return;
        }
      }
      this.updateDisplay();
    }, 1000);
  }
  
  reset() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.timerSeconds = 0;
    this.updateDisplay();
  }
  
  updateDisplay() {
    const hours = Math.floor(this.timerSeconds / 3600);
    const minutes = Math.floor((this.timerSeconds % 3600) / 60);
    const seconds = this.timerSeconds % 60;
    
    const display = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const timerElement = document.getElementById('timer');
    if (timerElement) {
      timerElement.textContent = display;
    }
  }
}

// =========================
// Notes Management
// =========================
class NotesManager {
  constructor() {
    this.NOTE_KEY = 'focusflow_notes';
    this.notes = JSON.parse(localStorage.getItem(this.NOTE_KEY)) || [];
    this.init();
  }
  
  init() {
    const noteForm = document.getElementById('noteForm');
    if (noteForm) {
      noteForm.addEventListener('submit', (e) => this.handleAddNote(e));
    }
    this.render();
  }
  
  handleAddNote(e) {
    e.preventDefault();
    const input = document.getElementById('noteInput');
    const value = input?.value.trim();
    
    if (!value) {
      alert('Bitte eine Notiz eingeben!');
      return;
    }
    
    this.add(value);
    input.value = '';
  }
  
  add(note) {
    this.notes.push(note);
    this.save();
    this.render();
  }
  
  edit(index) {
    const newValue = prompt('Notiz bearbeiten:', this.notes[index]);
    if (newValue) {
      this.notes[index] = newValue;
      this.save();
      this.render();
    }
  }
  
  delete(index) {
    this.notes.splice(index, 1);
    this.save();
    this.render();
  }
  
  save() {
    localStorage.setItem(this.NOTE_KEY, JSON.stringify(this.notes));
  }
  
  render() {
    const container = document.getElementById('notesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (this.notes.length === 0) {
      container.innerHTML = '<li style="opacity: 0.5; text-align: center;">Keine Notizen vorhanden</li>';
      return;
    }
    
    this.notes.forEach((note, index) => {
      const li = document.createElement('li');
      li.textContent = note;
      
      const editBtn = document.createElement('button');
      editBtn.textContent = '✏️';
      editBtn.className = 'btn-delete';
      editBtn.addEventListener('click', () => this.edit(index));
      
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '🗑️';
      deleteBtn.className = 'btn-delete';
      deleteBtn.addEventListener('click', () => this.delete(index));
      
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
      container.appendChild(li);
    });
  }
}

// =========================
// Calendar Management (Events)
// =========================
class CalendarManager {
  constructor() {
    this.EVENTS_KEY = 'focusflow_events';
    this.events = JSON.parse(localStorage.getItem(this.EVENTS_KEY)) || [];
    const _now = new Date();
    const _pad = (n) => String(n).padStart(2, '0');
    this.selectedDate = `${_now.getFullYear()}-${_pad(_now.getMonth() + 1)}-${_pad(_now.getDate())}`;
    this.currentViewMonth = new Date();
    this.editingId = null;
    this.init();
  }
  
  init() {
    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
      eventForm.addEventListener('submit', (e) => this.handleAddEvent(e));
    }
    
    // Modal handlers
    const eventModalForm = document.getElementById('eventModalForm');
    if (eventModalForm) {
      eventModalForm.addEventListener('submit', (e) => this.handleAddEventFromModal(e));
    }
    
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
      modalClose.addEventListener('click', () => this.closeModal());
    }
    
    const modal = document.getElementById('eventModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }
    
    // Set today's date as default
    const eventDate = document.getElementById('eventDate');
    if (eventDate) {
      eventDate.valueAsDate = new Date();
    }
    
    this.render();
  }
  
  handleAddEvent(e) {
    e.preventDefault();
    const date = document.getElementById('eventDate')?.value;
    const time = document.getElementById('eventTime')?.value;
    const title = document.getElementById('eventTitle')?.value.trim();
    const desc = document.getElementById('eventDesc')?.value.trim() || '';
    
    if (!date || !time || !title) {
      alert('Bitte Datum, Uhrzeit und Titel ausfüllen!');
      return;
    }
    
    this.add({ date, time, title, desc });
    document.getElementById('eventForm').reset();
    // Set today's date as default
    document.getElementById('eventDate').valueAsDate = new Date();
  }
  
  handleAddEventFromModal(e) {
    e.preventDefault();
    const date = document.getElementById('eventModalDate')?.value;
    const time = document.getElementById('eventModalTime')?.value;
    const title = document.getElementById('eventModalTitle')?.value.trim();
    const desc = document.getElementById('eventModalDesc')?.value.trim() || '';
    
    if (!date || !time || !title) {
      alert('Bitte Datum, Uhrzeit und Titel ausfüllen!');
      return;
    }
    
    if (this.editingId) {
      const idx = this.events.findIndex(ev => ev.id === this.editingId);
      if (idx !== -1) {
        this.events[idx] = Object.assign({}, this.events[idx], { date, time, title, desc });
        this.sort();
        this.save();
        this.render();
      }
      this.editingId = null;
    } else {
      this.add({ date, time, title, desc });
    }
    this.closeModal();
  }
  
  add(event) {
    this.events.push({
      id: Date.now(),
      date: event.date,
      time: event.time,
      title: event.title,
      desc: event.desc
    });
    this.sort();
    this.save();
    this.render();
  }
  
  delete(id) {
    if (!confirm('Termin wirklich löschen?')) return;
    this.events = this.events.filter(e => e.id !== id);
    this.save();
    this.render();
  }
  
  sort() {
    this.events.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  }
  
  save() {
    localStorage.setItem(this.EVENTS_KEY, JSON.stringify(this.events));
    try { document.dispatchEvent(new CustomEvent('eventsUpdated')); } catch (e) { }
  }
  
  render() {
    this.renderCalendar();
    this.renderTodayEvents();
  }
  
  openModal(dateStr) {
    const modal = document.getElementById('eventModal');
    const dateInput = document.getElementById('eventModalDate');
    const timeInput = document.getElementById('eventModalTime');
    
    this.selectedDate = dateStr;
    
    if (dateInput) dateInput.value = dateStr;
    if (timeInput) timeInput.value = '10:00';
    
    if (modal) {
      modal.classList.add('active');
    }
  }

  openModalForEdit(id) {
    const ev = this.events.find(x => x.id === id);
    if (!ev) return;
    const modal = document.getElementById('eventModal');
    if (!modal) return;

    document.getElementById('eventModalDate').value = ev.date;
    document.getElementById('eventModalTime').value = ev.time || '10:00';
    document.getElementById('eventModalTitle').value = ev.title || '';
    document.getElementById('eventModalDesc').value = ev.desc || '';

    this.editingId = id;
    modal.classList.add('active');
  }
  
  closeModal() {
    const modal = document.getElementById('eventModal');
    if (modal) {
      modal.classList.remove('active');
      // Clear form when closing modal
      document.getElementById('eventModalForm')?.reset();
      // clear editing state
      this.editingId = null;
    }
  }
  
  showDayEvents(dateStr) {
    const container = document.getElementById('todayEvents');
    if (!container) return;
    
    // Parse date correctly without timezone offset
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const selectedDate = date.toLocaleDateString('de-DE', 
      { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    container.innerHTML = '';
    
    const dayEvents = this.events.filter(e => e.date === dateStr);
    
    if (dayEvents.length === 0) {
      const li = document.createElement('li');
      li.textContent = `Keine Termine für ${selectedDate}`;
      li.style.opacity = '0.5';
      li.style.textAlign = 'center';
      container.appendChild(li);
      return;
    }
    
    // show date header
    const header = document.createElement('li');
    header.style.fontWeight = 'bold';
    header.style.marginBottom = '0.5rem';
    header.textContent = selectedDate;
    container.appendChild(header);
    
    dayEvents.forEach(event => {
      const li = document.createElement('li');
      li.style.padding = '0.75rem';
      li.style.backgroundColor = 'rgba(56, 189, 248, 0.1)';
      li.style.borderRadius = '0.5rem';
      li.style.marginBottom = '0.5rem';
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'flex-start';
      
      const content = document.createElement('div');
      content.style.flex = '1';
      content.innerHTML = `
        <strong>${event.time} — ${event.title}</strong>
        ${event.desc ? `<p style="margin: 0.5rem 0 0 0; opacity: 0.8; font-size: 0.9rem;">${event.desc}</p>` : ''}
      `;
      
      const editBtn = document.createElement('button');
      editBtn.textContent = '✏️';
      editBtn.className = 'btn-edit';
      editBtn.style.marginRight = '0.5rem';
      editBtn.addEventListener('click', () => this.openModalForEdit(event.id));

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '🗑️';
      deleteBtn.className = 'btn-delete';
      deleteBtn.style.marginLeft = '0.5rem';
      deleteBtn.addEventListener('click', () => this.delete(event.id));
      
      li.appendChild(content);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
      container.appendChild(li);
    });
  }
  
  renderCalendar() {
    const container = document.getElementById('calendar');
    if (!container) return;
    
    const today = new Date();
    const currentMonth = this.currentViewMonth.getMonth();
    const currentYear = this.currentViewMonth.getFullYear();
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    const monthName = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate()).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    
    let html = `<div style="grid-column: 1 / -1; margin-bottom:0.5rem;">
                  <div class="calendar-header">
                    <button type="button" id="prevMonth" style="background: transparent; border: none; color: var(--primary); cursor: pointer; font-size: 1.2rem;">←</button>
                    <span class="month-title">${monthName}</span>
                    <button type="button" id="nextMonth" style="background: transparent; border: none; color: var(--primary); cursor: pointer; font-size: 1.2rem;">→</button>
                  </div>
                </div>
                <div class="calendar-weekdays">`;
    
    weekDays.forEach(day => {
      html += `<div>${day}</div>`;
    });
    
    html += `</div><div class="calendar-grid">`;
    
    // Empty cells for days before month starts
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Adjust for Monday start
    for (let i = 0; i < startingDayOfWeek; i++) {
      html += `<div style="opacity: 0.3;"></div>`;
    }
    
    // Days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(currentYear, currentMonth, day);
      // Format date string without UTC conversion
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const dayStr = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayStr}`;
      const hasEvents = this.events.some(e => e.date === dateStr);
      const isToday = date.toDateString() === today.toDateString();
      
      let classes = 'calendar-day';
      if (isToday) classes += ' calendar-today';
      if (hasEvents) classes += ' calendar-has-events';
      
      html += `<span class="${classes}" data-date="${dateStr}">${day}</span>`;
    }
    
    html += `</div>`;
    
    container.innerHTML = html;
    container.style.display = 'contents';
    
    // Recreate the outer grid wrapper
    const wrapper = document.createElement('div');
    wrapper.style.display = 'grid';
    wrapper.style.gridTemplateColumns = '1fr';
    wrapper.style.gap = '0.5rem';
    
    const calendarContent = document.createElement('div');
    calendarContent.style.display = 'grid';
    calendarContent.style.gridTemplateColumns = 'repeat(7, 1fr)';
    calendarContent.style.gap = '0.3rem';
    calendarContent.innerHTML = html;
    
    container.innerHTML = html;
    
    // Add event listeners
    document.querySelectorAll('.calendar-day').forEach(span => {
      span.addEventListener('click', (e) => {
        const dateStr = e.target.getAttribute('data-date');
        if (dateStr) this.showDayEvents(dateStr);
      });
      span.addEventListener('dblclick', (e) => {
        const dateStr = e.target.getAttribute('data-date');
        if (dateStr) this.openModal(dateStr);
      });
    });
    
    // Add month navigation
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.currentViewMonth.setMonth(this.currentViewMonth.getMonth() - 1);
        this.renderCalendar();
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.currentViewMonth.setMonth(this.currentViewMonth.getMonth() + 1);
        this.renderCalendar();
      });
    }
  }
  
  renderTodayEvents() {
    const _now = new Date();
    const _pad = (n) => String(n).padStart(2, '0');
    const today = `${_now.getFullYear()}-${_pad(_now.getMonth() + 1)}-${_pad(_now.getDate())}`;
    this.showDayEvents(today);
  }
}

// =========================
// Quick Actions Manager
// =========================
class QuickActionsManager {
  constructor(timerManager, todoManager, timeManager, calendarManager) {
    this.timerManager = timerManager;
    this.todoManager = todoManager;
    this.timeManager = timeManager;
    this.calendarManager = calendarManager;
    this.init();
  }
  
  init() {
    // Quick timers
    document.getElementById('timer5min')?.addEventListener('click', () => this.startQuickTimer(5 * 60));
    document.getElementById('timer15min')?.addEventListener('click', () => this.startQuickTimer(15 * 60));
    document.getElementById('timer30min')?.addEventListener('click', () => this.startQuickTimer(30 * 60));
    
    // Data management
    document.getElementById('exportBtn')?.addEventListener('click', () => this.exportData());
    document.getElementById('importBtn')?.addEventListener('click', () => this.triggerImport());
    document.getElementById('clearAllBtn')?.addEventListener('click', () => this.clearAllData());
    
    // Cleanup & stats
    document.getElementById('statsBtn')?.addEventListener('click', () => this.showWeeklyStats());
    
    // Hidden file input
    document.getElementById('importFile')?.addEventListener('change', (e) => this.importData(e));
  }
  
  startQuickTimer(seconds) {
    this.timerManager.timerSeconds = seconds;
    
    // Set form values for display
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    document.getElementById('hours').value = hours;
    document.getElementById('minutes').value = minutes;
    document.getElementById('seconds').value = secs;
    
    // Reset and start timer in countdown mode
    document.getElementById('timerMode').value = 'countdown';
    this.timerManager.reset();
    this.timerManager.start();
  }
  
  exportData() {
    const data = {
      todos: this.todoManager.todos,
      times: this.timeManager.times,
      events: this.calendarManager.events,
      notes: JSON.parse(localStorage.getItem('focusflow_notes') || '[]'),
      exportDate: new Date().toLocaleString('de-DE')
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focusflow_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('✅ Daten erfolgreich exportiert!');
  }
  
  triggerImport() {
    document.getElementById('importFile').click();
  }
  
  importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (!confirm('Möchtest du alle aktuellen Daten mit den importierten Daten überschreiben?')) {
          return;
        }
        
        // Import data
        if (data.todos) {
          localStorage.setItem('focusflow_todos', JSON.stringify(data.todos));
          this.todoManager.todos = data.todos;
          this.todoManager.render();
        }
        
        if (data.times) {
          localStorage.setItem('focusflow_times', JSON.stringify(data.times));
          this.timeManager.times = data.times;
        }
        
        if (data.events) {
          localStorage.setItem('focusflow_events', JSON.stringify(data.events));
          this.calendarManager.events = data.events;
          this.calendarManager.render();
        }
        
        if (data.notes) {
          localStorage.setItem('focusflow_notes', JSON.stringify(data.notes));
        }
        
        alert('✅ Daten erfolgreich importiert!');
        location.reload();
      } catch (err) {
        alert('❌ Fehler beim Importieren der Datei!');
      }
    };
    reader.readAsText(file);
  }
  
  clearAllData() {
    if (!confirm('⚠️ Das löscht ALLE Daten (Todos, Zeiten, Notizen, Termine). Fortfahren?')) {
      return;
    }
    if (!confirm('Bist du dir wirklich sicher? Diese Aktion ist nicht rückgängig zu machen!')) {
      return;
    }
    
    localStorage.clear();
    alert('✅ Alle Daten gelöscht. Seite wird neu geladen...');
    location.reload();
  }
  
  showWeeklyStats() {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    // Count todos completed this week
    const thisWeekTodos = this.todoManager.todos.filter(t => {
      const dueDate = new Date(t.due);
      return t.done && dueDate >= weekStart && dueDate <= today;
    }).length;
    
    // Sum work hours this week
    const thisWeekTimes = this.timeManager.times.filter(t => {
      const [year, month, day] = t.date.split('-').map(Number);
      const timeDate = new Date(year, month - 1, day);
      return timeDate >= weekStart && timeDate <= today && t.end;
    });
    
    let totalHours = 0;
    thisWeekTimes.forEach(t => {
      const [sH, sM] = t.start.split(':').map(Number);
      const [eH, eM] = t.end.split(':').map(Number);
      const diffMinutes = (eH * 60 + eM) - (sH * 60 + sM);
      totalHours += diffMinutes / 60;
    });
    
    // Count events this week
    const thisWeekEvents = this.calendarManager.events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate >= weekStart && eventDate <= today;
    }).length;
    
    const wochentag = weekStart.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
    
    alert(`
📊 Statistik dieser Woche (seit ${wochentag}):

✅ Erledigte Aufgaben: ${thisWeekTodos}
⏱️ Arbeitszeiten: ${totalHours.toFixed(1)}h
📅 Termine: ${thisWeekEvents}

Großartig, weiter so! 💪
    `.trim());
  }
}
class StatsDisplay {
  constructor(todoManager, timeManager) {
    this.todoManager = todoManager;
    this.timeManager = timeManager;
    this.init();
  }
  
  init() {
    const clearDoneBtn = document.getElementById('clearDoneBtn');
    if (clearDoneBtn) {
      clearDoneBtn.addEventListener('click', () => this.todoManager.clearDone());
    }
    this.render();
    // Re-render when times are updated elsewhere
    document.addEventListener('timesUpdated', () => this.render());
  }
  
  render() {
    const container = document.getElementById('statsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Zeige erledigte Aufgaben
    const doneTodos = this.todoManager.todos.filter(t => t.done);
    doneTodos.forEach(todo => {
      const li = document.createElement('li');
      li.textContent = `✓ ${todo.title} (${todo.urgency}) von ${todo.author}`;
      li.style.opacity = '0.7';
      container.appendChild(li);
    });
    
    // Zeige Arbeitszeiten
    this.timeManager.times.forEach(time => {
      const li = document.createElement('li');
      // format stored YYYY-MM-DD to localized string
      let dateText = time.date;
      try { 
        const [year, month, day] = time.date.split('-').map(Number);
        dateText = new Date(year, month - 1, day).toLocaleDateString('de-DE');
      } catch (e) { }
      li.textContent = `⏱️ ${dateText}: ${time.start} → ${time.end || 'Laufend'}`;
      container.appendChild(li);
    });
    
    // Aktualisiere Statistik
    const statsElement = document.getElementById('stats');
    if (statsElement) {
      statsElement.textContent = doneTodos.length;
    }
  }
}

// =========================
// App Initialization
// =========================
document.addEventListener('DOMContentLoaded', function() {
  // Initialize all managers
  new ThemeManager();
  new QuoteManager();
  
  const todoManager = new TodoManager();
  const timeManager = new TimeManager();
  const timerManager = new TimerManager();
  new NotesManager();
  const calendarManager = new CalendarManager();
  
  const stats = new StatsDisplay(todoManager, timeManager);
  const quickActions = new QuickActionsManager(timerManager, todoManager, timeManager, calendarManager);
  
  // Re-render stats when todos change
  const originalRender = todoManager.render.bind(todoManager);
  todoManager.render = function() {
    originalRender();
    stats.render();
  };
  
  // Listen for storage changes from other tabs/windows (e.g., zeiten.html)
  window.addEventListener('storage', (event) => {
    if (event.key === 'focusflow_times') {
      // Reload times from localStorage and update stats
      timeManager.times = JSON.parse(localStorage.getItem('focusflow_times')) || [];
      stats.render();
    }
  });
});
