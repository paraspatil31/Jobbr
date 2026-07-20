import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface CategoryLegendItem {
  name: string;
  color: string;
}

function categoryColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0x7fffffff;
  }
  return `hsl(${hash % 360}, 60%, 48%)`;
}

interface JobPin {
  id: string;
  title: string;
  company: string;
  category: string;
  type: string;
  salary: string;
  lat: number;
  lng: number;
  color: string;
}

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
    html: `<div style="width:20px;height:20px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 2px 8px rgba(37,99,235,0.5)"></div>`,
  });
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

interface JobMapProps {
  radius?: number;
  onCategoriesChange?: (cats: CategoryLegendItem[]) => void;
}

export default function JobMap({ radius = 25, onCategoriesChange }: JobMapProps) {
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [jobs, setJobs] = useState<JobPin[]>([]);
  const [center] = useState<[number, number]>([37.7749, -122.4194]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    const lat = userPos?.lat ?? 37.7749;
    const lng = userPos?.lng ?? -122.4194;
    const radiusM = radius * 1000;

    fetch(`/api/jobs/nearby?latitude=${lat}&longitude=${lng}&radius=${radiusM}`)
      .then((r) => r.json())
      .then((data: { jobs?: Array<Record<string, unknown>>; categories?: Array<{ name: string; count: number }> }) => {
        const pins: JobPin[] = (data.jobs ?? [])
          .map((j) => {
            // Prefer geoLocation, fall back to flat latitude/longitude fields
            const geo = j["geoLocation"] as { coordinates?: [number, number] } | undefined;
            let jobLat: number | null = null;
            let jobLng: number | null = null;

            if (geo?.coordinates && geo.coordinates.length === 2) {
              jobLng = geo.coordinates[0]!;
              jobLat = geo.coordinates[1]!;
            } else if (typeof j["latitude"] === "number" && typeof j["longitude"] === "number") {
              jobLat = j["latitude"] as number;
              jobLng = j["longitude"] as number;
            }

            if (jobLat === null || jobLng === null || (jobLat === 0 && jobLng === 0)) return null;

            const cat = String(j["category"] ?? "General");
            return {
              id: String(j["_id"]),
              title: String(j["title"] ?? ""),
              company: String(j["company"] ?? ""),
              category: cat,
              type: String(j["type"] ?? ""),
              salary: String(j["salary"] ?? ""),
              lat: jobLat,
              lng: jobLng,
              color: categoryColor(cat),
            } satisfies JobPin;
          })
          .filter((p): p is JobPin => p !== null);

        setJobs(pins);

        if (onCategoriesChange) {
          const cats: CategoryLegendItem[] = (data.categories ?? []).map((c) => ({
            name: c.name,
            color: categoryColor(c.name),
          }));
          onCategoriesChange(cats);
        }
      })
      .catch(() => {});
  }, [userPos, radius]);

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
        attribution='&copy; OSM &copy; CARTO'
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
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e40af" }}>📍 You are here</div>
            </Popup>
          </Marker>
        </>
      )}

      {!userPos && (
        <Marker position={mapCenter} icon={makeUserIcon()}>
          <Popup>
            <div style={{ fontSize: 12, color: "#64748b" }}>Enable location to see nearby jobs</div>
          </Popup>
        </Marker>
      )}

      {jobs.map((job) => (
        <Marker key={job.id} position={[job.lat, job.lng]} icon={makeJobIcon(job.color)}>
          <Popup>
            <div style={{ minWidth: 160, fontFamily: "sans-serif" }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, color: "#0f172a" }}>{job.title}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{job.company}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 4 }}>
                <span style={{ fontSize: 11, background: "#f1f5f9", borderRadius: 4, padding: "2px 6px", color: "#475569" }}>{job.type}</span>
                {job.salary && <span style={{ fontSize: 11, background: "#f1f5f9", borderRadius: 4, padding: "2px 6px", color: "#475569" }}>💰 {job.salary}</span>}
              </div>
              <div style={{ fontSize: 11, background: `${job.color}18`, color: job.color, borderRadius: 4, padding: "2px 6px", display: "inline-block" }}>{job.category}</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
