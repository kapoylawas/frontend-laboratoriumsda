import {
    IconCircleCheck,
    IconPackage,
    IconShoppingCart,
    IconListCheck,
    IconInfoCircle,
    IconRefresh,
    IconCheck
} from "@tabler/icons-react";

export default function OrderSuccessModal({
    show,
    onClose,
    orderDetails,
    orderTotal,
    formatCurrency,
    onPrint,
    onOrderAgain,
    onViewOrders
}) {
    if (!show) return null;

    return (
        <div className="custom-order-modal">
            <div className="custom-order-modal-dialog" style={{
                maxWidth: '95%',
                width: '900px',
                margin: '20px auto',
                maxHeight: '95vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div className="custom-order-modal-content" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '95vh',
                    overflow: 'hidden'
                }}>
                    {/* Header */}
                    <div className="custom-order-modal-header" style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        padding: '1.5rem 2rem',
                        borderBottom: '1px solid rgba(255,255,255,0.2)',
                        flexShrink: 0,
                        position: 'relative',
                        zIndex: 10
                    }}>
                        <div className="d-flex align-items-center justify-content-between w-100">
                            <div className="d-flex align-items-center">
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: '1rem',
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    <IconCircleCheck size={24} style={{ color: 'white' }} />
                                </div>
                                <div>
                                    <h4 className="mb-0 fw-bold text-white">Pesanan Berhasil!</h4>
                                    <small className="text-white opacity-90">Pesanan Anda sedang diproses</small>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={onClose}
                                style={{
                                    filter: 'brightness(0) invert(1)',
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: '1.5rem',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="custom-order-modal-body" style={{
                        padding: '2rem',
                        overflowY: 'auto',
                        flex: '1 1 auto',
                        maxHeight: 'calc(95vh - 200px)'
                    }}>
                        {/* Summary Cards */}
                        <div className="row g-3 mb-4">
                            <div className="col-md-4">
                                <div className="card border-0 shadow-sm h-100" style={{
                                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                    borderLeft: '4px solid #0ea5e9'
                                }}>
                                    <div className="card-body text-center p-3">
                                        <div className="text-sky-600 mb-2">
                                            <IconPackage size={24} />
                                        </div>
                                        <h5 className="fw-bold text-gray-900 mb-1">{orderDetails.length}</h5>
                                        <p className="text-muted small mb-0">Total Item</p>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="card border-0 shadow-sm h-100" style={{
                                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                                    borderLeft: '4px solid #22c55e'
                                }}>
                                    <div className="card-body text-center p-3">
                                        <div className="text-emerald-600 mb-2">
                                            <IconShoppingCart size={24} />
                                        </div>
                                        <h5 className="fw-bold text-gray-900 mb-1">
                                            {orderDetails.reduce((sum, item) => sum + item.quantity, 0)}
                                        </h5>
                                        <p className="text-muted small mb-0">Total Quantity</p>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="card border-0 shadow-sm h-100" style={{
                                    background: 'linear-gradient(135deg, #fef7ff 0%, #fae8ff 100%)',
                                    borderLeft: '4px solid #a855f7'
                                }}>
                                    <div className="card-body text-center p-3">
                                        <div className="text-purple-600 mb-2">
                                            <IconCircleCheck size={24} />
                                        </div>
                                        <h5 className="fw-bold text-gray-900 mb-1">{formatCurrency(orderTotal)}</h5>
                                        <p className="text-muted small mb-0">Total Pembayaran</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Details */}
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-header bg-transparent border-0 py-3" style={{ background: '#f8fafc' }}>
                                <h6 className="mb-0 fw-semibold text-gray-900 d-flex align-items-center">
                                    <IconListCheck size={18} className="me-2 text-primary" />
                                    Detail Pesanan
                                </h6>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    <table className="table table-hover align-middle mb-0">
                                        <thead style={{
                                            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                            position: 'sticky',
                                            top: 0,
                                            zIndex: 5
                                        }}>
                                            <tr>
                                                <th style={{
                                                    padding: '0.75rem',
                                                    fontWeight: '600',
                                                    color: '#374151',
                                                    borderBottom: '2px solid #e5e7eb',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    Item
                                                </th>
                                                <th style={{
                                                    padding: '0.75rem',
                                                    fontWeight: '600',
                                                    color: '#374151',
                                                    borderBottom: '2px solid #e5e7eb',
                                                    width: '80px',
                                                    textAlign: 'center',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    Qty
                                                </th>
                                                <th style={{
                                                    padding: '0.75rem',
                                                    fontWeight: '600',
                                                    color: '#374151',
                                                    borderBottom: '2px solid #e5e7eb',
                                                    width: '120px',
                                                    textAlign: 'right',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    Harga
                                                </th>
                                                <th style={{
                                                    padding: '0.75rem',
                                                    fontWeight: '600',
                                                    color: '#374151',
                                                    borderBottom: '2px solid #e5e7eb',
                                                    width: '120px',
                                                    textAlign: 'right',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    Subtotal
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orderDetails.map((item, index) => (
                                                <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <div className="d-flex align-items-center">
                                                            <div style={{
                                                                width: '6px',
                                                                height: '6px',
                                                                borderRadius: '50%',
                                                                background: '#10b981',
                                                                marginRight: '10px',
                                                                flexShrink: 0
                                                            }}></div>
                                                            <div style={{ minWidth: 0 }}>
                                                                <div className="fw-medium text-gray-900" style={{
                                                                    fontSize: '0.9rem',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }}>
                                                                    {item.parameter}
                                                                </div>
                                                                <small className="text-muted">Item #{index + 1}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{
                                                        padding: '0.75rem',
                                                        textAlign: 'center'
                                                    }}>
                                                        <span className="badge" style={{
                                                            background: '#f3f4f6',
                                                            color: '#374151',
                                                            padding: '0.25rem 0.5rem',
                                                            borderRadius: '6px',
                                                            fontWeight: '600',
                                                            fontSize: '0.8rem'
                                                        }}>
                                                            {item.quantity}
                                                        </span>
                                                    </td>
                                                    <td style={{
                                                        padding: '0.75rem',
                                                        textAlign: 'right',
                                                        color: '#6b7280',
                                                        fontWeight: '500',
                                                        fontSize: '0.9rem'
                                                    }}>
                                                        {formatCurrency(item.price)}
                                                    </td>
                                                    <td style={{
                                                        padding: '0.75rem',
                                                        textAlign: 'right',
                                                        color: '#059669',
                                                        fontWeight: '600',
                                                        fontSize: '0.9rem'
                                                    }}>
                                                        {formatCurrency(item.subtotal)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Total Summary */}
                        <div className="card border-0 bg-gradient-success text-white mb-4">
                            <div className="card-body text-center py-3">
                                <div className="row align-items-center">
                                    <div className="col-md-8 text-md-start">
                                        <h6 className="mb-1 fw-semibold">Total Pembayaran</h6>
                                        <small className="opacity-90">Termasuk pajak dan biaya lainnya</small>
                                    </div>
                                    <div className="col-md-4">
                                        <h4 className="mb-0 fw-bold">{formatCurrency(orderTotal)}</h4>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Information Section */}
                        <div className="alert border-0 shadow-sm" style={{
                            background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)',
                            borderLeft: '4px solid #f59e0b'
                        }}>
                            <div className="d-flex align-items-start">
                                <IconInfoCircle size={18} className="me-3 mt-1 text-amber-600 flex-shrink-0" />
                                <div>
                                    <h6 className="fw-semibold text-gray-900 mb-2">Langkah Selanjutnya</h6>
                                    <div className="row text-muted small">
                                        <div className="col-lg-4 mb-2">
                                            <span className="d-block fw-medium">📋 Konfirmasi Admin</span>
                                            <small>1-2 jam kerja</small>
                                        </div>
                                        <div className="col-lg-4 mb-2">
                                            <span className="d-block fw-medium">⚡ Proses Penyiapan</span>
                                            <small>Tim kami menyiapkan sampel</small>
                                        </div>
                                        <div className="col-lg-4 mb-2">
                                            <span className="d-block fw-medium">📞 Notifikasi</span>
                                            <small>Via WhatsApp</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="custom-order-modal-footer" style={{
                        padding: '1.5rem 2rem',
                        background: '#f8fafc',
                        borderTop: '1px solid #e5e7eb',
                        flexShrink: 0
                    }}>
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                            <div className="text-center text-md-start">
                                <small className="text-muted">
                                    Pesanan: {new Date().toLocaleString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </small>
                            </div>

                            <div className="d-flex flex-column flex-sm-row gap-2">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        fontWeight: '500'
                                    }}
                                    onClick={onPrint}
                                >
                                    <IconPackage size={16} className="me-2" />
                                    Cetak
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm d-flex align-items-center"
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        fontWeight: '500'
                                    }}
                                    onClick={onOrderAgain}
                                >
                                    <IconRefresh size={16} className="me-2" />
                                    Pesan Lagi
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-success btn-sm d-flex align-items-center"
                                    style={{
                                        padding: '0.5rem 1.5rem',
                                        borderRadius: '8px',
                                        fontWeight: '500'
                                    }}
                                    onClick={onViewOrders}
                                >
                                    <IconCheck size={16} className="me-2" />
                                    Lihat Pesanan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}