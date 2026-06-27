"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  CloudRain, 
  Sun, 
  Wind, 
  Thermometer, 
  CloudLightning,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Info
} from "lucide-react";

export default function WeatherPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState<any>(null);

  // Get active project ID
  const selectedProjectId = typeof window !== "undefined" ? localStorage.getItem("selected_project_id") : null;

  const fetchWeather = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const headers = { "Authorization": `Bearer ${token}` };
      const res = await fetch(`http://localhost:8000/api/projects/${selectedProjectId}/weather`, { headers });
      if (!res.ok) throw new Error("Failed to load weather intelligence data");
      const data = await res.json();
      setWeatherData(data);
    } catch (err: any) {
      setError(err.message || "Failed to load weather intelligence. Please verify backend connection.");
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [selectedProjectId]);

  const getWeatherIcon = (cond: string) => {
    const c = cond?.toLowerCase() || "";
    if (c.includes("rain")) return <CloudRain className="h-10 w-10 text-cyan-400" />;
    if (c.includes("storm") || c.includes("thunder")) return <CloudLightning className="h-10 w-10 text-orange-400" />;
    if (c.includes("wind")) return <Wind className="h-10 w-10 text-slate-400" />;
    return <Sun className="h-10 w-10 text-amber-400" />;
  };

  const getStatusColor = (status: string) => {
    if (status === "High Risk") return "bg-red-500/10 text-red-400 border-red-500/15";
    if (status === "Medium Risk") return "bg-amber-500/10 text-amber-400 border-amber-500/15";
    return "bg-green-500/10 text-green-400 border-green-500/15";
  };

  return (
    <div className="pl-64 min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-900 bg-slate-950/40 p-6 flex justify-between items-center backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">
            Weather Intelligence
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Site weather forecasts and dynamic construction risk analysis
          </p>
        </div>
        <button
          onClick={fetchWeather}
          className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-800 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
          <span>Sync Forecast</span>
        </button>
      </header>

      {error && (
        <div className="mx-6 mt-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      <main className="p-6 flex-grow space-y-6">
        {!weatherData && !loading && (
          <div className="bg-slate-900/20 border border-dashed border-slate-850 p-16 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 max-w-lg mx-auto my-8">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-full">
              <CloudRain className="h-10 w-10 text-orange-500/80 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-355">No weather data fetched.</h3>
              <p className="text-xs text-slate-500 max-w-xs">
                Local weather telemetry is empty. Sync the forecast to pull real-time weather logs and safety operations analyses.
              </p>
            </div>
            <button
              onClick={fetchWeather}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-xs font-bold px-6 py-2.5 rounded-xl border border-orange-500/20 transition-all shadow-lg shadow-orange-500/10"
            >
              Sync Forecast
            </button>
          </div>
        )}

        {weatherData && (
          <div className="space-y-6">
            {/* Current weather alert headers */}
            {weatherData.log.alerts_triggered?.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/15 rounded-2xl p-5 flex items-start space-x-3 text-red-400 text-xs">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm uppercase">Active Hazards Alert</h4>
                  <ul className="list-disc list-inside space-y-0.5 font-medium opacity-90">
                    {weatherData.log.alerts_triggered.map((alert: string, idx: number) => (
                      <li key={idx}>{alert}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Current Weather Card */}
            <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center space-x-4">
                {getWeatherIcon(weatherData.log.condition)}
                <div>
                  <h3 className="text-xl font-bold">{weatherData.log.condition}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Live Local Site Reading</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 text-center text-xs">
                <div className="space-y-1">
                  <div className="text-slate-500 font-bold uppercase tracking-wider">Temperature</div>
                  <div className="font-mono text-lg font-bold text-slate-100 flex items-center justify-center">
                    <Thermometer className="h-4.5 w-4.5 text-orange-500 mr-1" />
                    {weatherData.log.temp}°C
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-slate-500 font-bold uppercase tracking-wider">Precipitation</div>
                  <div className="font-mono text-lg font-bold text-slate-100 flex items-center justify-center">
                    <CloudRain className="h-4.5 w-4.5 text-cyan-400 mr-1" />
                    {weatherData.log.rain_prob}%
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-slate-500 font-bold uppercase tracking-wider">Wind Speed</div>
                  <div className="font-mono text-lg font-bold text-slate-100 flex items-center justify-center">
                    <Wind className="h-4.5 w-4.5 text-slate-400 mr-1" />
                    {weatherData.forecast[0]?.wind_speed || 8.5} m/s
                  </div>
                </div>
              </div>
            </div>

            {/* Construction Safety Analysis Tiers */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Operations Safety Matrix</h3>
              <div className="grid md:grid-cols-4 gap-4">
                {Object.keys(weatherData.log.impact_assessment).map((catName) => {
                  const assessment = weatherData.log.impact_assessment[catName];
                  return (
                    <div key={catName} className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                            {catName === "concrete" ? "Concrete curing" : catName.toUpperCase()}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${getStatusColor(assessment.status)}`}>
                            {assessment.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                          {assessment.reason}
                        </p>
                      </div>

                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850 text-[10px] text-slate-400">
                        <span className="font-bold text-orange-400/90 block mb-0.5">Advisory Action:</span>
                        {assessment.action}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 7-Day Forecast Row */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">7-Day Local Forecast</h3>
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-7 divide-x divide-slate-800 text-center text-xs">
                  {weatherData.forecast.map((f: any, idx: number) => (
                    <div key={idx} className="p-4 space-y-3 hover:bg-slate-850/20 transition-all duration-200">
                      <div className="text-[10px] font-bold text-slate-500">
                        {new Date(f.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
                      </div>
                      <div className="flex justify-center my-2">
                        {getWeatherIcon(f.condition)}
                      </div>
                      <div className="font-mono text-sm font-extrabold text-slate-100">{f.temp}°C</div>
                      <div className="text-[9px] text-slate-500 font-semibold uppercase">{f.condition}</div>
                      <div className="text-[9px] text-cyan-400 font-mono font-bold">{f.rain_prob}% Rain</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
