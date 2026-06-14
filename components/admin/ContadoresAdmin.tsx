type ContadoresAdminProps = {
  total: number;
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
  cuposMax: number;
};

export default function ContadoresAdmin({
  total,
  pendientes,
  aprobadas,
  rechazadas,
  cuposMax,
}: ContadoresAdminProps) {
  const cuposRestantes = Math.max(cuposMax - aprobadas, 0);
  const cuposExcedidos = aprobadas > cuposMax ? aprobadas - cuposMax : 0;

  const tarjetas = [
    { etiqueta: "Total", valor: total },
    { etiqueta: "Pendientes", valor: pendientes },
    { etiqueta: "Aprobadas", valor: aprobadas },
    { etiqueta: "Rechazadas", valor: rechazadas },
    { etiqueta: "Cupos restantes", valor: cuposRestantes, nota: cuposExcedidos > 0 ? `Excedido por ${cuposExcedidos}` : undefined },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {tarjetas.map((t) => (
        <div
          key={t.etiqueta}
          className="rounded-2xl border border-line bg-white/[0.03] p-4 transition-colors hover:border-white/15"
        >
          <p className="text-3xl font-semibold tracking-tight text-fg">{t.valor}</p>
          <p className="mt-1 text-sm text-muted">{t.etiqueta}</p>
          {t.nota && <p className="mt-1 text-xs font-medium text-red-300">{t.nota}</p>}
        </div>
      ))}
    </div>
  );
}
