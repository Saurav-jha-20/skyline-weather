/* =========================================================
   AIR QUALITY PAGE — AQI badge + pollutant breakdown
   ========================================================= */
Skyline.init(async (data) => {
  const aqiData = await Skyline.fetchAirQuality(data.coord.lat, data.coord.lon);
  if (aqiData) renderAirQuality(aqiData);
});

const AQI_LABELS = { 1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor" };

function renderAirQuality(data) {
  const item = data.list && data.list[0];
  if (!item) return;
  const aqi = item.main.aqi;
  const c = item.components;

  document.getElementById("aqiNumber").textContent = aqi;
  document.getElementById("aqiLabel").textContent = AQI_LABELS[aqi] || "--";
  document.getElementById("aqiBadge").setAttribute("data-level", aqi);

  const pollutants = [
    { label: "PM2.5", value: c.pm2_5 },
    { label: "PM10", value: c.pm10 },
    { label: "Ozone (O₃)", value: c.o3 },
    { label: "NO₂", value: c.no2 },
    { label: "SO₂", value: c.so2 },
    { label: "CO", value: c.co },
  ];
  document.getElementById("aqiPollutants").innerHTML = pollutants.map((p) => `
    <div class="aqi-pollutant">
      <span class="stat-label">${p.label}</span>
      <span class="stat-value">${p.value != null ? p.value.toFixed(1) : "--"}<small>µg/m³</small></span>
    </div>`).join("");

  document.getElementById("airQualitySection").hidden = false;
}
