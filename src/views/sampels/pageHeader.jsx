import { IconRefresh } from "@tabler/icons-react";
import SampelCreate from './create';

export default function PageHeader({
    isLoading,
    fetchData,
    toggleAllCategories,
    expandedCategories,
    groupedSampels
}) {
    const allExpanded = Object.values(expandedCategories).every(val => val);

    return (
        <div className="page-header">
            <div className="container-xl">
                <div className="row g-2 align-items-center">
                    <div className="col">
                        <div className="page-header-content">
                            <div className="page-pretitle text-muted">Manajemen</div>
                            <h2 className="page-title">Data Sampel</h2>
                            <div className="page-subtitle text-muted">
                                Kelola data sampel yang dikelompokkan berdasarkan kategori
                            </div>
                        </div>
                    </div>
                    <div className="col-auto ms-auto">
                        <div className="btn-list">
                            <button
                                onClick={() => fetchData()}
                                className="btn btn-outline-primary"
                                disabled={isLoading}
                            >
                                <IconRefresh size={18} className="me-1" />
                                {isLoading ? "Memuat..." : "Refresh"}
                            </button>
                            <SampelCreate fetchData={fetchData} />
                            <button
                                onClick={toggleAllCategories}
                                className="btn btn-outline-secondary"
                                disabled={isLoading || Object.keys(groupedSampels).length === 0}
                            >
                                {allExpanded ? "Tutup Semua" : "Buka Semua"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}