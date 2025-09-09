import { IconSearch } from "@tabler/icons-react";

export default function EmptyState({ keywords, resetSearch }) {
    return (
        <div className="text-center p-5">
            <div className="d-flex flex-column align-items-center">
                <div className="bg-azure-lt p-4 rounded-circle mb-3">
                    <IconSearch size={32} className="text-azure" />
                </div>
                <h3 className="h5">Data tidak ditemukan</h3>
                <p className="text-muted">
                    {keywords
                        ? `Tidak ada hasil untuk "${keywords}". Coba dengan kata kunci lain.`
                        : "Belum ada data sampel yang tersedia."}
                </p>
                {keywords && (
                    <button
                        onClick={resetSearch}
                        className="btn btn-primary"
                    >
                        Tampilkan Semua Sampel
                    </button>
                )}
            </div>
        </div>
    );
}