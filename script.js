document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const body = document.body;


  function toggleTheme() {
    body.classList.toggle('light-mode');
    const isLightMode = body.classList.contains('light-mode');
    themeToggleBtn.textContent = isLightMode ? '🌙 Dark' : '☀️ Light';
    localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
  }

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    body.classList.add('light-mode');
    themeToggleBtn.textContent = '🌙 Dark';
  } else {

    body.classList.remove('light-mode');
    themeToggleBtn.textContent = '☀️ Light';
  }

  themeToggleBtn.addEventListener('click', toggleTheme);


  const taskForm = document.getElementById('taskForm');
  const taskListEl = document.getElementById('taskList');
  let tasks = [];

  function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  function loadTasks() {
    const storedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks = storedTasks.sort((a, b) => new Date(a.due) - new Date(b.due));
    renderTasks();
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
  }

  function renderTasks() {
    taskListEl.innerHTML = '';
    if (tasks.length === 0) {
      const li = document.createElement('li');
      li.className = 'text-gray-500 italic'; 
      li.innerText = 'Keine Aufgaben vorhanden.';
      taskListEl.appendChild(li);
      return;
    }
    tasks.forEach((task, index) => {
      const li = document.createElement('li');

      li.className = 'bg-gray-700 p-3 rounded-md flex justify-between items-center shadow'; 
      
      const taskDate = new Date(task.due);

      const taskDateUTC = new Date(Date.UTC(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate()));
      const formattedDate = taskDateUTC.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' });


      li.innerHTML = `
        <div>
          <span class="font-semibold">${task.title}</span>
          <span class="block text-sm text-gray-400">Fällig: ${formattedDate} [${task.priority}]</span>
        </div>
        <button data-index="${index}" class="delete-task-btn bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs">Löschen</button>
      `;
      taskListEl.appendChild(li);
    });

    document.querySelectorAll('.delete-task-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const taskIndex = parseInt(e.target.dataset.index);
            tasks.splice(taskIndex, 1);
            saveTasks();
            loadTasks();
        });
    });
  }

  taskForm.addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const due = document.getElementById('due').value; 
    const priority = document.getElementById('priority').value;
    
    tasks.push({ title, due, priority });
    saveTasks();
    taskForm.reset();
    loadTasks();
  });

  fetch("https://api.quotable.io/random")
  .then(res => res.json())
  .then(data => {
    document.getElementById("quote").innerText = `"${data.content}"\n— ${data.author}`;
  })
  .catch(error => {
    console.error("Fehler beim Laden des Zitats:", error);
    document.getElementById("quote").innerText = "Zitat konnte nicht geladen werden (Netzwerkfehler).";
  });


  // api für wetter
  const LATITUDE = 48.2082;
  const LONGITUDE = 16.3738;

  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current_weather=true`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      console.log("Wetter-API Antwort:", data); 
      if (data && data.current_weather) {
        const weather = data.current_weather;
        document.getElementById('weather').innerText =
          `Temperatur: ${weather.temperature}°C\nWind: ${weather.windspeed} km/h`;
      } else {
        document.getElementById('weather').innerText = "Wetterdaten konnten nicht geladen werden (Formatfehler).";
        console.warn('Wetter API Datenformat unerwartet:', data);
      }
    })
    .catch(error => {
      console.error("Fehler beim Laden der Wetterdaten:", error);
      document.getElementById('weather').innerText = "Wetterdaten konnten nicht geladen werden (Netzwerkfehler).";
    });
  // Fokus-Timer
  let timerInterval;
  let timeRemaining;
  const countdownEl = document.getElementById('countdown');
  const timerSelect = document.getElementById('timerSelect');
  const startTimerBtn = document.getElementById('startTimerBtn');
  const resetTimerBtn = document.getElementById('resetTimerBtn');
  const player = document.getElementById('player');

  function updateCountdownDisplay() {
    const minutes = String(Math.floor(timeRemaining / 60)).padStart(2, '0');
    const seconds = String(timeRemaining % 60).padStart(2, '0');
    countdownEl.innerText = `${minutes}:${seconds}`;
  }

  function startTimer() {
    clearInterval(timerInterval);
    timeRemaining = parseInt(timerSelect.value) * 60;
    updateCountdownDisplay();
  
    timerInterval = setInterval(() => {
      timeRemaining--;
      if (timeRemaining < 0) {
        clearInterval(timerInterval);
        countdownEl.innerText = "Fertig!";
        player.pause(); // Stoppen
        return;
      }
      updateCountdownDisplay();
    }, 1000);
  }
  // Timerfunktiom
  function resetTimer() {
    clearInterval(timerInterval);
    timeRemaining = parseInt(timerSelect.value) * 60;
    updateCountdownDisplay();
    player.pause();
    player.currentTime = 0;
  }

  startTimerBtn.addEventListener('click', () => {
    //Musik starten beim Timeranfang
    try {
      player.currentTime = 0;
      player.play().catch(e => {
        console.warn("Autoplay blockiert:", e);
      });
    } catch (err) {
      console.error("Fehler beim Abspielen der Musik:", err);
    }
  
    startTimer();
  });

  resetTimerBtn.addEventListener('click', resetTimer);
  timerSelect.addEventListener('change', () => {
      resetTimer();
  });

  // Kalender Logik
  const calendarGrid = document.getElementById('calendarGrid');
  const monthYearEl = document.getElementById('monthYear');
  const prevMonthBtn = document.getElementById('prevMonth');
  const nextMonthBtn = document.getElementById('nextMonth');
  let currentDate = new Date();

  function renderCalendar(year, month) {
    calendarGrid.innerHTML = '';
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDay = (firstDayOfMonth.getDay() + 6) % 7; 

    monthYearEl.textContent = `${firstDayOfMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`;

    const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    dayNames.forEach(name => {
      const dayNameCell = document.createElement('div');
      dayNameCell.classList.add('day-name');
      dayNameCell.textContent = name;
      calendarGrid.appendChild(dayNameCell);
    });

    for (let i = 0; i < startingDay; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.classList.add('empty-day');
      calendarGrid.appendChild(emptyCell);
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    for (let day = 1; day <= daysInMonth; day++) {
      const dayCell = document.createElement('div');
      dayCell.textContent = day;
      const cellDate = new Date(year, month, day);
      cellDate.setHours(0,0,0,0);

      if (cellDate.getTime() === today.getTime()) {
        dayCell.classList.add('current-day');
      }

      const tasksForDay = tasks.filter(task => {

        const [taskYear, taskMonth, taskDay] = task.due.split('-').map(Number);

        const taskDueDate = new Date(Date.UTC(taskYear, taskMonth - 1, taskDay)); 

        const cellDateUTC = new Date(Date.UTC(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate()));

        return taskDueDate.getTime() === cellDateUTC.getTime();
      });

      if (tasksForDay.length > 0) {
        dayCell.classList.add('task-day');
        dayCell.title = tasksForDay.map(t => t.title).join(' | ');
      }
      calendarGrid.appendChild(dayCell);
    }
  }

  prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
  });

  nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
  });

  // Init Laden der Kacheln
  loadTasks();
  resetTimer();
});