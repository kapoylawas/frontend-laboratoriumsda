import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Api from '../../services/api';
import Swal from 'sweetalert2';
import LayoutAdmin from '../../layouts/admin';


export default function PengajuanCreate() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [sampels, setSampels] = useState([]);
    const [categories, setCategories] = useState({});
    const [fetchingSampels, setFetchingSampels] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [form, setForm] = useState({
        jenis: 'SURAT_PENAWARAN',
        catatan: '',
        items: [{ sampel_id: '', qty: 1 }]
    });

    useEffect(() => {
        fetchSampels();
    }, []);

    const fetchSampels = async (search = '') => {
        setFetchingSampels(true);
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                // Fetch categories (same as Sampels menu)
                const categoriesResponse = await Api.get('/api/categories');
                const categoriesMap = {};
                categoriesResponse.data.data.forEach(category => {
                    categoriesMap[category.id.toString()] = category;
                });
                setCategories(categoriesMap);

                // Fetch all sampels (same API as Sampels menu)
                const allSampels = [];
                let page = 1;
                let hasMore = true;
                while (hasMore) {
                    const response = await Api.get(`/api/sampels?page=${page}&search=${search}`);
                    const data = response.data.data || [];
                    allSampels.push(...data);
                    const pagination = response.data.pagination || response.data;
                    const totalPages = pagination.totalPages || pagination.last_page || 1;
                    hasMore = page < totalPages;
                    page++;
                }
                setSampels(allSampels);
            } catch (error) {
                console.error('Error fetching sampels:', error);
            }
        }
        setFetchingSampels(false);
    };

    const handleJenisChange = (jenis) => {
        setForm(prev => ({ ...prev, jenis }));
    };

    const handleSearchSampel = (e) => {
        e.preventDefault();
        fetchSampels(searchKeyword);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
    };

    // Get selected sampel details for display
    const getSelectedSampel = (sampelId) => {
        return sampels.find(s => s.id === parseInt(sampelId));
    };

    // Calculate total for selected items
    const calculateTotal = () => {
        return form.items.reduce((total, item) => {
            const sampel = getSelectedSampel(item.sampel_id);
            return total + ((sampel?.price_sell || 0) * (parseInt(item.qty) || 0));
        }, 0);
    };

    // Group sampels by category for the dropdown
    const getSampelsGroupedByCategory = () => {
        const grouped = {};
        sampels.forEach(sampel => {
            const catId = sampel.category_id?.toString() || '0';
            const catName = categories[catId]?.name || 'Tanpa Kategori';
            if (!grouped[catName]) grouped[catName] = [];
            grouped[catName].push(sampel);
        });
        return grouped;
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...form.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setForm(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setForm(prev => ({
            ...prev,
            items: [...prev.items, { sampel_id: '', qty: 1 }]
        }));
    };

    const removeItem = (index) => {
        if (form.items.length <= 1) return;
        const newItems = form.items.filter((_, i) => i !== index);
        setForm(prev => ({ ...prev, items: newItems }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        const invalidItems = form.items.some(item => !item.sampel_id || item.qty < 1);
        if (invalidItems) {
            Swal.fire({ icon: 'warning', title: 'Peringatan', text: 'Pastikan semua item terisi dengan benar!' });
            return;
        }

        const confirmResult = await Swal.fire({
            title: 'Konfirmasi',
            text: `Buat ${form.jenis === 'SURAT_PENAWARAN' ? 'Surat Penawaran' : 'Pemesanan'}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0d6efd',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Ya, Buat!',
            cancelButtonText: 'Batal'
        });

        if (!confirmResult.isConfirmed) return;

        setIsLoading(true);
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const payload = {
                    jenis: form.jenis,
                    catatan: form.catatan || null,
                    items: form.items.map(item => ({
                        sampel_id: parseInt(item.sampel_id),
                        qty: parseInt(item.qty)
                    }))
                };

                const response = await Api.post('/api/pemohonan', payload);

                await Swal.fire({
                    icon: 'success', title: 'Berhasil!',
                    text: response.data.meta?.message || 'Pemohonan berhasil dibuat!',
                    toast: true, position: 'top',
                    showConfirmButton: false, timer: 1500
                });

                navigate('/penawaran');
            } catch (error) {
                Swal.fire({
                    icon: 'error', title: 'Gagal',
                    text: error.response?.data?.message || 'Gagal membuat pemohonan!'
                });
            }
        }
        setIsLoading(false);
    };

    return (
        <LayoutAdmin>

            <div className="page-wrapper">
                <div className="page-header d-print-none">
                    <div className="container-xl">
                        <div className="row g-2 align-items-center">
                            <div className="col">
                                <h2 className="page-title">Buat Pemohonan</h2>
                                <div className="text-muted mt-1">Buat surat penawaran atau pemesanan baru</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="page-body">
                    <div className="container-xl">
                        <div className="row row-cards">
                            <div className="col-lg-8">
                                <form onSubmit={handleSubmit}>
                                    {/* Type Selection */}
                                    <div className="card mb-3">
                                        <div className="card-header">
                                            <h3 className="card-title">Tipe Pemohonan</h3>
                                        </div>
                                        <div className="card-body">
                                            <div className="row g-3">
                                                <div className="col-6">
                                                    <label className={`form-selectgroup-item flex-fill ${form.jenis === 'SURAT_PENAWARAN' ? 'active' : ''}`}>
                                                        <input type="radio" name="jenis" value="SURAT_PENAWARAN" checked={form.jenis === 'SURAT_PENAWARAN'} onChange={() => handleJenisChange('SURAT_PENAWARAN')} className="d-none" />
                                                        <div className={`card border-2 ${form.jenis === 'SURAT_PENAWARAN' ? 'border-primary' : ''}`}>
                                                            <div className="card-body text-center p-3">
                                                                <div className="mb-2">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                                                        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                                                                        <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
                                                                        <path d="M9 9l1 0" />
                                                                        <path d="M9 13l6 0" />
                                                                        <path d="M9 17l6 0" />
                                                                    </svg>
                                                                </div>
                                                                <h4 className="mb-1">Surat Penawaran</h4>
                                                                <div className="text-muted small">Auto-expire 7 hari</div>
                                                            </div>
                                                        </div>
                                                    </label>
                                                </div>
                                                <div className="col-6">
                                                    <label className={`form-selectgroup-item flex-fill ${form.jenis === 'PEMESANAN' ? 'active' : ''}`}>
                                                        <input type="radio" name="jenis" value="PEMESANAN" checked={form.jenis === 'PEMESANAN'} onChange={() => handleJenisChange('PEMESANAN')} className="d-none" />
                                                        <div className={`card border-2 ${form.jenis === 'PEMESANAN' ? 'border-primary' : ''}`}>
                                                            <div className="card-body text-center p-3">
                                                                <div className="mb-2">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                                                        <path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5" />
                                                                        <path d="M12 12l8 -4.5" />
                                                                        <path d="M12 12l0 9" />
                                                                        <path d="M12 12l-8 -4.5" />
                                                                        <path d="M16 5.25l-8 4.5" />
                                                                    </svg>
                                                                </div>
                                                                <h4 className="mb-1">Pemesanan</h4>
                                                                <div className="text-muted small">Pemesanan langsung</div>
                                                            </div>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Catatan */}
                                    <div className="card mb-3">
                                        <div className="card-header">
                                            <h3 className="card-title">Catatan</h3>
                                        </div>
                                        <div className="card-body">
                                            <textarea
                                                className="form-control"
                                                rows="3"
                                                placeholder="Catatan opsional (opsional)"
                                                value={form.catatan}
                                                onChange={(e) => setForm(prev => ({ ...prev, catatan: e.target.value }))}
                                            ></textarea>
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div className="card mb-3">
                                        <div className="card-header">
                                            <h3 className="card-title">Item Sampel</h3>
                                            <button type="button" className="btn btn-primary btn-sm ms-auto" onClick={addItem}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                                                Tambah Item
                                            </button>
                                        </div>
                                        <div className="card-body">
                                            {/* Search Sampel */}
                                            <div className="mb-3">
                                                <form onSubmit={handleSearchSampel} className="input-icon">
                                                    <span className="input-icon-addon">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                                                    </span>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Cari sampel (parameter/kategori)..."
                                                        value={searchKeyword}
                                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                                    />
                                                </form>
                                                <div className="form-hint">Data sampel diambil dari menu Sampel</div>
                                            </div>

                                            {form.items.map((item, index) => {
                                                const selectedSampel = getSelectedSampel(item.sampel_id);
                                                const groupedSampels = getSampelsGroupedByCategory();
                                                return (
                                                <div key={index} className={`card mb-3 ${selectedSampel ? 'border-primary' : ''}`}>
                                                    <div className="card-body">
                                                        <div className="row g-2 align-items-end">
                                                            <div className="col-md-5">
                                                                <label className="form-label">Sampel</label>
                                                                <select
                                                                    className="form-select"
                                                                    value={item.sampel_id}
                                                                    onChange={(e) => handleItemChange(index, 'sampel_id', e.target.value)}
                                                                    required
                                                                >
                                                                    <option value="">Pilih Sampel...</option>
                                                                    {Object.entries(groupedSampels).sort(([a], [b]) => a.localeCompare(b)).map(([catName, catSampels]) => (
                                                                        <optgroup key={catName} label={catName}>
                                                                            {catSampels.map(sampel => (
                                                                                <option key={sampel.id} value={sampel.id}>
                                                                                    {sampel.parameter || sampel.name} - {formatCurrency(sampel.price_sell)}
                                                                                </option>
                                                                            ))}
                                                                        </optgroup>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div className="col-md-3">
                                                                <label className="form-label">Jumlah</label>
                                                                <input
                                                                    type="number"
                                                                    className="form-control"
                                                                    min="1"
                                                                    value={item.qty}
                                                                    onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="col-md-3">
                                                                {selectedSampel && (
                                                                    <div className="text-end">
                                                                        <div className="text-muted small">Harga</div>
                                                                        <div className="fw-bold">{formatCurrency(selectedSampel.price_sell)}</div>
                                                                        <div className="text-muted small">Subtotal: {formatCurrency((selectedSampel.price_sell || 0) * (parseInt(item.qty) || 0))}</div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="col-md-1">
                                                                {form.items.length > 1 && (
                                                                    <button type="button" className="btn btn-outline-danger w-100" onClick={() => removeItem(index)}>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {selectedSampel && (
                                                            <div className="mt-2 d-flex flex-wrap gap-1">
                                                                <span className="badge bg-primary" style={{ fontSize: '12px' }}>{selectedSampel.parameter || '-'}</span>
                                                                <span className="badge bg-info" style={{ fontSize: '12px' }}>{categories[selectedSampel.category_id?.toString()]?.name || 'Tanpa Kategori'}</span>
                                                                {selectedSampel.price_sell && (
                                                                    <span className="badge bg-success" style={{ fontSize: '12px' }}>{formatCurrency(selectedSampel.price_sell)}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                );
                                            })}
                                            {fetchingSampels && (
                                                <div className="text-center text-muted py-3">
                                                    <div className="spinner-border spinner-border-sm me-2"></div>
                                                    Memuat daftar sampel...
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Total Summary */}
                                    {form.items.some(item => item.sampel_id) && (
                                        <div className="card mb-3">
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <span className="text-muted me-2">Total Estimasi:</span>
                                                        <span className="fs-2 fw-bold text-primary">{formatCurrency(calculateTotal())}</span>
                                                    </div>
                                                    <span className="badge bg-secondary">{form.items.filter(i => i.sampel_id).length} item dipilih</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="card">
                                        <div className="card-body d-flex justify-content-between">
                                            <button type="button" className="btn btn-secondary" onClick={() => navigate('/penawaran')}>
                                                Batal
                                            </button>
                                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                                {isLoading ? (
                                                    <><span className="spinner-border spinner-border-sm me-2"></span>Memproses...</>
                                                ) : (
                                                    <><svg xmlns="http://www.w3.org/2000/svg" className="icon" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l5 5l10 -10" /></svg> Buat Pemohonan</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </LayoutAdmin>
    );
}
