import { useState, useEffect, useRef } from "react";

const MARKETS = [
  "Home Win",
  "Home Win or Draw (1X)",
  "Away Win",
  "Away Win or Draw (X2)",
  "Over 1.5 Goals",
];

const SYSTEM_PROMPT = `You are an advanced football analytics and probabilistic decision engine.

Your job is to analyze, score, and filter football selections using real statistical reasoning.

You will receive a list of football fixtures with selected betting markets.
Markets: Home Win | Home Win or Draw (1X) | Away Win | Away Win or Draw (X2) | Over 1.5 Goals

For each fixture, perform:
STEP 1 — DATA ANALYSIS
Evaluate both teams using your knowledge of:
- Recent form (last 5–10 matches)
- Home vs away performance
- Goals scored/conceded
- Head-to-head history
- League strength and scoring trends

STEP 2 — MARKET EVALUATION
Assess probability of the selected market using proper interpretation:
- Home Win → strict win probability needed
- 1X → home strength + draw buffer
- Away Win → away dominance required
- X2 → away strength + draw buffer
- Over 1.5 → goal expectation model

STEP 3 — RISK SCORING
Assign Confidence Score (0–100). Apply penalties for: derbies, cup games, unstable teams, rotation risk, end-of-season unpredictability, low-data leagues.

STEP 4 — FILTERING
Remove all selections below 85 confidence. Select ONLY TOP 3 safest picks. If fewer than 3 qualify, return only valid ones. Do NOT force weak selections.

Respond ONLY in this exact JSON format (no markdown, no extra text):
{
  "analysis": [
    {
      "fixture": "Team A vs Team B",
      "market": "Market Name",
      "confidence": 92,
      "qualified": true,
      "reasoning": "Sharp explanation of why this pick is safe with key stats",
      "risk_factor": "Main risk if any",
      "league_context": "League name or context",
      "form_summary": "Brief form of both teams",
      "goals_context": "Goals/defensive context"
    }
  ],
  "top_picks": [
    {
      "fixture": "Team A vs Team B",
      "market": "Market Name",
      "confidence": 92,
      "reasoning": "Why safe",
      "risk_factor": "Main risk",
      "rank": 1
    }
  ],
  "combined_assessment": {
    "risk_level": "Low",
    "stability_rating": "High",
    "odds_range": "1.20–1.60",
    "summary": "Overall assessment of the slip"
  }
}`;

