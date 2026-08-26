import { useState, useEffect, useCallback } from "react";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  CloudDrizzle,
  CloudSun,
  Droplets,
  Wind,
  Thermometer,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface WeatherData {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };
}

const WMO_CODES: Record<number, { condition: string; label: string }> = {
  0: { condition: "Clear", label: "Clear sky" },
  1: { condition: "Clear", label: "Mainly clear" },
  2: { condition: "Clouds", label: "Partly cloudy" },
  3: { condition: "Clouds", label: "Overcast" },
  45: { condition: "Fog", label: "Fog" },
  48: { condition: "Fog", label: "Rime fog" },
  51: { condition: "Drizzle", label: "Light drizzle" },
  53: { condition: "Drizzle", label: "Moderate drizzle" },
  55: { condition: "Drizzle", label: "Dense drizzle" },
  56: { condition: "Drizzle", label: "Freezing drizzle" },
  57: { condition: "Drizzle", label: "Dense freezing drizzle" },
  61: { condition: "Rain", label: "Slight rain" },
  63: { condition: "Rain", label: "Moderate rain" },
  65: { condition: "Rain", label: "Heavy rain" },
  66: { condition: "Rain", label: "Freezing rain" },
  67: { condition: "Rain", label: "Heavy freezing rain" },
  71: { condition: "Snow", label: "Slight snow" },
  73: { condition: "Snow", label: "Moderate snow" },
  75: { condition: "Snow", label: "Heavy snow" },
  77: { condition: "Snow", label: "Snow grains" },
  80: { condition: "Rain", label: "Rain showers" },
  81: { condition: "Rain", label: "Moderate rain showers" },
  82: { condition: "Rain", label: "Violent rain showers" },
  85: { condition: "Snow", label: "Snow showers" },
  86: { condition: "Snow", label: "Heavy snow showers" },
  95: { condition: "Thunderstorm", label: "Thunderstorm" },
  96: { condition: "Thunderstorm", label: "Thunderstorm with hail" },
  99: { condition: "Thunderstorm", label: "Severe thunderstorm" },
};

const getWeatherIcon = (code: number) => {
  const condition = WMO_CODES[code]?.condition ?? "Clear";
  switch (condition) {
    case "Clear":
      return <Sun size={32} color="var(--accent)" />;
    case "Clouds":
      return <Cloud size={32} color="var(--text-2)" />;
    case "Rain":
      return <CloudRain size={32} color="#5B9BD5" />;
    case "Drizzle":
      return <CloudDrizzle size={32} color="#5B9BD5" />;
    case "Thunderstorm":
      return <CloudLightning size={32} color="#FFD93D" />;
    case "Snow":
      return <CloudSnow size={32} color="var(--text-1)" />;
    case "Fog":
      return <CloudFog size={32} color="var(--text-3)" />;
    default:
      return <CloudSun size={32} color="var(--accent)" />;
  }
};

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=34.1688&longitude=73.2462&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia/Karachi"
      );
      if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
      const data: WeatherData = await res.json();
      setWeather(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch weather");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  if (loading && !weather) {
    return (
      <div className="glass-panel" style={styles.container}>
        <RefreshCw size={24} color="var(--accent)" className="spin" />
        <span style={styles.placeholderText}>Loading weather...</span>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="glass-panel" style={styles.container}>
        <AlertCircle size={24} color="var(--negative)" />
        <span style={{ ...styles.placeholderText, color: "var(--negative)" }}>
          {error}
        </span>
      </div>
    );
  }

  if (!weather) return null;

  const code = weather.current.weather_code;
  const label = WMO_CODES[code]?.label ?? "Unknown";
  const temp = Math.round(weather.current.temperature_2m);
  const feelsLike = Math.round(weather.current.apparent_temperature);
  const humidity = weather.current.relative_humidity_2m;
  const wind = weather.current.wind_speed_10m;

  return (
    <div className="glass-panel" style={styles.container}>
      <div style={styles.header}>
        {getWeatherIcon(code)}
        <div>
          <div style={styles.temp}>{temp}°C</div>
          <div style={styles.desc}>{label}</div>
        </div>
      </div>

      <div style={styles.details}>
        <div style={styles.detailItem}>
          <Thermometer size={16} color="var(--text-3)" />
          <span style={styles.detailLabel}>Feels like</span>
          <span style={styles.detailValue}>{feelsLike}°C</span>
        </div>
        <div style={styles.detailItem}>
          <Droplets size={16} color="var(--text-3)" />
          <span style={styles.detailLabel}>Humidity</span>
          <span style={styles.detailValue}>{humidity}%</span>
        </div>
        <div style={styles.detailItem}>
          <Wind size={16} color="var(--text-3)" />
          <span style={styles.detailLabel}>Wind</span>
          <span style={styles.detailValue}>{wind} km/h</span>
        </div>
      </div>

      {error && (
        <div style={styles.staleWarning}>
          <AlertCircle size={14} color="var(--warning)" />
          <span style={{ color: "var(--warning)", fontSize: "0.7rem" }}>
            Stale data — {error}
          </span>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "1rem 1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    minWidth: 0,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  temp: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "var(--text-1)",
    lineHeight: 1.1,
  },
  desc: {
    fontSize: "0.8rem",
    color: "var(--text-3)",
    textTransform: "capitalize",
  },
  details: {
    display: "flex",
    justifyContent: "space-between",
    gap: "0.5rem",
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.15rem",
  },
  detailLabel: {
    fontSize: "0.65rem",
    color: "var(--text-3)",
  },
  detailValue: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--text-2)",
  },
  placeholderText: {
    color: "var(--text-3)",
    fontSize: "0.85rem",
  },
  staleWarning: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    justifyContent: "center",
  },
};
