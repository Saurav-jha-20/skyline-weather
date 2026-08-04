/* =========================================================
   HOURLY PAGE — 24-hour SVG trend chart + hourly cards
   ========================================================= */
Skyline.init(async (data) => {
  if (!data) return;

  const forecast = await Skyline.fetchForecast(data.coord.lat, data.coord.lon);
  if (forecast && forecast.list) {
    renderHourly(forecast.list, forecast.city ? forecast.city.timezone : data.timezone);
  }
});

function renderHourly(list, tzOffset) {
  // The free forecast endpoint steps in 3-hour increments, so the next
  // 8 entries cover the next 24 hours.
  const points = list.slice(0, 8);
  if (points.length < 2) return;

  const temps = points.map((p) => p.main.temp);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const range = max - min || 1;

  const width = 760, height = 140, padX = 30, padTop = 26, padBottom = 20;
  const plotW = width - padX * 2;
  const plotH = height - padTop - padBottom;

  const coords = points.map((p, i) => {
    const x = padX + i * (plotW / (points.length - 1));
    const y = padTop + (1 - (p.main.temp - min) / range) * plotH;
    return { x, y, temp: Skyline.displayTemp(p.main.temp) };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${height - padBottom} L${coords[0].x.toFixed(1)},${height - padBottom} Z`;

  const dots = coords.map((c) => `<circle class="hourly-dot" cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="3.5"/>`).join("");
  const labels = coords.map((c) => `<text class="hourly-label" x="${c.x.toFixed(1)}" y="${(c.y - 10).toFixed(1)}">${c.temp}°</text>`).join("");

  const chartElem = document.getElementById("hourlyChart");
  if (chartElem) {
    chartElem.innerHTML = `
      <defs>
        <linearGradient id="hourlyFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4F8A8B" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#4F8A8B" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path class="hourly-area" d="${areaPath}"/>
      <path class="hourly-line" d="${linePath}"/>
      ${dots}${labels}
    `;
  }

  const stripElem = document.getElementById("hourlyStrip");
  if (stripElem) {
    stripElem.innerHTML = points.map((p) => {
      const timeLabel = Skyline.formatLocalHour(p.dt, tzOffset);
      const popPercent = Math.round((p.pop || 0) * 100);
      return `
        <div class="hourly-card">
          <div class="hourly-time">${timeLabel}</div>
          <div class="hourly-icon">${Skyline.getWeatherIcon(p.weather[0].main, 26)}</div>
          <div class="hourly-pop">${popPercent}% rain</div>
          <div class="hourly-temp">${Skyline.displayTemp(p.main.temp)}°</div>
        </div>`;
    }).join("");
  }

  const sectionElem = document.getElementById("hourlySection");
  if (sectionElem) {
    sectionElem.hidden = false;
  }
}