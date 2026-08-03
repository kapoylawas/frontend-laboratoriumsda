//import axios
import axios from 'axios';

//import js cookie
import Cookies from 'js-cookie';

const Api = axios.create({
    //set default endpoint API
    baseURL: import.meta.env.VITE_APP_BASEURL
})

//handle unauthenticated
Api.interceptors.response.use(function(response) {
    return response;
}, ((error) => {
    //check if response unauthenticated
    if (error.response && error.response.status === 401) {
        //remove token
        Cookies.remove('token');

        //only redirect if not already on public pages
        if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
            window.location = '/login';
        }
    }
    return Promise.reject(error);
}));

export default Api