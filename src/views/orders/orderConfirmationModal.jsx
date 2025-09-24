import { IconShoppingCart, IconCheck, IconInfoCircle } from "@tabler/icons-react";

export default function OrderConfirmationModal({
    show,
    onClose,
    selectedSampels,
    sampels,
    quantities,
    categories,
    formatCurrency,
    orderSummary,
    isSubmitting,
    onSubmit,
    onBackToEdit
}) {
    if (!show) return null;

    return (
        <div className="custom-order-modal">
            <div className="custom-order-modal-dialog">
                <div className="custom-order-modal-content">
                    {/* Header */}
                    <div className="custom-order-modal-header">
                        <div className="d-flex align-items-center justify-content-between w-100">
                            <h5 className="modal-title mb-0 d-flex align-items-center">
                                <IconShoppingCart size={24} className="me-2" />
                                Konfirmasi Pesanan
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={onClose}
                                style={{
                                    filter: 'brightness(0) invert(1)',
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: '1.2rem'
                                }}
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="custom-order-modal-body">
                        <div className="alert alert-info d-flex align-items-center mb-4" style={{ background: '#e7f3ff', color: '#055160' }}>
                            <IconInfoCircle size={20} className="me-2 flex-shrink-0" />
                            <div>
                                <strong className="d-block">Periksa kembali pesanan Anda</strong>
                                <small className="d-block mt-1">Pastikan semua item dan jumlah sudah benar sebelum mengkonfirmasi.</small>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="custom-order-table table table-hover">
                                <thead className="table-light">
                                    <tr>
                                        <th>Nama Sampel</th>
                                        <th width="120" className="text-center">Jumlah</th>
                                        <th width="150" className="text-end">Harga Satuan</th>
                                        <th width="150" className="text-end">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSampels.map((sampelId) => {
                                        const sampel = sampels.find(s => s.id === sampelId);
                                        const qty = quantities[sampelId] || 1;
                                        const subtotal = sampel && sampel.price_sell ? qty * sampel.price_sell : 0;

                                        return sampel ? (
                                            <tr key={sampelId}>
                                                <td>
                                                    <div className="fw-medium" style={{ color: '#333' }}>
                                                        {sampel.parameter || 'Tidak ada parameter'}
                                                    </div>
                                                    <small className="text-muted">
                                                        {categories[sampel.category_id]?.name || 'Unknown Category'}
                                                    </small>
                                                </td>
                                                <td className="fw-semibold text-center" style={{ color: '#333' }}>
                                                    {qty}
                                                </td>
                                                <td className="text-end" style={{ color: '#333' }}>
                                                    {sampel.price_sell ? formatCurrency(sampel.price_sell) : 'Gratis'}
                                                </td>
                                                <td className="fw-bold text-success text-end">
                                                    {formatCurrency(subtotal)}
                                                </td>
                                            </tr>
                                        ) : null;
                                    })}
                                </tbody>
                                <tfoot className="table-group-divider">
                                    <tr>
                                        <th colSpan="3" className="text-end" style={{ color: '#333' }}>
                                            Total Pesanan:
                                        </th>
                                        <th className="text-success fs-5 text-end">
                                            {formatCurrency(orderSummary.totalPrice)}
                                        </th>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="custom-order-modal-footer">
                        <div className="d-flex justify-content-between align-items-center w-100">
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-lg"
                                onClick={onBackToEdit}
                                disabled={isSubmitting}
                            >
                                Kembali ke Edit
                            </button>
                            <button
                                type="button"
                                className="btn btn-success btn-lg px-4"
                                onClick={onSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Memproses Pesanan...
                                    </>
                                ) : (
                                    <>
                                        <IconCheck size={20} className="me-2" />
                                        Konfirmasi & Kirim Pesanan
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}