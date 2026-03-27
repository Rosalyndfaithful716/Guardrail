"use client";

import { motion, useInView, animate } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Globe = dynamic(() => import("@/components/Globe"), { ssr: false });

function F({ children, className = "", d = 0 }: { children: React.ReactNode; className?: string; d?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.4, delay: d * 0.08 }} className={className}>
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TYPING TERMINAL — the product IS the hero
   ═══════════════════════════════════════════════════════════════════ */

function TerminalHero() {
  const [phase, setPhase] = useState(0);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    const blink = setInterval(() => setCursor((c) => !c), 530);
    const timers = [
      setTimeout(() => setPhase(1), 800),   // show command
      setTimeout(() => setPhase(2), 1600),  // show banner
      setTimeout(() => setPhase(3), 2200),  // show scan header
      setTimeout(() => setPhase(4), 2800),  // show file
      setTimeout(() => setPhase(5), 3200),  // show violation
      setTimeout(() => setPhase(6), 3800),  // show code frame
      setTimeout(() => setPhase(7), 4400),  // show hint
      setTimeout(() => setPhase(8), 5000),  // show results box
      setTimeout(() => setPhase(9), 5600),  // show menu
    ];
    return () => { clearInterval(blink); timers.forEach(clearTimeout); };
  }, []);

  const show = (n: number) => phase >= n;
  const fade = "transition-opacity duration-300";

  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0a0a0a] overflow-hidden w-full max-w-[680px]">
      {/* Chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"/>
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]"/>
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]"/>
        </div>
        <span className="ml-2 text-[10px] font-mono text-white/20">~/project</span>
      </div>
      {/* Content */}
      <div className="p-5 font-mono text-[11px] md:text-[12px] leading-[1.85] min-h-[380px] md:min-h-[420px]">
        {/* Command */}
        <div className={`text-white/70 ${fade} ${show(0) ? "opacity-100" : "opacity-0"}`}>
          <span className="text-[#d4a012]">$</span> npx @guardrail-ai/cli scan ./src{!show(1) && <span className={`${cursor ? "opacity-100" : "opacity-0"} text-[#d4a012]`}>_</span>}
        </div>

        {/* Banner */}
        {show(2) && <div className={`mt-3 text-[#d4a012]/60 text-[10px] leading-[1.4] ${fade}`}>
{`   ____                     _           _ _
  / ___|_   _  __ _ _ __ __| |_ __ __ _(_) |
 | |  _| | | |/ _\` | '__/ _\` | '__/ _\` | | |
 | |_| | |_| | (_| | | | (_| | | | (_| | | |
  \\____|\\__,_|\\__,_|_|  \\__,_|_|  \\__,_|_|_|`}
        </div>}

        {/* Scan header */}
        {show(3) && <div className={`mt-2 text-white/20 ${fade}`}>
          <div>Target &nbsp;&nbsp;./src</div>
          <div>Rules &nbsp;&nbsp;&nbsp;30 rules across 4 categories</div>
        </div>}

        {/* File header */}
        {show(4) && <div className={`mt-3 ${fade}`}>
          <span className="text-red-400">{"◉"}</span> <span className="text-white/80 font-semibold">src/api/auth.ts</span> <span className="text-white/20">(4 issues)</span>
        </div>}

        {/* Violation */}
        {show(5) && <div className={`mt-2 ml-2 ${fade}`}>
          <span className="text-red-400">{"✖"}</span> <span className="text-red-400/80 text-[10px] font-bold">CRIT</span> <span className="text-white/60">Potential SQL injection</span>
          <div className="text-white/15 ml-4">at src/api/auth.ts:18:18</div>
        </div>}

        {/* Code frame */}
        {show(6) && <div className={`ml-4 ${fade}`}>
          <div><span className="text-white/10">17 │</span> <span className="text-white/20">function getUser(db, userId) {"{"}</span></div>
          <div><span className="text-red-400">{">"}</span> <span className="text-white/10">18 │</span> <span className="text-white/60">  db.query(&quot;SELECT * FROM &quot; + userId);</span></div>
          <div><span className="text-white/10">{"   │"}</span>           <span className="text-red-400">^^^^^^^^^^^^^^^^^^^^^^^^^</span></div>
          <div><span className="text-white/10">19 │</span> <span className="text-white/20">{"}"}</span></div>
        </div>}

        {/* Hint */}
        {show(7) && <div className={`ml-6 text-cyan-400/60 ${fade}`}>
          {"↳"} Use parameterized queries: db.query(&quot;...WHERE id = $1&quot;, [id])
        </div>}

        {/* Results */}
        {show(8) && <div className={`mt-4 ${fade}`}>
          <div className="text-white/50"><span className="font-semibold">Health</span> &nbsp;<span className="text-[#d4a012]">{"━━━━━━━━━━━━━━"}</span><span className="text-white/10">{"╌╌╌╌╌╌╌╌╌"}</span> 62/100 <span className="text-[#d4a012]">[C]</span></div>
          <div className="text-white/50 mt-0.5"><span className="font-semibold">Issues</span> &nbsp;<span className="text-red-400 text-[10px]">2 CRIT</span> &nbsp;<span className="text-orange-400 text-[10px]">3 HIGH</span> &nbsp;<span className="text-amber-400/50 text-[10px]">4 WARN</span></div>
        </div>}

        {/* Interactive menu */}
        {show(9) && <div className={`mt-3 ${fade}`}>
          <div className="text-white/30 mb-1">What would you like to do?</div>
          <div><span className="text-cyan-400/50">[1]</span> <span className="text-white/40">Auto-fix 3 issues</span></div>
          <div><span className="text-cyan-400/50">[2]</span> <span className="text-white/40">Generate AI fix guide</span></div>
          <div><span className="text-cyan-400/50">[3]</span> <span className="text-white/40">Install pre-commit hook</span></div>
          <div className="mt-1 text-cyan-400/40">{"→"} <span className={`${cursor ? "opacity-100" : "opacity-0"} text-[#d4a012]`}>_</span></div>
        </div>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */

const RULES: [string, string][] = [
  ["security/sql-injection", "CRIT"], ["security/xss-vulnerability", "CRIT"], ["security/hardcoded-api-key", "CRIT"],
  ["security/path-traversal", "CRIT"], ["security/jwt-misuse", "CRIT"], ["security/prototype-pollution", "HIGH"],
  ["security/open-redirect", "HIGH"], ["security/insecure-cookie", "HIGH"],
  ["ai-codegen/hallucinated-import", "HIGH"], ["ai-codegen/unused-imports", "WARN"],
  ["ai-codegen/no-async-without-await", "WARN"], ["ai-codegen/placeholder-code", "WARN"],
  ["performance/n-plus-one-query", "HIGH"], ["quality/dead-code", "WARN"],
];

const COMPARE: [string, boolean, boolean | string, boolean, boolean][] = [
  ["SQL injection", true, false, true, false],
  ["XSS / innerHTML", true, "Plugin", true, false],
  ["JWT misuse", true, false, false, false],
  ["AI hallucinated imports", true, false, false, false],
  ["Inline code frames", true, false, false, false],
  ["Pre-commit hook", true, "Plugin", false, false],
  ["Baseline / gradual adoption", true, false, false, false],
  ["Git diff scanning", true, false, false, false],
  ["AST auto-fix", true, false, false, false],
  ["AI remediation report", true, false, false, false],
  ["Zero config", true, false, false, true],
];

const sev: Record<string, string> = { CRIT: "text-red-400", HIGH: "text-orange-400", WARN: "text-amber-500/60" };

export default function Page() {
  const [copied, setCopied] = useState(false);
  const cp = () => { navigator.clipboard?.writeText("npx @guardrail-ai/cli scan ."); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <main className="bg-[#060606] text-white min-h-screen">

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#060606]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] font-bold tracking-[0.15em] uppercase text-[#d4a012]">Guardrail</span>
          <div className="hidden md:flex items-center gap-7">
            {["Rules", "Compare", "Integrate"].map((s) => (
              <a key={s} href={`#${s.toLowerCase()}`} className="text-[12px] text-white/30 hover:text-white/60 transition-colors">{s}</a>
            ))}
            <a href="https://github.com/Manavarya09/Guardrail" target="_blank" rel="noopener noreferrer"
              className="text-[12px] text-white/40 border border-white/8 px-3.5 py-1.5 rounded hover:border-white/15 hover:text-white/70 transition-all">GitHub</a>
          </div>
        </div>
      </nav>

      {/* ═══ HERO — Terminal is the product ═══ */}
      <section className="pt-28 pb-20 md:pt-36 md:pb-28 relative overflow-hidden">
        <div className="absolute top-40 right-[-200px] w-[600px] h-[600px] bg-[#d4a012]/[0.02] rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-16 items-start">
            {/* Left — text */}
            <div className="lg:pt-8">
              <F>
                <p className="font-mono text-[11px] text-[#d4a012]/60 mb-5">open source &middot; MIT license &middot; v0.2.2</p>
              </F>
              <F d={1}>
                <h1 className="text-[clamp(2.2rem,5.5vw,4rem)] font-black leading-[1] tracking-[-0.04em]">
                  AI writes code.
                  <br/><span className="text-[#d4a012]">We make it safe.</span>
                </h1>
              </F>
              <F d={2}>
                <p className="mt-5 text-[14px] text-white/35 max-w-sm leading-[1.7]">
                  30 AST-powered rules catch SQL injection, XSS, hardcoded secrets,
                  hallucinated imports, and 26 more patterns that ESLint and Snyk miss.
                  Then auto-fix them.
                </p>
              </F>
              <F d={3}>
                <div className="mt-7 flex items-center gap-2.5">
                  <button onClick={cp} className="font-mono text-[12px] bg-[#d4a012] text-black px-4 py-2.5 rounded font-semibold hover:bg-[#e0ad1a] transition-colors">
                    {copied ? "Copied to clipboard" : "$ npx @guardrail-ai/cli scan ."}
                  </button>
                  <a href="https://github.com/Manavarya09/Guardrail" target="_blank" rel="noopener noreferrer"
                    className="text-[12px] text-white/30 border border-white/8 px-4 py-2.5 rounded hover:text-white/60 hover:border-white/15 transition-all">GitHub</a>
                </div>
              </F>
              <F d={4}>
                <div className="mt-12 grid grid-cols-4 gap-6 max-w-sm">
                  {[["30", "rules"], ["7", "cmds"], ["<1s", "scan"], ["141", "tests"]].map(([n, l]) => (
                    <div key={l}><div className="text-[20px] font-black font-mono text-[#d4a012]">{n}</div><div className="text-[10px] text-white/20">{l}</div></div>
                  ))}
                </div>
              </F>
            </div>

            {/* Right — live terminal */}
            <F d={2}>
              <TerminalHero />
            </F>
          </div>
        </div>
      </section>

      {/* ═══ WHAT IT CATCHES ═══ */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid md:grid-cols-[1fr_1.5fr] gap-12">
            <F>
              <p className="font-mono text-[10px] text-[#d4a012]/50 tracking-wider mb-3">DETECTION</p>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
                Patterns that<br/>linters miss.
              </h2>
              <p className="mt-3 text-[13px] text-white/25 leading-[1.7] max-w-xs">
                AI models generate code that looks right but ships with real vulnerabilities.
                We catch all of it in under a second.
              </p>
            </F>
            <div className="grid grid-cols-3 gap-px bg-white/[0.04] rounded overflow-hidden">
              {[
                ["15", "Security", "SQL injection, XSS, JWT misuse, path traversal, prototype pollution, secrets, cookies, redirects"],
                ["11", "AI-Codegen", "Hallucinated imports, placeholder code, async without await, unused imports, missing error handling"],
                ["4", "Quality + Perf", "N+1 queries, inefficient loops, dead code, duplicate logic"],
              ].map(([n, t, d], i) => (
                <F key={t} d={i + 1}>
                  <div className="bg-[#060606] p-6 h-full">
                    <span className="text-[32px] font-black font-mono text-[#d4a012]/70 leading-none">{n}</span>
                    <h3 className="mt-2 text-[13px] font-bold text-white/70">{t}</h3>
                    <p className="mt-1.5 text-[11px] text-white/20 leading-[1.6]">{d}</p>
                  </div>
                </F>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ VS CODE ═══ */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-[1200px] mx-auto px-6 grid lg:grid-cols-[1fr_1.3fr] gap-12 items-start">
          <div className="lg:sticky lg:top-24">
            <F>
              <p className="font-mono text-[10px] text-[#d4a012]/50 tracking-wider mb-3">VS CODE</p>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
                Red squiggles on<br/>vulnerabilities.
              </h2>
            </F>
            <F d={1}>
              <p className="mt-3 text-[13px] text-white/25 leading-[1.7]">
                Scans on save. Inline diagnostics. Quick-fix lightbulbs. Status bar severity count.
              </p>
              <div className="mt-6 space-y-2 text-[12px] text-white/30">
                {["Diagnostics on save", "Auto-fix + suppress", "Workspace scan", "Configurable rules"].map((f) => (
                  <div key={f} className="flex items-center gap-2"><span className="text-[#d4a012] text-[9px]">&#10003;</span>{f}</div>
                ))}
              </div>
            </F>
          </div>
          <F d={1}>
            <div className="rounded-lg border border-white/[0.06] bg-[#1e1e1e] overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-[#2d2d2d] border-b border-white/5">
                <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"/><div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]"/><div className="w-2.5 h-2.5 rounded-full bg-[#28c840]"/></div>
                <span className="ml-2 text-[10px] font-mono text-white/20">auth.ts</span>
                <span className="ml-auto text-[9px] text-red-400/60 font-mono">Guardrail: 3 issues</span>
              </div>
              <div className="p-4 font-mono text-[11px] leading-[2]">
                <div><span className="text-white/10 inline-block w-6 text-right mr-3">12</span><span className="text-[#569cd6]">const</span> <span className="underline decoration-wavy decoration-red-500 text-white/50">API_KEY</span> <span className="text-white/30">=</span> <span className="text-[#ce9178]">&quot;sk-abc123...&quot;</span><span className="text-white/30">;</span></div>
                <div><span className="text-white/10 inline-block w-6 text-right mr-3">13</span></div>
                <div><span className="text-white/10 inline-block w-6 text-right mr-3">14</span><span className="text-[#569cd6]">function</span> <span className="text-[#dcdcaa]">getUser</span><span className="text-white/30">(db, id) {"{"}</span></div>
                <div><span className="text-white/10 inline-block w-6 text-right mr-3">15</span><span className="text-white/30">  </span><span className="text-[#c586c0]">return</span><span className="text-white/30"> db.</span><span className="text-[#dcdcaa]">query</span><span className="text-white/30">(</span><span className="underline decoration-wavy decoration-red-500 text-[#ce9178]">&quot;SELECT * FROM users WHERE id=&quot;</span><span className="text-white/30">+id);</span></div>
                <div><span className="text-white/10 inline-block w-6 text-right mr-3">16</span><span className="text-white/30">{"}"}</span></div>
                <div><span className="text-white/10 inline-block w-6 text-right mr-3">17</span></div>
                <div><span className="text-white/10 inline-block w-6 text-right mr-3">18</span><span className="text-[#569cd6]">const</span> <span className="text-white/40">data =</span> <span className="underline decoration-wavy decoration-yellow-500 text-white/40">jwt.decode</span><span className="text-white/30">(token);</span></div>
              </div>
              <div className="border-t border-white/5">
                <div className="px-3 py-1 text-[9px] text-white/20 uppercase tracking-wider border-b border-white/5">Problems (3)</div>
                <div className="p-1 text-[10px] font-mono">
                  <div className="flex items-center gap-2 px-2 py-0.5"><span className="text-red-400 text-[7px]">&#9679;</span><span className="text-white/35">Hardcoded secret in &quot;API_KEY&quot;</span><span className="ml-auto text-white/10">:12</span></div>
                  <div className="flex items-center gap-2 px-2 py-0.5"><span className="text-red-400 text-[7px]">&#9679;</span><span className="text-white/35">SQL injection — use parameterized queries</span><span className="ml-auto text-white/10">:15</span></div>
                  <div className="flex items-center gap-2 px-2 py-0.5"><span className="text-orange-400 text-[7px]">&#9679;</span><span className="text-white/35">jwt.decode() does NOT verify the token</span><span className="ml-auto text-white/10">:18</span></div>
                </div>
              </div>
            </div>
          </F>
        </div>
      </section>

      {/* ═══ RULES ═══ */}
      <section id="rules" className="py-20 border-t border-white/5">
        <div className="max-w-[1000px] mx-auto px-6">
          <F>
            <p className="font-mono text-[10px] text-[#d4a012]/50 tracking-wider mb-3">30 RULES</p>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-8">No plugins. No config. Just works.</h2>
          </F>
          <F d={1}>
            <div className="grid md:grid-cols-2 gap-x-10">
              {RULES.map(([id, s]) => (
                <div key={id} className="flex items-center justify-between py-2 border-b border-white/[0.03]">
                  <span className="font-mono text-[11.5px] text-white/30">{id}</span>
                  <span className={`font-mono text-[9px] font-bold ${sev[s]}`}>{s}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-white/15">+16 more rules. <a href="https://github.com/Manavarya09/Guardrail#30-built-in-rules" className="text-[#d4a012]/40 hover:text-[#d4a012]">View all</a></p>
          </F>
        </div>
      </section>

      {/* ═══ COMPARE ═══ */}
      <section id="compare" className="py-20 border-t border-white/5">
        <div className="max-w-[800px] mx-auto px-6">
          <F>
            <p className="font-mono text-[10px] text-[#d4a012]/50 tracking-wider mb-3">VS OTHERS</p>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-8">ESLint wasn&apos;t built for AI code.</h2>
          </F>
          <F d={1}>
            <div className="rounded border border-white/[0.06] overflow-x-auto">
              <table className="w-full text-left min-w-[500px]">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.015]">
                    <th className="px-3 py-2 text-[9px] text-white/20 font-normal tracking-wider uppercase">Feature</th>
                    <th className="px-3 py-2 text-[9px] text-[#d4a012] font-semibold tracking-wider uppercase">Guardrail</th>
                    <th className="px-3 py-2 text-[9px] text-white/20 font-normal tracking-wider uppercase">ESLint</th>
                    <th className="px-3 py-2 text-[9px] text-white/20 font-normal tracking-wider uppercase">Sonar</th>
                    <th className="px-3 py-2 text-[9px] text-white/20 font-normal tracking-wider uppercase">Snyk</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map(([f, g, e, s, n]) => (
                    <tr key={f} className="border-b border-white/[0.025]">
                      <td className="px-3 py-1.5 text-[11px] text-white/30">{f}</td>
                      {[g, e, s, n].map((v, i) => (
                        <td key={i} className="px-3 py-1.5 text-[11px]">
                          {v === true ? <span className={i === 0 ? "text-[#d4a012]" : "text-white/25"}>&#10003;</span> : v === false ? <span className="text-white/8">&ndash;</span> : <span className="text-white/15 text-[9px]">{v}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </F>
        </div>
      </section>

      {/* ═══ INTEGRATIONS ═══ */}
      <section id="integrate" className="py-20 border-t border-white/5">
        <div className="max-w-[1200px] mx-auto px-6">
          <F>
            <p className="font-mono text-[10px] text-[#d4a012]/50 tracking-wider mb-3">INTEGRATIONS</p>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-10">Drop in anywhere.</h2>
          </F>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
            {[
              ["CLI", "7 commands", "guardrail scan .\nguardrail fix .\nguardrail diff main\nguardrail hook install\nguardrail baseline create"],
              ["VS Code", "extension", "Real-time squiggles.\nQuick-fix lightbulbs.\nStatus bar severity.\nZero config."],
              ["GitHub Action", "CI/CD", "- uses: Manavarya09/Guardrail@v0.1.0\n  with:\n    target: './src'\n    fail-on: 'high'"],
              ["Claude Code", "MCP server", '{ "mcpServers": {\n    "guardrail": {\n      "command": "npx",\n      "args": ["@guardrail-ai/mcp"]\n} } }'],
              ["Reports", "MD / HTML / SARIF", "guardrail scan . --report md\n# AI fix guide for Claude/ChatGPT\n\nguardrail scan . --report sarif\n# GitHub Code Scanning"],
              ["Pre-commit", "git hook", "guardrail hook install\n# blocks commits with\n# critical/high issues"],
            ].map(([t, s, c], i) => (
              <F key={t} d={i}>
                <div className="rounded border border-white/[0.05] bg-white/[0.01] p-4 hover:border-white/[0.1] transition-colors h-full">
                  <div className="flex items-baseline gap-2 mb-2.5">
                    <span className="text-[12px] font-bold text-white/70">{t}</span>
                    <span className="text-[9px] text-white/15">{s}</span>
                  </div>
                  <pre className="text-[10px] font-mono text-white/20 leading-[1.65] whitespace-pre-wrap">{c}</pre>
                </div>
              </F>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-28 border-t border-white/5">
        <div className="max-w-[600px] mx-auto px-6 text-center">
          <F><h2 className="text-3xl md:text-4xl font-black tracking-tight">Stop shipping<br/><span className="text-[#d4a012]">vulnerable code.</span></h2></F>
          <F d={1}><p className="mt-4 text-[13px] text-white/25">One command. 30 rules. Under a second. Free forever.</p></F>
          <F d={2}>
            <div className="mt-7 flex justify-center gap-2.5">
              <button onClick={cp} className="font-mono text-[12px] bg-[#d4a012] text-black px-5 py-2.5 rounded font-semibold hover:bg-[#e0ad1a] transition-colors">{copied ? "Copied!" : "$ npx @guardrail-ai/cli scan ."}</button>
              <a href="https://github.com/Manavarya09/Guardrail" target="_blank" rel="noopener noreferrer" className="text-[12px] border border-white/8 px-5 py-2.5 rounded text-white/30 hover:text-white/60 hover:border-white/15 transition-all">Star on GitHub</a>
            </div>
          </F>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="text-[10px] text-white/15">Guardrail &middot; MIT &middot; Open Source</span>
          <div className="flex gap-5">
            {[["GitHub", "https://github.com/Manavarya09/Guardrail"], ["npm", "https://www.npmjs.com/package/@guardrail-ai/cli"], ["Contribute", "https://github.com/Manavarya09/Guardrail/blob/main/CONTRIBUTING.md"]].map(([l, h]) => (
              <a key={l} href={h} target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/15 hover:text-white/40 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
