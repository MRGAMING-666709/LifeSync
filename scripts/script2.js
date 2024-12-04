const API_KEY = "e311da3cf179a4259e77fe22db429359";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

let debounceTimeout;


document.addEventListener('DOMContentLoaded', () =>{
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByLocation(latitude, longitude);
                fetchWeatherForData(latitude, longitude);
                handleAuthClick();
            },
            () => {
                displayError("Location access denied. Please allow location access.");
            }
        );
    } else {
        displayError("Geolocation is not supported by your browser.");
    }
})


document.getElementById("getLocationWeather").addEventListener("click", () => {
    document.getElementById("cityInput").textContent = '';
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByLocation(latitude, longitude);
            },
            () => {
                displayError("Location access denied. Please allow location access.");
            }
        );
    } else {
        displayError("Geolocation is not supported by your browser.");
    }
});

async function fetchWeatherByLocation(lat, lon) {
    try {
        showLoading();
        const response = await fetch(`${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        if (!response.ok) throw new Error("Unable to fetch weather for your location.");
        const data = await response.json();
        displayWeather(data);
        
    } catch (error) {
        displayError(error.message);
    }
}

async function fetchWeatherForData(lat, lon) {
    try {
        showLoading();
        const response = await fetch(`${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        if (!response.ok) throw new Error("Unable to fetch weather for your location.");
        const data = await response.json();
        generateWeatherSuggestions(data);
        
    } catch (error) {
        displayError(error.message);
    }
}

async function fetchWeatherByCity(city) {
    try {
        const country = city.includes(",") ? city.split(",").pop().trim() : "";
        const cityQuery = country ? `${city.split(",")[0].trim()},${country}` : city;
        showLoading();
        const response = await fetch(`${BASE_URL}?q=${cityQuery}&appid=${API_KEY}&units=metric`);
        if (!response.ok) throw new Error("City not found. Please check the name.");
        const data = await response.json();
        displayWeather(data);
    } catch (error) {
        displayError(error.message);
    }
}

async function fetchCitySuggestions(query) {
    if (!query) return;
    const apiUrl = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&limit=5`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const cities = data.map((result) => ({
            name: result.display_name,
            country: result.address.country || "",
            lat: result.lat,
            lon: result.lon,
        }));
        displayCitySuggestions(cities);
    } catch (error) {
        console.error("Error fetching city suggestions:", error);
    }
}

function displayCitySuggestions(cities) {
    const suggestionBox = document.getElementById("citySuggestions");
    suggestionBox.innerHTML = "";
    if (cities.length === 0) {
        suggestionBox.innerHTML = "<div class='suggestion-item'>No results found</div>";
        return;
    }
    cities.forEach((city) => {
        const suggestionItem = document.createElement("div");
        suggestionItem.textContent = `${city.name} (${city.country})`;
        suggestionItem.className = "suggestion-item";
        suggestionItem.addEventListener("click", () => {
            document.getElementById("cityInput").value = city.name;
            fetchWeatherByLocation(city.lat, city.lon);
            suggestionBox.innerHTML = "";
        });
        suggestionBox.appendChild(suggestionItem);
    });
}

document.getElementById("cityInput").addEventListener("input", (e) => {
    const query = e.target.value;
    clearTimeout(debounceTimeout);
    const suggestionBox = document.getElementById("citySuggestions");
    suggestionBox.innerHTML = "<div class='suggestion-item'>Loading suggestions...</div>";
    debounceTimeout = setTimeout(() => {
        fetchCitySuggestions(query);
    }, 300);
});

document.getElementById("cityInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const city = document.getElementById("cityInput").value;
        if (!city) {
            displayError("Please enter a city name!");
            return;
        }
        fetchWeatherByCity(city);
        document.getElementById("citySuggestions").innerHTML = "";
    }
});

function displayWeather(data) {
    const weatherCondition = data.weather[0].main.toLowerCase();
    const weatherInfo = `
        <h2>${data.name}, ${data.sys.country}</h2>
        <p><strong>Temperature:</strong> ${data.main.temp}°C</p>
        <p><strong>Condition:</strong> ${data.weather[0].description}</p>
        <p><strong>Humidity:</strong> ${data.main.humidity}%</p>
        <p><strong>Wind Speed:</strong> ${data.wind.speed} m/s</p>
    `;
    document.getElementById("weatherResult").innerHTML = weatherInfo;
    updateBackground(weatherCondition);
}

function updateBackground(condition) {
    const body = document.querySelector('#weather');
    body.className = "default-weather";
    
    if (condition.includes("clear")) {
        body.className = "clear";
    } else if (condition.includes("cloud")) {
        body.className = "cloudy";
    } else if (condition.includes("rain")) {
        body.className = "rain";
    } else if (condition.includes("snow")) {
        body.className = "snow";
    } else if (condition.includes("thunderstorm")) {
        body.className = "thunderstorm";
    }
}

function displayError(message) {
    document.getElementById("weatherResult").innerHTML = `<p id="error">${message}</p>`;
}

function showLoading() {
    document.getElementById("weatherResult").innerHTML = "<p>Loading weather data...</p>";
}
