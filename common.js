/* =========================================================
   SKYLINE — Shared app shell
   Loaded on every page, BEFORE that page's own small script.
   Handles: config, API calls, unit/city persistence, icons,
   and wiring for the nav menu, unit toggle, search bar,
   geolocation button, and recent-city chips.
   ========================================================= */

// ---------------------------------------------------------
// 1. CONFIG — put your free OpenWeatherMap API key here.
//    Get one at: https://home.openweathermap.org/users/sign_up
// ---------------------------------------------------------
const API_KEY = "ae80d554dbed807acee55aab8a58f70b";

const CURRENT_URL  = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";
const AQI_URL      = "https://api.openweathermap.org/data/2.5/air_pollution";
const DEFAULT_CITY = "Mumbai";
const RECENT_KEY   = "skyline_recent_cities";
const UNIT_KEY     = "skyline_unit";
const LOCATION_KEY = "skyline_last_location";

let unitPref = localStorage.getItem(UNIT_KEY) || "metric";
let lastCurrentData = null;
let locationReadyCallback = null;

// ---------------------------------------------------------
// 2. Weather-condition -> icon (inline SVG, currentColor)
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
// 3. Formatting & calculation helpers
// ---------------------------------------------------------
function formatLocalTime(unixSeconds, tzOffsetSeconds) {
  const date = new Date((unixSeconds + tzOffsetSeconds) * 1000);
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatLocalHour(unixSeconds, tzOffsetSeconds) {
  const date = new Date((unixSeconds + tzOffsetSeconds) * 1000);
  let hour = date.getUTCHours();
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour} ${ampm}`;
}

// Maps a temperature to a -90deg..+90deg needle rotation across a
// fixed instrument scale of -10C (cold) to 45C (hot).
function tempToNeedleDeg(tempC) {
  const min = -10, max = 45;
  const clamped = Math.max(min, Math.min(max, tempC));
  const ratio = (clamped - min) / (max - min);
  return -90 + ratio * 180;
}

// Magnus formula — estimates dew point (°C) from temperature and humidity,
// so we don't need an extra API call for it.
function calculateDewPoint(tempC, humidityPct) {
  const a = 17.27, b = 237.7;
  const alpha = (a * tempC) / (b + tempC) + Math.log(humidityPct / 100);
  return (b * alpha) / (a - alpha);
}

// --- Unit display helpers (API is always fetched in metric; we convert
// for display only, so toggling units never needs a new network call) ---
function displayTemp(tempC) {
  return Math.round(unitPref === "imperial" ? (tempC * 9) / 5 + 32 : tempC);
}
function tempUnitLabel() {
  return unitPref === "imperial" ? "°F" : "°C";
}
function displayWind(speedMs) {
  return (unitPref === "imperial" ? speedMs * 2.237 : speedMs * 3.6).toFixed(1);
}
function windUnitLabel() {
  return unitPref === "imperial" ? "mph" : "km/h";
}

// ---------------------------------------------------------
// 4. Status message + location label (present on every page)
// ---------------------------------------------------------
function setStatus(text, isError = false) {
  const el = document.getElementById("statusMsg");
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("is-error", isError);
}

function setLocationLabel(data) {
  const el = document.getElementById("locationLabel");
  if (el) el.textContent = `Showing conditions for ${data.name}, ${data.sys.country}`;
}

// ---------------------------------------------------------
// 5. Location persistence — shared across pages via localStorage,
//    so navigating to another page keeps showing the same city.
// ---------------------------------------------------------
function saveLastLocation(data) {
  localStorage.setItem(LOCATION_KEY, JSON.stringify({
    name: data.name,
    country: data.sys.country,
    lat: data.coord.lat,
    lon: data.coord.lon,
  }));
}
function getLastLocation() {
  try {
    return JSON.parse(localStorage.getItem(LOCATION_KEY));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------
// 6. Recent cities (chips, shared across pages)
// ---------------------------------------------------------
function getRecentCities() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
  } catch {
    return [];
  }
}
function addRecentCity(name) {
  let list = getRecentCities().filter((c) => c.toLowerCase() !== name.toLowerCase());
  list.unshift(name);
  list = list.slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  renderRecentChips();
}
function renderRecentChips() {
  const el = document.getElementById("recentChips");
  if (!el) return;
  el.innerHTML = getRecentCities().map((name) =>
    `<button type="button" class="chip" data-city="${name.replace(/"/g, "&quot;")}">${name}</button>`
  ).join("");
}

