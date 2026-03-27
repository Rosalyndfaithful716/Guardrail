"use client";

import { motion, useInView, animate } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Globe = dynamic(() => import("@/components/Globe"), { ssr: false });

// ─── Animations ─────────────────────────────────────────────────────

function F({ children, className = "", d = 0 }: { children: React.ReactNode; className?: string; d?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: d * 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Counter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, target, { duration: 1.5, onUpdate: (n) => setV(Math.round(n)) });
    return () => c.stop();
  }, [inView, target]);
  return <span ref={ref}>{prefix}{v}{suffix}</span>;
}

// ─── Data ───────────────────────────────────────────────────────────

const RULES_PREVIEW = [
  ["security/sql-injection", "CRIT"], ["security/xss-vulnerability", "CRIT"], ["security/hardcoded-api-key", "CRIT"],
  ["security/path-traversal", "CRIT"], ["security/jwt-misuse", "CRIT"], ["security/prototype-pollution", "HIGH"],
  ["security/open-redirect", "HIGH"], ["security/insecure-cookie", "HIGH"], ["security/insecure-cors", "HIGH"],
  ["ai-codegen/hallucinated-import", "HIGH"], ["ai-codegen/unused-imports", "WARN"], ["ai-codegen/no-async-without-await", "WARN"],
  ["ai-codegen/placeholder-code", "WARN"], ["ai-codegen/fetch-without-error-handling", "WARN"],
  ["performance/n-plus-one-query", "HIGH"], ["quality/dead-code", "WARN"],
] as const;

const COMPARE_FEATURES: Array<[string, boolean, boolean | string, boolean, boolean]> = [
  ["SQL injection", true, false, true, false],
  ["XSS detection", true, "Plugin", true, false],
  ["JWT misuse", true, false, false, false],
  ["AI hallucinated imports", true, false, false, false],
  ["Inline code frames", true, false, false, false],
  ["Pre-commit hook", true, "Plugin", false, false],
  ["Baseline adoption", true, false, false, false],
  ["Git diff scanning", true, false, false, false],
  ["AST auto-fix", true, false, false, false],
  ["AI fix guide", true, false, false, false],
  ["Zero config", true, false, false, true],
  ["< 1s scan", true, false, false, false],
];

const sevColor: Record<string, string> = {
  CRIT: "text-red-400", HIGH: "text-orange-400", WARN: "text-amber-500/70",
};

// ─── Page ───────────────────────────────────────────────────────────

