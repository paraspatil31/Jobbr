import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface JobPin {
  id: string;
  title: string;
  company: string;
  type: string;
  salary: string;
  distance: string;
  lat: number;
  lng: number;
  color: string;
}

const MAP_JOBS: JobPin[] = [
  { id: "1", title: "Frontend Developer",   company: "TechHub SF",   type: "Full-time", salary: "$90k–$120k",  distance: "1.2 mi", lat: 37.7749,  lng: -122.4194, color: "#3b82f6" },
  { id: "2", title: "UX Designer",          company: "DesignCo",     type: "Contract",  salary: "$75k–$95k",   distance: "0.8 mi", lat: 37.7858,  lng: -122.4064, color: "#a855f7" },
  { id: "3", title: "Product Manager",      company: "GrowthLabs",   type: "Full-time", salary: "$110k–$140k", distance: "3.4 mi", lat: 37.8044,  lng: -122.2712, color: "#22c55e" },
  { id: "4", title: "Backend Engineer",     company: "DataStream",   type: "Part-time", salary: "$70k–$90k",   distance: "2.1 mi", lat: 37.7590,  lng: -122.4040, color: "#f97316" },
  { id: "5", title: "Marketing Specialist", company: "BrandForward", type: "Full-time", salary: "$60k–$80k",   distance: "1.8 mi", lat: 37.7700,  lng: -122.4400, color: "#ec4899" },
  { id: "6", title: "DevOps Engineer",      company: "CloudBase",    type: "Contract",  salary: "$100k–$130k", distance: "Remote", lat: 37.7825,  lng: -122.4100, color: "#06b6d4" },
];

function makeJobIcon(color: string) {
  return L.divIcon({
    className: "",
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
    html: `
      <div style="position:relative;width:36px;height:44px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.25))">
        <svg viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
          <path d="M18 0C8.059 0 0 8.059 0 18c0 12.255 16.2 24.98 17.135 25.708a1.5 1.5 0 001.73 0C19.8 42.98 36 30.255 36 18 36 8.059 27.941 0 18 0z" fill="${color}"/>
          <circle cx="18" cy="18" r="10" fill="white" opacity="0.95"/>
          <path d="M13 17.5h2.5V15a2.5 2.5 0 015 0v2.5H23a1 1 0 011 1v5a1 1 0 01-1 1H13a1 1 0 01-1-1v-5a1 1 0 011-1zm3.5 0H20V15a2 2 0 00-4 0v2.5zm-1.5 1v5h8v-5h-8z" fill="${color}" fill-rule="evenodd" clip-rule="evenodd"/>
        </svg>
      </div>
    `,
  });
}

function makeUserIcon() {
  return L.divIcon({
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `
      <div style="width:20px;height:20px;position:relative">
        <div style="width:20px;height:20px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 2px 8px rgba(37,99,235,0.5);position:absolute;inset:0"></div>
      </div>
    `,
  });
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

interface JobMapProps {
  radius?: number;
}

export default function JobMap({ radius = 25 }: JobMapProps) {
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [center] = useState<[number, number]>([37.7749, -122.4194]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationGranted(true);
      },
      () => {
        setLocationGranted(false);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  const mapCenter: [number, number] = userPos ? [userPos.lat, userPos.lng] : center;
  const radiusMeters = radius * 1000;

  return (
    <MapContainer
      center={mapCenter}
      zoom={13}
      zoomControl={false}
      scrollWheelZoom={false}
      dragging={true}
      doubleClickZoom={false}
      style={{ width: "100%", height: "100%", position: "absolute", inset: 0, zIndex: 0 }}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
      />

      {userPos && (
        <>
          <RecenterMap lat={userPos.lat} lng={userPos.lng} />
          <Circle
            center={[userPos.lat, userPos.lng]}
            radius={radiusMeters}
            pathOptions={{
              fillColor: "#f59e0b",
              fillOpacity: 0.07,
              color: "#f59e0b",
              weight: 1.5,
              dashArray: "6 4",
            }}
          />
          <Marker position={[userPos.lat, userPos.lng]} icon={makeUserIcon()}>
            <Popup>
              <div className="text-sm font-semibold text-blue-600">📍 You are here</div>
            </Popup>
          </Marker>
        </>
      )}

      {MAP_JOBS.map((job) => (
        <Marker key={job.id} position={[job.lat, job.lng]} icon={makeJobIcon(job.color)}>
          <Popup>
            <div style={{ minWidth: 160, fontFamily: "sans-serif" }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, color: "#0f172a" }}>{job.title}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{job.company}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                <span style={{ fontSize: 11, background: "#f1f5f9", borderRadius: 4, padding: "2px 6px", color: "#475569" }}>{job.type}</span>
                <span style={{ fontSize: 11, background: "#f1f5f9", borderRadius: 4, padding: "2px 6px", color: "#475569" }}>💰 {job.salary}</span>
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>📍 {job.distance}</div>
            </div>
          </Popup>
        </Marker>
      ))}

      {!locationGranted && (
        <Marker position={mapCenter} icon={makeUserIcon()}>
          <Popup>
            <div style={{ fontSize: 12, color: "#64748b" }}>Enable location to see nearby jobs</div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
