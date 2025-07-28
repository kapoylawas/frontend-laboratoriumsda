//import axios
import axios from 'axios';

//import js cookie
import Cookies from 'js-cookie';

const Api = axios.create({
    //set default endpoint API
    baseURL: import.meta.env.VITE_APP_BASEURL
})

//handle unathenticated
Api.interceptors.response.use(function(response) {

    //return response
    return response;
}, ((error) => {

    //check if response unauthenticated
    if (401 === error.response.status) {

        //remove token
        Cookies.remove('token');

        //redirect "/admin/login"
        window.location = '/';
    } else {

        //reject promise error
        return Promise.reject(error);
    }
}));

export default Api