import './offlinePage.css'

const OfflinePage = () => {
    const handleRetry = () => {
        window.location.reload()
    }

    return (
        <div className="offline-page">
            <div className="offline-container">
                <div className="offline-icon">📶</div>
                <h1>Koneksi Terputus</h1>
                <p>Maaf, Anda sedang offline. Periksa koneksi internet Anda dan coba lagi.</p>
                <button className="retry-button" onClick={handleRetry}>
                    Coba Lagi
                </button>
                <div className="offline-tips">
                    <h3>Tips saat offline:</h3>
                    <ul>
                        <li>Periksa koneksi Wi-Fi atau data seluler Anda</li>
                        <li>Pastikan mode pesawat dimatikan</li>
                        <li>Coba restart perangkat Anda</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default OfflinePage