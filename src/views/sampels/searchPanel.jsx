import { IconSearch } from "@tabler/icons-react";

export default function SearchPanel({
    keywords,
    setKeywords,
    handleKeyDown,
    resetSearch,
    searchHandlder,
    isLoading
}) {
    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Pencarian Sampel</h3>
            </div>
            <div className="card-body">
                <div className="row g-2 align-items-center">
                    <div className="col">
                        <label className="form-label">Cari berdasarkan nama sampel</label>
                        <div className="input-group">
                            <span className="input-group-text">
                                <IconSearch size={18} />
                            </span>
                            <input
                                type="text"
                                className="form-control"
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Masukkan nama sampel... & Tekan Enter untuk mencari atau gunakan tombol Cari"
                                disabled={isLoading}
                            />
                            {keywords && (
                                <button
                                    onClick={resetSearch}
                                    className="btn btn-outline-secondary"
                                    type="button"
                                    disabled={isLoading}
                                >
                                    Hapus
                                </button>
                            )}
                            <button
                                onClick={searchHandlder}
                                className="btn btn-primary"
                                disabled={isLoading}
                            >
                                {isLoading ? "Mencari..." : "Cari"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}