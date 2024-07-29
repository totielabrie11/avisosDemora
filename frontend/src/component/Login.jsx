import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Login.css';

// Detectar si estamos en localhost o accediendo desde internet
const isLocalhost = window.location.hostname === 'localhost';

// Configurar la URL del backend en consecuencia
const BACKEND_URL = isLocalhost 
  ? 'http://localhost:43000'
  : 'http://dosivac.homeip.net:43000';

console.log("🚀 ~ BACKEND_URL:", BACKEND_URL);

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Resetear el error antes de la solicitud

    if (!username || !password) {
      setError('Todos los campos son obligatorios');
      return;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/api/v1/login`, {
        username,
        password,
      });
      onLogin(response.data.accessToken);
    } catch (error) {
      setError('Credenciales inválidas');
    }
  };

  return (
    <div className="login-background">
      <h1 className="main-title">
        SIC
        <span className="subtitle">Sistema de Información Centralizada</span>
      </h1>
      <div className="login-content">
        <h2>Iniciar sesión</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nombre de usuario"
            className="form-control"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="form-control"
          />
          <button type="submit" className="btn btn-primary">
            Ingresar
          </button>
        </form>
        {error && <div className="alert alert-danger">{error}</div>}
      </div>
    </div>
  );
};

export default Login;

