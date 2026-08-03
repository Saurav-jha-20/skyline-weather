/* =========================================================
   SKYLINE — Weather Station
   Calls the free OpenWeatherMap API (Current Weather +
   5 day / 3 hour Forecast) and renders the results.
   ========================================================= */

// ---------------------------------------------------------
// 1. CONFIG — put your free OpenWeatherMap API key here.
//    Get one at: https://home.openweathermap.org/users/sign_up
// ---------------------------------------------------------
const API_KEY = "dcbfa1ae6697767abb9f7ac64ef1cb17";

const CURRENT_URL  = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";
const DEFAULT_CITY = "Mumbai";

// ---------------------------------------------------------
// 2. DOM references
// ---------------------------------------------------------
const searchForm     = document.getElementById("searchForm");
const cityInput      = document.getElementById("cityInput");
const geoBtn         = document.getElementById("geoBtn");
const statusMsg      = document.getElementById("statusMsg");
const weatherPanel   = document.getElementById("weatherPanel");
const forecastSection= document.getElementById("forecastSection");
const forecastStrip  = document.getElementById("forecastStrip");
const localClock     = document.getElementById("localClock");

// ---------------------------------------------------------
// 3. Weather-condition -> icon (inline SVG, currentColor)
// ---------------------------------------------------------
function getWeatherIcon(main, size = 46) {
  const icons = {
    Clear: `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><circle cx="12" cy="12" r="5" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/><line x1="4.2" y1="4.2" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.8" y2="19.8"/><line x1="4.2" y1="19.8" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.8" y2="4.2"/></g></svg>`,
    Clouds: `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><path d="M6 18a4 4 0 0 1 .4-8 5.5 5.5 0 0 1 10.6.9A3.5 3.5 0 0 1 16.5 18H6Z" fill="currentColor"/></svg>`,
    Rain: `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><path d="M6 13a4 4 0 0 1 .4-8 5.5 5.5 0 0 1 10.6.9A3.5 3.5 0 0 1 16.5 13H6Z" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="17" x2="7" y2="21"/><line x1="12" y1="17" x2="11" y2="21"/><line x1="16" y1="17" x2="15" y2="21"/></g></svg>`,
    Drizzle: `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><path d="M6 13a4 4 0 0 1 .4-8 5.5 5.5 0 0 1 10.6.9A3.5 3.5 0 0 1 16.5 13H6Z" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="9" y1="17" x2="8.5" y2="19"/><line x1="13" y1="17" x2="12.5" y2="19"/></g></svg>`,
    Thunderstorm: `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><path d="M6 12a4 4 0 0 1 .4-8 5.5 5.5 0 0 1 10.6.9A3.5 3.5 0 0 1 16.5 12H6Z" fill="currentColor"/><path d="M13 12l-3 5h2.5L11 22l5-7h-2.5L15 12z" fill="currentColor"/></svg>`,
    Snow: `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><path d="M6 12a4 4 0 0 1 .4-8 5.5 5.5 0 0 1 10.6.9A3.5 3.5 0 0 1 16.5 12H6Z" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="16" x2="8" y2="21"/><line x1="12" y1="16" x2="12" y2="21"/><line x1="16" y1="16" x2="16" y2="21"/></g></svg>`,
    Mist: `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="9" x2="21" y2="9"/><line x1="5" y1="13" x2="19" y2="13"/><line x1="3" y1="17" x2="21" y2="17"/></g></svg>`,
  };
  const fallbacks = { Haze: "Mist", Fog: "Mist", Smoke: "Mist", Squall: "Rain", Tornado: "Thunderstorm" };
  return icons[main] || icons[fallbacks[main]] || icons.Clouds;
}

