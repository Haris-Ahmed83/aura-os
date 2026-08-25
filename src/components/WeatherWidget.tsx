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
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: { description: string; icon: string; main: string }[];
  wind: { speed: number };
  name: string;
}

interface WeatherWidgetProps {
  apiKey: string;
}

const getWeatherIcon = (condition: string) => {
  switch (condition.toLowerCase()) {
    case "clear":
      return <Sun size={32} color="var(--accent)" />;
    case "clouds":
      return <Cloud size={32} color="var(--text-2)" />;
    case "rain":
      return <CloudRain size={32} color="#5B9BD5" />;
    case "drizzle":
      return <CloudDrizzle size={32} color="#5B9BD5" />;
    case "thunderstorm":
      return <CloudLightning size={32} color="#FFD93D" />;
    case "snow":
      return <CloudSnow size={32} color="var(--text-1)" />;
    case "mist":
    case "fog":
    case "haze":
      return <CloudFog size={32} color="var(--text-3)" />;
    default:
      return <CloudSun size={32} color="var(--accent)" />;
  }
};

export default function WeatherWidget({ apiKey }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=34.1688&lon=73.2462&units=metric&appid=${apiKey}`
      );
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data: WeatherData = await res.json();
      setWeather(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch weather");
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    if (!apiKey) return;
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [apiKey, fetchWeather]);

  if (!apiKey) {
    return (
      <div className="glass-panel" style={styles.container}>
        <Sun size={28} color="var(--accent)" />
        <span style={styles.placeholderText}>Set API key in Settings</span>
      </div>
    );
  }

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

  const condition = weather.weather[0]?.main ?? "Clear";
  const description = weather.weather[0]?.description ?? "";

  return (
    <div className="glass-panel" style={styles.container}>
      <div style={styles.header}>
        {getWeatherIcon(condition)}
        <div>
          <div style={styles.temp}>{Math.round(weather.main.temp)}°C</div>
          <div style={styles.desc}>{description}</div>
        </div>
      </div>

      <div style={styles.details}>
        <div style={styles.detailItem}>
          <Thermometer size={16} color="var(--text-3)" />
          <span style={styles.detailLabel}>Feels like</span>
          <span style={styles.detailValue}>
            {Math.round(weather.main.feels_like)}°C
          </span>
        </div>
        <div style={styles.detailItem}>
          <Droplets size={16} color="var(--text-3)" />
          <span style={styles.detailLabel}>Humidity</span>
          <span style={styles.detailValue}>{weather.main.humidity}%</span>
        </div>
        <div style={styles.detailItem}>
          <Wind size={16} color="var(--text-3)" />
          <span style={styles.detailLabel}>Wind</span>
          <span style={styles.detailValue}>
            {weather.wind.speed} m/s
          </span>
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
