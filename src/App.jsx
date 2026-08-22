import React, { useState, useEffect, useCallback } from "react";
import {
  Compass,
  BookOpen,
  MapPin,
  MessagesSquare,
  ChevronDown,
  Send,
  Loader2,
  Info,
} from "lucide-react";
import { supabase } from "./supabaseClient.js";

// ---------------------------------------------------------------------------
// Content — grounded in publicly available Austrian family-law information
// and Vorarlberg-specific services. This is informational / peer-support
// content, not legal advice.
// ---------------------------------------------------------------------------

const WISSEN = [
  {
    id: "obsorge",
    label: "Obsorge",
    title: "Obsorge nach einer Trennung",
    body: [
      "Seit der Reform 2013 ist die gemeinsame Obsorge beider Elternteile nach einer Trennung oder Scheidung in Österreich der gesetzliche Regelfall — unabhängig davon, ob die Eltern verheiratet waren.",
      "Sind sich die Eltern uneinig, kann das Gericht zunächst für bis zu sechs Monate eine vorläufige Regelung samt Hauptbetreuung treffen, um zu beobachten, wie sie funktioniert, bevor eine endgültige Entscheidung fällt.",
      "Eine alleinige Obsorge wird nur angeordnet, wenn dies dem Wohl des Kindes eindeutig besser dient als die gemeinsame Wahrnehmung.",
    ],
  },
  {
    id: "kontaktrecht",
    label: "Kontaktrecht",
    title: "Kontaktrecht & Kontaktregelung",
    body: [
      "Das Recht auf persönlichen Kontakt zum Kind (§ 187 ABGB) steht beiden Elternteilen unabhängig von der Obsorge zu — auch wenn ein Elternteil nicht obsorgeberechtigt ist.",
      "Eine Kontaktregelung kann einvernehmlich zwischen den Eltern vereinbart oder, bei Uneinigkeit, vom Bezirksgericht (Pflegschaftsgericht) festgelegt werden.",
      "Vor und während eines Verfahrens unterstützen die kostenlose Familiengerichtshilfe sowie Mediation oder Erziehungsberatung dabei, tragfähige Regelungen zu finden.",
    ],
  },
  {
    id: "besuchscafe",
    label: "Besuchscafé",
    title: "Begleiteter Besuchskontakt (Besuchscafé)",
    body: [
      "Wenn ein unbegleiteter Kontakt (noch) nicht möglich ist — etwa bei hochkonflikthaften Trennungen oder nach längerer Kontaktunterbrechung — kann das Gericht oder ein Elternteil einen begleiteten Besuchskontakt in einem Besuchscafé anregen.",
      "Eine ausgebildete Besuchsbegleitung ist während der gesamten Kontaktzeit anwesend; Ziel ist immer, mittelfristig zu unbegleiteten Kontakten zurückzufinden.",
      "Die Kosten trägt grundsätzlich der besuchsberechtigte Elternteil, bei geringem Einkommen und gerichtlicher Anordnung gibt es aber eine Förderung durch den Bund.",
    ],
  },
  {
    id: "verfahren",
    label: "Verfahren",
    title: "Der Weg ans Gericht",
    body: [
      "Zuständig ist das Bezirksgericht am Wohnort des Kindes (Pflegschaftsverfahren). Ein Antrag auf Obsorge- oder Kontaktrechtsregelung ist formlos möglich, auch ohne Anwalt.",
      "Bei geringem Einkommen kann Verfahrenshilfe beantragt werden, die die Kosten für einen Rechtsanwalt ganz oder teilweise übernimmt.",
      "Die Familiengerichtshilfe erstellt auf Ersuchen des Gerichts Empfehlungen zum Kindeswohl und ist oft die erste fachliche Anlaufstelle im Verfahren.",
    ],
  },
];

