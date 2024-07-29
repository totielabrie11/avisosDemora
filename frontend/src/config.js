// config.js
const getBackendUrl = () => {
    const isLocalhost = window.location.hostname === 'localhost';
    const prodUrl = 'http://dosivac.homeip.net:43000';
  
    console.log('REACT_APP_BACKEND_URL_PROD:', process.env.REACT_APP_BACKEND_URL_PROD || prodUrl);
    console.log('isLocalhost:', isLocalhost);
  
    return isLocalhost ? 'http://localhost:43000' : (process.env.REACT_APP_BACKEND_URL_PROD || prodUrl);
  };
  
  export const BACKEND_URL = getBackendUrl();
  