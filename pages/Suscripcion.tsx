import React from 'react';
import { useSiteData } from '../App';

const Suscripcion = () => {
  const { data } = useSiteData() as any;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black">Seguridad por Suscripción</h1>

      <p className="mt-3 text-lg opacity-80">
        Arriendo mensual de equipos con cámara, instalación y soporte.
      </p>

      <div className="mt-8 grid gap-4">
        <div className="rounded-2xl border p-5">
          <h2 className="text-xl font-bold">¿Qué incluye?</h2>
          <ul className="mt-3 list-disc pl-6 opacity-80 space-y-1">
            <li>Equipos en arriendo</li>
            <li>Instalación</li>
            <li>Soporte y mantención</li>
            <li>Monitoreo / revisión (según plan)</li>
          </ul>
        </div>

        <div className="rounded-2xl border p-5">
          <h2 className="text-xl font-bold">¿Cómo se contrata?</h2>
          <ol className="mt-3 list-decimal pl-6 opacity-80 space-y-1">
            <li>Nos cuentas tu necesidad</li>
            <li>Te proponemos un plan</li>
            <li>Instalamos y dejas funcionando</li>
            <li>Pagas mensual y tienes soporte</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Suscripcion;
