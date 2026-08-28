import React from 'react';
import { Navigate } from 'react-router-dom';

export const CreateQuestion: React.FC = () => {
  return <Navigate to="/admin/questions?mode=manual" replace />;
};
