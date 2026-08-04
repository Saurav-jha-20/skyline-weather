# Skyline — Weather Station 🌤️

A **5-page** static weather website built with **HTML, CSS, and vanilla JavaScript**. It calls the free [OpenWeatherMap](https://openweathermap.org/) API to show current conditions, an hourly trend, a 5-day outlook, air quality, and an interactive weather map for any city.

No backend, no build tools, no database — just static files, so it's ready to deploy on **GitHub Pages** in a few minutes.

## Pages
| Page | File | What it shows |
|---|---|---|
| Today | `index.html` | Search bar, animated temperature gauge, humidity/wind/pressure/visibility/dew point/sunrise/sunset |
| Hourly | `hourly.html` | SVG temperature trend line + next-24-hours cards with rain chance |
| 5-Day | `forecast.html` | 5-day outlook strip |
| Air Quality | `air-quality.html` | AQI badge (Good → Very Poor) + PM2.5, PM10, O₃, NO₂, SO₂, CO |
| Map | `map.html` | Interactive Leaflet map with switchable Clouds / Precipitation / Temperature / Wind overlays |

Every page shares the same header, nav menu, search bar, °C/°F toggle, and recent-city chips. **Searching or switching units on any page carries over to every other page** — the last city and unit preference are remembered in your browser (`localStorage`), so clicking "Hourly" after searching "Tokyo" on the home page shows Tokyo's hourly forecast automatically, no re-searching needed.

## Features
- **5-page navigation menu** with a mobile hamburger toggle
- Search weather by city name, or use your current location
- **°C / °F unit toggle** — switches instantly using cached data, no extra API call
- **Recent cities** — your last few searches appear as quick-access chips on every page
- Live current conditions with an animated instrument-style temperature gauge
- Dew point, calculated client-side (Magnus formula) — no extra API call needed
- **Hourly trend chart** + cards with precipitation chance
- **Air Quality panel** with AQI category and full pollutant breakdown
- **Interactive weather map** with switchable overlay layers
- Fully responsive, works on mobile

> Note on UV Index: OpenWeatherMap's UV Index now lives behind the paid "One Call" API tier, not the free APIs this project uses — so it isn't included. Dew point is included instead as a free substitute.

## APIs used (all free tier)
- [Current Weather](https://openweathermap.org/current)
- [5 Day / 3 Hour Forecast](https://openweathermap.org/forecast5)
- [Air Pollution](https://openweathermap.org/api/air-pollution)
- [Weather Maps 1.0](https://openweathermap.org/api/weathermaps) — tile overlays, rendered via [Leaflet.js](https://leafletjs.com/) (loaded from a CDN)

## 1. Get a free API key
1. Sign up at https://home.openweathermap.org/users/sign_up
2. Go to **API keys** in your account and copy your default key
3. New keys can take up to a couple of hours to activate — if you get a 401 error at first, just wait and try again

## 2. Add your key to the project
Open **`common.js`** (shared by every page) and replace the placeholder near the top:

```js
const API_KEY = "dcbfa1ae6697767abb9f7ac64ef1cb17";
```

with your actual key:

```js
const API_KEY = "dcbfa1ae6697767abb9f7ac64ef1cb17";
```

You only need to do this in one place — every page loads `common.js` first.

## 3. Run it locally
Since this is a static site, serve it with a local server rather than opening the HTML files directly — this also makes `localStorage` (which powers cross-page memory) behave correctly:

```bash
# Python 3
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## 4. Publish on GitHub Pages
1. Create a new repository on GitHub (e.g. `weather-website`)
2. Push this project to it:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Skyline weather website"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/weather-website.git
   git push -u origin main
   ```
3. On GitHub, go to your repo's **Settings → Pages**
4. Under **Build and deployment**, set **Source** to `Deploy from a branch`, choose the `main` branch and `/ (root)` folder, then **Save**
5. Wait a minute, then your site will be live at:
   `https://YOUR_USERNAME.github.io/weather-website/`

> ⚠️ Note: your API key will be visible in the public JavaScript source once deployed. That's normal for free-tier client-side projects like this one — just don't reuse a key that's tied to a paid account.

## Project structure
```
weather-website/
├── index.html         # Today (home) page
├── hourly.html         # Hourly forecast page
├── forecast.html       # 5-Day outlook page
├── air-quality.html    # Air Quality page
├── map.html             # Weather map page
├── common.js            # Shared: API key, API calls, icons, nav/unit/search wiring, localStorage
├── home.js              # Home page rendering only
├── hourly.js             # Hourly page rendering only
├── forecast.js           # 5-Day page rendering only
├── air-quality.js        # Air Quality page rendering only
├── map.js                # Map page rendering only
├── style.css             # Shared design system & layout (used by every page)
└── README.md
```

## Credits
Weather data provided by [OpenWeatherMap](https://openweathermap.org/). Map tiles by [OpenStreetMap](https://www.openstreetmap.org/copyright) via [Leaflet.js](https://leafletjs.com/).