export default function Page() {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText("npx @guardrail-ai/cli scan ."); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <main className="bg-[#060606] text-white min-h-screen">

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#060606]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] font-bold tracking-[0.15em] uppercase text-[#d4a012]">Guardrail</span>
          <div className="hidden md:flex items-center gap-7">
            {["Features", "Rules", "Compare"].map((s) => (
              <a key={s} href={`#${s.toLowerCase()}`} className="text-[12px] text-white/35 hover:text-white/70 transition-colors">{s}</a>
            ))}
            <a href="https://github.com/Manavarya09/Guardrail" target="_blank" rel="noopener noreferrer"
              className="text-[12px] text-white/50 border border-white/10 px-3.5 py-1.5 rounded hover:border-white/20 hover:text-white/80 transition-all">
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* ═══ Hero ═══ */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute top-20 right-0 w-[700px] h-[700px] bg-[#d4a012]/[0.025] rounded-full blur-[150px] pointer-events-none" />
        <div className="max-w-[1200px] mx-auto px-6 grid lg:grid-cols-[1fr_420px] gap-8 items-center">
          <div>
            <F>
              <p className="text-[12px] font-mono text-[#d4a012]/70 mb-6">v0.2.2 &mdash; open source, MIT licensed</p>
            </F>
            <F d={1}>
              <h1 className="text-[clamp(2.8rem,6.5vw,5rem)] font-black leading-[0.95] tracking-[-0.035em]">
                AI writes code.<br/>
                <span className="text-[#d4a012]">We make it safe.</span>
              </h1>
            </F>
            <F d={2}>
              <p className="mt-6 text-[15px] text-white/40 max-w-md leading-[1.7]">
                30 detection rules catch security vulnerabilities, AI anti-patterns,
                and performance issues that ESLint and Snyk miss. Then auto-fix them.
              </p>
            </F>
            <F d={3}>
              <div className="mt-8 flex items-center gap-3">
                <button onClick={copy}
                  className="group font-mono text-[13px] bg-[#d4a012] text-black px-5 py-3 rounded font-semibold hover:bg-[#e0ad1a] transition-colors">
                  {copied ? "Copied!" : "$ npx @guardrail-ai/cli scan ."}
                </button>
                <a href="https://github.com/Manavarya09/Guardrail" target="_blank" rel="noopener noreferrer"
                  className="text-[13px] text-white/40 border border-white/10 px-5 py-3 rounded hover:text-white/70 hover:border-white/20 transition-all">
                  GitHub
                </a>
              </div>
            </F>
            <F d={4}>
              <div className="mt-10 flex gap-10">
                {[["30", "rules"], ["7", "commands"], ["<1s", "scan time"], ["141", "tests"]].map(([n, l]) => (
                  <div key={l}>
                    <div className="text-[22px] font-black font-mono text-[#d4a012]">{n}</div>
                    <div className="text-[11px] text-white/25 mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
            </F>
          </div>
          <F d={2} className="hidden lg:flex h-[500px] items-center justify-center">
            <Globe />
          </F>
        </div>
      </section>

      {/* ═══ What it catches ═══ */}
      <section id="features" className="py-24 border-t border-white/5">
        <div className="max-w-[1200px] mx-auto px-6">
          <F>
            <p className="text-[11px] font-mono text-[#d4a012]/60 mb-4 tracking-wider">WHAT IT CATCHES</p>
          </F>
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-2">
            <F d={1}>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                Patterns that traditional<br/>linters completely miss.
              </h2>
            </F>
            <F d={2}>
              <p className="text-[14px] text-white/35 leading-[1.8] md:pt-2">
                AI models generate code that looks correct but ships with hardcoded secrets,
                SQL injection, hallucinated npm packages, and missing error handling.
                Guardrail&apos;s AST analysis catches all of it — in under a second.
              </p>
            </F>
          </div>
          {/* Feature cards — left-aligned, not centered */}
          <div className="mt-16 grid md:grid-cols-3 gap-px bg-white/[0.04] rounded-lg overflow-hidden">
            {[
              { n: "15", t: "Security rules", d: "SQL injection, XSS, JWT misuse, path traversal, prototype pollution, hardcoded secrets, insecure cookies, open redirects..." },
              { n: "11", t: "AI-codegen rules", d: "Hallucinated imports, placeholder code, async without await, unused imports, missing error handling, console spam..." },
              { n: "4", t: "Quality + Perf", d: "N+1 queries, inefficient loops, dead code, duplicate logic. Performance killers that AI loves to generate." },
            ].map((f, i) => (
              <F key={f.t} d={i + 1}>
                <div className="bg-[#060606] p-8">
                  <span className="text-[40px] font-black font-mono text-[#d4a012]/80 leading-none">{f.n}</span>
                  <h3 className="mt-3 text-[15px] font-bold">{f.t}</h3>
                  <p className="mt-2 text-[13px] text-white/30 leading-[1.7]">{f.d}</p>
                </div>
              </F>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Terminal ═══ */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-[1000px] mx-auto px-6">
          <F>
            <p className="text-[11px] font-mono text-[#d4a012]/60 mb-4 tracking-wider">CLI OUTPUT</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-10">Not just warnings. Context.</h2>
          </F>
          <F d={1}>
            <div className="rounded-lg border border-white/[0.07] bg-[#0c0c0c] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/[0.015]">
                <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-white/10"/><div className="w-2.5 h-2.5 rounded-full bg-white/10"/><div className="w-2.5 h-2.5 rounded-full bg-white/10"/></div>
                <span className="ml-2 text-[10px] font-mono text-white/20">zsh</span>
              </div>
              <pre className="p-5 text-[11.5px] md:text-[12.5px] leading-[1.9] font-mono text-white/50 overflow-x-auto whitespace-pre">
{`  `}<span className="text-red-400/90">{'◉'}</span>{` `}<span className="text-white/80 font-semibold">src/api/auth.ts</span><span className="text-white/20">{`  (4 issues)`}</span>{`

    `}<span className="text-red-400">{'✖'}</span>{` `}<span className="text-red-400/90 text-[10px] font-semibold">CRIT</span>{` `}<span className="text-white/70">Potential SQL injection</span>{`
      `}<span className="text-white/15">17 │</span>{` `}<span className="text-white/25">function getUser(db, userId) {'{'}</span>{`
    `}<span className="text-red-400">{'>'}</span>{` `}<span className="text-white/15">18 │</span>{` `}<span className="text-white/70">  return db.query("SELECT * FROM " + userId);</span>{`
      `}<span className="text-white/15">   │</span>{`                  `}<span className="text-red-400">^^^^^^^^^^^^^^^^^^^^^^^^^</span>{`
      `}<span className="text-cyan-400/70">{'↳'} Use parameterized queries: db.query("...WHERE id = $1", [id])</span>{`

  `}<span className="text-white/60 font-semibold">Health</span>{`  `}<span className="text-[#d4a012]">{'━━━━━━━━━━━━━━'}</span><span className="text-white/10">{'╌╌╌╌╌╌╌╌╌╌'}</span>{`  62/100  `}<span className="text-[#d4a012]">[C]</span>{`
  `}<span className="text-white/60 font-semibold">Issues</span>{`  `}<span className="text-red-400 text-[10px]">2 CRIT</span>{`  `}<span className="text-orange-400 text-[10px]">3 HIGH</span>{`  `}<span className="text-amber-400/60 text-[10px]">4 WARN</span>{`

  `}<span className="text-cyan-400/50">[1]</span>{` Auto-fix 3 issues
  `}<span className="text-cyan-400/50">[2]</span>{` Generate AI fix guide
  `}<span className="text-cyan-400/50">[3]</span>{` Create baseline
  `}<span className="text-cyan-400/50">[4]</span>{` Install pre-commit hook`}
              </pre>
            </div>
          </F>
        </div>
      </section>

      {/* ═══ VS Code ═══ */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 items-start">
            <div className="lg:sticky lg:top-28">
              <F>
                <p className="text-[11px] font-mono text-[#d4a012]/60 mb-4 tracking-wider">EDITOR</p>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">Red squiggles on<br/>vulnerabilities.</h2>
              </F>
              <F d={1}>
                <p className="mt-4 text-[14px] text-white/35 leading-[1.7]">
                  VS Code extension scans on save. Inline diagnostics, quick-fix lightbulbs,
                  severity in the status bar. No setup required.
                </p>
              </F>
              <F d={2}>
                <div className="mt-8 space-y-3 text-[13px] text-white/40">
                  {["Diagnostics on save", "Quick fix + suppress", "Workspace scan", "Configurable severity"].map((f) => (
                    <div key={f} className="flex items-center gap-2.5">
                      <span className="text-[#d4a012] text-[10px]">&#x2713;</span>{f}
                    </div>
                  ))}
                </div>
              </F>
            </div>
            <F d={1}>
              <div className="rounded-lg border border-white/[0.07] bg-[#1e1e1e] overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-[#2d2d2d] border-b border-white/5">
                  <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"/><div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]"/><div className="w-2.5 h-2.5 rounded-full bg-[#28c840]"/></div>
                  <span className="ml-2 text-[10px] text-white/30 font-mono">auth.ts</span>
                  <span className="ml-auto text-[9px] text-red-400/70 font-mono">Guardrail: 2 critical</span>
                </div>
                <div className="p-4 font-mono text-[11.5px] leading-[2]">
                  <div><span className="text-white/15 w-7 inline-block text-right mr-4">12</span><span className="text-[#569cd6]">const</span> <span className="decoration-wavy decoration-red-500 underline text-white/60">API_KEY</span> <span className="text-white/40">=</span> <span className="text-[#ce9178]">&quot;sk-abc123456789...&quot;</span><span className="text-white/40">;</span></div>
                  <div><span className="text-white/15 w-7 inline-block text-right mr-4">13</span></div>
                  <div><span className="text-white/15 w-7 inline-block text-right mr-4">14</span><span className="text-[#569cd6]">function</span> <span className="text-[#dcdcaa]">getUser</span><span className="text-white/40">(db, userId) {'{'}</span></div>
                  <div className="relative"><span className="text-white/15 w-7 inline-block text-right mr-4">15</span><span className="text-white/40">  </span><span className="text-[#c586c0]">return</span><span className="text-white/40"> db.</span><span className="text-[#dcdcaa]">query</span><span className="text-white/40">(</span><span className="decoration-wavy decoration-red-500 underline text-[#ce9178]">&quot;SELECT * FROM users WHERE id = &quot;</span><span className="text-white/40"> + userId);</span></div>
                  <div><span className="text-white/15 w-7 inline-block text-right mr-4">16</span><span className="text-white/40">{'}'}</span></div>
                  <div><span className="text-white/15 w-7 inline-block text-right mr-4">17</span></div>
                  <div><span className="text-white/15 w-7 inline-block text-right mr-4">18</span><span className="text-[#569cd6]">const</span> <span className="text-white/60">data</span> <span className="text-white/40">=</span> <span className="decoration-wavy decoration-yellow-500 underline text-white/60">jwt.decode</span><span className="text-white/40">(token);</span></div>
                </div>
                <div className="border-t border-white/5 bg-[#1e1e1e]">
                  <div className="px-3 py-1.5 text-[9px] text-white/25 uppercase tracking-wider border-b border-white/5">Problems (3)</div>
                  <div className="p-1.5 text-[10.5px] font-mono">
                    <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/[0.03]"><span className="text-red-400 text-[8px]">&#9679;</span><span className="text-white/45">Hardcoded secret in &quot;API_KEY&quot;</span><span className="ml-auto text-white/15">:12</span></div>
                    <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/[0.03]"><span className="text-red-400 text-[8px]">&#9679;</span><span className="text-white/45">Potential SQL injection</span><span className="ml-auto text-white/15">:15</span></div>
                    <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/[0.03]"><span className="text-orange-400 text-[8px]">&#9679;</span><span className="text-white/45">jwt.decode() does NOT verify</span><span className="ml-auto text-white/15">:18</span></div>
                  </div>
                </div>
              </div>
            </F>
          </div>
        </div>
      </section>

      {/* ═══ Rules ═══ */}
      <section id="rules" className="py-24 border-t border-white/5">
        <div className="max-w-[1200px] mx-auto px-6">
          <F>
            <p className="text-[11px] font-mono text-[#d4a012]/60 mb-4 tracking-wider">ALL 30 RULES</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-10">Every rule. No plugins needed.</h2>
          </F>
          <F d={1}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
              {RULES_PREVIEW.map(([id, sev]) => (
                <div key={id} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] group">
                  <span className="text-[12.5px] font-mono text-white/40 group-hover:text-white/60 transition-colors">{id}</span>
                  <span className={`text-[10px] font-bold tracking-wider ${sevColor[sev]}`}>{sev}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[12px] text-white/20">+ 14 more. <a href="https://github.com/Manavarya09/Guardrail#30-built-in-rules" target="_blank" rel="noopener noreferrer" className="text-[#d4a012]/50 hover:text-[#d4a012] transition-colors">See all rules</a></p>
          </F>
        </div>
      </section>

      {/* ═══ Compare ═══ */}
      <section id="compare" className="py-24 border-t border-white/5">
        <div className="max-w-[900px] mx-auto px-6">
          <F>
            <p className="text-[11px] font-mono text-[#d4a012]/60 mb-4 tracking-wider">COMPARISON</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-10">ESLint wasn&apos;t built for this.</h2>
          </F>
          <F d={1}>
            <div className="rounded-lg border border-white/[0.07] overflow-x-auto">
              <table className="w-full text-left min-w-[550px]">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.015]">
                    <th className="px-4 py-2.5 text-[10px] text-white/25 font-normal tracking-wider uppercase w-[40%]">Feature</th>
                    <th className="px-4 py-2.5 text-[10px] text-[#d4a012] font-semibold tracking-wider uppercase">Guardrail</th>
                    <th className="px-4 py-2.5 text-[10px] text-white/25 font-normal tracking-wider uppercase">ESLint</th>
                    <th className="px-4 py-2.5 text-[10px] text-white/25 font-normal tracking-wider uppercase">Sonar</th>
                    <th className="px-4 py-2.5 text-[10px] text-white/25 font-normal tracking-wider uppercase">Snyk</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_FEATURES.map(([feat, g, e, s, n]) => {
                    const cell = (v: boolean | string, highlight = false) =>
                      v === true ? <span className={highlight ? "text-[#d4a012]" : "text-white/30"}>&#10003;</span>
                      : v === false ? <span className="text-white/10">&#x2013;</span>
                      : <span className="text-white/20 text-[10px]">{v}</span>;
                    return (
                      <tr key={feat} className="border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors">
                        <td className="px-4 py-2 text-[12px] text-white/40">{feat}</td>
                        <td className="px-4 py-2 text-[12px]">{cell(g, true)}</td>
                        <td className="px-4 py-2 text-[12px]">{cell(e)}</td>
                        <td className="px-4 py-2 text-[12px]">{cell(s)}</td>
                        <td className="px-4 py-2 text-[12px]">{cell(n)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </F>
        </div>
      </section>

      {/* ═══ Integrations ═══ */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-[1200px] mx-auto px-6">
          <F>
            <p className="text-[11px] font-mono text-[#d4a012]/60 mb-4 tracking-wider">INTEGRATIONS</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-12">Drop it into any workflow.</h2>
          </F>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { t: "CLI", s: "7 commands", c: "guardrail scan .\nguardrail fix .\nguardrail diff main\nguardrail hook install\nguardrail baseline create" },
              { t: "VS Code", s: "Real-time", c: "Install the .vsix extension.\nScans on save. Red squiggles\non vulnerabilities. Quick fixes." },
              { t: "GitHub Action", s: "CI/CD", c: "- uses: Manavarya09/Guardrail@v0.1.0\n  with:\n    target: './src'\n    fail-on: 'high'" },
              { t: "Claude Code", s: "MCP", c: '{ "mcpServers": {\n    "guardrail": {\n      "command": "npx",\n      "args": ["@guardrail-ai/mcp"]\n    }\n  }\n}' },
              { t: "Reports", s: "MD / HTML / SARIF", c: "guardrail scan . --report md\n# AI-guided fix report\n\nguardrail scan . --report sarif\n# GitHub Code Scanning" },
              { t: "Pre-commit", s: "git hook", c: "guardrail hook install\n# Blocks commits with\n# critical / high issues\n\ngit commit --no-verify\n# to bypass" },
            ].map((item, i) => (
              <F key={item.t} d={i}>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-5 hover:border-white/[0.12] transition-colors h-full">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-[13px] font-bold">{item.t}</span>
                    <span className="text-[10px] text-white/20">{item.s}</span>
                  </div>
                  <pre className="text-[10.5px] font-mono text-white/30 leading-[1.7] whitespace-pre-wrap">{item.c}</pre>
                </div>
              </F>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-32 border-t border-white/5">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <F>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Stop shipping<br/><span className="text-[#d4a012]">vulnerable code.</span>
            </h2>
          </F>
          <F d={1}>
            <p className="mt-5 text-[14px] text-white/35">One command. 30 rules. Under a second. Free forever.</p>
          </F>
          <F d={2}>
            <div className="mt-8 flex justify-center gap-3">
              <button onClick={copy} className="font-mono text-[13px] bg-[#d4a012] text-black px-6 py-3 rounded font-semibold hover:bg-[#e0ad1a] transition-colors">
                {copied ? "Copied!" : "$ npx @guardrail-ai/cli scan ."}
              </button>
              <a href="https://github.com/Manavarya09/Guardrail" target="_blank" rel="noopener noreferrer"
                className="text-[13px] border border-white/10 px-6 py-3 rounded text-white/50 hover:text-white/80 hover:border-white/20 transition-all">
                Star on GitHub
              </a>
            </div>
          </F>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-10">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[11px] text-white/20">Guardrail &middot; MIT License &middot; Open Source</span>
          <div className="flex gap-6">
            {[["GitHub", "https://github.com/Manavarya09/Guardrail"], ["npm", "https://www.npmjs.com/package/@guardrail-ai/cli"], ["Contribute", "https://github.com/Manavarya09/Guardrail/blob/main/CONTRIBUTING.md"]].map(([l, h]) => (
              <a key={l} href={h} target="_blank" rel="noopener noreferrer" className="text-[11px] text-white/20 hover:text-white/50 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
