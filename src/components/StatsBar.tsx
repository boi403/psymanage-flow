const stats = [
  { num: "20.000+", label: "Psicólogos e clínicas" },
  { num: "21,3 mi", label: "Sessões realizadas" },
  { num: "11", label: "Países atendidos" },
  { num: "2M+", label: "Pacientes atendidos" },
];

const StatsBar = () => (
  <div className="bg-primary-dark py-9 px-[5%]">
    <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-5">
      {stats.map((s) => (
        <div key={s.label} className="text-center">
          <div className="text-4xl font-extrabold text-primary-foreground">{s.num}</div>
          <div className="text-[13px] text-primary-foreground/70 mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  </div>
);

export default StatsBar;
