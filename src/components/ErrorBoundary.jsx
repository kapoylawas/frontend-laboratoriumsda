import { Component } from 'react'
import OfflinePage from '../views/offline'

class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, isOffline: !navigator.onLine }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true }
    }

    componentDidMount() {
        window.addEventListener('online', this.handleOnline)
        window.addEventListener('offline', this.handleOffline)
    }

    componentWillUnmount() {
        window.removeEventListener('online', this.handleOnline)
        window.removeEventListener('offline', this.handleOffline)
    }

    handleOnline = () => {
        this.setState({ isOffline: false })
    }

    handleOffline = () => {
        this.setState({ isOffline: true })
    }

    render() {
        if (this.state.isOffline) {
            return <OfflinePage />
        }

        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <h2>Terjadi Kesalahan</h2>
                    <p>Maaf, terjadi masalah saat memuat halaman.</p>
                    <button onClick={() => window.location.reload()}>
                        Muat Ulang Halaman
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary