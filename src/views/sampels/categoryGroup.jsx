import { IconChevronUp, IconChevronDown, IconPackage, IconInfoCircle } from "@tabler/icons-react";
import SampelRow from './sampelRow';

export default function CategoryGroup({
    categoryId,
    categoryData,
    color,
    isPackage,
    packageTotal,
    expandedCategories,
    toggleCategory,
    formatCurrency,
    fetchData,
    keywords
}) {
    // Highlight search terms in category name
    const highlightSearchTerm = (text, searchTerm) => {
        if (!searchTerm) return text;

        // Escape special regex characters
        const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    };

    return (
        <div className="category-group">
            <div
                className="category-header p-3 d-flex justify-content-between align-items-center cursor-pointer"
                onClick={() => toggleCategory(categoryId)}
                style={{
                    backgroundColor: color.bg,
                    borderLeft: `4px solid ${color.text}`,
                    transition: 'all 0.2s ease'
                }}
            >
                <div className="d-flex align-items-center">
                    <div className="me-2" style={{ color: color.text }}>
                        {expandedCategories[categoryId] ?
                            <IconChevronUp /> :
                            <IconChevronDown />
                        }
                    </div>
                    <h4
                        className="m-0 fw-semibold"
                        style={{ color: color.text }}
                    >
                        <span
                            dangerouslySetInnerHTML={{
                                __html: highlightSearchTerm(categoryData.category.name, keywords)
                            }}
                        />
                        {isPackage && (
                            <IconPackage size={18} className="ms-1" />
                        )}
                        <span
                            className="badge ms-2"
                            style={{
                                backgroundColor: color.text,
                                color: 'white'
                            }}
                        >
                            {categoryData.sampels.length} sampel
                        </span>
                        {isPackage && categoryData.sampels.length > 0 && (
                            <span
                                className="badge ms-2"
                                style={{
                                    backgroundColor: '#28a745',
                                    color: 'white'
                                }}
                            >
                                Total: {formatCurrency(packageTotal)}
                            </span>
                        )}
                    </h4>
                </div>
                <div className="text-muted small">
                    Klik untuk {expandedCategories[categoryId] ? 'menutup' : 'membuka'}
                </div>
            </div>
            {expandedCategories[categoryId] && (
                <div className="table-responsive">
                    <table className="table table-hover table-mobile-md card-table mb-0">
                        <thead>
                            <tr>
                                <th width="60%">Nama Parameter</th>
                                <th width="30%">Harga</th>
                                <th width="10%" className="text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categoryData.sampels.length > 0 ? (
                                categoryData.sampels.map((sampel, index) => (
                                    <SampelRow
                                        key={`${categoryId}-${index}`}
                                        sampel={sampel}
                                        color={color}
                                        formatCurrency={formatCurrency}
                                        fetchData={fetchData}
                                        keywords={keywords}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="text-center py-4">
                                        <div className="d-flex flex-column align-items-center text-muted">
                                            <IconInfoCircle size={24} className="mb-2" />
                                            Tidak ada sampel dalam kategori ini
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {isPackage && categoryData.sampels.length > 0 && (
                                <tr className="bg-green-lt">
                                    <td colSpan="1" className="text-end fw-bold">
                                        <IconPackage size={16} className="me-1" />
                                        Total Paket:
                                    </td>
                                    <td className="fw-bold text-success">
                                        {formatCurrency(packageTotal)}
                                    </td>
                                    <td></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}