/* =========================================================
   MAP PAGE — Leaflet map with switchable OpenWeatherMap tile layers
   ========================================================= */
let weatherMapInstance = null;
let weatherTileLayer = null;
let cityMarker = null;
let currentMapLayerKey = "clouds_new";

Skyline.init((data) => {
  initOrUpdateMap(data.coord.lat, data.coord.lon);
});

function buildWeatherTileUrl(layerKey) {
  return `https://tile.openweathermap.org/map/${layerKey}/{z}/{x}/{y}.png?appid=${Skyline.API_KEY}`;
}

function initOrUpdateMap(lat, lon) {
  if (typeof L === "undefined") return; // Leaflet failed to load (e.g. offline)

  if (!weatherMapInstance) {
    weatherMapInstance = L.map("weatherMap", { scrollWheelZoom: false }).setView([lat, lon], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 12,
    }).addTo(weatherMapInstance);
    weatherTileLayer = L.tileLayer(buildWeatherTileUrl(currentMapLayerKey), { opacity: 0.6, maxZoom: 12 }).addTo(weatherMapInstance);
    cityMarker = L.marker([lat, lon]).addTo(weatherMapInstance);
  } else {
    weatherMapInstance.setView([lat, lon], 6);
    cityMarker.setLatLng([lat, lon]);
  }
  setTimeout(() => weatherMapInstance.invalidateSize(), 200);
}

function setMapLayer(layerKey) {
  currentMapLayerKey = layerKey;
  if (!weatherMapInstance || !weatherTileLayer) return;
  weatherMapInstance.removeLayer(weatherTileLayer);
  weatherTileLayer = L.tileLayer(buildWeatherTileUrl(layerKey), { opacity: 0.6, maxZoom: 12 }).addTo(weatherMapInstance);
}

const mapLayerToggle = document.getElementById("mapLayerToggle");
if (mapLayerToggle) {
  mapLayerToggle.addEventListener("click", (e) => {
    const btn = e.target.closest(".layer-btn");
    if (!btn) return;
    mapLayerToggle.querySelectorAll(".layer-btn").forEach((b) => b.classList.toggle("active", b === btn));
    setMapLayer(btn.dataset.layer);
  });
}
