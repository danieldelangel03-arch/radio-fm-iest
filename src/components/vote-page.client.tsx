"use client";
import { useState } from "react";
import { useRadioState } from "./use-radio-state.client";
export function VotePage() {
  const { data, connection } = useRadioState();
  const [selected, setSelected] = useState<string>();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const round = data?.round;
  const submit = async () => {
    if (!round || !selected) return;
    setSending(true);
    setMessage("");
    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId: round.id, songId: selected }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "No se pudo registrar el voto");
      setMessage("¡Voto registrado! La pantalla mostrará el resultado al cerrar la ronda.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo registrar el voto");
    } finally {
      setSending(false);
    }
  };
  return (
    <main className="mobile-shell">
      <header>
        <p className="eyebrow">Radio Campus</p>
        <span className={`connection connection-${connection}`}>{connection}</span>
      </header>
      <h1>Elige lo que sigue</h1>
      <p className="mobile-lead">Tu voto cuenta una vez por ronda. No necesitas instalar nada.</p>
      {round?.status === "open" ? (
        <>
          <fieldset disabled={sending || message.startsWith("¡Voto")}>
            <legend className="sr-only">Canciones disponibles</legend>
            {round.options.map((option) => (
              <label
                className={selected === option.id ? "vote-card selected" : "vote-card"}
                key={option.id}
              >
                <input
                  type="radio"
                  name="song"
                  value={option.id}
                  checked={selected === option.id}
                  onChange={() => setSelected(option.id)}
                />
                <span>
                  <small>Opción {option.position}</small>
                  <strong>{option.title}</strong>
                  <em>{option.artist}</em>
                </span>
              </label>
            ))}
          </fieldset>
          <button
            className="primary-button vote-submit"
            type="button"
            disabled={!selected || sending || message.startsWith("¡Voto")}
            onClick={submit}
          >
            {sending ? "Registrando…" : "Confirmar voto"}
          </button>
        </>
      ) : (
        <div className="notice">
          <strong>Esperando la próxima ronda</strong>
          <p>Esta página se actualizará automáticamente.</p>
        </div>
      )}
      {message && (
        <p className="form-message" role="status">
          {message}
        </p>
      )}
      <a className="back-link" href="/pantalla">
        Ver pantalla pública
      </a>
    </main>
  );
}
