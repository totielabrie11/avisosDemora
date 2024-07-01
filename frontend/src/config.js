const getBackendUrl = () => {
    const prodUrl = 'http://dosivac.homeip.net:43000';

    console.log('REACT_APP_BACKEND_URL_PROD:', process.env.REACT_APP_BACKEND_URL_PROD || prodUrl);

    return process.env.REACT_APP_BACKEND_URL_PROD || prodUrl;
};

export const BACKEND_URL = getBackendUrl();