// ---------------------------------------------------------
// 7. API calls
// ---------------------------------------------------------
async function apiFetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.message || "Request failed");
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function fetchCurrentByCity(city) {
  return apiFetchJson(`${CURRENT_URL}?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`);
}
function fetchCurrentByCoords(lat, lon) {
  return apiFetchJson(`${CURRENT_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
}
async function fetchForecast(lat, lon) {
  try {
    return await apiFetchJson(`${FORECAST_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
  } catch {
    return null;
  }
}
async function fetchAirQuality(lat, lon) {
  try {
    return await apiFetchJson(`${AQI_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------
// 8. Core load flow — every page calls Skyline.init(callback).
//    callback(currentWeatherData) runs after the initial load,
//    after every new search, and after every unit toggle.
// ---------------------------------------------------------
function handleNewCurrentData(data) {
  lastCurrentData = data;
  saveLastLocation(data);
  addRecentCity(`${data.name}, ${data.sys.country}`);
  setStatus("");
  setLocationLabel(data);
  if (locationReadyCallback) locationReadyCallback(data);
}

async function loadCity(city) {
  setStatus(`Checking the sky over ${city}...`);
  try {
    handleNewCurrentData(await fetchCurrentByCity(city));
  } catch (err) {
    if (err.status === 401) setStatus("Missing or invalid API key — add yours in common.js (see README).", true);
    else if (err.status === 404) setStatus("Couldn't find that city. Try a different spelling.", true);
    else setStatus("Network error — check your connection and try again.", true);
  }
}

async function loadCoords(lat, lon) {
  setStatus("Locating you on the map...");
  try {
    handleNewCurrentData(await fetchCurrentByCoords(lat, lon));
  } catch {
    setStatus("Network error — check your connection and try again.", true);
  }
}

// ---------------------------------------------------------
// 9. App shell wiring — nav, unit toggle, search, geo, clock, chips.
//    Safe to call even if a given element isn't on the current page.
// ---------------------------------------------------------
function wireAppShell() {
  const clockEl = document.getElementById("localClock");
  if (clockEl) {
    const tick = () => (clockEl.textContent = new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }));
    tick();
    setInterval(tick, 30000);
  }

  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      const open = mainNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
  }

  const unitToggleEl = document.getElementById("unitToggle");
  if (unitToggleEl) {
    unitToggleEl.querySelectorAll(".unit-btn").forEach((b) => b.classList.toggle("active", b.dataset.unit === unitPref));
    unitToggleEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".unit-btn");
      if (!btn) return;
      unitPref = btn.dataset.unit;
      localStorage.setItem(UNIT_KEY, unitPref);
      unitToggleEl.querySelectorAll(".unit-btn").forEach((b) => b.classList.toggle("active", b === btn));
      if (lastCurrentData && locationReadyCallback) locationReadyCallback(lastCurrentData);
    });
  }

  const searchForm = document.getElementById("searchForm");
  const cityInput = document.getElementById("cityInput");
  if (searchForm && cityInput) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const city = cityInput.value.trim();
      if (city) loadCity(city);
    });
  }

  const geoBtn = document.getElementById("geoBtn");
  if (geoBtn) {
    geoBtn.addEventListener("click", () => {
      if (!navigator.geolocation) {
        setStatus("Geolocation isn't supported by your browser.", true);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => loadCoords(pos.coords.latitude, pos.coords.longitude),
        () => setStatus("Location access denied — search a city instead.", true)
      );
    });
  }

  const chipsEl = document.getElementById("recentChips");
  if (chipsEl) {
    renderRecentChips();
    chipsEl.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (chip) loadCity(chip.dataset.city);
    });
  }
}

// ---------------------------------------------------------
// 10. Public entry point
// ---------------------------------------------------------
const Skyline = {
  API_KEY,
  getWeatherIcon,
  formatLocalTime,
  formatLocalHour,
  tempToNeedleDeg,
  calculateDewPoint,
  displayTemp,
  tempUnitLabel,
  displayWind,
  windUnitLabel,
  setStatus,
  fetchForecast,
  fetchAirQuality,

  // Call once from each page's own script.
  // onLocationReady(data) fires on load, on every new search, and on unit toggle.
  init(onLocationReady) {
    locationReadyCallback = onLocationReady;
    wireAppShell();

    if (API_KEY === "YOUR_API_KEY_HERE") {
      setStatus("Add your free OpenWeatherMap API key in common.js to get started (see README).", true);
      return;
    }
    const last = getLastLocation();
    if (last && last.lat != null) {
      loadCoords(last.lat, last.lon);
    } else {
      loadCity(DEFAULT_CITY);
    }
  },
};

window.Skyline = Skyline;

// ---------------------------------------------------------
// 11. Register the service worker (makes the site installable
//     as a PWA and lets it work offline after the first visit)
// ---------------------------------------------------------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  });
}

// ---------------------------------------------------------
// 12. Custom "Install" button
//     Chrome/Edge fire 'beforeinstallprompt' when the site is
//     eligible to install. We stop the automatic mini-infobar,
//     save the event, and reveal our own button instead — the
//     button only shows up on pages/browsers where it'll work.
// ---------------------------------------------------------
let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const btn = document.getElementById("installBtn");
  if (btn) btn.hidden = false;
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  const btn = document.getElementById("installBtn");
  if (btn) btn.hidden = true;
});

function wireInstallButton() {
  const btn = document.getElementById("installBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    btn.hidden = true;
  });
}
wireInstallButton();
