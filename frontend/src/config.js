const getBackendUrl = () => {
    const localUrl = 'http://localhost:43000';
    const prodUrl = 'http://dosivac.homeip.net:43000';

    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('REACT_APP_BACKEND_URL_LOCAL:', process.env.REACT_APP_BACKEND_URL_LOCAL || localUrl);
    console.log('REACT_APP_BACKEND_URL_PROD:', process.env.REACT_APP_BACKEND_URL_PROD || prodUrl);

    if (process.env.NODE_ENV === 'development') {
        return process.env.REACT_APP_BACKEND_URL_LOCAL || localUrl;
    } else {
        return process.env.REACT_APP_BACKEND_URL_PROD || prodUrl;
    }
};

export const BACKEND_URL = getBackendUrl();
