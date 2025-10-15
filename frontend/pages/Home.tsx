import { useState } from "react";
import api from "../src/api";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchStops = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/stops?query=${query}`);
      setResults(res.data.stops);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-4">🚌 TFI Stop Finder</h1>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stops..."
          className="p-2 border rounded w-80"
        />
        <button
          onClick={searchStops}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <ul>
        {results.map((stop) => (
          <li key={stop.stop_id} className="border-b py-2">
            <div className="font-semibold">{stop.stop_name}</div>
            <div className="text-sm text-gray-600">{stop.stop_id}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
