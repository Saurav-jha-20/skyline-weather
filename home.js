/* =========================================================
   HOME PAGE — current conditions gauge + stats
   ========================================================= */
Skyline.init((data) => {
  renderCurrent(data);
});

function renderCurrent(data) {
  const rawTempC = data.main.temp;
  const main = data.weather[0].main;

  document.getElementById("tempValue").textContent = Skyline.displayTemp(rawTempC);
  document.getElementById("tempUnitLabel").textContent = Skyline.tempUnitLabel();
  document.getElementById("cityName").textContent = `${data.name}, ${data.sys.country}`;
  document.getElementById("conditionDesc").textContent = data.weather[0].description;
  document.getElementById("feelsLike").textContent = Skyline.displayTemp(data.main.feels_like);
  document.getElementById("feelsLikeUnit").textContent = Skyline.tempUnitLabel();
  document.getElementById("conditionIcon").innerHTML = Skyline.getWeatherIcon(main, 46);

  document.getElementById("statHumidity").innerHTML = `${data.main.humidity}<small>%</small>`;
  document.getElementById("statWind").innerHTML = `${Skyline.displayWind(data.wind.speed)}<small>${Skyline.windUnitLabel()}</small>`;
  document.getElementById("statPressure").innerHTML = `${data.main.pressure}<small>hPa</small>`;
  document.getElementById("statVisibility").innerHTML = `${(data.visibility / 1000).toFixed(1)}<small>km</small>`;

  const dewPointC = Skyline.calculateDewPoint(data.main.temp, data.main.humidity);
  document.getElementById("statDewPoint").innerHTML = `${Skyline.displayTemp(dewPointC)}<small>${Skyline.tempUnitLabel()}</small>`;

  document.getElementById("statSunrise").textContent = Skyline.formatLocalTime(data.sys.sunrise, data.timezone);
  document.getElementById("statSunset").textContent = Skyline.formatLocalTime(data.sys.sunset, data.timezone);

  document.getElementById("gaugeNeedle").style.setProperty("--deg", `${Skyline.tempToNeedleDeg(rawTempC)}deg`);

  document.getElementById("weatherPanel").hidden = false;
}
