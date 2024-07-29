import React from 'react';
import './LeyendaAdministracion.css';

const LeyendaAdministracion = () => {
  return (
    <div className="leyenda">
      <h4>Leyenda Administración</h4>
      <ul>
        <li className="reclamo">
          <span className="circle"></span> Reclamo con remito existente
        </li>
        <li className="retenido">
          <span className="circle"></span> Remito retenido
        </li>
        <li className="conflicto">
          <span className="circle"></span> Remito en conflicto por crédito
        </li>
      </ul>
    </div>
  );
};

export default LeyendaAdministracion;
