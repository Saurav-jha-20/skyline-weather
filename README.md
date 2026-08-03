# Skyline — Weather Station 🌤️

A simple static weather-lookup website built with **HTML, CSS, and vanilla JavaScript**. It calls the free [OpenWeatherMap](https://openweathermap.org/) API to show current conditions and a 5-day outlook for any city, with a custom animated temperature gauge.

No backend, no build tools, no database — just three files, so it's ready to deploy on **GitHub Pages** in a few minutes.

## Features
- Search weather by city name, or use your current location
- Live current conditions: temperature, "feels like," humidity, wind, pressure, visibility, dew point, sunrise/sunset
- Animated instrument-style temperature gauge
- **Next 24 hours**: an SVG temperature trend line plus hourly cards with rain chance
- 5-day forecast strip
- Fully responsive, works on mobile

> Note on UV Index: OpenWeatherMap's UV Index now lives behind the paid "One Call" API tier, not the free Current Weather / 5-Day Forecast APIs this project uses — so it isn't included here. Dew point is included instead, calculated client-side from temperature and humidity (Magnus formula), so it doesn't need an extra API call.

## Tech used
- HTML5 / CSS3 / JavaScript (ES6, `fetch`, `async/await`)
- [OpenWeatherMap Current Weather](https://openweathermap.org/current) and [5 Day / 3 Hour Forecast](https://openweathermap.org/forecast5) APIs (both free tier)

## 1. Get a free API key
1. Sign up at https://home.openweathermap.org/users/sign_up
2. Go to **API keys** in your account and copy your default key
3. New keys can take up to a couple of hours to activate — if you get a 401 error at first, just wait and try again

## 2. Add your key to the project
Open `script.js` and replace the placeholder near the top:

```js
const API_KEY = "YOUR_API_KEY_HERE";
```

with your actual key:

```js
const API_KEY = "abcd1234yourrealkeyhere";
```

## 3. Run it locally
Since this is a static site, you can just open `index.html` in a browser. For best results (some browsers restrict `fetch` on `file://`), serve it locally instead:

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
├── index.html   # Page structure
├── style.css    # Design system & layout
├── script.js    # API calls + DOM rendering
└── README.md
```

## Credits
Weather data provided by [OpenWeatherMap](https://openweathermap.org/).
