import { useEffect, useState } from 'react'
import './OfflineNotification.css'

const OfflineNotification = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [showNotification, setShowNotification] = useState(false)

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowNotification(false);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowNotification(true);
        };

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    if (!showNotification || isOnline) return null

    return (
        <div className="offline-notification-overlay">
            <div className="offline-notification-center">
                <div className="offline-content-center">
                    <span className="offline-icon-center">⚠️</span>
                    <div className="offline-message-center">
                        <p className="offline-title-center">Koneksi Terputus</p>
                        <p className="offline-description-center">Internet Anda offline. Beberapa fitur mungkin tidak tersedia.</p>
                    </div>
                    <button
                        className="close-button-center"
                        onClick={() => setShowNotification(false)}
                        aria-label="Tutup notifikasi"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    )
}

export default OfflineNotification