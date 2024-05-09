// UserState.jsx
import React from 'react';

const UserState = ({ username, role, onLogout }) => {
  return (
    <div className="d-flex justify-content-between align-items-center mt-3 mb-3">
      <div>
        <span className="mr-3"><strong>Usuario:</strong> {username} ({role})</span>
        <button className="btn btn-danger" onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
};

export default UserState;