import { useEffect, useState } from 'react';
import LayoutAdmin from '../../layouts/admin'
import Cookies from "js-cookie";
import Api from "../../services/api";
import {
    IconCategory,
} from "@tabler/icons-react";
import SearchPanel from './searchPanel';
import CategoryGroup from './categoryGroup';
import PageHeader from './pageHeader';
import EmptyState from './emptyState';
import LoadingState from './loadingState';

export default function Sampels() {
    const [sampels, setSampel] = useState([]);
    const [groupedSampels, setGroupedSampels] = useState(new Map());
    const [expandedCategories, setExpandedCategories] = useState({});
    const [categories, setCategories] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 0,
        total: 0
    });
    const [keywords, setKeywords] = useState("");

    const categoryColors = [
        { bg: '#e3f2fd', text: '#0d47a1', border: '#bbdefb' },
        { bg: '#e8f5e9', text: '#1b5e20', border: '#c8e6c9' },
        { bg: '#fff3e0', text: '#e65100', border: '#ffe0b2' },
        { bg: '#fce4ec', text: '#880e4f', border: '#f8bbd0' },
        { bg: '#f3e5f5', text: '#4a148c', border: '#e1bee7' },
        { bg: '#e8eaf6', text: '#1a237e', border: '#c5cae9' },
        { bg: '#e0f2f1', text: '#004d40', border: '#b2dfdb' },
        { bg: '#fff8e1', text: '#ff6f00', border: '#ffecb3' },
    ];

    const getCategoryColor = (categoryId) => {
        const index = parseInt(categoryId) % categoryColors.length;
        return categoryColors[index];
    };

    const calculatePackageTotal = (sampels) => {
        return sampels.reduce((total, sampel) => {
            return total + (sampel.price_sell || 0);
        }, 0);
    };

    const isPackageCategory = (categoryId) => {
        return categoryId === 39 || categoryId === 40;
    };

    const fetchData = async (pageNumber, keywords = "") => {
        setIsLoading(true);
        const page = pageNumber ? pageNumber : pagination.currentPage;
        const token = Cookies.get("token");

        if (!token) {
            console.error("Token is not available!");
            setIsLoading(false);
            return;
        }

        Api.defaults.headers.common["Authorization"] = token;

        try {
            const categoriesResponse = await Api.get('/api/categories');
            const categoriesMap = {};
            categoriesResponse.data.data.forEach(category => {
                categoriesMap[category.id.toString()] = category;
            });

            const response = await Api.get(
                `/api/sampels?page=${page}&search=${keywords}`
            );

            const grouped = groupSampelsByCategoryId(response.data.data, categoriesMap);

            setCategories(prev => ({ ...prev, ...categoriesMap }));
            setSampel(response.data.data);
            setGroupedSampels(grouped);

            // Auto-expand categories with search results
            const newExpandedState = {};
            Object.keys(categoriesMap).forEach(categoryId => {
                const idStr = categoryId.toString();
                // If searching, only expand categories that have results
                if (keywords) {
                    newExpandedState[idStr] = grouped[idStr] && grouped[idStr].sampels.length > 0;
                } else {
                    // If not searching, use previous state or default to true
                    newExpandedState[idStr] = expandedCategories[idStr] !== undefined
                        ? expandedCategories[idStr]
                        : true;
                }
            });

            setExpandedCategories(newExpandedState);

            setPagination({
                currentPage: response.data.pagination.currentPage,
                perPage: response.data.pagination.perPage,
                total: response.data.pagination.total
            });

        } catch (error) {
            console.error("There was an error fetching the data!", error);
        } finally {
            setIsLoading(false);
        }
    };

    const groupSampelsByCategoryId = (sampelsData, categoriesMap) => {
        const groups = {};

        Object.keys(categoriesMap).forEach(categoryId => {
            const idStr = categoryId.toString();
            groups[idStr] = {
                category: categoriesMap[categoryId],
                sampels: []
            };
        });

        sampelsData.forEach(sampel => {
            const categoryId = sampel.category_id?.toString();
            if (categoryId && groups[categoryId]) {
                const existingSampel = groups[categoryId].sampels.find(
                    s => s.id === sampel.id
                );

                if (!existingSampel) {
                    groups[categoryId].sampels.push(sampel);
                } else {
                    console.warn(`Duplicate sampel detected: ${sampel.id}`);
                }
            } else if (categoryId) {
                console.warn(`Kategori dengan ID ${categoryId} tidak ditemukan dalam categoriesMap`);
            }
        });

        return groups;
    };

    const toggleCategory = (categoryId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    const toggleAllCategories = () => {
        const allExpanded = Object.values(expandedCategories).every(val => val);
        const newState = {};
        Object.keys(expandedCategories).forEach(categoryId => {
            newState[categoryId] = !allExpanded;
        });
        setExpandedCategories(newState);
    };

    useEffect(() => {
        if (Object.keys(groupedSampels).length > 0) {
            Object.entries(groupedSampels).forEach(([categoryId, categoryData]) => {
                const sampelIds = new Set();
                const duplicates = [];

                categoryData.sampels.forEach(sampel => {
                    if (sampelIds.has(sampel.id)) {
                        duplicates.push(sampel.id);
                    }
                    sampelIds.add(sampel.id);
                });

                if (duplicates.length > 0) {
                    console.error(`DUPLICATES FOUND in category ${categoryId}:`, duplicates);
                }
            });
        }
    }, [groupedSampels]);

    useEffect(() => {
        fetchData();

        return () => {
            setGroupedSampels({});
            setExpandedCategories({});
        };
    }, []);

    const searchHandlder = () => {
        fetchData(1, keywords);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            searchHandlder();
        }
    };

    const resetSearch = () => {
        setKeywords("");
        fetchData(1, "");
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <LayoutAdmin>
            <PageHeader
                isLoading={isLoading}
                fetchData={fetchData}
                toggleAllCategories={toggleAllCategories}
                expandedCategories={expandedCategories}
                groupedSampels={groupedSampels}
            />

            <div className="page-body">
                <div className="container-xl">
                    <div className="row">
                        <div className="col-12 mb-4">
                            <SearchPanel
                                keywords={keywords}
                                setKeywords={setKeywords}
                                handleKeyDown={handleKeyDown}
                                resetSearch={resetSearch}
                                searchHandlder={searchHandlder}
                                isLoading={isLoading}
                            />
                        </div>

                        <div className="col-12">
                            <div className="card">
                                <div className="card-header">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h3 className="card-title">Daftar Sampel</h3>
                                            <div className="text-muted">
                                                <IconCategory size={16} className="me-1" />
                                                {Object.keys(groupedSampels).length} kategori • {sampels.length} sampel
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-body p-0">
                                    {isLoading ? (
                                        <LoadingState />
                                    ) : (
                                        <>
                                            {Object.keys(groupedSampels).length > 0 ? (
                                                <div className="category-groups">
                                                    {Object.entries(groupedSampels).map(([categoryId, categoryData]) => {
                                                        const categoryIdStr = categoryId.toString();
                                                        const categoryIdNum = parseInt(categoryIdStr);
                                                        const color = getCategoryColor(categoryIdStr);
                                                        const isPackage = isPackageCategory(categoryIdNum);
                                                        const packageTotal = isPackage ? calculatePackageTotal(categoryData.sampels) : 0;

                                                        return (
                                                            <CategoryGroup
                                                                key={`category-${categoryIdStr}`}
                                                                categoryId={categoryIdStr}
                                                                categoryData={categoryData}
                                                                color={color}
                                                                isPackage={isPackage}
                                                                packageTotal={packageTotal}
                                                                expandedCategories={expandedCategories}
                                                                toggleCategory={toggleCategory}
                                                                formatCurrency={formatCurrency}
                                                                fetchData={fetchData}
                                                                keywords={keywords}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <EmptyState
                                                    keywords={keywords}
                                                    resetSearch={resetSearch}
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </LayoutAdmin>
    )
}