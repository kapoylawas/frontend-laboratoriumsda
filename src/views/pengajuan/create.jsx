import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import Api from '../../services/api';
import Swal from 'sweetalert2';
import LayoutAdmin from '../../layouts/admin';
import {
    IconFileText, IconPlus, IconTrash, IconSearch,
    IconArrowLeft, IconCheck, IconSparkles, IconFlask,
    IconInfoCircle, IconReceiptTax, IconClock
} from '@tabler/icons-react';

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
                // Fetch categories
                const categoriesResponse = await Api.get('/api/categories');
                const categoriesMap = {};
                (categoriesResponse.data.data || []).forEach(category => {
                    categoriesMap[category.id.toString()] = category;
                });
                setCategories(categoriesMap);

                // Fetch all sampels
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

    const handleSearchSampel = (e) => {
        e.preventDefault();
        fetchSampels(searchKeyword);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
    };

    const getSelectedSampel = (sampelId) => {
        return sampels.find(s => s.id === parseInt(sampelId));
    };

    const calculateTotal = () => {
        return form.items.reduce((total, item) => {
            const sampel = getSelectedSampel(item.sampel_id);
            return total + ((sampel?.price_sell || 0) * (parseInt(item.qty) || 0));
        }, 0);
    };

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
            Swal.fire({
                icon: 'warning',
                title: 'Peringatan',
                text: 'Pastikan semua item terisi dengan benar!',
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        const confirmResult = await Swal.fire({
            title: 'Konfirmasi Surat Penawaran',
            text: `Apakah Anda yakin ingin membuat Surat Penawaran ini?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Ya, Buat Penawaran!',
            cancelButtonText: 'Batal'
        });

        if (!confirmResult.isConfirmed) return;

        setIsLoading(true);
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const payload = {
                    jenis: 'SURAT_PENAWARAN',
                    catatan: form.catatan || null,
                    items: form.items.map(item => ({
                        sampel_id: parseInt(item.sampel_id),
                        qty: parseInt(item.qty)
                    }))
                };

                const response = await Api.post('/api/pemohonan', payload);

                await Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!',
                    text: response.data.meta?.message || 'Surat Penawaran berhasil dibuat!',
                    toast: true,
                    position: 'top',
                    showConfirmButton: false,
                    timer: 2000
                });

                navigate('/penawaran');
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: error.response?.data?.message || 'Gagal membuat Surat Penawaran!',
                    confirmButtonColor: '#ef4444'
                });
            }
        }
        setIsLoading(false);
    };

    return (
        <LayoutAdmin>
            {/* 3D Neo-Brutalist Theme Styles */}
            <style>{`
                .card-3d {
                    background: #ffffff !important;
                    border: 3px solid #000000 !important;
                    box-shadow: 6px 6px 0px #000000 !important;
                    border-radius: 20px !important;
                    transition: all 0.15s ease-in-out !important;
                }
                .hero-card-3d {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
                    border: 3px solid #000000 !important;
                    box-shadow: 6px 6px 0px #000000 !important;
                    border-radius: 22px !important;
                    color: #ffffff !important;
                }
                .item-card-3d {
                    background: #ffffff !important;
                    border: 2.5px solid #000000 !important;
                    box-shadow: 4px 4px 0px #000000 !important;
                    border-radius: 16px !important;
                    transition: all 0.15s ease-in-out !important;
                }
                .item-card-3d:hover {
                    box-shadow: 6px 6px 0px #000000 !important;
                    transform: translateY(-2px);
                }
                .badge-3d {
                    border: 2px solid #000000 !important;
                    box-shadow: 2px 2px 0px #000000 !important;
                    border-radius: 8px !important;
                    font-weight: 800 !important;
                }
                .btn-3d-primary {
                    background: #2563eb !important;
                    color: #ffffff !important;
                    border: 2.5px solid #000000 !important;
                    box-shadow: 4px 4px 0px #000000 !important;
                    border-radius: 12px !important;
                    font-weight: 800 !important;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.15s ease-in-out !important;
                    text-decoration: none !important;
                }
                .btn-3d-primary:hover {
                    background: #1d4ed8 !important;
                    color: #ffffff !important;
                    transform: translate(-2px, -2px);
                    box-shadow: 6px 6px 0px #000000 !important;
                }
                .btn-3d-secondary {
                    background: #f1f5f9 !important;
                    color: #0f172a !important;
                    border: 2.5px solid #000000 !important;
                    box-shadow: 4px 4px 0px #000000 !important;
                    border-radius: 12px !important;
                    font-weight: 800 !important;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.15s ease-in-out !important;
                    text-decoration: none !important;
                }
                .btn-3d-secondary:hover {
                    background: #e2e8f0 !important;
                    color: #000000 !important;
                    transform: translate(-2px, -2px);
                    box-shadow: 6px 6px 0px #000000 !important;
                }
                .btn-3d-danger {
                    background: #ef4444 !important;
                    color: #ffffff !important;
                    border: 2px solid #000000 !important;
                    box-shadow: 3px 3px 0px #000000 !important;
                    border-radius: 10px !important;
                    font-weight: 800 !important;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s ease-in-out !important;
                }
                .btn-3d-danger:hover {
                    background: #dc2626 !important;
                    color: #ffffff !important;
                    transform: translate(-1px, -1px);
                    box-shadow: 4px 4px 0px #000000 !important;
                }
                .btn-3d-green {
                    background: #10b981 !important;
                    color: #ffffff !important;
                    border: 2.5px solid #000000 !important;
                    box-shadow: 4px 4px 0px #000000 !important;
                    border-radius: 12px !important;
                    font-weight: 800 !important;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    transition: all 0.15s ease-in-out !important;
                }
                .btn-3d-green:hover {
                    background: #059669 !important;
                    color: #ffffff !important;
                    transform: translate(-2px, -2px);
                    box-shadow: 6px 6px 0px #000000 !important;
                }
                .input-3d {
                    border: 2.5px solid #000000 !important;
                    border-radius: 12px !important;
                    box-shadow: 3px 3px 0px #000000 !important;
                    font-weight: 600 !important;
                    transition: all 0.15s ease-in-out !important;
                }
                .input-3d:focus {
                    border-color: #2563eb !important;
                    box-shadow: 4px 4px 0px #000000 !important;
                    outline: none !important;
                }
            `}</style>

            <div className="page-wrapper py-3">
                <div className="container-xl">
                    {/* Header Hero Card 3D */}
                    <div className="hero-card-3d p-4 mb-4">
                        <div className="row align-items-center g-3">
                            <div className="col-lg-8">
                                <div className="d-flex align-items-center gap-3 mb-2">
                                    <div className="p-3 bg-primary text-white rounded-3 border border-2 border-dark" style={{ boxShadow: '3px 3px 0px #000' }}>
                                        <IconFileText size={32} />
                                    </div>
                                    <div>
                                        <h2 className="fw-black mb-1 text-white" style={{ fontSize: '1.75rem', letterSpacing: '-0.5px' }}>
                                            Buat Surat Penawaran Baru
                                        </h2>
                                        <div className="text-white-50 small">
                                            Pengajuan estimasi biaya resmi sampel & parameter pengujian Laboratorium SDA
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex flex-wrap gap-2 mt-3">
                                    <span className="badge badge-3d bg-warning text-dark">
                                        <IconClock size={14} className="me-1" /> Expire 7 Hari
                                    </span>
                                    <span className="badge badge-3d bg-info text-dark">
                                        <IconSparkles size={14} className="me-1" /> Dokumen Resmi
                                    </span>
                                    <span className="badge badge-3d bg-success text-white">
                                        <IconFlask size={14} className="me-1" /> {sampels.length} Parameter Tersedia
                                    </span>
                                </div>
                            </div>
                            <div className="col-lg-4 text-lg-end">
                                <Link to="/penawaran" className="btn btn-3d-secondary py-2 px-3">
                                    <IconArrowLeft size={18} /> Kembali ke Penawaran
                                </Link>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="row g-4">
                            <div className="col-lg-8">
                                {/* Banner Informatif Tipe Pemohonan (Replacing Tabs) */}
                                <div className="card-3d p-4 mb-4" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' }}>
                                    <div className="d-flex align-items-start gap-3">
                                        <div className="p-2 bg-primary text-white rounded-3 border border-2 border-dark mt-1" style={{ boxShadow: '2px 2px 0px #000' }}>
                                            <IconReceiptTax size={26} />
                                        </div>
                                        <div>
                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                <h4 className="fw-black text-dark mb-0">Dokumen Surat Penawaran Harga</h4>
                                                <span className="badge badge-3d bg-primary text-white">Aktif</span>
                                            </div>
                                            <p className="text-secondary small mb-0" style={{ lineHeight: '1.5' }}>
                                                Dokumen surat penawaran ini merupakan estimasi biaya pengujian resmi yang otomatis berlaku selama <strong>7 hari kalender</strong> sejak diterbitkan. Setelah penawaran disetujui, Anda dapat melanjutkan ke tahap pembayaran dan pengujian.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Items Sampel Section */}
                                <div className="card-3d p-4 mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="p-2 bg-warning text-dark rounded-3 border border-2 border-dark" style={{ boxShadow: '2px 2px 0px #000' }}>
                                                <IconFlask size={20} />
                                            </div>
                                            <div>
                                                <h4 className="fw-black text-dark mb-0">Item Sampel & Parameter</h4>
                                                <small className="text-muted">Pilih sampel uji yang akan diajukan dalam penawaran</small>
                                            </div>
                                        </div>
                                        <button type="button" className="btn btn-3d-green py-2 px-3" onClick={addItem}>
                                            <IconPlus size={18} /> Tambah Item
                                        </button>
                                    </div>

                                    {/* Search Sampel Box */}
                                    <div className="mb-4">
                                        <div className="d-flex align-items-center bg-white p-1" style={{ border: '2.5px solid #000', boxShadow: '4px 4px 0px #000', borderRadius: '14px' }}>
                                            <div className="ps-3 pe-2 text-muted d-flex align-items-center">
                                                <IconSearch size={20} />
                                            </div>
                                            <input
                                                type="text"
                                                className="form-control border-0 shadow-none bg-transparent py-2 fw-semibold"
                                                style={{ fontSize: '0.95rem' }}
                                                placeholder="Cari sampel berdasarkan nama parameter atau kategori..."
                                                value={searchKeyword}
                                                onChange={(e) => setSearchKeyword(e.target.value)}
                                                onKeyUp={(e) => {
                                                    if (e.key === 'Enter') handleSearchSampel(e);
                                                }}
                                            />
                                            {searchKeyword && (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-light border-0 text-muted me-2 fw-bold rounded-circle px-2"
                                                    onClick={() => { setSearchKeyword(''); fetchSampels(''); }}
                                                    title="Reset Pencarian"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                            <button 
                                                type="button" 
                                                className="btn btn-primary fw-bold py-2 px-4 me-1" 
                                                style={{ border: '2px solid #000', boxShadow: 'none', borderRadius: '10px' }}
                                                onClick={handleSearchSampel}
                                            >
                                                Cari
                                            </button>
                                        </div>
                                        <div className="form-hint mt-2 text-muted small d-flex align-items-center gap-1">
                                            <IconInfoCircle size={14} /> Data sampel diambil secara otomatis dari master katalog sampel laboratorium.
                                        </div>
                                    </div>

                                    {/* List Item Cards */}
                                    {form.items.map((item, index) => {
                                        const selectedSampel = getSelectedSampel(item.sampel_id);
                                        const groupedSampels = getSampelsGroupedByCategory();
                                        return (
                                            <div key={index} className="item-card-3d p-3 mb-3">
                                                <div className="d-flex align-items-center justify-content-between mb-2">
                                                    <span className="badge badge-3d bg-dark text-white">Item #{index + 1}</span>
                                                    {form.items.length > 1 && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-3d-danger py-1 px-2 text-white"
                                                            onClick={() => removeItem(index)}
                                                            title="Hapus Item"
                                                        >
                                                            <IconTrash size={16} className="me-1" /> Hapus
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="row g-3 align-items-center">
                                                    <div className="col-md-7">
                                                        <label className="form-label fw-bold text-dark mb-1">Pilih Sampel / Parameter</label>
                                                        <select
                                                            className="form-select input-3d"
                                                            value={item.sampel_id}
                                                            onChange={(e) => handleItemChange(index, 'sampel_id', e.target.value)}
                                                            required
                                                        >
                                                            <option value="">-- Pilih Sampel Laboratory --</option>
                                                            {Object.entries(groupedSampels).sort(([a], [b]) => a.localeCompare(b)).map(([catName, catSampels]) => (
                                                                <optgroup key={catName} label={`📁 ${catName}`}>
                                                                    {catSampels.map(sampel => (
                                                                        <option key={sampel.id} value={sampel.id}>
                                                                            {sampel.parameter || sampel.name} — {formatCurrency(sampel.price_sell)}
                                                                        </option>
                                                                    ))}
                                                                </optgroup>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-md-5">
                                                        <div className="row g-2 align-items-center">
                                                            <div className="col-5">
                                                                <label className="form-label fw-bold text-dark mb-1">Jumlah (Qty)</label>
                                                                <input
                                                                    type="number"
                                                                    className="form-control input-3d text-center"
                                                                    min="1"
                                                                    value={item.qty}
                                                                    onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="col-7 text-end">
                                                                <label className="form-label fw-bold text-muted mb-1 d-block">Subtotal</label>
                                                                <div className="fw-black fs-5 text-primary">
                                                                    {selectedSampel ? formatCurrency((selectedSampel.price_sell || 0) * (parseInt(item.qty) || 0)) : 'Rp 0'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {selectedSampel && (
                                                    <div className="mt-3 pt-2 border-top d-flex flex-wrap align-items-center gap-2">
                                                        <span className="badge badge-3d bg-primary text-white">
                                                            Parameter: {selectedSampel.parameter || '-'}
                                                        </span>
                                                        <span className="badge badge-3d bg-info text-dark">
                                                            Kategori: {categories[selectedSampel.category_id?.toString()]?.name || 'Tanpa Kategori'}
                                                        </span>
                                                        {selectedSampel.price_sell && (
                                                            <span className="badge badge-3d bg-success text-white">
                                                                Harga Satuan: {formatCurrency(selectedSampel.price_sell)}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {fetchingSampels && (
                                        <div className="text-center text-muted py-4">
                                            <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                                            Memuat daftar sampel laboratorium...
                                        </div>
                                    )}
                                </div>

                                {/* Catatan Card 3D */}
                                <div className="card-3d p-4 mb-4">
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                        <div className="p-2 bg-secondary text-white rounded-3 border border-2 border-dark" style={{ boxShadow: '2px 2px 0px #000' }}>
                                            <IconFileText size={20} />
                                        </div>
                                        <h4 className="fw-black text-dark mb-0">Catatan Tambahan (Opsional)</h4>
                                    </div>
                                    <textarea
                                        className="form-control input-3d"
                                        rows="3"
                                        placeholder="Tambahkan catatan khusus mengenai sampel atau pengajuan ini jika ada..."
                                        value={form.catatan}
                                        onChange={(e) => setForm(prev => ({ ...prev, catatan: e.target.value }))}
                                    ></textarea>
                                </div>
                            </div>

                            {/* Sidebar Summary Card */}
                            <div className="col-lg-4">
                                <div className="card-3d p-4 sticky-top" style={{ top: '20px' }}>
                                    <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom border-2 border-dark">
                                        <div className="p-2 bg-success text-white rounded-3 border border-2 border-dark" style={{ boxShadow: '2px 2px 0px #000' }}>
                                            <IconReceiptTax size={22} />
                                        </div>
                                        <h4 className="fw-black text-dark mb-0">Ringkasan Estimasi</h4>
                                    </div>

                                    <div className="mb-4">
                                        <div className="text-muted fw-bold small mb-1">TOTAL ESTIMASI BIAYA</div>
                                        <div className="fw-black text-primary" style={{ fontSize: '2rem', letterSpacing: '-0.5px' }}>
                                            {formatCurrency(calculateTotal())}
                                        </div>
                                        <div className="mt-2 d-flex align-items-center justify-content-between">
                                            <span className="text-muted small">Total Item Dipilih:</span>
                                            <span className="badge badge-3d bg-dark text-white">
                                                {form.items.filter(i => i.sampel_id).length} Item
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-3 mb-4 rounded-3 border border-2 border-dark bg-light" style={{ boxShadow: '3px 3px 0px #000' }}>
                                        <div className="d-flex align-items-center gap-2 fw-bold text-dark mb-1 small">
                                            <IconClock size={16} className="text-warning" /> Masa Berlaku Surat Penawaran
                                        </div>
                                        <p className="text-muted small mb-0">
                                            Surat penawaran berlaku selama <strong>7 hari kalender</strong>. Segera lakukan persetujuan atau konfirmasi sebelum batas waktu berakhir.
                                        </p>
                                    </div>

                                    <div className="d-grid gap-2">
                                        <button
                                            type="submit"
                                            className="btn btn-3d-primary py-3 px-4 w-100 fs-6"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <><span className="spinner-border spinner-border-sm me-2"></span>Memproses...</>
                                            ) : (
                                                <><IconCheck size={20} /> Buat Surat Penawaran</>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-3d-secondary py-2.5 px-4 w-100"
                                            onClick={() => navigate('/penawaran')}
                                        >
                                            <IconArrowLeft size={18} /> Batal
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </LayoutAdmin>
    );
}
