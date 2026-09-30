import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function PemohonanLocationMap({ 
    lat, 
    lng, 
    alamat = '', 
    title = 'Titik Penjemputan Sampel', 
    height = '240px',
    zoom = 15,
    interactive = true
}) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);

    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return;

        // Cleanup existing map if re-rendering with different coords
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const map = L.map(mapContainerRef.current, {
            center: [lat, lng],
            zoom: zoom,
            zoomControl: interactive,
            dragging: interactive,
            touchZoom: interactive,
            scrollWheelZoom: false,
            doubleClickZoom: interactive
        });

        // Google Maps Tile Layers
        const googleRoadmap = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
            attribution: '&copy; Google Maps'
        });

        const googleHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
            attribution: '&copy; Google Maps'
        });

        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19
        });

        // Set Google Maps as active default layer
        googleRoadmap.addTo(map);

        if (interactive) {
            L.control.layers({
                "Google Maps": googleRoadmap,
                "Google Satelit": googleHybrid,
                "OpenStreetMap": osmLayer
            }, null, { position: 'topright' }).addTo(map);
        }

        // Custom stylish DivIcon for marker
        const pinIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
                <div style="
                    background: #ef4444;
                    color: #ffffff;
                    width: 38px;
                    height: 38px;
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                    border: 2.5px solid #ffffff;
                ">
                    <span style="transform: rotate(45deg); font-size: 16px;">📍</span>
                </div>
            `,
            iconSize: [38, 38],
            iconAnchor: [19, 38],
            popupAnchor: [0, -38]
        });

        const marker = L.marker([lat, lng], { icon: pinIcon }).addTo(map);

        const popupContent = `
            <div style="font-family: inherit; font-size: 12px; min-width: 180px; max-width: 250px;">
                <div style="font-weight: 800; color: #1e293b; margin-bottom: 4px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 3px;">
                    ${title}
                </div>
                ${alamat ? `<div style="color: #475569; margin-bottom: 6px; line-height: 1.3;">${alamat}</div>` : ''}
                <div style="font-size: 11px; color: #64748b; font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">
                    ${lat.toFixed(6)}, ${lng.toFixed(6)}
                </div>
                <div style="margin-top: 6px;">
                    <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-weight: bold;">
                        Buka di Google Maps &rarr;
                    </a>
                </div>
            </div>
        `;
        marker.bindPopup(popupContent);

        // Invalidate size once visible/loaded
        const timer1 = setTimeout(() => map.invalidateSize(), 100);
        const timer2 = setTimeout(() => map.invalidateSize(), 300);
        const timer3 = setTimeout(() => map.invalidateSize(), 600);

        let resizeObserver = null;
        if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
            resizeObserver = new ResizeObserver(() => {
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.invalidateSize();
                }
            });
            resizeObserver.observe(mapContainerRef.current);
        }

        mapInstanceRef.current = map;

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [lat, lng, alamat, title, height, zoom, interactive]);

    if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
        return (
            <div 
                className="d-flex align-items-center justify-content-center bg-light text-muted small p-3 rounded-3"
                style={{ height, border: '2px dashed #cbd5e1' }}
            >
                Koordinat lokasi tidak tersedia
            </div>
        );
    }

    return (
        <div 
            ref={mapContainerRef} 
            style={{ 
                height: height, 
                width: '100%', 
                borderRadius: '12px',
                border: '2.5px solid #000000',
                boxShadow: '3px 3px 0px #000000',
                overflow: 'hidden',
                zIndex: 1
            }} 
        />
    );
}
