"use client";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { useRadioState } from "./use-radio-state.client";
export function PublicScreen({ voteUrl }: { voteUrl: string }) {
  const { data, connection } = useRadioState();
  const [audio, setAudio] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);
  const remaining = data?.round
    ? Math.max(0, Math.ceil((new Date(data.round.closesAt).getTime() - now) / 1_000))
    : 0;
  useEffect(() => {
    if (!audio || !data?.currentAnnouncement || data.currentAnnouncement.audioUrl) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(data.currentAnnouncement.text));
  }, [audio, data?.currentAnnouncement]);
  return (
    <main className="screen-shell">
      <header className="screen-header">
        <span className={`connection connection-${connection}`}>{connection}</span>
        <strong>RADIO CAMPUS</strong>
        <span>{data?.status ?? "esperando"}</span>
      </header>
      <section className="now-playing">
        <div>
          <p className="eyebrow">Al aire</p>
          <h1>
            {data?.currentAnnouncement?.title ?? data?.currentSong?.title ?? "Preparando la señal"}
          </h1>
          <p className="artist">
            {data?.currentAnnouncement
              ? "Anuncio institucional"
              : (data?.currentSong?.artist ?? "Conecta la base y ejecuta la semilla")}
          </p>
          {data?.currentAnnouncement && <p>{data.currentAnnouncement.text}</p>}
        </div>
        <div className="player-frame">
          {audio && data?.currentAnnouncement?.audioUrl ? (
            // biome-ignore lint/a11y/useMediaCaption: el texto íntegro se muestra junto al reproductor.
            <audio controls autoPlay src={data.currentAnnouncement.audioUrl} />
          ) : audio && data?.currentSong ? (
            <iframe
              title={`Reproductor de ${data.currentSong.title}`}
              src={`https://www.youtube.com/embed/${data.currentSong.youtubeId}?autoplay=1&enablejsapi=1`}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <button className="audio-button" type="button" onClick={() => setAudio(true)}>
              Activar audio
            </button>
          )}
        </div>
      </section>
      <section className="vote-board">
        <div className="round-title">
          <div>
            <p className="eyebrow">Siguiente canción</p>
            <h2>La comunidad decide</h2>
          </div>
          <span className="timer" role="timer" aria-label={`${remaining} segundos restantes`}>
            {remaining}s
          </span>
        </div>
        <div className="option-grid">
          {data?.round?.options.map((option) => (
            <article
              className={data.round?.winnerSongId === option.id ? "option winner" : "option"}
              key={option.id}
            >
              <span>0{option.position}</span>
              <h3>{option.title}</h3>
              <p>{option.artist}</p>
              <strong>{option.votes} votos</strong>
            </article>
          )) ?? <p className="empty">Todavía no hay una ronda activa.</p>}
        </div>
        <p className="reason">{data?.round?.reason ?? "La selección contextual aparecerá aquí."}</p>
      </section>
      <aside className="qr-panel">
        <QRCodeSVG
          value={voteUrl}
          size={180}
          bgColor="#f4f2e9"
          fgColor="#081b24"
          title="Código QR para votar"
        />
        <h2>Escanea y vota</h2>
        <p>Sin instalar nada</p>
        <a href={voteUrl}>{voteUrl}</a>
      </aside>
    </main>
  );
}
