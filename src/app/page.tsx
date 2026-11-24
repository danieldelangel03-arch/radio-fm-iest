import Link from "next/link";

const superficies = [
  { href: "/pantalla", titulo: "Pantalla pública", detalle: "Visualización horizontal y audio" },
  { href: "/votar", titulo: "Votación", detalle: "Experiencia móvil sin instalación" },
  { href: "/admin", titulo: "Administración", detalle: "Operación protegida de la radio" },
];

export default function Inicio() {
  return (
    <main className="inicio">
      <p className="eyebrow">IEST · Comunidad en frecuencia</p>
      <h1>Radio Campus</h1>
      <p className="introduccion">
        Música elegida por la comunidad, contexto universitario y avisos que sí llegan a tiempo.
      </p>
      <nav aria-label="Superficies de Radio Campus" className="enlaces">
        {superficies.map((superficie) => (
          <Link href={superficie.href} key={superficie.href}>
            <strong>{superficie.titulo}</strong>
            <span>{superficie.detalle}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
