// components/PaymentModal.jsx
import { FiCreditCard, FiDollarSign, FiX, FiLoader, FiPrinter, FiAlertCircle, FiUser } from "react-icons/fi";
import "./PaymentModal.css";

const PaymentModal = ({
    showPaymentModal,
    closePaymentModal,
    categoryToPay,
    paymentData,
    handlePaymentDataChange,
    calculateChange,
    handlePayment,
    isProcessingPayment,
    groupedData,
    userData,
    formatCurrency
}) => {
    if (!showPaymentModal || !categoryToPay) return null;

    // Get unpaid items for the category
    const unpaidItems = groupedData[categoryToPay]?.items?.filter(item => !item.status) || [];
    const unpaidTotal = groupedData[categoryToPay]?.unpaidTotal || 0;

    return (
        <>
            {/* Backdrop dengan class kustom */}
            <div
                className="payment-modal-backdrop fade show"
                onClick={closePaymentModal}
            ></div>

            {/* Modal Container dengan class kustom */}
            <div
                className="payment-modal-wide modal fade show"
                style={{ display: 'block' }}
                tabIndex="-1"
            >
                <div className="payment-modal-dialog modal-dialog">
                    <div className="payment-modal-content modal-content">
                        {/* Status Bar */}
                        <div className="payment-status-bar"></div>

                        {/* Modal Header */}
                        <div className="payment-modal-header modal-header">
                            <div className="payment-modal-header-content">
                                <FiCreditCard className="payment-modal-header-icon" />
                                <h5 className="payment-modal-title modal-title">
                                    Konfirmasi Pembayaran - {categoryToPay}
                                </h5>
                            </div>
                            <button
                                type="button"
                                className="payment-btn-close btn-close"
                                onClick={closePaymentModal}
                                aria-label="Close"
                                disabled={isProcessingPayment}
                            ></button>
                        </div>

                        {/* Modal Body */}
                        <div className="payment-modal-body modal-body">
                            <div className="payment-modal-grid">
                                {/* Left Column - Customer & Items */}
                                <div className="payment-left-column">
                                    <div className="payment-card card">
                                        <div className="payment-card-header card-header">
                                            <FiUser className="payment-card-header-icon" />
                                            <h6>Detail Pelanggan & Item</h6>
                                        </div>
                                        <div className="payment-card-body card-body">
                                            {/* Customer Info */}
                                            <div className="payment-customer-info-grid">
                                                <div className="payment-customer-info-item">
                                                    <label>Nama Pelanggan</label>
                                                    <div className="payment-customer-value">
                                                        {userData?.name || 'Guest'}
                                                    </div>
                                                </div>
                                                <div className="payment-customer-info-item">
                                                    <label>ID User</label>
                                                    <div className="payment-customer-value">
                                                        {userData?.id || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Items Table */}
                                            <div className="payment-items-section">
                                                <h6 className="payment-section-title">
                                                    Item yang akan dibayar:
                                                </h6>
                                                <div className="payment-table-responsive">
                                                    <table className="payment-items-table table">
                                                        <thead>
                                                            <tr>
                                                                <th width="5%" className="payment-text-center">No</th>
                                                                <th width="55%">Nama Sampel</th>
                                                                <th width="10%" className="payment-text-center">Qty</th>
                                                                <th width="15%" className="payment-text-end">Harga</th>
                                                                <th width="15%" className="payment-text-end">Subtotal</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {unpaidItems.map((item, index) => (
                                                                <tr key={item.id}>
                                                                    <td className="payment-text-center">{index + 1}</td>
                                                                    <td>
                                                                        <div className="payment-fw-semibold">
                                                                            {item.sampel?.name || 'N/A'}
                                                                        </div>
                                                                    </td>
                                                                    <td className="payment-text-center">
                                                                        <span className="payment-quantity-badge">
                                                                            {item.qty}
                                                                        </span>
                                                                    </td>
                                                                    <td className="payment-text-end">
                                                                        {formatCurrency(item.price)}
                                                                    </td>
                                                                    <td className="payment-text-end payment-item-subtotal">
                                                                        {formatCurrency(item.price * item.qty)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr className="payment-table-total">
                                                                <td
                                                                    colSpan="4"
                                                                    className="payment-text-end payment-fw-bold"
                                                                >
                                                                    Total Pembayaran:
                                                                </td>
                                                                <td className="payment-text-end payment-total-amount">
                                                                    {formatCurrency(unpaidTotal)}
                                                                </td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Payment Information */}
                                <div className="payment-right-column">
                                    <div className="payment-card card">
                                        <div className="payment-card-header card-header">
                                            <FiDollarSign className="payment-card-header-icon" />
                                            <h6>Informasi Pembayaran</h6>
                                        </div>
                                        <div className="payment-card-body card-body">
                                            <div className="payment-details">
                                                {/* Total Belanja */}
                                                <div className="payment-detail-item">
                                                    <label className="payment-detail-label">
                                                        Total Belanja
                                                    </label>
                                                    <div className="payment-detail-value payment-total-shopping">
                                                        {formatCurrency(unpaidTotal)}
                                                    </div>
                                                </div>

                                                {/* Diskon */}
                                                <div className="payment-detail-item">
                                                    <label className="payment-detail-label">
                                                        Diskon
                                                    </label>
                                                    <div className="payment-input-group input-group input-group-sm">
                                                        <span className="payment-input-group-text input-group-text">Rp</span>
                                                        <input
                                                            type="number"
                                                            className="payment-input form-control"
                                                            value={paymentData.discount}
                                                            onChange={(e) => handlePaymentDataChange('discount', e.target.value)}
                                                            disabled={isProcessingPayment}
                                                            min="0"
                                                            max={unpaidTotal}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <small className="payment-input-help">
                                                        Maksimal diskon: {formatCurrency(unpaidTotal)}
                                                    </small>
                                                </div>

                                                {/* Grand Total */}
                                                <div className="payment-detail-item">
                                                    <label className="payment-detail-label">
                                                        Grand Total
                                                    </label>
                                                    <div className="payment-detail-value payment-grand-total">
                                                        {formatCurrency(paymentData.grand_total)}
                                                    </div>
                                                </div>

                                                {/* Cash */}
                                                <div className="payment-detail-item">
                                                    <label className="payment-detail-label">
                                                        Cash
                                                    </label>
                                                    <div className="payment-input-group input-group input-group-sm">
                                                        <span className="payment-input-group-text input-group-text">Rp</span>
                                                        <input
                                                            type="number"
                                                            className="payment-input form-control"
                                                            value={paymentData.cash}
                                                            onChange={(e) => handlePaymentDataChange('cash', e.target.value)}
                                                            disabled={isProcessingPayment}
                                                            min={paymentData.grand_total}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <small className="payment-input-help">
                                                        Minimum cash: {formatCurrency(paymentData.grand_total)}
                                                    </small>
                                                </div>

                                                {/* Kembalian */}
                                                <div className="payment-detail-item">
                                                    <label className="payment-detail-label">
                                                        Kembalian
                                                    </label>
                                                    <div className={`payment-detail-value payment-change-amount ${calculateChange() > 0 ? 'has-change' : 'no-change'
                                                        }`}>
                                                        {formatCurrency(calculateChange())}
                                                    </div>
                                                </div>

                                                {/* Warning Message */}
                                                {calculateChange() < 0 && (
                                                    <div className="payment-alert">
                                                        <FiAlertCircle className="payment-alert-icon" />
                                                        <div className="payment-alert-message">
                                                            Cash tidak cukup! Tambahkan cash sebesar {formatCurrency(Math.abs(calculateChange()))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="payment-modal-footer modal-footer">
                            <div className="payment-footer-actions">
                                <button
                                    className="payment-btn payment-btn-cancel btn btn-outline-secondary"
                                    onClick={closePaymentModal}
                                    disabled={isProcessingPayment}
                                    type="button"
                                >
                                    <FiX className="payment-btn-icon" />
                                    Batalkan
                                </button>
                                <button
                                    className="payment-btn payment-btn-confirm btn btn-success"
                                    onClick={handlePayment}
                                    disabled={isProcessingPayment || calculateChange() < 0}
                                    type="button"
                                >
                                    {isProcessingPayment ? (
                                        <>
                                            <FiLoader className="payment-btn-icon payment-spinner" />
                                            Memproses Pembayaran...
                                        </>
                                    ) : (
                                        <>
                                            <FiPrinter className="payment-btn-icon" />
                                            Bayar & Cetak Struk
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PaymentModal;