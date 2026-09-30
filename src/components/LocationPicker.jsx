import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
    FaMapMarkerAlt, 
    FaHome, 
    FaHospital, 
    FaCrosshairs, 
    FaSearch, 
    FaCheckCircle,
    FaInfoCircle,
    FaMapPin
} from 'react-icons/fa';

export default function LocationPicker({ 
    value = {
        tempat_pengambilan: 'LABKESDA',
        titik_lokasi: '',
        latitude: -7.4478,
        longitude: 112.7183,
        alamat: '',
        catatan_lokasi: ''
    },
    onChange,
    defaultAddress = ''
}) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markerRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

    // Initial state setup
    const tempat = value?.tempat_pengambilan || 'LABKESDA';
    const lat = value?.latitude || -7.4478;
    const lng = value?.longitude || 112.7183;
    const alamat = value?.alamat || defaultAddress || '';
    const catatanLokasi = value?.catatan_lokasi || '';

    // Handle place change (DI_RUMAH vs LABKESDA)
    const handleTempatChange = (newTempat) => {
        const updated = {
            ...value,
            tempat_pengambilan: newTempat,
            alamat: newTempat === 'LABKESDA' ? 'UPTD Labkesda Sidoarjo, Jl. A. Yani Gedangan No. 330' : (alamat || defaultAddress)
        };
        if (newTempat === 'LABKESDA') {
            updated.titik_lokasi = 'UPTD Labkesda Sidoarjo (-7.3756, 112.7231)';
            updated.latitude = -7.3756;
            updated.longitude = 112.7231;
        } else {
            updated.titik_lokasi = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
        if (onChange) onChange(updated);
    };

    // Initialize or update Leaflet map when DI_RUMAH is selected
    useEffect(() => {
        if (tempat !== 'DI_RUMAH') return;

        // Custom DivIcon for crisp map pin
        const customPin = L.divIcon({
            className: 'custom-map-pin',
            html: `
                <div style="
                    background: #dc2626;
                    color: white;
                    width: 36px;
                    height: 36px;
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                    border: 2px solid white;
                ">
                    <span style="transform: rotate(45deg); font-size: 16px;">📍</span>
                </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 36]
        });

        // Initialize map if not yet initialized
        if (mapRef.current && !mapInstance.current) {
            const map = L.map(mapRef.current).setView([lat, lng], 13);

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

            googleRoadmap.addTo(map);

            L.control.layers({
                "Google Maps": googleRoadmap,
                "Google Satelit": googleHybrid,
                "OpenStreetMap": osmLayer
            }, null, { position: 'topright' }).addTo(map);

            const marker = L.marker([lat, lng], {
                draggable: true,
                icon: customPin
            }).addTo(map);

            marker.on('dragend', (e) => {
                const pos = e.target.getLatLng();
                updateCoordinates(pos.lat, pos.lng);
            });

            map.on('click', (e) => {
                marker.setLatLng(e.latlng);
                updateCoordinates(e.latlng.lat, e.latlng.lng);
            });

            mapInstance.current = map;
            markerRef.current = marker;

            // Invalidate size to ensure map renders smoothly inside modals/cards
            setTimeout(() => {
                map.invalidateSize();
            }, 300);
        } else if (mapInstance.current && markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
            mapInstance.current.setView([lat, lng], mapInstance.current.getZoom());
        }

        return () => {
            // Clean up when unmounting
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
                markerRef.current = null;
            }
        };
    }, [tempat]);

    const updateCoordinates = async (newLat, newLng, autoReverse = true) => {
        const coordString = `${newLat.toFixed(6)}, ${newLng.toFixed(6)}`;
        let detectedAddress = alamat;

        if (autoReverse) {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&zoom=18&addressdetails=1`);
                const data = await res.json();
                if (data && data.display_name) {
                    detectedAddress = data.display_name;
                }
            } catch (err) {
                console.warn('Reverse geocoding error:', err);
            }
        }

        if (onChange) {
            onChange({
                ...value,
                tempat_pengambilan: 'DI_RUMAH',
                latitude: newLat,
                longitude: newLng,
                titik_lokasi: coordString,
                alamat: detectedAddress || alamat
            });
        }
    };

    // GPS location detection
    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Browser tidak mendukung geolokasi GPS.');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setIsLocating(false);
                const { latitude, longitude } = pos.coords;
                if (mapInstance.current && markerRef.current) {
                    mapInstance.current.setView([latitude, longitude], 16);
                    markerRef.current.setLatLng([latitude, longitude]);
                }
                updateCoordinates(latitude, longitude);
            },
            (err) => {
                setIsLocating(false);
                alert('Gagal mendeteksi lokasi: ' + err.message);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Address search
    const handleSearchAddress = async (e) => {
        e?.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ' Sidoarjo Jawa Timur')}`);
            const data = await res.json();
            if (data && data.length > 0) {
                const first = data[0];
                const newLat = parseFloat(first.lat);
                const newLng = parseFloat(first.lon);

                if (mapInstance.current && markerRef.current) {
                    mapInstance.current.setView([newLat, newLng], 16);
                    markerRef.current.setLatLng([newLat, newLng]);
                }
                updateCoordinates(newLat, newLng, false);
                if (onChange) {
                    onChange({
                        ...value,
                        tempat_pengambilan: 'DI_RUMAH',
                        latitude: newLat,
                        longitude: newLng,
                        titik_lokasi: `${newLat.toFixed(6)}, ${newLng.toFixed(6)}`,
                        alamat: first.display_name
                    });
                }
            } else {
                alert('Alamat tidak ditemukan. Silakan geser pin langsung di peta.');
            }
        } catch (err) {
            console.error('Search error:', err);
            alert('Gagal mencari alamat');
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="location-picker-card card border-0 shadow-sm rounded-4 mb-4 overflow-hidden" style={{ border: '2px solid #000000', backgroundColor: '#ffffff' }}>
            <div className="card-header bg-dark text-white p-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                    <FaMapMarkerAlt className="text-warning fs-5" />
                    <h5 className="mb-0 fw-bold">Tempat & Lokasi Pengambilan Sampel</h5>
                </div>
                <span className="badge bg-warning text-dark fw-bold px-3 py-1 rounded-pill">Wajib Dipilih</span>
            </div>

            <div className="card-body p-3 p-md-4">
                {/* 1. Selector Pilihan Tempat Pengambilan */}
                <label className="form-label fw-bold text-dark mb-2">Pilih Metode / Lokasi Penyerahan Sampel:</label>
                <div className="row g-3 mb-4">
                    <div className="col-md-6">
                        <div 
                            className={`p-3 rounded-3 cursor-pointer border ${tempat === 'LABKESDA' ? 'border-primary bg-primary-lt' : 'bg-light'}`}
                            style={{ 
                                cursor: 'pointer', 
                                transition: 'all 0.2s ease',
                                border: tempat === 'LABKESDA' ? '2.5px solid #2563eb' : '2px solid #cbd5e1',
                                boxShadow: tempat === 'LABKESDA' ? '0 4px 12px rgba(37, 99, 235, 0.15)' : 'none'
                            }}
                            onClick={() => handleTempatChange('LABKESDA')}
                        >
                            <div className="d-flex align-items-start gap-3">
                                <div className={`p-3 rounded-circle text-white ${tempat === 'LABKESDA' ? 'bg-primary' : 'bg-secondary'}`}>
                                    <FaHospital size={24} />
                                </div>
                                <div className="flex-grow-1">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <h6 className="fw-bold text-dark mb-1">Diserahkan Langsung ke Labkesda</h6>
                                        {tempat === 'LABKESDA' && <FaCheckCircle className="text-primary fs-5" />}
                                    </div>
                                    <p className="text-muted small mb-0">
                                        Pemohon mengantar sampel langsung ke loket penerimaan UPTD Labkesda Sidoarjo.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div 
                            className={`p-3 rounded-3 cursor-pointer border ${tempat === 'DI_RUMAH' ? 'border-primary bg-primary-lt' : 'bg-light'}`}
                            style={{ 
                                cursor: 'pointer', 
                                transition: 'all 0.2s ease',
                                border: tempat === 'DI_RUMAH' ? '2.5px solid #2563eb' : '2px solid #cbd5e1',
                                boxShadow: tempat === 'DI_RUMAH' ? '0 4px 12px rgba(37, 99, 235, 0.15)' : 'none'
                            }}
                            onClick={() => handleTempatChange('DI_RUMAH')}
                        >
                            <div className="d-flex align-items-start gap-3">
                                <div className={`p-3 rounded-circle text-white ${tempat === 'DI_RUMAH' ? 'bg-primary' : 'bg-secondary'}`}>
                                    <FaHome size={24} />
                                </div>
                                <div className="flex-grow-1">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <h6 className="fw-bold text-dark mb-1">Diambil di Rumah / Lokasi Pemohon</h6>
                                        {tempat === 'DI_RUMAH' && <FaCheckCircle className="text-primary fs-5" />}
                                    </div>
                                    <p className="text-muted small mb-0">
                                        Petugas Sanitarian Labkesda datang mengambil sampel ke rumah pemohon sesuai titik koordinat peta.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Informasi jika diserahkan langsung ke Labkesda */}
                {tempat === 'LABKESDA' && (
                    <div className="alert alert-info border-0 rounded-3 p-3 mb-0" style={{ backgroundColor: '#eff6ff', border: '1.5px solid #bfdbfe' }}>
                        <div className="d-flex align-items-start gap-2">
                            <FaInfoCircle className="text-primary fs-5 mt-1 flex-shrink-0" />
                            <div>
                                <h6 className="fw-bold text-primary mb-1">Lokasi Penerimaan Sampel:</h6>
                                <p className="text-dark small mb-1">
                                    <strong>UPTD Laboratorium Kesehatan Daerah Kabupaten Sidoarjo</strong><br />
                                    Jl. A. Yani Gedangan No. 330, Kecamatan Gedangan, Kab. Sidoarjo (Depan RSUD RT Notopuro / seberang jalur utama).
                                </p>
                                <span className="badge bg-success text-white">Jam Layanan: Senin - Jumat (08.00 - 14.00 WIB)</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Peta Interaktif & Form Titik Lokasi saat Diambil di Rumah */}
                {tempat === 'DI_RUMAH' && (
                    <div className="map-picker-container">
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                            <div className="fw-bold text-dark d-flex align-items-center gap-1 small">
                                <FaMapPin className="text-danger" /> Tentukan Titik Lokasi Pengambilan pada Peta:
                            </div>
                            <div className="d-flex gap-2">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                                    onClick={handleGetCurrentLocation}
                                    disabled={isLocating}
                                >
                                    <FaCrosshairs /> {isLocating ? 'Mendeteksi...' : 'Lokasi Saya (GPS)'}
                                </button>
                            </div>
                        </div>

                        {/* Search Bar for Map */}
                        <div className="input-group mb-2">
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Cari kelurahan / jalan / kecamatan di Sidoarjo..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress(e)}
                            />
                            <button
                                className="btn btn-sm btn-primary"
                                type="button"
                                onClick={handleSearchAddress}
                                disabled={isSearching}
                            >
                                <FaSearch className="me-1" /> {isSearching ? 'Mencari...' : 'Cari'}
                            </button>
                        </div>

                        {/* Leaflet Map Canvas */}
                        <div 
                            ref={mapRef} 
                            style={{ 
                                height: '280px', 
                                width: '100%', 
                                borderRadius: '12px', 
                                border: '2px solid #000000',
                                zIndex: 1
                            }} 
                        />
                        <small className="text-muted d-block mt-1">
                            💡 <em>Klik pada peta atau geser pin merah untuk memposisikan titik rumah Anda secara presisi.</em>
                        </small>

                        {/* Coordinates & Detailed Address Input */}
                        <div className="row g-3 mt-2">
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-dark mb-1">Titik Koordinat (Latitude, Longitude):</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm bg-light fw-bold font-monospace"
                                    readOnly
                                    value={value?.titik_lokasi || `${lat.toFixed(6)}, ${lng.toFixed(6)}`}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-dark mb-1">Catatan / Patokan Rumah (Opsional):</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Cth: Pagar hitam, samping musholla Al-Ikhlas"
                                    value={catatanLokasi}
                                    onChange={(e) => {
                                        if (onChange) {
                                            onChange({
                                                ...value,
                                                tempat_pengambilan: 'DI_RUMAH',
                                                catatan_lokasi: e.target.value
                                            });
                                        }
                                    }}
                                />
                            </div>
                            <div className="col-12">
                                <label className="form-label small fw-bold text-dark mb-1">Detail Alamat Lengkap Pengambilan:</label>
                                <textarea
                                    className="form-control form-control-sm"
                                    rows="2"
                                    placeholder="Alamat rumah tempat pengambilan sampel..."
                                    value={alamat}
                                    onChange={(e) => {
                                        if (onChange) {
                                            onChange({
                                                ...value,
                                                tempat_pengambilan: 'DI_RUMAH',
                                                alamat: e.target.value
                                            });
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