const ANLAUFSTELLEN = [
  {
    name: "Familiengerichtshilfe",
    region: "an jedem Bezirksgericht",
    desc: "Kostenlose, niederschwellige fachliche Unterstützung bei Obsorge- und Kontaktrechtsfragen — oft schon vor der ersten Verhandlung erreichbar.",
    contact: "Direkt beim zuständigen Bezirksgericht erfragen",
  },
  {
    name: "Rechtsanwaltskammer Vorarlberg",
    region: "Vorarlberg",
    desc: "Kostenlose telefonische Erstauskunft und Vermittlung an Fachanwält:innen für Familienrecht.",
    contact: "rechtsanwaelte.at — Anwaltssuche",
  },
  {
    name: "ifs — Institut für Sozialdienste",
    region: "alle Regionen Vorarlbergs",
    desc: "Kostenlose, vertrauliche Erstberatung in familiären und sozialen Krisensituationen, politisch unabhängig.",
    contact: "ifs.at",
  },
  {
    name: "Besuchscafé Bregenz & Feldkirch",
    region: "betrieben vom Vorarlberger Kinderdorf",
    desc: "Begleiteter Besuchskontakt in kindgerechter Umgebung, samstags 9–17 Uhr. Terminvereinbarung nötig, Voraussetzung ist ein anhängiges Pflegschaftsverfahren.",
    contact: "besuchsbegleitung@voki.at",
  },
];

const CATEGORIES = ["Erfahrung", "Frage", "Tipp"];

// ---------------------------------------------------------------------------

function Signpost({ onNavigate }) {
  const arms = [
    { id: "wissen", label: "Wissen", meta: `${WISSEN.length} Themen`, side: "right" },
    { id: "anlaufstellen", label: "Anlaufstellen", meta: `${ANLAUFSTELLEN.length} Stellen`, side: "left" },
    { id: "austausch", label: "Austausch", meta: "Erfahrungen teilen", side: "right" },
  ];
  return (
    <div className="signpost">
      <div className="signpost-pole" />
      {arms.map((arm, i) => (
        <button
          key={arm.id}
          className={`signpost-plank plank-${arm.side}`}
          style={{ top: `${18 + i * 84}px` }}
          onClick={() => onNavigate(arm.id)}
        >
          <span className="plank-label">{arm.label}</span>
          <span className="plank-meta">{arm.meta}</span>
        </button>
      ))}
      <div className="signpost-base" />
    </div>
  );
}

