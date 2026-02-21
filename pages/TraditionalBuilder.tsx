import React from 'react';
import { Link } from 'react-router-dom';

export default function TraditionalBuilder() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <Link to="/create-project" className="text-sm font-bold text-gray-600 hover:text-black">
          ← Volver
        </Link>

        <h1 className="mt-6 text-4xl font-black text-gray-900">Crea tu Proyecto (Tradicional)</h1>
        <p className="mt-3 text-gray-600">
          Wizard tradicional en construcción. (Ya está la ruta lista, ahora seguimos con el paso a paso.)
        </p>
      </div>
    </div>
  );
}
