import { useState, useEffect } from "react";
import { checkApiHealth } from "@/lib/api";
import { Activity, CheckCircle, XCircle, RefreshCw } from "lucide-react";

const API_ENDPOINTS = [
  { name: "Health", path: "/health", method: "GET" },
  { name: "Products", path: "/products", method: "GET" },
  { name: "Categories", path: "/categories", method: "GET" },
  { name: "Brands", path: "/brands", method: "GET" },
  { name: "Banners", path: "/banners/active", method: "GET" },
  { name: "Deals", path: "/deals/active", method: "GET" },
  { name: "Homepage", path: "/homepage/sections", method: "GET" },
];

export default function ApiHealthChecker() {
  const [healthStatus, setHealthStatus] = useState({});
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

  const checkEndpoint = async (endpoint) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const checkAllEndpoints = async () => {
    setIsChecking(true);
    const results = {};
    
    await Promise.all(
      API_ENDPOINTS.map(async (endpoint) => {
        const isHealthy = await checkEndpoint(endpoint);
        results[endpoint.name] = isHealthy;
      })
    );

    setHealthStatus(results);
    setLastChecked(new Date());
    setIsChecking(false);
  };

  useEffect(() => {
    checkAllEndpoints();
    const interval = setInterval(checkAllEndpoints, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const allHealthy = Object.values(healthStatus).every((status) => status === true);
  const healthyCount = Object.values(healthStatus).filter((status) => status === true).length;

  return (
    <div className="bg-surface border border-outline-variant rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-academic-blue" />
          <h3 className="text-[15px] font-semibold text-academic-blue">API Health Status</h3>
        </div>
        <button
          onClick={checkAllEndpoints}
          disabled={isChecking}
          className="inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-oxford-red hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
          {isChecking ? "Checking..." : "Refresh"}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {API_ENDPOINTS.map((endpoint) => {
          const isHealthy = healthStatus[endpoint.name];
          const statusColor = isHealthy === true ? "text-green-600" : isHealthy === false ? "text-red-600" : "text-gray-400";
          const bgColor = isHealthy === true ? "bg-green-50 border-green-200" : isHealthy === false ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200";
          
          return (
            <div
              key={endpoint.name}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${bgColor} transition-colors`}
            >
              {isHealthy === true ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : isHealthy === false ? (
                <XCircle className="w-4 h-4 text-red-600" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
              )}
              <span className={`text-[13px] font-medium ${statusColor}`}>
                {endpoint.name}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-[12px] text-on-surface-variant">
        <span>
          {healthyCount}/{API_ENDPOINTS.length} endpoints healthy
        </span>
        {lastChecked && (
          <span>Last checked: {lastChecked.toLocaleTimeString()}</span>
        )}
      </div>
    </div>
  );
}