function Accordion({ item, open, onToggle }) {
  return (
    <div className={`accordion ${open ? "open" : ""}`}>
      <button className="accordion-head" onClick={onToggle}>
        <span className="accordion-eyebrow">{item.label}</span>
        <span className="accordion-title">{item.title}</span>
        <ChevronDown className="accordion-chevron" size={18} />
      </button>
      {open && (
        <div className="accordion-body">
          {item.body.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function WissenView() {
  const [openId, setOpenId] = useState(WISSEN[0].id);
  return (
    <div className="view">
      <h1 className="view-title">Wissen</h1>
      <p className="view-intro">
        Grundlagen zu Obsorge und Kontaktrecht in Österreich — kurz erklärt.
        Ersetzt keine Rechtsberatung im Einzelfall.
      </p>
      <div className="accordion-list">
        {WISSEN.map((item) => (
          <Accordion
            key={item.id}
            item={item}
            open={openId === item.id}
            onToggle={() => setOpenId(openId === item.id ? null : item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function AnlaufstellenView() {
  return (
    <div className="view">
      <h1 className="view-title">Anlaufstellen</h1>
      <p className="view-intro">
        Stellen in Vorarlberg, an die du dich wenden kannst — für Beratung,
        begleiteten Kontakt oder rechtliche Ersteinschätzung.
      </p>
      <div className="card-list">
        {ANLAUFSTELLEN.map((a) => (
          <div className="place-card" key={a.name}>
            <div className="place-region">{a.region}</div>
            <div className="place-name">{a.name}</div>
            <p className="place-desc">{a.desc}</p>
            <div className="place-contact">
              <MapPin size={14} />
              <span>{a.contact}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AustauschView() {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState(null);
  const [nickname, setNickname] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (fetchError) {
      setPosts([]);
      return;
    }
    setPosts(
      (data || []).map((row) => ({
        id: row.id,
        nickname: row.nickname,
        category: row.category,
        text: row.text,
        ts: row.created_at,
      }))
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError(null);
    const { error: insertError } = await supabase.from("posts").insert([
      {
        nickname: nickname.trim() || "Anonym",
        category,
        text: text.trim(),
      },
    ]);
    if (insertError) {
      setError("Beitrag konnte nicht gespeichert werden. Bitte nochmal versuchen.");
      setSending(false);
      return;
    }
    setText("");
    await load();
    setSending(false);
  }

  return (
    <div className="view">
      <h1 className="view-title">Austausch</h1>
      <p className="view-intro">
        Teile eine Erfahrung, stell eine Frage oder gib einen Tipp weiter.
        Beiträge sind für alle Nutzer:innen dieser Seite sichtbar — schreib
        nichts, das dich oder dein Kind identifizierbar macht.
      </p>

      <form className="post-form" onSubmit={submit}>
        <div className="form-row">
          <input
            className="input"
            placeholder="Name (optional, sonst Anonym)"
            value={nickname}
            maxLength={30}
            onChange={(e) => setNickname(e.target.value)}
          />
          <select
            className="input select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <textarea
          className="textarea"
          placeholder="Was möchtest du teilen?"
          value={text}
          maxLength={1200}
          onChange={(e) => setText(e.target.value)}
          rows={4}
        />
        {error && <div className="form-error">{error}</div>}
        <button className="submit-btn" type="submit" disabled={sending || !text.trim()}>
          {sending ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
          Beitrag teilen
        </button>
      </form>

      <div className="post-list">
        {posts === null && (
          <div className="post-empty">
            <Loader2 className="spin" size={18} /> Beiträge werden geladen …
          </div>
        )}
        {posts && posts.length === 0 && (
          <div className="post-empty">
            Noch keine Beiträge. Sei der Erste, der etwas teilt.
          </div>
        )}
        {posts &&
          posts.map((p) => (
            <div className="post-card" key={p.id}>
              <div className="post-meta">
                <span className="post-tag">{p.category}</span>
                <span className="post-nick">{p.nickname}</span>
                <span className="post-date">
                  {new Date(p.ts).toLocaleDateString("de-AT", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  })}
                </span>
              </div>
              <p className="post-text">{p.text}</p>
            </div>
          ))}
      </div>
    </div>
  );
}

function HomeView({ onNavigate }) {
  return (
    <div className="view home-view">
      <div className="home-eyebrow">
        <Compass size={16} />
        <span>Vätersteig</span>
      </div>
      <h1 className="home-title">Ein Weg durch Obsorge, Kontakt und Verfahren.</h1>
      <p className="home-sub">
        Informationen, Anlaufstellen und ein Ort zum Austauschen für Väter in
        Vorarlberg, die um den Kontakt zu ihrem Kind ringen.
      </p>
      <Signpost onNavigate={onNavigate} />
      <div className="disclaimer">
        <Info size={16} />
        <span>
          Diese Seite bietet Information und Erfahrungsaustausch, aber keine
          Rechtsberatung. Für deinen konkreten Fall wende dich an eine
          Rechtsanwältin/einen Rechtsanwalt oder die Familiengerichtshilfe.
        </span>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home");

  const NAV = [
    { id: "home", icon: Compass, label: "Start" },
    { id: "wissen", icon: BookOpen, label: "Wissen" },
    { id: "anlaufstellen", icon: MapPin, label: "Stellen" },
    { id: "austausch", icon: MessagesSquare, label: "Austausch" },
  ];

  return (
    <div className="app-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

        :root {
          --paper: #EDEEE6;
          --paper-2: #E3E4D9;
          --ink: #232A26;
          --ink-soft: #566056;
          --pine: #33513F;
          --pine-deep: #223829;
          --wood: #8A6A4B;
          --wood-dark: #6E5138;
          --ochre: #C48A3E;
          --rust: #A6553A;
          --line: #C9CBBC;
        }
        * { box-sizing: border-box; }
        .app-shell {
          font-family: 'IBM Plex Sans', sans-serif;
          background: var(--paper);
          color: var(--ink);
          min-height: 100vh;
          max-width: 480px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .view {
          padding: 28px 20px 100px;
          flex: 1;
        }
        .view-title {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 28px;
          margin: 0 0 8px;
          color: var(--pine-deep);
        }
        .view-intro {
          font-size: 14.5px;
          line-height: 1.55;
          color: var(--ink-soft);
          margin: 0 0 22px;
        }

        /* Home */
        .home-view { padding-top: 40px; }
        .home-eyebrow {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--wood-dark);
          margin-bottom: 14px;
        }
        .home-title {
          font-family: 'Fraunces', serif;
          font-weight: 700;
          font-optical-sizing: auto;
          font-size: 32px;
          line-height: 1.15;
          margin: 0 0 12px;
          color: var(--pine-deep);
        }
        .home-sub {
          font-size: 15px;
          line-height: 1.6;
          color: var(--ink-soft);
          margin: 0 0 36px;
          max-width: 40ch;
        }

        /* Signpost signature element */
        .signpost {
          position: relative;
          height: 300px;
          margin: 0 auto 32px;
          width: 100%;
          max-width: 340px;
        }
        .signpost-pole {
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 10px;
          width: 10px;
          transform: translateX(-50%);
          background: linear-gradient(90deg, var(--wood-dark), var(--wood) 40%, var(--wood-dark));
          border-radius: 3px;
        }
        .signpost-base {
          position: absolute;
          left: 50%;
          bottom: 0;
          width: 70px;
          height: 12px;
          transform: translateX(-50%);
          background: var(--wood-dark);
          border-radius: 3px;
          opacity: 0.6;
        }
        .signpost-plank {
          position: absolute;
          left: 50%;
          height: 52px;
          min-width: 168px;
          background: var(--pine);
          color: #F3F1E8;
          border: none;
          padding: 8px 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 3px 0 rgba(0,0,0,0.15);
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .signpost-plank:active { transform: translateY(1px); }
        .plank-right {
          transform: translateX(6px) rotate(-2.5deg);
          clip-path: polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%);
          text-align: left;
        }
        .plank-left {
          transform: translateX(calc(-100% - 6px)) rotate(2.5deg);
          clip-path: polygon(8% 0, 100% 0, 100% 100%, 8% 100%, 0 50%);
          text-align: right;
        }
        .signpost-plank:hover { background: var(--pine-deep); }
        .plank-label {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 17px;
        }
        .plank-meta {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          opacity: 0.75;
          margin-top: 2px;
        }

        .disclaimer {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          background: var(--paper-2);
          border-left: 3px solid var(--ochre);
          padding: 14px 16px;
          border-radius: 4px;
          font-size: 12.5px;
          line-height: 1.5;
          color: var(--ink-soft);
        }
        .disclaimer svg { flex-shrink: 0; margin-top: 2px; color: var(--ochre); }

        /* Accordion (Wissen) */
        .accordion-list { display: flex; flex-direction: column; gap: 10px; }
        .accordion {
          border: 1px solid var(--line);
          border-radius: 6px;
          background: #F5F5EE;
          overflow: hidden;
        }
        .accordion.open { border-color: var(--pine); }
        .accordion-head {
          width: 100%;
          background: none;
          border: none;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          text-align: left;
        }
        .accordion-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          background: var(--pine);
          color: #F3F1E8;
          padding: 3px 7px;
          border-radius: 3px;
          flex-shrink: 0;
        }
        .accordion-title {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 15.5px;
          flex: 1;
          color: var(--ink);
        }
        .accordion-chevron {
          transition: transform 0.15s ease;
          color: var(--ink-soft);
          flex-shrink: 0;
        }
        .accordion.open .accordion-chevron { transform: rotate(180deg); }
        .accordion-body {
          padding: 0 16px 16px;
        }
        .accordion-body p {
          font-size: 14px;
          line-height: 1.6;
          color: var(--ink-soft);
          margin: 0 0 10px;
        }
        .accordion-body p:last-child { margin-bottom: 0; }

        /* Anlaufstellen */
        .card-list { display: flex; flex-direction: column; gap: 12px; }
        .place-card {
          background: #F5F5EE;
          border: 1px solid var(--line);
          border-radius: 6px;
          padding: 16px;
        }
        .place-region {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--wood-dark);
          margin-bottom: 4px;
        }
        .place-name {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 17px;
          color: var(--pine-deep);
          margin-bottom: 6px;
        }
        .place-desc {
          font-size: 13.5px;
          line-height: 1.55;
          color: var(--ink-soft);
          margin: 0 0 10px;
        }
        .place-contact {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          color: var(--pine);
          font-weight: 500;
        }

        /* Austausch */
        .post-form {
          background: #F5F5EE;
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .form-row { display: flex; gap: 8px; margin-bottom: 8px; }
        .input, .textarea {
          font-family: 'IBM Plex Sans', sans-serif;
          border: 1px solid var(--line);
          border-radius: 5px;
          padding: 9px 11px;
          font-size: 13.5px;
          background: #fff;
          color: var(--ink);
        }
        .input { flex: 1; min-width: 0; }
        .select { flex: 0 0 130px; }
        .textarea { width: 100%; resize: vertical; margin-bottom: 10px; }
        .form-error {
          color: var(--rust);
          font-size: 12.5px;
          margin-bottom: 8px;
        }
        .submit-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--pine);
          color: #F3F1E8;
          border: none;
          border-radius: 5px;
          padding: 10px 16px;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
        }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .spin { animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .post-list { display: flex; flex-direction: column; gap: 10px; }
        .post-empty {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          color: var(--ink-soft);
          padding: 20px 0;
        }
        .post-card {
          background: #F5F5EE;
          border: 1px solid var(--line);
          border-radius: 6px;
          padding: 13px 15px;
        }
        .post-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          flex-wrap: wrap;
        }
        .post-tag {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: var(--ochre);
          color: #fff;
          padding: 2px 7px;
          border-radius: 3px;
        }
        .post-nick {
          font-weight: 600;
          font-size: 12.5px;
          color: var(--pine-deep);
        }
        .post-date {
          font-size: 11px;
          color: var(--ink-soft);
          margin-left: auto;
          font-family: 'IBM Plex Mono', monospace;
        }
        .post-text {
          font-size: 13.5px;
          line-height: 1.55;
          margin: 0;
          color: var(--ink);
          white-space: pre-wrap;
        }

        /* Bottom nav */
        .bottom-nav {
          position: sticky;
          bottom: 0;
          display: flex;
          background: var(--pine-deep);
          border-top: 1px solid var(--pine);
        }
        .nav-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 11px 0 9px;
          background: none;
          border: none;
          color: #A9B8AC;
          cursor: pointer;
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 10.5px;
        }
        .nav-btn.active { color: #F3F1E8; }
      `}</style>

      {view === "home" && <HomeView onNavigate={setView} />}
      {view === "wissen" && <WissenView />}
      {view === "anlaufstellen" && <AnlaufstellenView />}
      {view === "austausch" && <AustauschView />}

      <nav className="bottom-nav">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={`nav-btn ${view === n.id ? "active" : ""}`}
            onClick={() => setView(n.id)}
          >
            <n.icon size={19} />
            {n.label}
          </button>
        ))}
      </nav>
    </div>
);
}
