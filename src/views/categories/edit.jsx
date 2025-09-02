import React, { useState, useRef, useEffect } from 'react';
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Api from "../../services/api";
import { handleErrors } from "../../utils/handleErrors";
import {
    IconEdit,
} from "@tabler/icons-react";

export default function CategoryEdit({ fetchData, categoryId }) {
    const [name, setName] = useState("");
    const [errors, setErrors] = useState({});
    const modalRef = useRef(null);
    const [currentCategoryId, setCurrentCategoryId] = useState(null);

    const token = Cookies.get("token");

    const fetchCategory = async (id) => {
        if (id) {
            try {
                //set authorization header with token
                Api.defaults.headers.common['Authorization'] = token;
                const response = await Api.get(`/api/categories/${id}`);
                const category = response.data.data;
                setName(category.name);
                setCurrentCategoryId(id);
            } catch (error) {
                console.error("There was an error fetching the category data!", error);
            }
        }
    };

    // Event listener untuk modal show
    useEffect(() => {
        const modalElement = modalRef.current;

        const handleShowModal = () => {
            fetchCategory(categoryId);
        };

        if (modalElement) {
            modalElement.addEventListener('show.bs.modal', handleShowModal);
        }

        return () => {
            if (modalElement) {
                modalElement.removeEventListener('show.bs.modal', handleShowModal);
            }
        };
    }, [categoryId, token]);

    const updateCategory = async (e) => {
        e.preventDefault();

        // Reset errors
        setErrors({});

        // Validasi sederhana
        if (!name.trim()) {
            setErrors({ name: "Category name is required" });
            return;
        }

        if (!currentCategoryId) {
            toast.error("Category ID not found");
            return;
        }

        // Set authorization header with token
        Api.defaults.headers.common['Authorization'] = token;
        await Api.put(`/api/categories/${currentCategoryId}`, {
            name: name,
        }).then((response) => {
            toast.success(`${response.data.meta.message}`, {
                duration: 4000,
                position: "top-center",
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });

            // Hide the modal
            const modalElement = modalRef.current;
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();

            // Call function "fetchData"
            fetchData();

            // Reset form
            setName('');
            setCurrentCategoryId(null);

        })
            .catch((error) => {
                handleErrors(error.response.data, setErrors);
            })
    }

    return (
        <>
            <button
                className="btn btn-icon btn-sm btn-outline-primary"
                title="Edit Kategori"
                data-bs-toggle="modal"
                data-bs-target={`#modal-edit-category-${categoryId}`}
            >
                <IconEdit size={16} />
            </button>

            <div
                className="modal fade"
                id={`modal-edit-category-${categoryId}`}
                tabIndex="-1"
                role="dialog"
                aria-hidden="true"
                ref={modalRef}
                data-category-id={categoryId}
            >
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content" style={{ borderRadius: '16px', overflow: 'hidden', maxWidth: '500px', margin: '0 auto' }}>
                        <button type="button" className="btn-close position-absolute top-0 end-0 m-3" data-bs-dismiss="modal" aria-label="Close"></button>
                        <form onSubmit={updateCategory}>
                            <div className="modal-body p-5 text-center">
                                <div className="mb-4">
                                    <h3 className="fw-bold mb-1">Edit Category</h3>
                                </div>
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        className={`form-control form-control-lg ${errors.name ? 'is-invalid' : ''}`}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder='Enter category name'
                                        style={{ textAlign: 'center' }}
                                        autoFocus
                                    />
                                    {errors.name && (
                                        <div className="invalid-feedback d-block mt-2">
                                            {errors.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer justify-content-center py-4 border-top-0">
                                <button type="button" className="btn btn-outline-secondary rounded-pill px-4" data-bs-dismiss="modal">
                                    Cancel
                                </button>
                                <button type='submit' className="btn btn-primary rounded-pill px-4 ms-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-check" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                        <path d="M5 12l5 5l10 -10" />
                                    </svg>
                                    Save Category
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}