import React from 'react';
import { 
    IconMapPin, 
    IconHome, 
    IconBuilding, 
    IconCompass, 
    IconExternalLink,
    IconMaximize
} from '@tabler/icons-react';
import PemohonanLocationMap from './PemohonanLocationMap';
import { parseLocationFromCatatan } from '../utils/locationParser';

export default function PemohonanLocationCard({ 
    catatan, 
    item = {}, 
    onOpenModal,
    compact = false 
}) {
    const loc = parseLocationFromCatatan(catatan, item);

    // If no location info at all (neither DI_RUMAH nor LABKESDA nor coords nor address)
    if (!loc.isDiRumah && !loc.isLabkesda && !loc.hasCoordinates && !loc.alamat) {
        return null;
    }

    return (
        <div 
            className="p-3 mb-3"
            style={{
                backgroundColor: '#ffffff',
                border: '2.5px solid #000000',
                borderRadius: '14px',
                boxShadow: '4px 4px 0px #000000'
            }}
        >
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 pb-2 border-bottom">
                <div className="d-flex align-items-center gap-2">
                    <span 
                        style={{
                            background: loc.isDiRumah ? '#ef4444' : '#2563eb',
                            color: '#ffffff',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            border: '1.5px solid #000000',
                            display: 'inline-flex',
                            alignItems: 'center',
                            boxShadow: '2px 2px 0px #000000'
                        }}
                    >
                        {loc.isDiRumah ? <IconHome size={16} /> : <IconBuilding size={16} />}
                    </span>
                    <span className="fw-black text-dark fs-6">
                        {loc.isDiRumah ? 'Pengambilan Sampel: Di Rumah / Lokasi Pemohon' : 'Penyerahan Sampel: Langsung ke Labkesda'}
                    </span>
                </div>

                <div className="d-flex gap-2">
                    {loc.hasCoordinates && (
                        <a 
                            href={loc.googleMapsDirUrl || loc.googleMapsUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 fw-bold"
                            style={{
                                border: '2px solid #000000',
                                boxShadow: '2px 2px 0px #000000',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <IconExternalLink size={14} /> Buka Google Maps
                        </a>
                    )}
                    {onOpenModal && (
                        <button 
                            type="button"
                            className="btn btn-sm btn-warning d-inline-flex align-items-center gap-1 fw-bold text-dark"
                            style={{
                                border: '2px solid #000000',
                                boxShadow: '2px 2px 0px #000000',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenModal(item);
                            }}
                        >
                            <IconMaximize size={14} /> Perbesar Peta
                        </button>
                    )}
                </div>
            </div>

            <div className="row g-3 align-items-stretch">
                {/* Left side: Address & Info */}
                <div className={loc.hasCoordinates ? "col-lg-6" : "col-12"}>
                    <div className="d-flex flex-column gap-2 h-100 justify-content-center">
                        {loc.alamat && (
                            <div>
                                <small className="text-muted fw-bold d-flex align-items-center gap-1">
                                    <IconHome size={14} className="text-primary" /> Alamat Penjemputan:
                                </small>
                                <div className="fw-bold text-dark fs-7 bg-light p-2 rounded-2" style={{ border: '1.5px solid #cbd5e1' }}>
                                    {loc.alamat}
                                </div>
                            </div>
                        )}

                        {loc.patokan && (
                            <div>
                                <small className="text-muted fw-bold d-flex align-items-center gap-1">
                                    <IconCompass size={14} className="text-warning" /> Patokan Lokasi:
                                </small>
                                <div className="fw-semibold text-dark fs-7 bg-light p-2 rounded-2" style={{ border: '1.5px solid #cbd5e1' }}>
                                    {loc.patokan}
                                </div>
                            </div>
                        )}

                        {loc.hasCoordinates && (
                            <div>
                                <small className="text-muted fw-bold d-flex align-items-center gap-1">
                                    <IconMapPin size={14} className="text-danger" /> Koordinat GPS:
                                </small>
                                <div className="font-monospace text-dark fs-7 bg-light p-2 rounded-2" style={{ border: '1.5px solid #cbd5e1' }}>
                                    {loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}
                                </div>
                            </div>
                        )}

                        {loc.cleanNote && (
                            <div>
                                <small className="text-muted fw-bold">Catatan Pemohon:</small>
                                <div className="text-muted fs-7 bg-light p-2 rounded-2 fst-italic" style={{ border: '1.5px solid #cbd5e1' }}>
                                    "{loc.cleanNote}"
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right side: Interactive Map */}
                {loc.hasCoordinates && (
                    <div className="col-lg-6">
                        <PemohonanLocationMap 
                            lat={loc.lat} 
                            lng={loc.lng} 
                            alamat={loc.alamat}
                            title={`Lokasi Sampel #${item.id || ''}`}
                            height={compact ? "180px" : "220px"}
                            zoom={15}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
