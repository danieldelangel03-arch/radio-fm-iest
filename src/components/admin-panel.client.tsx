"use client";
import { useCallback, useEffect, useState } from "react";

type Overview = {
  metrics: { songs: number; rounds: number; votes: number };
  state: null | { status: string; version: number };
  catalog: Array<{ id: string; title: string; artist: string; energy: number; active: boolean }>;
  rules: Array<{ id: string; name: string; priority: number; enabled: boolean }>;
  events: Array<{ id: string; name: string; kind: string }>;
  announcements: Array<{ id: string; title: string; text: string; approved: boolean }>;
  settings: Array<{ key: string; value: unknown }>;
};
export function AdminPanel() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [overview, setOverview] = useState<Overview>();
  const [message, setMessage] = useState("");
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeText, setNoticeText] = useState("");
  const [editingNoticeId, setEditingNoticeId] = useState<string>();
  const [editingNoticeTitle, setEditingNoticeTitle] = useState("");
  const [editingNoticeText, setEditingNoticeText] = useState("");
  const load = useCallback(async () => {
    const status = await fetch("/api/admin/status", { cache: "no-store" });
    setAuthenticated(status.ok);
    if (status.ok) {
      const response = await fetch("/api/admin/overview", { cache: "no-store" });
      if (response.ok) setOverview((await response.json()) as Overview);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const login = async () => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const body = (await response.json()) as { error?: string };
    setMessage(response.ok ? "Sesión iniciada" : (body.error ?? "No se pudo iniciar sesión"));
    if (response.ok) void load();
  };
  const control = async (action: string) => {
    const response = await fetch("/api/admin/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setMessage(response.ok ? "Cambio aplicado" : "No se pudo aplicar");
    if (response.ok) void load();
  };
  const saveDuration = async (value: string) => {
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "roundDurationSeconds", value: Number(value) }),
    });
    setMessage(response.ok ? "Duración guardada" : "No se pudo guardar");
    if (response.ok) void load();
  };
  const createNotice = async () => {
    const response = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: noticeTitle,
        text: noticeText,
        approved: true,
        minIntervalMinutes: 60,
      }),
    });
    const body = (await response.json()) as { error?: string; id?: string };
    if (!response.ok) {
      setMessage(body.error ?? "No se pudo crear el anuncio");
      return;
    }
    const audioResponse = body.id
      ? await fetch(`/api/admin/announcements/${body.id}/audio`, { method: "POST" })
      : undefined;
    setMessage(
      audioResponse?.ok
        ? "Anuncio aprobado y locución lista"
        : "Anuncio aprobado; la pantalla usará la voz del navegador",
    );
    setNoticeTitle("");
    setNoticeText("");
    void load();
  };
  const previewVoice = () => {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(noticeText));
  };
  const startEditingNotice = (notice: Overview["announcements"][number]) => {
    setEditingNoticeId(notice.id);
    setEditingNoticeTitle(notice.title);
    setEditingNoticeText(notice.text);
  };
  const saveNotice = async () => {
    if (!editingNoticeId) return;
    const response = await fetch(`/api/admin/announcements/${editingNoticeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editingNoticeTitle, text: editingNoticeText }),
    });
    setMessage(response.ok ? "Noticia actualizada" : "No se pudo actualizar la noticia");
    if (response.ok) {
      setEditingNoticeId(undefined);
      void load();
    }
  };
  const deleteNotice = async (id: string) => {
    const response = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    setMessage(response.ok ? "Noticia eliminada" : "No se pudo eliminar la noticia");
    if (response.ok) void load();
  };
  if (authenticated === null)
    return (
      <main className="admin-shell">
        <p>Comprobando sesión…</p>
      </main>
    );
  if (!authenticated)
    return (
      <main className="login-shell">
        <p className="eyebrow">Operación protegida</p>
        <h1>Administración</h1>
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button className="primary-button" type="button" onClick={login}>
          Entrar
        </button>
        {message && <p role="alert">{message}</p>}
      </main>
    );
  return (
    <main className="admin-shell">
      <header>
        <div>
          <p className="eyebrow">Centro de control</p>
          <h1>Radio Campus</h1>
        </div>
        <span className="status-pill">{overview?.state?.status ?? "sin estado"}</span>
      </header>
      {message && (
        <p className="form-message" role="status">
          {message}
        </p>
      )}
      <section className="metric-row">
        <article>
          <strong>{overview?.metrics.songs ?? 0}</strong>
          <span>Canciones</span>
        </article>
        <article>
          <strong>{overview?.metrics.rounds ?? 0}</strong>
          <span>Rondas</span>
        </article>
        <article>
          <strong>{overview?.metrics.votes ?? 0}</strong>
          <span>Votos</span>
        </article>
      </section>
      <section className="admin-section">
        <h2>En vivo</h2>
        <div className="button-row">
          <button type="button" onClick={() => control("pause")}>
            Pausar
          </button>
          <button type="button" onClick={() => control("resume")}>
            Reanudar
          </button>
          <button type="button" onClick={() => control("skip")}>
            Saltar
          </button>
          <button type="button" onClick={() => control("close-round")}>
            Cerrar ronda
          </button>
        </div>
      </section>
      <section className="admin-grid">
        <article className="admin-section">
          <h2>Configuración</h2>
          <label htmlFor="duration">Duración de ronda</label>
          <select
            id="duration"
            defaultValue={String(
              overview?.settings.find((item) => item.key === "roundDurationSeconds")?.value ?? 45,
            )}
            onChange={(event) => saveDuration(event.target.value)}
          >
            <option value="30">30 s</option>
            <option value="45">45 s</option>
            <option value="60">60 s</option>
            <option value="90">90 s</option>
          </select>
        </article>
        <article className="admin-section">
          <h2>Reglas</h2>
          <ul>
            {overview?.rules.map((rule) => (
              <li key={rule.id}>
                {rule.name} · prioridad {rule.priority}
              </li>
            ))}
          </ul>
        </article>
      </section>
      <section className="admin-grid">
        <article className="admin-section">
          <h2>Catálogo</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Canción</th>
                  <th>Artista</th>
                  <th>Energía</th>
                </tr>
              </thead>
              <tbody>
                {overview?.catalog.map((song) => (
                  <tr key={song.id}>
                    <td>{song.title}</td>
                    <td>{song.artist}</td>
                    <td>{song.energy}/5</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        <article className="admin-section">
          <h2>Eventos y anuncios</h2>
          <ul>
            {overview?.events.map((event) => (
              <li key={event.id}>
                {event.name} · {event.kind}
              </li>
            ))}
            {overview?.announcements.map((notice) => (
              <li key={notice.id}>
                <div className="button-row">
                  <button type="button" onClick={() => startEditingNotice(notice)}>
                    Editar
                  </button>
                  <button type="button" onClick={() => deleteNotice(notice.id)}>
                    Eliminar
                  </button>
                </div>
                {notice.title} · {notice.approved ? "aprobado" : "pendiente"}
              </li>
            ))}
          </ul>
        </article>
      </section>
      {editingNoticeId && (
        <section className="admin-section notice-editor">
          <h2>Editar noticia</h2>
          <label htmlFor="edit-notice-title">TÃ­tulo</label>
          <input
            id="edit-notice-title"
            value={editingNoticeTitle}
            onChange={(event) => setEditingNoticeTitle(event.target.value)}
          />
          <label htmlFor="edit-notice-text">Texto autorizado</label>
          <textarea
            id="edit-notice-text"
            rows={4}
            value={editingNoticeText}
            onChange={(event) => setEditingNoticeText(event.target.value)}
          />
          <div className="button-row">
            <button type="button" onClick={() => setEditingNoticeId(undefined)}>
              Cancelar
            </button>
            <button
              className="primary-button"
              type="button"
              disabled={!editingNoticeTitle || !editingNoticeText}
              onClick={saveNotice}
            >
              Guardar cambios
            </button>
          </div>
        </section>
      )}
      <section className="admin-section notice-editor">
        <h2>Nuevo anuncio</h2>
        <label htmlFor="notice-title">Título</label>
        <input
          id="notice-title"
          value={noticeTitle}
          onChange={(event) => setNoticeTitle(event.target.value)}
        />
        <label htmlFor="notice-text">Texto autorizado</label>
        <textarea
          id="notice-text"
          rows={4}
          value={noticeText}
          onChange={(event) => setNoticeText(event.target.value)}
        />
        <div className="button-row">
          <button type="button" disabled={!noticeText} onClick={previewVoice}>
            Vista previa del navegador
          </button>
          <button type="button" disabled={!noticeTitle || !noticeText} onClick={createNotice}>
            Aprobar y guardar
          </button>
        </div>
      </section>
    </main>
  );
}