// ---------------------------------------------------------
// 4. Helpers
// ---------------------------------------------------------
function formatLocalTime(unixSeconds, tzOffsetSeconds) {
  const date = new Date((unixSeconds + tzOffsetSeconds) * 1000);
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// Maps a temperature to a -90deg..+90deg needle rotation across a
// fixed instrument scale of -10C (cold) to 45C (hot).
function tempToNeedleDeg(tempC) {
  const min = -10, max = 45;
  const clamped = Math.max(min, Math.min(max, tempC));
  const ratio = (clamped - min) / (max - min);
  return -90 + ratio * 180;
}

// Track the last-loaded city's UTC offset (seconds) so hourly/sunrise times
// can be shown in *that city's* local time, not the visitor's.
let currentTimezoneOffset = 0;

function formatLocalHour(unixSeconds, tzOffsetSeconds) {
  const date = new Date((unixSeconds + tzOffsetSeconds) * 1000);
  let hour = date.getUTCHours();
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour} ${ampm}`;
}

// Magnus formula — estimates dew point (°C) from temperature and humidity,
// so we don't need an extra API call for it.
function calculateDewPoint(tempC, humidityPct) {
  const a = 17.27, b = 237.7;
  const alpha = (a * tempC) / (b + tempC) + Math.log(humidityPct / 100);
  return (b * alpha) / (a - alpha);
}

function setStatus(text, isError = false) {
  statusMsg.textContent = text;
  statusMsg.classList.toggle("is-error", isError);
}

// ---------------------------------------------------------
// 5. Render functions
// ---------------------------------------------------------
function renderCurrent(data) {
  const tempC = Math.round(data.main.temp);
  const main = data.weather[0].main;

  document.getElementById("tempValue").textContent = tempC;
  document.getElementById("cityName").textContent = `${data.name}, ${data.sys.country}`;
  document.getElementById("conditionDesc").textContent = data.weather[0].description;
  document.getElementById("feelsLike").textContent = Math.round(data.main.feels_like);
  document.getElementById("conditionIcon").innerHTML = getWeatherIcon(main, 46);

  document.getElementById("statHumidity").innerHTML = `${data.main.humidity}<small>%</small>`;
  document.getElementById("statWind").innerHTML = `${(data.wind.speed * 3.6).toFixed(1)}<small>km/h</small>`;
  document.getElementById("statPressure").innerHTML = `${data.main.pressure}<small>hPa</small>`;
  document.getElementById("statVisibility").innerHTML = `${(data.visibility / 1000).toFixed(1)}<small>km</small>`;

  const dewPoint = calculateDewPoint(data.main.temp, data.main.humidity);
  document.getElementById("statDewPoint").innerHTML = `${Math.round(dewPoint)}<small>°C</small>`;

  currentTimezoneOffset = data.timezone;
  document.getElementById("statSunrise").textContent = formatLocalTime(data.sys.sunrise, data.timezone);
  document.getElementById("statSunset").textContent = formatLocalTime(data.sys.sunset, data.timezone);

  document.getElementById("gaugeNeedle").style.setProperty("--deg", `${tempToNeedleDeg(tempC)}deg`);

  weatherPanel.hidden = false;
}

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
  forecastStrip.innerHTML = days.map((day) => {
    const entry = byDay[day];
    const label = new Date(day).toLocaleDateString(undefined, { weekday: "short" });
    return `
      <div class="forecast-card">
        <div class="forecast-day">${label}</div>
        <div class="forecast-icon">${getWeatherIcon(entry.weather[0].main, 32)}</div>
        <div class="forecast-temp">
          ${Math.round(entry.main.temp_max)}° <span class="lo">${Math.round(entry.main.temp_min)}°</span>
        </div>
      </div>`;
  }).join("");

  forecastSection.hidden = false;
}

function renderHourly(list) {
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
    return { x, y, temp: Math.round(p.main.temp) };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${height - padBottom} L${coords[0].x.toFixed(1)},${height - padBottom} Z`;

  const dots = coords.map((c) => `<circle class="hourly-dot" cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="3.5"/>`).join("");
  const labels = coords.map((c) => `<text class="hourly-label" x="${c.x.toFixed(1)}" y="${(c.y - 10).toFixed(1)}">${c.temp}°</text>`).join("");

  document.getElementById("hourlyChart").innerHTML = `
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

  document.getElementById("hourlyStrip").innerHTML = points.map((p) => {
    const timeLabel = formatLocalHour(p.dt, currentTimezoneOffset);
    const popPercent = Math.round((p.pop || 0) * 100);
    return `
      <div class="hourly-card">
        <div class="hourly-time">${timeLabel}</div>
        <div class="hourly-icon">${getWeatherIcon(p.weather[0].main, 26)}</div>
        <div class="hourly-pop">${popPercent}% rain</div>
        <div class="hourly-temp">${Math.round(p.main.temp)}°</div>
      </div>`;
  }).join("");

  document.getElementById("hourlySection").hidden = false;
}

// ---------------------------------------------------------
// 6. API calls
// ---------------------------------------------------------
async function fetchWeatherByCity(city) {
  setStatus(`Checking the sky over ${city}...`);
  try {
    const [current, forecast] = await Promise.all([
      fetch(`${CURRENT_URL}?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`),
      fetch(`${FORECAST_URL}?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`),
    ]);
    await handleResponses(current, forecast);
  } catch (err) {
    setStatus("Network error — check your connection and try again.", true);
  }
}

async function fetchWeatherByCoords(lat, lon) {
  setStatus("Locating you on the map...");
  try {
    const [current, forecast] = await Promise.all([
      fetch(`${CURRENT_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
      fetch(`${FORECAST_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
    ]);
    await handleResponses(current, forecast);
  } catch (err) {
    setStatus("Network error — check your connection and try again.", true);
  }
}

async function handleResponses(current, forecast) {
  if (!current.ok) {
    const body = await current.json().catch(() => ({}));
    if (current.status === 401) {
      setStatus("Missing or invalid API key — add yours in script.js (see README).", true);
    } else if (current.status === 404) {
      setStatus("Couldn't find that city. Try a different spelling.", true);
    } else {
      setStatus(body.message || "Something went wrong fetching the weather.", true);
    }
    return;
  }
  const currentData = await current.json();
  const forecastData = forecast.ok ? await forecast.json() : null;

  setStatus("");
  renderCurrent(currentData);
  if (forecastData) {
    renderHourly(forecastData.list);
    renderForecast(forecastData.list);
  }
}

// ---------------------------------------------------------
// 7. Header clock
// ---------------------------------------------------------
function tickClock() {
  const now = new Date();
  localClock.textContent = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
tickClock();
setInterval(tickClock, 1000 * 30);

// ---------------------------------------------------------
// 8. Event listeners
// ---------------------------------------------------------
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (city) fetchWeatherByCity(city);
});

geoBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("Geolocation isn't supported by your browser.", true);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
    () => setStatus("Location access denied — search a city instead.", true)
  );
});

// ---------------------------------------------------------
// 9. Initial load
// ---------------------------------------------------------
if (API_KEY === "YOUR_API_KEY_HERE") {
  setStatus("Add your free OpenWeatherMap API key in script.js to get started (see README).", true);
} else {
  fetchWeatherByCity(DEFAULT_CITY);
}
