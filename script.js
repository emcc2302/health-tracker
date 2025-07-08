let userHealthLogs = [];
let totalWaterDrank = 0;

document.addEventListener("DOMContentLoaded", () => {
  const steps = document.getElementById("steps");
  const sleep = document.getElementById("sleep");
  const calories = document.getElementById("calories");
  const moodButtons = document.querySelectorAll("#moods button");
  const moodLabel = document.getElementById("moodLabel");
  const waterContainer = document.getElementById("waterCups");
  const waterLabel = document.getElementById("waterValue");

  const updateLabel = (slider, label, suffix = "") => {
    label.textContent = slider.value + suffix;
  };

  steps.addEventListener("input", () => updateLabel(steps, steps.nextElementSibling));
  sleep.addEventListener("input", () => updateLabel(sleep, sleep.nextElementSibling, " / 8 hrs"));
  calories.addEventListener("input", () => updateLabel(calories, calories.nextElementSibling, " kcal"));

  function drawWaterCups() {
    const max = 8;
    waterContainer.innerHTML = "";

    for (let i = 0; i < max; i++) {
      const cup = document.createElement("div");
      if (i < totalWaterDrank) cup.classList.add("filled");
      cup.addEventListener("click", () => {
        totalWaterDrank = i + 1 === totalWaterDrank ? i : i + 1;
        drawWaterCups();
      });
      waterContainer.appendChild(cup);
    }

    waterLabel.textContent = `${totalWaterDrank}/8 glasses`;
  }

  drawWaterCups();

  moodButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      moodButtons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      moodLabel.textContent = `Selected Mood: ${btn.dataset.mood}`;
    });
  });

  document.getElementById("themeToggle").addEventListener("change", e => {
    document.body.classList.toggle("dark", e.target.checked);
  });

  setTimeout(() => {
    if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification("Don't forget to log your health today! 🩺");
        }
      });
    }
  }, 4000);
});

function saveTodayData() {
  const dateInput = document.getElementById("date");
  const dateValue = dateInput.value;

  // ✅ Check if date is selected
  if (!dateValue) {
    alert("⚠️ Please select a date before saving.");
    dateInput.focus();
    return;
  }

  const entry = {
    date: dateValue,
    steps: +document.getElementById("steps").value,
    sleep: +document.getElementById("sleep").value,
    calories: +document.getElementById("calories").value,
    water: totalWaterDrank,
    mood: document.querySelector("#moods button.selected")?.dataset.mood || ""
  };

  userHealthLogs.push(entry);

  const advice = generateHealthAdvice(entry);
  document.getElementById("adviceBox").textContent = advice;
}

function generateHealthAdvice({ water, sleep, calories, steps }) {
  const messages = [];

  if (water < 5) messages.push("💧 You're under-hydrated. Try drinking more water today.");
  else if (water > 8) messages.push("⚠️ Too much water may dilute electrolytes. Stay balanced.");

  if (sleep < 5) messages.push("😴 You slept less than 5 hours. This affects mood and immunity.");
  else if (sleep > 9) messages.push("🛏 Oversleeping can lead to fatigue and headaches. Try 7–8 hrs.");

  if (calories < 1200) messages.push("🍽 Low calorie intake. Ensure you're eating enough for energy.");
  else if (calories > 3000) messages.push("🔥 High calories — balance with activity or reduce intake.");

  if (steps < 4000) messages.push("🚶 Low activity today. A short walk can boost circulation.");
  else if (steps > 10000) messages.push("🏃 Great job staying active!");

  return messages.length ? messages.join("\n") : "✅ You're doing great! Keep it up.";
}

function exportCSV() {
  if (userHealthLogs.length === 0) return alert("⚠️ No data saved yet.");
  const csvHeader = "Date,Steps,Sleep,Calories,Water,Mood\n";
  const csvRows = userHealthLogs.map(d => `${d.date},${d.steps},${d.sleep},${d.calories},${d.water},${d.mood}`);
  const blob = new Blob([csvHeader + csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "health-log.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function viewReport() {
  const section = document.getElementById("chartSection");
  section.style.display = "block";

  const ctx = document.getElementById("healthChart").getContext("2d");

  if (window.myHealthChart) window.myHealthChart.destroy();

  const data = [
    { day: "Mon", steps: 6500, sleep: 7, calories: 1800, water: 6 },
    { day: "Tue", steps: 3000, sleep: 5, calories: 2500, water: 4 },
    { day: "Wed", steps: 9000, sleep: 8, calories: 2100, water: 8 },
    { day: "Thu", steps: 7000, sleep: 6, calories: 1900, water: 5 },
    { day: "Fri", steps: 8000, sleep: 9, calories: 2200, water: 7 },
    { day: "Sat", steps: 2000, sleep: 4, calories: 2800, water: 3 },
    { day: "Sun", steps: 10000, sleep: 10, calories: 1700, water: 8 }
  ];

  window.myHealthChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(d => d.day),
      datasets: [
        { label: "Steps", data: data.map(d => d.steps), borderColor: "#4caf50", fill: false },
        { label: "Sleep (hrs)", data: data.map(d => d.sleep), borderColor: "#3f51b5", fill: false },
        { label: "Calories", data: data.map(d => d.calories), borderColor: "#f44336", fill: false },
        { label: "Water (cups)", data: data.map(d => d.water), borderColor: "#2196f3", fill: false }
      ]
    }
  });

  highlightBestAndWorstDays(data);
}

function highlightBestAndWorstDays(data) {
  let best = "", worst = "";
  let bestScore = -Infinity, worstScore = Infinity;

  data.forEach(day => {
    const score = day.steps / 1000 + day.sleep * 1.5 + day.water - day.calories / 1000;
    if (score > bestScore) [bestScore, best] = [score, day.day];
    if (score < worstScore) [worstScore, worst] = [score, day.day];
  });

  document.getElementById("highlight").innerHTML =
    `<p>🌟 <strong>Best Day</strong>: ${best}<br>⚠️ <strong>Worst Day</strong>: ${worst}</p>`;
}
