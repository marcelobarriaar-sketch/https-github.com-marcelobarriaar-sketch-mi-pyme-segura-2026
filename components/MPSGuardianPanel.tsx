import React from 'react';
import './MPSGuardianPanel.css';

const ROBOT_URL =
  'https://raw.githubusercontent.com/marcelobarriaar-sketch/https-github.com-marcelobarriaar-sketch-mi-pyme-segura-2026/refs/heads/main/public/images/MASCOTA%20MPS.png';

type Message = {
  id: string | number;
  role: 'assistant' | 'user';
  title?: string;
  content: string;
};

type ProjectSummary = {
  siteType?: string;
  distance?: string;
  cableDifficulty?: string;
  connectivity?: string;
  progress?: number;
};

type Props = {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onFinalize?: () => void;
  onDownloadPdf?: () => void;
  onRequestInstall?: () => void;
  onAdjustParams?: () => void;
  summary?: ProjectSummary;
  isThinking?: boolean;
  showFinalRobot?: boolean;
};

export default function MPSGuardianPanel({
  messages,
  input,
  setInput,
  onSend,
  onFinalize,
  onDownloadPdf,
  onRequestInstall,
  onAdjustParams,
  summary,
  isThinking = false,
  showFinalRobot = false,
}: Props) {
  const progress = summary?.progress ?? 15;

  return (
    <section className="mps-shell">
      <div className="mps-layout">
        <div className="mps-chat-card">
          <div className="mps-header">
            <div className="mps-header-left">
              <img src={ROBOT_URL} alt="MPS Guardian" className="mps-header-avatar" />
              <div>
                <h2>MPS Guardian</h2>
                <p>Asesor técnico virtual</p>
                <span className="mps-status">
                  <span className="mps-status-dot" />
                  En línea
                </span>
              </div>
            </div>

            <div className="mps-header-right">
              {showFinalRobot && <img src={ROBOT_URL} alt="MPS Guardian" className="mps-hero-robot" />}
            </div>
          </div>

          <div className="mps-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mps-message-row ${msg.role === 'user' ? 'user' : 'assistant'}`}
              >
                {msg.role === 'assistant' && (
                  <img src={ROBOT_URL} alt="MPS Guardian" className="mps-message-avatar" />
                )}

                <div className={`mps-bubble ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                  {msg.role === 'assistant' && (
                    <div className="mps-bubble-title">
                      <strong>MPS Guardian</strong>
                      {msg.title ? <span>{msg.title}</span> : <span>Diagnóstico técnico</span>}
                    </div>
                  )}
                  <div className="mps-bubble-content">{msg.content}</div>
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="mps-message-row assistant">
                <img src={ROBOT_URL} alt="MPS Guardian" className="mps-message-avatar" />
                <div className="mps-bubble assistant">
                  <div className="mps-bubble-title">
                    <strong>MPS Guardian</strong>
                    <span>Analizando proyecto</span>
                  </div>
                  <div className="mps-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mps-input-wrap">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu consulta para MPS Guardian..."
              className="mps-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSend();
              }}
            />
            <button className="mps-send-btn" onClick={onSend}>
              Enviar
            </button>
          </div>

          {showFinalRobot && (
            <div className="mps-final-box">
              <div className="mps-final-box-header">
                <img src={ROBOT_URL} alt="MPS Guardian" className="mps-final-mini-avatar" />
                <div>
                  <h3>Propuesta preliminar de seguridad</h3>
                  <p>MPS Guardian · Resultado técnico inicial</p>
                </div>
              </div>

              <div className="mps-warning-box">
                <p>
                  <strong>Importante:</strong> Los valores mostrados corresponden a una
                  <strong> estimación técnica inicial</strong> basada en la información entregada.
                </p>
                <p>El valor final puede variar según:</p>
                <ul>
                  <li>condiciones reales del lugar</li>
                  <li>dificultad de instalación</li>
                  <li>distancia efectiva del cableado</li>
                  <li>infraestructura existente</li>
                </ul>
              </div>

              <div className="mps-actions">
                <button className="mps-secondary-btn" onClick={onDownloadPdf}>
                  Descargar proyecto PDF
                </button>
                <button className="mps-secondary-btn" onClick={onRequestInstall}>
                  Solicitar instalación
                </button>
                <button className="mps-secondary-btn" onClick={onAdjustParams}>
                  Ajustar parámetros
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="mps-sidebar">
          <div className="mps-sidebar-card">
            <h3>Estado del Proyecto</h3>

            <div className="mps-summary-item">
              <span className="mps-summary-label">Tipo de lugar</span>
              <strong>{summary?.siteType || 'Pendiente'}</strong>
            </div>

            <div className="mps-summary-item">
              <span className="mps-summary-label">Distancia grabador - cámaras</span>
              <strong>{summary?.distance || 'Pendiente'}</strong>
            </div>

            <div className="mps-summary-item">
              <span className="mps-summary-label">Dificultad de cableado</span>
              <strong>{summary?.cableDifficulty || 'Pendiente'}</strong>
            </div>

            <div className="mps-summary-item">
              <span className="mps-summary-label">Conectividad</span>
              <strong>{summary?.connectivity || 'Pendiente'}</strong>
            </div>

            <div className="mps-progress-block">
              <div className="mps-progress-label">
                <span>Avance del diagnóstico</span>
                <strong>{progress}%</strong>
              </div>
              <div className="mps-progress-bar">
                <div className="mps-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <button className="mps-finalize-btn" onClick={onFinalize}>
              Finalizar
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
