import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Issue } from '../types';

// Fix for default marker icons in Leaflet when using Vite/React
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
    issues: Issue[];
    onMarkerClick?: (issue: Issue) => void;
    onMapClick?: (e: { lat: number, lng: number }) => void;
    center?: { lat: number; lng: number };
    zoom?: number;
    interactive?: boolean;
    selectedLocation?: { lat: number; lng: number } | null;
    userLocation?: { lat: number; lng: number } | null;
}

// Internal component to handle center updates and clicks
const MapEvents = ({ onMapClick, center, zoom }: { onMapClick?: (e: { lat: number, lng: number }) => void, center: [number, number], zoom: number }) => {
    const map = useMap();

    useEffect(() => {
        map.setView(center, zoom, { animate: true });
    }, [center[0], center[1], zoom, map]);

    useMapEvents({
        click(e) {
            onMapClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });

    return null;
};

const MapComponent = ({
    issues,
    onMarkerClick,
    onMapClick,
    center = { lat: 37.7749, lng: -122.4194 },
    zoom = 12,
    interactive = true,
    selectedLocation = null,
    userLocation = null
}: MapComponentProps) => {

    const userIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg ring-4 ring-blue-500/20"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });

    return (
        <div className="w-full h-full rounded-3xl overflow-hidden shadow-inner bg-gray-100 border border-gray-200">
            <MapContainer
                center={[center.lat, center.lng] as [number, number]}
                zoom={zoom}
                scrollWheelZoom={interactive}
                dragging={interactive}
                zoomControl={interactive}
                style={{ height: '100%', width: '100%', zIndex: 10 }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapEvents onMapClick={onMapClick} center={[center.lat, center.lng] as [number, number]} zoom={zoom} />

                {issues.map((issue) => (
                    <Marker
                        key={issue.id}
                        position={[issue.latitude, issue.longitude] as [number, number]}
                        eventHandlers={{
                            click: () => onMarkerClick?.(issue),
                        }}
                    >
                        <Popup>
                            <div className="p-1">
                                <p className="font-bold text-sm mb-1">{issue.title}</p>
                                <p className="text-xs text-teal-600 font-bold uppercase tracking-wider">Priority: {issue.priority}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {selectedLocation && (
                    <Marker position={[selectedLocation.lat, selectedLocation.lng] as [number, number]} icon={DefaultIcon}>
                        <Popup>Selected Location</Popup>
                    </Marker>
                )}

                {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng] as [number, number]} icon={userIcon}>
                        <Popup>You are here</Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
