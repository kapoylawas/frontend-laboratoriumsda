import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    IconX, 
    IconMapPin, 
    IconHome, 
    IconBuilding, 
    IconCompass, 
    IconExternalLink,
    IconCopy,
    IconCheck,
    IconPhone
} from '@tabler/icons-react';
import PemohonanLocationMap from './PemohonanLocationMap';
import { parseLocationFromCatatan } from '../utils/locationParser';

export default function PemohonanLocationModal({ 
    isOpen, 
    onClose, 
    item 
}) {
    const [copiedCoords, setCopiedCoords] = useState(false);
    const [copiedAddress, setCopiedAddress] = useState(false);

    // Escape key listener to close modal
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !item) return null;

    const loc = parseLocationFromCatatan(item.catatan, item);
    const coordsStr = loc.hasCoordinates ? `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}` : '';

    const handleCopyCoords = () => {
        if (!coordsStr) return;
        navigator.clipboard.writeText(coordsStr);
        setCopiedCoords(true);
        setTimeout(() => setCopiedCoords(false), 2000);
    };

    const handleCopyAddress = () => {
        if (!loc.alamat) return;
        navigator.clipboard.writeText(loc.alamat);
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
    };

    const userName = item.user?.name || item.user?.instansi || 'Pemohon';
    const userPhone = item.user?.phone || item.user?.no_hp || '';

    const modalMarkup = (
        <div className="loc-custom-overlay" onClick={onClose}>
            <style>{`
                .loc-custom-overlay {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    background: rgba(15, 23, 42, 0.72) !important;
                    backdrop-filter: blur(5px) !important;
                    z-index: 999999 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    padding: 24px !important;
                    box-sizing: border-box !important;
                }

                .loc-custom-dialog {
                    width: 100% !important;
                    max-width: 1100px !important;
                    max-height: 90vh !important;
                    background: #ffffff !important;
                    border: 3.5px solid #000000 !important;
                    border-radius: 20px !important;
                    box-shadow: 10px 10px 0px #000000 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    overflow: hidden !important;
                    box-sizing: border-box !important;
                    animation: locModalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
                }

                @keyframes locModalPop {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                .loc-custom-header {
                    background: #fef08a !important;
                    border-bottom: 3.5px solid #000000 !important;
                    padding: 16px 24px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    flex-shrink: 0 !important;
                }

                .loc-custom-body {
                    flex: 1 !important;
                    overflow-y: auto !important;
                    padding: 24px !important;
                    background: #fafaf9 !important;
                    display: grid !important;
                    grid-template-columns: 420px 1fr !important;
                    gap: 24px !important;
                    box-sizing: border-box !important;
                }

                @media (max-width: 900px) {
                    .loc-custom-body {
                        grid-template-columns: 1fr !important;
                    }
                }

                .loc-info-panel {
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 14px !important;
                }

                .loc-map-panel {
                    display: flex !important;
                    flex-direction: column !important;
                    background: #ffffff !important;
                    border: 2.5px solid #000000 !important;
                    border-radius: 14px !important;
                    box-shadow: 4px 4px 0px #000000 !important;
                    padding: 16px !important;
                    box-sizing: border-box !important;
                    min-height: 480px !important;
                }

                .loc-card-box {
                    background: #ffffff !important;
                    border: 2.5px solid #000000 !important;
                    border-radius: 12px !important;
                    box-shadow: 3px 3px 0px #000000 !important;
                    padding: 14px 16px !important;
                    box-sizing: border-box !important;
                }

                .loc-btn-action {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 8px !important;
                    padding: 10px 16px !important;
                    border-radius: 12px !important;
                    border: 2.5px solid #000000 !important;
                    box-shadow: 3px 3px 0px #000000 !important;
                    font-weight: 800 !important;
                    text-decoration: none !important;
                    cursor: pointer !important;
                    transition: transform 0.1s, box-shadow 0.1s !important;
                }

                .loc-btn-action:hover {
                    transform: translate(-2px, -2px) !important;
                    box-shadow: 5px 5px 0px #000000 !important;
                }

                .loc-btn-close {
                    background: #ffffff !important;
                    border: 2.5px solid #000000 !important;
                    border-radius: 10px !important;
                    width: 36px !important;
                    height: 36px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    cursor: pointer !important;
                    box-shadow: 2px 2px 0px #000000 !important;
                    transition: all 0.1s !important;
                    padding: 0 !important;
                }

                .loc-btn-close:hover {
                    background: #fee2e2 !important;
                    transform: translate(-1px, -1px) !important;
                }

                .loc-custom-footer {
                    padding: 14px 24px !important;
                    background: #f1f5f9 !important;
                    border-top: 3.5px solid #000000 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    flex-shrink: 0 !important;
                }
            `}</style>

            <div 
                className="loc-custom-dialog" 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="loc-custom-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div 
                            style={{
                                background: '#ef4444',
                                color: '#ffffff',
                                width: '42px',
                                height: '42px',
                                borderRadius: '12px',
                                border: '2.5px solid #000000',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '2.5px 2.5px 0px #000000',
                                flexShrink: 0
                            }}
                        >
                            <IconMapPin size={24} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1.15rem', lineHeight: '1.2' }}>
                                Titik Lokasi & Alamat Penjemputan Sampel
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                <span style={{ background: '#000000', color: '#ffffff', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', fontSize: '11px' }}>
                                    ID #{item.id}
                                </span>
                                <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>
                                    Pemohon: <strong style={{ color: '#0f172a' }}>{userName}</strong>
                                </span>
                            </div>
                        </div>
                    </div>

                    <button 
                        type="button" 
                        onClick={onClose}
                        className="loc-btn-close"
                        title="Tutup Modal (Esc)"
                    >
                        <IconX size={20} stroke={2.5} color="#000000" />
                    </button>
                </div>

                {/* Body - 2 Columns (Info Left, Map Right) */}
                <div className="loc-custom-body">
                    {/* Left Column: Details */}
                    <div className="loc-info-panel">
                        {/* Status Pengambilan Mode */}
                        <div 
                            style={{
                                background: loc.isDiRumah ? '#dcfce7' : '#dbeafe',
                                border: '2.5px solid #000000',
                                borderRadius: '12px',
                                boxShadow: '3px 3px 0px #000000',
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}
                        >
                            <div 
                                style={{
                                    background: loc.isDiRumah ? '#16a34a' : '#2563eb',
                                    color: '#ffffff',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    display: 'flex'
                                }}
                            >
                                {loc.isDiRumah ? <IconHome size={20} /> : <IconBuilding size={20} />}
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13.5px' }}>
                                    {loc.isDiRumah ? 'Diambil di Rumah / Lokasi Pemohon' : 'Diserahkan ke Labkesda Sidoarjo'}
                                </div>
                                <div style={{ color: loc.isDiRumah ? '#15803d' : '#1d4ed8', fontWeight: 600, fontSize: '11px' }}>
                                    {loc.isDiRumah ? 'Sanitarian mengambil sampel langsung ke alamat' : 'Pemohon menyerahkan sampel ke loket lab'}
                                </div>
                            </div>
                        </div>

                        {/* Alamat Lengkap */}
                        <div className="loc-card-box">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ color: '#64748b', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <IconHome size={15} color="#2563eb" /> Alamat Penjemputan
                                </span>
                                {loc.alamat && (
                                    <button 
                                        type="button" 
                                        onClick={handleCopyAddress}
                                        style={{
                                            background: '#f1f5f9',
                                            border: '1.5px solid #cbd5e1',
                                            borderRadius: '6px',
                                            padding: '2px 8px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            cursor: 'pointer'
                                        }}
                                        title="Salin Alamat Lengkap"
                                    >
                                        {copiedAddress ? <span style={{ color: '#16a34a' }}>✓ Tersalin</span> : 'Salin'}
                                    </button>
                                )}
                            </div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px', lineHeight: '1.45' }}>
                                {loc.alamat || (
                                    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                        {loc.isLabkesda ? 'UPTD Laboratorium Kesehatan Daerah Sidoarjo' : 'Alamat belum diatur'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Patokan & Koordinat GPS */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {loc.patokan && (
                                <div className="loc-card-box">
                                    <div style={{ color: '#64748b', fontWeight: 700, fontSize: '11.5px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <IconCompass size={14} color="#d97706" /> Patokan / Petunjuk Lokasi
                                    </div>
                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>
                                        {loc.patokan}
                                    </div>
                                </div>
                            )}

                            {loc.hasCoordinates && (
                                <div className="loc-card-box">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <span style={{ color: '#64748b', fontWeight: 700, fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <IconMapPin size={14} color="#ef4444" /> Titik Koordinat GPS
                                        </span>
                                        <button 
                                            type="button" 
                                            onClick={handleCopyCoords}
                                            style={{
                                                background: '#f1f5f9',
                                                border: '1.5px solid #cbd5e1',
                                                borderRadius: '6px',
                                                padding: '2px 8px',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                cursor: 'pointer'
                                            }}
                                            title="Salin Koordinat"
                                        >
                                            {copiedCoords ? <span style={{ color: '#16a34a' }}>✓ Tersalin</span> : 'Salin'}
                                        </button>
                                    </div>
                                    <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0f172a', fontSize: '13px', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                        {coordsStr}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Catatan Pemohon */}
                        {loc.cleanNote && (
                            <div className="loc-card-box">
                                <div style={{ color: '#64748b', fontWeight: 700, fontSize: '11px', marginBottom: '4px' }}>
                                    Catatan Pemohon:
                                </div>
                                <div style={{ color: '#334155', fontStyle: 'italic', fontSize: '12.5px' }}>
                                    "{loc.cleanNote}"
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                            {loc.hasCoordinates && (
                                <a 
                                    href={loc.googleMapsDirUrl || loc.googleMapsUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="loc-btn-action"
                                    style={{
                                        background: '#2563eb',
                                        color: '#ffffff'
                                    }}
                                >
                                    <IconExternalLink size={18} /> Buka Rute di Google Maps
                                </a>
                            )}

                            {userPhone && (
                                <a 
                                    href={`https://wa.me/${userPhone.replace(/^0/, '62').replace(/\D/g, '')}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="loc-btn-action"
                                    style={{
                                        background: '#86efac',
                                        color: '#064e3b'
                                    }}
                                >
                                    <IconPhone size={16} /> Hubungi Pemohon ({userPhone})
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Wide Interactive Map */}
                    <div className="loc-map-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1.5px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>
                                <span>🗺️</span> Peta Google Maps Interaktif
                            </div>
                            <span style={{ color: '#64748b', fontSize: '11.5px' }}>
                                Toggle layer (Jalan / Satelit) di kanan atas peta
                            </span>
                        </div>

                        {loc.hasCoordinates ? (
                            <div style={{ flex: 1, minHeight: '430px', width: '100%', position: 'relative' }}>
                                <PemohonanLocationMap 
                                    lat={loc.lat} 
                                    lng={loc.lng} 
                                    alamat={loc.alamat}
                                    title={`Lokasi #${item.id} - ${userName}`}
                                    height="430px"
                                    zoom={15}
                                />
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', textAlign: 'center' }}>
                                <div style={{ background: '#eff6ff', borderRadius: '50%', padding: '16px', marginBottom: '12px', border: '2px solid #bfdbfe' }}>
                                    <IconBuilding size={48} color="#2563eb" />
                                </div>
                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px', marginBottom: '4px' }}>
                                    Penyerahan Sampel di Kantor Labkesda
                                </div>
                                <div style={{ color: '#64748b', fontSize: '12.5px', maxWidth: '340px' }}>
                                    Pemohon memilih opsi mengantarkan sampel langsung ke loket UPTD Labkesda Sidoarjo. Tidak ada titik penjemputan di rumah.
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="loc-custom-footer">
                    <div style={{ color: '#64748b', fontSize: '12px' }}>
                        <strong style={{ color: '#0f172a' }}>Info:</strong> Titik pin merah menunjukkan lokasi akurat hasil pilihan pemohon pada peta.
                    </div>
                    <button 
                        type="button" 
                        onClick={onClose}
                        style={{
                            background: '#ffffff',
                            border: '2.5px solid #000000',
                            borderRadius: '10px',
                            boxShadow: '3px 3px 0px #000000',
                            fontWeight: 800,
                            padding: '8px 20px',
                            color: '#0f172a',
                            cursor: 'pointer'
                        }}
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalMarkup, document.body);
}
