import {
    FiCreditCard,
    FiX,
    FiLoader,
    FiPrinter,
    FiUser,
    FiDollarSign,
    FiAlertCircle
} from "react-icons/fi";

const PaymentAllModal = ({
    showAllPaymentModal,
    closeAllPaymentModal,
    isProcessingPayment,
    userData,
    groupedData,
    unpaidTotal,
    paymentData,
    handlePaymentDataChange,
    calculateChange,
    handleAllPayment,
    formatCurrency
}) => {
    if (!showAllPaymentModal) return null;

    return (
        <>
            <div
                className="modal-backdrop-custom fade show"
                onClick={closeAllPaymentModal}
                style={{ zIndex: 1040 }}
            ></div>

            <div
                className="modal-custom fade show"
                style={{ display: 'block', zIndex: 1050 }}
                tabIndex="-1"
            >
                <div className="modal-dialog modal-xl-custom modal-dialog-centered">
                    <div className="modal-content-custom">
                        <div className="modal-status-custom bg-success"></div>
                        <div className="modal-header-custom">
                            <h5 className="modal-title">
                                <FiCreditCard className="me-2 text-success" />
                                Konfirmasi Pembayaran - SEMUA KATEGORI
                            </h5>
                            <button
                                type="button"
                                className="btn-close-custom"
                                onClick={closeAllPaymentModal}
                                aria-label="Close"
                                disabled={isProcessingPayment}
                            ></button>
                        </div>
                        <div className="modal-body-custom">
                            <div className="row">
                                <div className="col-md-8">
                                    <div className="card">
                                        <div className="card-header">
                                            <h6 className="card-title mb-0">
                                                <FiUser className="me-2" />
                                                Detail Pelanggan & Semua Item
                                            </h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="row mb-4">
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label fw-bold">Nama Pelanggan</label>
                                                        <div className="form-control bg-light">
                                                            {userData?.name || 'Guest'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label fw-bold">Total Kategori</label>
                                                        <div className="form-control bg-light">
                                                            {Object.values(groupedData).filter(cat => cat.hasUnpaidItems).length} Kategori
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <h6 className="mb-3">Semua Item yang akan dibayar:</h6>
                                            <div className="table-responsive">
                                                <table className="table table-sm table-bordered">
                                                    <thead className="bg-light">
                                                        <tr>
                                                            <th>No</th>
                                                            <th>Kategori</th>
                                                            <th>Nama Sampel</th>
                                                            <th className="text-center">Qty</th>
                                                            <th className="text-end">Harga</th>
                                                            <th className="text-end">Subtotal</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {Object.entries(groupedData)
                                                            .filter(([categoryName, categoryData]) => categoryData.hasUnpaidItems)
                                                            .flatMap(([categoryName, categoryData], categoryIndex) =>
                                                                categoryData.items
                                                                    .filter(item => !item.status)
                                                                    .map((item, itemIndex) => (
                                                                        <tr key={item.id}>
                                                                            <td>{(categoryIndex * 10) + itemIndex + 1}</td>
                                                                            <td>
                                                                                <span className="badge bg-primary-lt">
                                                                                    {categoryName}
                                                                                </span>
                                                                            </td>
                                                                            <td>{item.sampel.parameter}</td>
                                                                            <td className="text-center">{item.qty}</td>
                                                                            <td className="text-end">{formatCurrency(item.price)}</td>
                                                                            <td className="text-end fw-bold">{formatCurrency(item.price * item.qty)}</td>
                                                                        </tr>
                                                                    ))
                                                            )}
                                                    </tbody>
                                                    <tfoot className="bg-light">
                                                        <tr>
                                                            <td colSpan="5" className="text-end fw-bold">Total Semua:</td>
                                                            <td className="text-end fw-bold text-primary">
                                                                {formatCurrency(unpaidTotal)}
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className="card">
                                        <div className="card-header">
                                            <h6 className="card-title mb-0">
                                                <FiDollarSign className="me-2" />
                                                Informasi Pembayaran
                                            </h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Total Belanja</label>
                                                <div className="form-control bg-light fw-bold text-primary">
                                                    {formatCurrency(unpaidTotal)}
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Grand Total</label>
                                                <div className="form-control bg-success text-white fw-bold">
                                                    {formatCurrency(paymentData.grand_total)}
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Cash</label>
                                                <div className="input-group">
                                                    <span className="input-group-text">Rp</span>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={paymentData.cash}
                                                        onChange={(e) => handlePaymentDataChange('cash', e.target.value)}
                                                        disabled={isProcessingPayment}
                                                        min={paymentData.grand_total}
                                                    />
                                                </div>
                                                <small className="text-muted">
                                                    Minimum cash: {formatCurrency(paymentData.grand_total)}
                                                </small>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Kembalian</label>
                                                <div className={`form-control fw-bold ${calculateChange() > 0 ? 'bg-warning' : 'bg-light'}`}>
                                                    {formatCurrency(calculateChange())}
                                                </div>
                                            </div>

                                            {calculateChange() < 0 && (
                                                <div className="alert alert-danger">
                                                    <FiAlertCircle className="me-2" />
                                                    Cash tidak cukup! Tambahkan cash sebesar {formatCurrency(Math.abs(calculateChange()))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer-custom">
                            <div className="w-100">
                                <div className="row g-2">
                                    <div className="col">
                                        <button
                                            className="btn btn-danger w-100 text-white"
                                            onClick={closeAllPaymentModal}
                                            disabled={isProcessingPayment}
                                            type="button"
                                        >
                                            <FiX className="me-1" />
                                            Batal
                                        </button>
                                    </div>
                                    <div className="col">
                                        <button
                                            className="btn btn-success w-100"
                                            onClick={handleAllPayment}
                                            disabled={isProcessingPayment || calculateChange() < 0}
                                            type="button"
                                        >
                                            {isProcessingPayment ? (
                                                <>
                                                    <FiLoader className="spinner me-2" />
                                                    Memproses...
                                                </>
                                            ) : (
                                                <>
                                                    <FiPrinter className="me-2" />
                                                    Bayar Semua & Cetak Struk
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PaymentAllModal;