import React from 'react';
import './Leyenda.css';

const Leyenda = () => {
  return (
    <div className="leyenda">
      <h4>Leyenda</h4>
      <ul>
        <li className="verde">
          <span className="circle"></span> Vence pronto (5 días)
        </li>
        <li className="amarillo">
          <span className="circle"></span> Vencido (15 días)
        </li>
        <li className="naranja">
          <span className="circle"></span> Vencido (30 días)
        </li>
        <li className="rojo">
          <span className="circle"></span> Vencido (45 días)
        </li>
      </ul>
    </div>
  );
};

export default Leyenda;

