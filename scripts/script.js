// API key
import { API_KEY } from "./config.js";

// Base URLs for OpenWeatherMap API
const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_API_URL = "https://api.openweathermap.org/data/2.5/forecast";

// DOM elements
const leftInfo = document.querySelector(".left-info");
const searchForm = document.querySelector(".search-container");
const searchInput = document.getElementById("location-search");
const todayDay = document.querySelector(".today-info h2");
const todayDate = document.querySelector(".today-info time");
const locationElement = document.querySelector(".location span");
const currentTemp = document.querySelector(".weather-temp");
const currentWeatherContainer = document.querySelector(".today-weather");
const currentWeatherDescription = document.querySelector(".today-weather h3");
const seaLevel = document.querySelector(".weather-stat:nth-child(1) .value");
const humidity = document.querySelector(".weather-stat:nth-child(2) .value");
const windSpeed = document.querySelector(".weather-stat:nth-child(3) .value");
const forecastList = document.querySelector(".days-list");

// Get corresponding weather icon
function getWeatherIconUrl(iconCode) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

// Format date
function formatDate(date) {
  const options = { day: "numeric", month: "long", year: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

// Day name
function getDayName(date, short = false) {
  const options = { weekday: short ? "short" : "long" };
  return date.toLocaleDateString("en-US", options);
}

// Kelvin to celsius
function kelvinToCelsius(kelvin) {
  return Math.round(kelvin - 273.15);
}

// Fetch current weather data from API
async function fetchCurrentWeather(location) {
  try {
    const response = await fetch(
      `${WEATHER_API_URL}?q=${location}&appid=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error("Location not found");
    }

    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error fetching current weather:", error);
    showToast("Location not found. Try 'City, State' format.");
    return null;
  }
}

// Fetch 5-day forecast
async function fetchForecast(location) {
  try {
    const response = await fetch(
      `${FORECAST_API_URL}?q=${location}&appid=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error("Location not found");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching forecast:", error);
    return null;
  }
}

// For setting bg image
function setBackgroundImage(description) {
  const formattedDesc = description.toLowerCase().replace(/\s+/g, "-");
  const imagePath = `../assets/${formattedDesc}.png`;

  // Preload image
  const img = new Image();
  img.onload = () => {
    leftInfo.style.backgroundImage = `url('${imagePath}')`;
  };
  img.onerror = () => {
    leftInfo.style.backgroundImage = `url('../assets/clear-sky.png')`;
  };
  img.src = imagePath;
}

// Own toast imple
function showToast(message) {
  let toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 100);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Update current weather UI
function updateCurrentWeather(data) {
  if (!data) return;

  setBackgroundImage(data.weather[0].description);

  const today = new Date();
  const tempCelsius = kelvinToCelsius(data.main.temp);
  const cityName = data.name;
  const countryCode = data.sys.country;
  const iconCode = data.weather[0].icon;

  // Update UI elements
  todayDay.textContent = getDayName(today);
  todayDate.textContent = formatDate(today);
  todayDate.setAttribute("datetime", today.toISOString().split("T")[0]);
  locationElement.textContent = `${cityName}, ${countryCode}`;
  currentTemp.textContent = `${tempCelsius}°C`;
  currentWeatherDescription.textContent = data.weather[0].description;

  // Find and replace weather icon
  const existingIcon = currentWeatherContainer.querySelector("i, img");
  if (existingIcon) {
    // Create new img element
    const weatherImg = document.createElement("img");
    weatherImg.src = getWeatherIconUrl(iconCode.replace("n", "d"));
    weatherImg.alt = data.weather[0].description;
    weatherImg.className = "weather-icon";

    // Replace old icon with new img
    existingIcon.replaceWith(weatherImg);
  }

  // Update weather stats
  seaLevel.textContent = data.main.sea_level;
  humidity.textContent = `${data.main.humidity} %`;
  windSpeed.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
}

// Update forecast UI
function updateForecast(data) {
  if (!data) return;

  // Clear existing forecast
  forecastList.innerHTML = "";

  // Group forecast by day
  const forecastByDay = {};
  const today = new Date().setHours(0, 0, 0, 0);

  data.list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const day = date.setHours(0, 0, 0, 0);

    // Skip today's forecast
    if (day === today) return;

    if (
      !forecastByDay[day] ||
      forecastByDay[day].main.temp_max < item.main.temp_max
    ) {
      forecastByDay[day] = item;
    }
  });

  // Get only the next 4 days
  const nextDays = Object.keys(forecastByDay)
    .sort((a, b) => a - b)
    .slice(0, 4);

  // Create forecast elements
  nextDays.forEach((day) => {
    const forecast = forecastByDay[day];
    const date = new Date(parseInt(day));
    const dayName = getDayName(date, true);
    const tempCelsius = kelvinToCelsius(forecast.main.temp_max);
    const iconCode = forecast.weather[0].icon;

    const li = document.createElement("li");
    li.innerHTML = `
      <img src="${getWeatherIconUrl(iconCode)}" alt="${
      forecast.weather[0].description
    }" class="forecast-icon">
      <span>${dayName}</span>
      <span class="day-temp">${tempCelsius}°C</span>
    `;

    forecastList.appendChild(li);
  });
}

// Search weather for a location
async function searchWeather(location) {
  const currentWeatherData = await fetchCurrentWeather(location);
  if (!currentWeatherData) return;

  updateCurrentWeather(currentWeatherData);

  const forecastData = await fetchForecast(location);
  updateForecast(forecastData);
}

// Handle search form submission
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const location = searchInput.value.trim();
  if (location) {
    searchWeather(location);
  }
});

// Load default location on page load
document.addEventListener("DOMContentLoaded", () => {
  searchWeather("Valenzuela, PH");
});
