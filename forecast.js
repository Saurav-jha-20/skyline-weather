/* =========================================================
   5-DAY PAGE — daily outlook strip
   ========================================================= */
Skyline.init(async (data) => {
  const forecast = await Skyline.fetchForecast(data.coord.lat, data.coord.lon);
  if (forecast) renderForecast(forecast.list);
});

function renderForecast(list) {
  // The free forecast endpoint returns 3-hour steps for 5 days.
  // Pick the entry closest to 12:00 for each calendar day.
  const byDay = {};
  list.forEach((entry) => {
    const day = entry.dt_txt.split(" ")[0];
    const hour = entry.dt_txt.split(" ")[1];
    if (!byDay[day] || hour === "12:00:00") byDay[day] = entry;
  });

  const days = Object.keys(byDay).slice(0, 5);
  document.getElementById("forecastStrip").innerHTML = days.map((day) => {
    const entry = byDay[day];
    const label = new Date(day).toLocaleDateString(undefined, { weekday: "short" });
    return `
      <div class="forecast-card">
        <div class="forecast-day">${label}</div>
        <div class="forecast-icon">${Skyline.getWeatherIcon(entry.weather[0].main, 32)}</div>
        <div class="forecast-temp">
          ${Skyline.displayTemp(entry.main.temp_max)}° <span class="lo">${Skyline.displayTemp(entry.main.temp_min)}°</span>
        </div>
      </div>`;
  }).join("");

  document.getElementById("forecastSection").hidden = false;
}
