import React, { useState } from 'react';
import axios from 'axios';
import { Button } from 'react-bootstrap';

const CerrarReclamoButton = ({ reclamo, token, onReclamoCerrado, username }) => {
  const [loading, setLoading] = useState(false);

  const handleCerrarReclamo = async () => {
    const remito = prompt("Indique número de remito de 8 dígitos que cierra el reclamo:");
    if (!remito) {
      alert("No se ingresó ningún número de remito.");
      return;
    }

    if (!/^\d{8}$/.test(remito)) {
      alert("El número de remito debe ser un número de 8 dígitos.");
      return;
    }

    const confirmed = window.confirm('¿Está seguro de que desea cerrar el reclamo?');
    if (confirmed) {
      setLoading(true);
      try {
        const response = await axios.put(`http://localhost:3000/api/v1/reclamos/${reclamo.id}`, {
          estado: 'cerrado',
          subId: reclamo.subId,
          usernameAlmacen: username,
          remito: remito,
          respuesta: `El usuario ${username} ha dado por cerrado el reclamo.`, // Mensaje de cierre
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          const updatedReclamo = {
            ...reclamo,
            estado: 'cerrado',
            remito: remito,
          };
          onReclamoCerrado(updatedReclamo);
          alert('Reclamo cerrado exitosamente');
        }
      } catch (error) {
        console.error('Error cerrando el reclamo:', error);
        alert('No se pudo cerrar el reclamo. Por favor, intente de nuevo.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Button className="w-100 mt-2" variant="danger" onClick={handleCerrarReclamo} disabled={loading}>
      {loading ? 'Cerrando...' : 'Cerrar Reclamo'}
    </Button>
  );
};

export default CerrarReclamoButton;
