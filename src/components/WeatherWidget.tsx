import { useState, useEffect, useCallback } from "react";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  CloudDrizzle,
  Droplets,
  Wind,
  Thermometer,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const API_KEY = "214d7023ffb25783d0a8c690e5b26149";
const CITY = "Abbottabad";
const COUNTRY = "PK";

interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    temp_min: number;
    temp_max: number;
  };
  weather: { id: number; main: string; description: string; icon: string }[];
  wind: { speed: number };
  name: string;
  sys: { country: string; sunrise: number; sunset: number };
}

const getWeatherIcon = (weatherId: number) => {
  if (weatherId >= 200 && weatherId < 300) return <CloudLightning size={32} color="#FFD93D" />;
  if (weatherId >= 300 && weatherId < 400) return <CloudDrizzle size={32} color="#5B9BD5" />;
  if (weatherId >= 500 && weatherId < 600) return <CloudRain size={32} color="#5B9BD5" />;
  if (weatherId >= 600 && weatherId < 700) return <CloudSnow size={32} color="var(--text-1)" />;
  if (weatherId >= 700 && weatherId < 800) return <CloudFog size={32} color="var(--text-3)" />;
  if (weatherId === 800) return <Sun size={32} color="var(--accent)" />;
  if (weatherId > 800) return <Cloud size={32} color="var(--text-2)" />;
  return <Sun size={32} color="var(--accent)" />;
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
        `https://api.openweathermap.org/data/2.5/weather?q=${CITY},${COUNTRY}&appid=${API_KEY}&units=metric`
      );
      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid API key");
        throw new Error(`Weather API error: ${res.status}`);
      }
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

  const weatherId = weather.weather[0]?.id ?? 800;
  const label = weather.weather[0]?.description ?? "Unknown";
  const temp = Math.round(weather.main.temp);
  const feelsLike = Math.round(weather.main.feels_like);
  const humidity = weather.main.humidity;
  const wind = weather.wind.speed;

  return (
    <div className="glass-panel" style={styles.container}>
      <div style={styles.header}>
        {getWeatherIcon(weatherId)}
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
          <span style={styles.detailValue}>{wind} m/s</span>
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
