/**
 * Berita Acara Utility Functions
 * Labkesda Sidoarjo
 */

/**
 * Get Roman Numeral for Month (1-indexed or 0-indexed Date month)
 */
export const getBulanRomawi = (monthIndex) => {
    const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const idx = typeof monthIndex === 'number' ? monthIndex : new Date().getMonth();
    return romanMonths[idx % 12] || 'I';
};

/**
 * Determine classification code automatically based on sample type / parameter
 * Examples:
 * - Air Bersih -> AB
 * - Air Minum -> AM
 * - Air Limbah -> AL
 * - Air Kolam Renang / Kolam -> AK
 * - Air Sungai / Badan Air -> AS
 * - Air Higiene Sanitasi -> AHS
 * - Makanan / Minuman -> MM
 * - Usap Alat -> UA
 * - Usap Dubur -> UD
 * - Mikrobiologi -> MB
 * - Kimia -> KM
 */
export const getKodeKlasifikasi = (jenisSampel = '', parameterName = '') => {
    const text = `${jenisSampel} ${parameterName}`.toLowerCase();

    if (text.includes('air bersih') || text.includes('bersih')) return 'AB';
    if (text.includes('air minum') || text.includes('minum')) return 'AM';
    if (text.includes('air limbah') || text.includes('limbah')) return 'AL';
    if (text.includes('kolam') || text.includes('renang')) return 'AK';
    if (text.includes('sungai') || text.includes('badan air')) return 'AS';
    if (text.includes('higiene') || text.includes('sanitasi')) return 'AHS';
    if (text.includes('makanan') || text.includes('minuman') || text.includes('pangan')) return 'MM';
    if (text.includes('usap alat')) return 'UA';
    if (text.includes('usap dubur')) return 'UD';
    if (text.includes('mikro')) return 'MB';
    if (text.includes('kimia')) return 'KM';

    // Fallback: take initial letters of words or 2 characters
    const words = jenisSampel.trim().split(/\s+/);
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    const clean = jenisSampel.replace(/[^a-zA-Z]/g, '').toUpperCase();
    return clean.slice(0, 2) || 'SP';
};

/**
 * Generate Berita Acara Number following official classification standard:
 * [nomor]/[kode klasifikasi]/[bulan romawi]/[tahun]
 * Example: 10003/AB/VIII/2026
 *
 * Connected and sequential for both Pengambilan and Penerimaan Sampel.
 */
export const generateNomorBeritaAcara = (counter = 1, jenisSampel = 'Air Bersih', parameterName = '', dateObj = new Date()) => {
    const baseNumber = 10000 + (parseInt(counter) || 1);
    const kode = getKodeKlasifikasi(jenisSampel, parameterName);
    const d = dateObj ? new Date(dateObj) : new Date();
    const bulanRomawi = getBulanRomawi(d.getMonth());
    const tahun = d.getFullYear() || new Date().getFullYear();

    return `${baseNumber}/${kode}/${bulanRomawi}/${tahun}`;
};

/**
 * Check if the sample transaction was received directly at Labkesda (Penerimaan)
 * vs picked up at customer's home (Pengambilan)
 */
export const isPenerimaanSampel = (data = {}) => {
    const textToCheck = [
        data.tempat_pengambilan,
        data.jenis_pengambilan,
        data.titik_pengambilan,
        data.lokasi
    ].filter(Boolean).join(' ').toLowerCase();

    return textToCheck.includes('labkesda') || 
           textToCheck.includes('datang_ke_lab') || 
           textToCheck.includes('datang ke lab') ||
           textToCheck.includes('loket penerimaan');
};
