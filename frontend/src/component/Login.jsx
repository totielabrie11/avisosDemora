// src/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/v1/login', {
        username,
        password,
      });
      onLogin(response.data.accessToken);
    } catch (error) {
      setError('Credenciales inválidas');
    }
  };

  return (
    <div className="container">
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit} className="form-inline mb-3">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nombre de usuario"
          className="form-control ml-2 mr-2"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="form-control ml-2 mr-2"
        />
        <button type="submit" className="btn btn-primary ml-2">
          Ingresar
        </button>
      </form>
      {error && <div className="alert alert-danger">{error}</div>}
    </div>
  );
};

export default Login