function FixtureRow({ fixture, index, onUpdate, onRemove }) {
  return (
    <div className="fixture-row" style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr auto",
      gap: "10px",
      alignItems: "center",
      padding: "12px 16px",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,200,50,0.12)",
      borderRadius: "8px",
      marginBottom: "8px",
      transition: "border-color 0.2s",
    }}>
      <input
        value={fixture.teams}
        onChange={e => onUpdate(index, "teams", e.target.value)}
        placeholder="e.g. Arsenal vs Chelsea"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "6px",
          padding: "10px 14px",
          color: "#fff",
          fontSize: "14px",
          fontFamily: "inherit",
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
        }}
      />
      <select
        value={fixture.market}
        onChange={e => onUpdate(index, "market", e.target.value)}
        style={{
          background: "#1a1a2e",
          border: "1px solid rgba(255,200,50,0.25)",
          borderRadius: "6px",
          padding: "10px 14px",
          color: "#ffc832",
          fontSize: "13px",
          fontFamily: "inherit",
          outline: "none",
          cursor: "pointer",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <button
        onClick={() => onRemove(index)}
        style={{
          background: "rgba(255,60,60,0.1)",
          border: "1px solid rgba(255,60,60,0.3)",
          color: "#ff6060",
          borderRadius: "6px",
          width: "36px",
          height: "36px",
          cursor: "pointer",
          fontSize: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >×</button>
    </div>
  );
}

function ConfidenceBar({ score }) {
  const color = score >= 90 ? "#00e676" : score >= 85 ? "#ffc832" : "#ff6060";
  return (
    <div style={{ marginTop: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Confidence</span>
        <span style={{ fontSize: "14px", fontWeight: "700", color }}>{score}</span>
      </div>
      <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${score}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          borderRadius: "2px",
          transition: "width 1s ease",
          boxShadow: `0 0 8px ${color}66`,
        }} />
      </div>
    </div>
  );
}

function RankBadge({ rank }) {
  const colors = ["#ffc832", "#c0c0c0", "#cd7f32"];
  const labels = ["1ST", "2ND", "3RD"];
  return (
    <div style={{
      width: "48px",
      height: "48px",
      borderRadius: "50%",
      background: `radial-gradient(circle, ${colors[rank-1]}22, transparent)`,
      border: `2px solid ${colors[rank-1]}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      flexShrink: 0,
    }}>
      <span style={{ fontSize: "9px", fontWeight: "700", color: colors[rank-1], letterSpacing: "0.05em" }}>{labels[rank-1]}</span>
    </div>
  );
}

function TopPickCard({ pick, index }) {
  const delay = index * 0.15;
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(255,200,50,0.05) 0%, rgba(255,255,255,0.02) 100%)",
      border: "1px solid rgba(255,200,50,0.2)",
      borderRadius: "12px",
      padding: "20px",
      animation: `slideIn 0.5s ease ${delay}s both`,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: `linear-gradient(90deg, transparent, #ffc832, transparent)`,
        opacity: 0.5,
      }} />
      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
        <RankBadge rank={pick.rank} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "16px", fontWeight: "700", color: "#fff", marginBottom: "4px", fontFamily: "'Bebas Neue', cursive" }}>{pick.fixture}</div>
          <div style={{
            display: "inline-block",
            background: "rgba(255,200,50,0.15)",
            border: "1px solid rgba(255,200,50,0.3)",
            borderRadius: "4px",
            padding: "2px 10px",
            fontSize: "11px",
            color: "#ffc832",
            fontWeight: "700",
            letterSpacing: "0.06em",
            marginBottom: "10px",
            textTransform: "uppercase",
          }}>{pick.market}</div>
          <ConfidenceBar score={pick.confidence} />
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", margin: "10px 0 0", lineHeight: "1.5" }}>{pick.reasoning}</p>
          {pick.risk_factor && pick.risk_factor !== "None" && (
            <p style={{ fontSize: "12px", color: "rgba(255,120,50,0.8)", margin: "6px 0 0", display: "flex", alignItems: "center", gap: "5px" }}>
              <span>⚠</span> {pick.risk_factor}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function AllAnalysisCard({ item }) {
  const qualified = item.confidence >= 85;
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: `1px solid ${qualified ? "rgba(0,230,118,0.15)" : "rgba(255,96,96,0.12)"}`,
      borderRadius: "10px",
      padding: "16px",
      marginBottom: "8px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: "700", color: "#fff", fontFamily: "'Bebas Neue', cursive" }}>{item.fixture}</div>
          <div style={{ fontSize: "11px", color: "rgba(255,200,50,0.7)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.market}</div>
        </div>
        <div style={{
          background: qualified ? "rgba(0,230,118,0.1)" : "rgba(255,96,96,0.1)",
          border: `1px solid ${qualified ? "rgba(0,230,118,0.3)" : "rgba(255,96,96,0.3)"}`,
          borderRadius: "6px",
          padding: "4px 10px",
          fontSize: "13px",
          fontWeight: "700",
          color: qualified ? "#00e676" : "#ff6060",
        }}>
          {item.confidence} {qualified ? "✓" : "✗"}
        </div>
      </div>
      {item.form_summary && <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", margin: "0 0 4px" }}>{item.form_summary}</p>}
      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: "1.45" }}>{item.reasoning}</p>
      {!qualified && (
        <div style={{ marginTop: "6px", fontSize: "11px", color: "rgba(255,96,96,0.7)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          ✗ Below 85 threshold — excluded
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [fixtures, setFixtures] = useState([
    { teams: "", market: "Home Win" },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("picks");
  const streamRef = useRef(null);

  const addFixture = () => {
    if (fixtures.length < 8) {
      setFixtures([...fixtures, { teams: "", market: "Home Win" }]);
    }
  };

  const updateFixture = (index, field, value) => {
    const updated = [...fixtures];
    updated[index][field] = value;
    setFixtures(updated);
  };

  const removeFixture = (index) => {
    if (fixtures.length > 1) setFixtures(fixtures.filter((_, i) => i !== index));
  };

  const analyze = async () => {
    const valid = fixtures.filter(f => f.teams.trim().length > 3);
    if (valid.length === 0) {
      setError("Please enter at least one fixture.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const fixtureList = valid.map((f, i) => `${i + 1}. ${f.teams} — Market: ${f.market}`).join("\n");
    const userMessage = `Analyze these football fixtures and provide your top safe picks:\n\n${fixtureList}\n\nRespond ONLY with valid JSON as specified.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage }],
        }),
      });

      const data = await response.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setActiveTab("picks");
    } catch (err) {
      setError("Analysis failed. Please check your fixtures and try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const riskColor = (level) => ({ Low: "#00e676", Medium: "#ffc832", High: "#ff6060" }[level] || "#fff");
  const stabilityColor = (s) => ({ High: "#00e676", Medium: "#ffc832", Low: "#ff6060" }[s] || "#fff");

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a14",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: "#fff",
      padding: "0",
      position: "relative",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        input::placeholder { color: rgba(255,255,255,0.25); }
        input:focus { border-color: rgba(255,200,50,0.4) !important; box-shadow: 0 0 0 2px rgba(255,200,50,0.1); }
        select option { background: #1a1a2e; color: #ffc832; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        ::-webkit-scrollbar-thumb { background: rgba(255,200,50,0.3); border-radius: 2px; }
      `}</style>

      {/* Background pattern */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle at 20% 20%, rgba(255,200,50,0.04) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(0,100,255,0.04) 0%, transparent 50%)`,
      }} />

      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "32px 20px 60px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.2em", color: "rgba(255,200,50,0.7)", textTransform: "uppercase", marginBottom: "12px" }}>
            ⚡ Powered by Statistical Intelligence
          </div>
          <h1 style={{
            fontFamily: "'Bebas Neue', cursive",
            fontSize: "clamp(42px, 8vw, 72px)",
            letterSpacing: "0.04em",
            margin: "0 0 8px",
            lineHeight: 1,
            background: "linear-gradient(135deg, #fff 30%, #ffc832 70%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>Football Analytics<br/>Decision Engine</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: 0 }}>
            Submit your selections · Get AI-scored, risk-filtered top picks
          </p>
        </div>

        {/* Input Section */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,200,50,0.15)",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "22px", margin: 0, color: "#ffc832", letterSpacing: "0.05em" }}>
              YOUR SELECTIONS
            </h2>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>{fixtures.length} / 8 fixtures</span>
          </div>

          <div style={{ marginBottom: "8px", display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "10px", padding: "0 16px" }}>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Fixture</span>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Market</span>
            <span style={{ width: "36px" }} />
          </div>

          {fixtures.map((f, i) => (
            <FixtureRow key={i} fixture={f} index={i} onUpdate={updateFixture} onRemove={removeFixture} />
          ))}

          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button
              onClick={addFixture}
              disabled={fixtures.length >= 8}
              style={{
                background: "transparent",
                border: "1px dashed rgba(255,200,50,0.3)",
                color: "rgba(255,200,50,0.7)",
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "13px",
                cursor: fixtures.length >= 8 ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: fixtures.length >= 8 ? 0.4 : 1,
                transition: "all 0.2s",
                flex: 1,
              }}
            >+ Add Fixture</button>
            <button
              onClick={analyze}
              disabled={loading}
              style={{
                background: loading ? "rgba(255,200,50,0.3)" : "linear-gradient(135deg, #ffc832, #ff9500)",
                border: "none",
                color: loading ? "rgba(255,255,255,0.5)" : "#0a0a14",
                borderRadius: "8px",
                padding: "10px 32px",
                fontSize: "14px",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                letterSpacing: "0.05em",
                flex: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: loading ? "none" : "0 0 20px rgba(255,200,50,0.3)",
                transition: "all 0.2s",
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Analyzing...
                </>
              ) : "⚡ Analyze Picks"}
            </button>
          </div>

          {error && (
            <div style={{ marginTop: "12px", padding: "10px 14px", background: "rgba(255,60,60,0.1)", border: "1px solid rgba(255,60,60,0.25)", borderRadius: "8px", fontSize: "13px", color: "#ff8080" }}>
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div style={{ animation: "slideIn 0.4s ease both" }}>

            {/* Combined Assessment */}
            <div style={{
              background: "linear-gradient(135deg, rgba(255,200,50,0.08), rgba(255,150,0,0.05))",
              border: "1px solid rgba(255,200,50,0.2)",
              borderRadius: "16px",
              padding: "20px 24px",
              marginBottom: "20px",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
            }}>
              {[
                { label: "Risk Level", value: result.combined_assessment?.risk_level, color: riskColor(result.combined_assessment?.risk_level) },
                { label: "Stability", value: result.combined_assessment?.stability_rating, color: stabilityColor(result.combined_assessment?.stability_rating) },
                { label: "Odds Range", value: result.combined_assessment?.odds_range, color: "#fff" },
              ].map(item => (
                <div key={item.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{item.label}</div>
                  <div style={{ fontSize: "20px", fontWeight: "700", color: item.color, fontFamily: "'Bebas Neue', cursive", letterSpacing: "0.05em" }}>{item.value}</div>
                </div>
              ))}
              {result.combined_assessment?.summary && (
                <div style={{ gridColumn: "1/-1", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: "1.5", textAlign: "center" }}>
                  {result.combined_assessment.summary}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "16px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "4px" }}>
              {[["picks", `🏆 Top Picks (${result.top_picks?.length || 0})`], ["all", `📊 Full Analysis (${result.analysis?.length || 0})`]].map(([tab, label]) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  flex: 1,
                  background: activeTab === tab ? "rgba(255,200,50,0.15)" : "transparent",
                  border: activeTab === tab ? "1px solid rgba(255,200,50,0.3)" : "1px solid transparent",
                  color: activeTab === tab ? "#ffc832" : "rgba(255,255,255,0.4)",
                  borderRadius: "8px",
                  padding: "10px",
                  fontSize: "13px",
                  fontWeight: activeTab === tab ? "700" : "400",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}>{label}</button>
              ))}
            </div>

            {/* Top Picks Tab */}
            {activeTab === "picks" && (
              <div>
                {result.top_picks && result.top_picks.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {result.top_picks.map((pick, i) => <TopPickCard key={i} pick={pick} index={i} />)}
                  </div>
                ) : (
                  <div style={{
                    textAlign: "center",
                    padding: "48px 24px",
                    background: "rgba(255,96,96,0.05)",
                    border: "1px solid rgba(255,96,96,0.15)",
                    borderRadius: "12px",
                  }}>
                    <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
                    <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "22px", color: "#ff8080", letterSpacing: "0.05em" }}>No Qualified Picks</div>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", marginTop: "8px" }}>None of your selections reached the 85 confidence threshold. Try different fixtures or markets.</p>
                  </div>
                )}

                {result.top_picks && result.top_picks.length > 0 && (
                  <div style={{
                    marginTop: "16px",
                    padding: "14px 18px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "10px",
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.3)",
                    lineHeight: "1.6",
                  }}>
                    ⚠ These selections are statistical suggestions only and do not guarantee outcomes. Football involves inherent unpredictability. Gamble responsibly.
                  </div>
                )}
              </div>
            )}

            {/* Full Analysis Tab */}
            {activeTab === "all" && (
              <div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginBottom: "12px" }}>
                  Showing all {result.analysis?.length || 0} fixtures · Green = qualified (≥85) · Red = excluded
                </div>
                {result.analysis?.map((item, i) => <AllAnalysisCard key={i} item={item} />)}
              </div>
            )}
          </div>
        )}

        {/* Empty state guide */}
        {!result && !loading && (
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.07)",
            borderRadius: "16px",
            padding: "32px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>⚽</div>
            <h3 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "20px", margin: "0 0 8px", color: "rgba(255,255,255,0.6)", letterSpacing: "0.05em" }}>How It Works</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginTop: "20px" }}>
              {[
                ["01", "Enter Fixtures", "Type team names and select your target market"],
                ["02", "AI Analysis", "Statistical scoring across form, H2H, goals & more"],
                ["03", "Top 3 Picks", "Only selections ≥85 confidence make the cut"],
              ].map(([num, title, desc]) => (
                <div key={num} style={{ padding: "16px", background: "rgba(255,200,50,0.03)", borderRadius: "10px" }}>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "28px", color: "rgba(255,200,50,0.3)", marginBottom: "4px" }}>{num}</div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "rgba(255,255,255,0.7)", marginBottom: "4px" }}>{title}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", lineHeight: "1.5" }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
