import React from 'react';
import './LeyendaAlmacen.css';

const LeyendaAlmacen = () => {
  return (
    <div className="leyenda">
      <h4>Leyenda Almacén</h4>
      <ul>
        <li className="total-reclamos">
          <span className="circle"></span> Total Reclamos
        </li>
        <li className="urgente">
          <span className="circle"></span> Urgente
        </li>
        <li className="regular">
          <span className="circle"></span> Regular
        </li>
        <li className="no-vencido">
          <span className="circle"></span> No Vencido
        </li>
        <li className="sin-responder">
          <span className="circle"></span> Sin Responder
        </li>
        <li className="con-remito">
          <span className="circle"></span> Respondidos
        </li>
        <li className="fecha-vencida">
          <span className="circle"></span> Fecha Vencida
        </li>
      </ul>
    </div>
  );
};

export default LeyendaAlmacen;
