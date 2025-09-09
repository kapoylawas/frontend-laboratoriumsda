import SampelEdit from './edit';
import DeleteButton from '../../components/DeleteButton';

export default function SampelRow({ sampel, color, formatCurrency, fetchData, keywords }) {
    // Highlight search terms in parameter name
    const highlightSearchTerm = (text, searchTerm) => {
        if (!searchTerm) return text;

        const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    };

    return (
        <tr>
            <td data-label="Parameter">
                <div className="d-flex align-items-center">
                    <div
                        className="flex-fill fw-medium"
                        style={{ color: color.text }}
                        dangerouslySetInnerHTML={{
                            __html: highlightSearchTerm(sampel.parameter || 'Tidak ada parameter', keywords)
                        }}
                    />
                </div>
            </td>
            <td data-label="Harga">
                <div className={sampel.price_sell ? "fw-semibold" : "text-muted"}>
                    {sampel.price_sell ? formatCurrency(sampel.price_sell) : 'Harga tidak tersedia atau 0'}
                </div>
            </td>
            <td>
                <div className="btn-list justify-content-center">
                    <SampelEdit sampelsId={sampel.id} fetchData={fetchData} />
                    <DeleteButton id={sampel.id} endpoint="/api/sampels" fetchData={fetchData} />
                </div>
            </td>
        </tr>
    );
}