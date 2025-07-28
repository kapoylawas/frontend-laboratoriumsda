//import layout auth
import LayoutAuth from '../../layouts/auth'

//import hook react
import React, { useState } from 'react';

//import hook useNavigate from react router dom
import { useNavigate } from "react-router-dom";

//import store
import { useStore } from '../../stores/user';

//import handler error
import { handleErrors } from "../../utils/handleErrors";

export default function Register() {

    return (
        <LayoutAuth>
            <div className="container-sm">
                <div className="text-center mb-5">
                    <div className="text-center mb-5">
                        <div className="d-flex justify-content-center">
                            <div className="p-4 bg-blue-lt rounded-circle shadow-sm" style={{ backgroundColor: 'rgba(70, 146, 245, 0.1)' }}>
                                <img src="/images/laboratory.png" height="70" alt="Lab Logo" />
                            </div>
                        </div>
                        <h1 className="h2 mt-4 mb-2 text-primary">Laboratorium Kesehatan Daerah <br /> Kabupaten Sidoarjo</h1>
                        <h2 className="h3 text-gradient text-info mb-1">Pendaftaran Akun Baru</h2>
                        <p className="text-muted">Daftarkan diri Anda untuk mengakses layanan kami</p>
                    </div>
                </div>

                <div className="card card-md rounded-4 shadow-sm border-0">
                    <div className="card-body p-5">

                    </div>
                </div>
            </div>
        </LayoutAuth>
    )
}