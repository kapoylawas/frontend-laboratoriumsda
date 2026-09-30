/**
 * Utility to parse location, coordinates, address, and notes from Pemohonan catatan / item.
 */
export function parseLocationFromCatatan(catatan, item = {}) {
    const defaultRes = {
        isDiRumah: false,
        isLabkesda: false,
        lat: null,
        lng: null,
        alamat: '',
        patokan: '',
        cleanNote: '',
        alasanPembatalan: '',
        hasCoordinates: false,
        googleMapsUrl: '',
        googleMapsDirUrl: ''
    };

    if (!catatan && !item) return defaultRes;

    const raw = (catatan || '').toString();

    // Check direct fields from item if available
    let tempat = item.tempat_pengambilan || '';
    let titik = item.titik_pengambilan || '';
    let alamat = item.alamat_pengambilan || '';
    let patokan = item.catatan_lokasi || '';

    let isDiRumah = tempat === 'DI_RUMAH' || /diambil di rumah|lokasi pemohon/i.test(raw);
    let isLabkesda = tempat === 'LABKESDA' || /diserahkan langsung ke labkesda|ke labkesda/i.test(raw);

    // Extract coordinates: matches "Titik Koordinat: -7.123, 112.123" or "(-7.123, 112.123)" or "-7.123, 112.123"
    let lat = null;
    let lng = null;

    const coordMatch = (titik + ' ' + raw).match(/([+-]?\d+\.\d{3,})\s*,\s*([+-]?\d+\.\d{3,})/);
    if (coordMatch) {
        const parsedLat = parseFloat(coordMatch[1]);
        const parsedLng = parseFloat(coordMatch[2]);
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
            lat = parsedLat;
            lng = parsedLng;
        }
    }

    // Extract Alamat
    if (!alamat) {
        const alamatMatch = raw.match(/(?:Alamat Pengambilan|Alamat\/Catatan|Alamat):\s*([^|\n]+?)(?=(?:\s*Patokan Lokasi:|\s*Patokan:|\s*Titik Koordinat:|\||\n|$))/i);
        if (alamatMatch) {
            alamat = alamatMatch[1].trim();
        }
    }

    // Extract Patokan
    if (!patokan) {
        const patokanMatch = raw.match(/(?:Patokan Lokasi|Patokan):\s*([^|\n]+?)(?=(?:\||\n|$))/i);
        if (patokanMatch) {
            patokan = patokanMatch[1].trim();
        }
    }

    // Extract cancellation reason if present
    let alasanPembatalan = '';
    const cancelMatch = raw.match(/(?:Alasan pembatalan oleh admin:\s*[^|\n]*|Dibatalkan oleh admin)/i);
    if (cancelMatch) {
        alasanPembatalan = cancelMatch[0].trim();
    }

    // Clean user note
    let cleanNote = raw
        .replace(/\[(?:TEMPAT|LOKASI) PENGAMBILAN:[^\]]*\]/gi, '')
        .replace(/\[Lokasi Pengambilan:[^\]]*\]/gi, '')
        .replace(/Titik Koordinat:\s*[^|\n]*/gi, '')
        .replace(/Alamat Pengambilan:\s*[^|\n]*/gi, '')
        .replace(/Alamat\/Catatan:\s*[^|\n]*/gi, '')
        .replace(/Patokan Lokasi:\s*[^|\n]*/gi, '')
        .replace(/Patokan:\s*[^|\n]*/gi, '')
        .replace(/Alasan pembatalan oleh admin:\s*[^|\n]*/gi, '')
        .replace(/Dibatalkan oleh admin/gi, '')
        .replace(/\|/g, '')
        .trim();

    const hasCoordinates = lat !== null && lng !== null;
    const googleMapsUrl = hasCoordinates ? `https://www.google.com/maps?q=${lat},${lng}` : '';
    const googleMapsDirUrl = hasCoordinates ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : '';

    return {
        isDiRumah,
        isLabkesda,
        lat,
        lng,
        alamat,
        patokan,
        cleanNote,
        alasanPembatalan,
        hasCoordinates,
        googleMapsUrl,
        googleMapsDirUrl
    };
}
