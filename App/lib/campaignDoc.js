/**
 * Builds a self-contained, print-ready HTML document for a campaign's 7-day
 * revenue plan. Opened in a new window and printed (Save as PDF) for a polished,
 * business-grade deliverable. No external dependencies.
 */

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildCampaignDoc(campaign, plan) {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const meta = [
    ["Goal", campaign.goal],
    ["Offer", campaign.offer],
    ["Audience", campaign.targetAudience],
    ["Channels", campaign.channel],
    ["Budget", campaign.budget],
    ["Timeline", campaign.timeline],
  ]
    .filter(([, v]) => v && String(v).trim())
    .map(
      ([k, v]) =>
        `<div class="meta-item"><span class="meta-key">${esc(k)}</span><span class="meta-val">${esc(v)}</span></div>`
    )
    .join("");

  const days = (plan?.days || [])
    .map((d, i) => {
      const todos = (d.todos || [])
        .map(
          (t) => `
          <li class="${t.done ? "done" : ""}">
            <span class="box">${t.done ? "✓" : ""}</span>
            <span class="task">${esc(t.text)}</span>
          </li>`
        )
        .join("");
      return `
        <section class="day">
          <div class="day-head">
            <span class="day-num">${i + 1}</span>
            <div>
              <h3>${esc(d.title || `Day ${i + 1}`)}</h3>
              ${d.focus ? `<p class="focus">${esc(d.focus)}</p>` : ""}
            </div>
          </div>
          <ul class="todos">${todos || `<li class="empty">No tasks</li>`}</ul>
        </section>`;
    })
    .join("");

  const totalTasks = (plan?.days || []).reduce((n, d) => n + (d.todos?.length || 0), 0);
  const doneTasks = (plan?.days || []).reduce(
    (n, d) => n + (d.todos?.filter((t) => t.done).length || 0),
    0
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(campaign.name)} — 7-Day Revenue Plan</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root { --ink:#0f1115; --muted:#5b6472; --line:#e6e9ee; --accent:#0f9d6e; --accent2:#0891b2; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
    color: var(--ink); background: #fff; line-height: 1.55;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .page { max-width: 920px; margin: 0 auto; padding: 48px 56px; }

  .cover {
    border-radius: 20px; padding: 40px 44px; color: #fff;
    background: linear-gradient(135deg, #0f9d6e 0%, #0891b2 100%);
    position: relative; overflow: hidden;
  }
  .cover::after {
    content: ""; position: absolute; right: -60px; top: -60px;
    width: 240px; height: 240px; border-radius: 50%;
    background: rgba(255,255,255,.12);
  }
  .brand { font-size: 12px; letter-spacing: .22em; text-transform: uppercase; opacity: .85; }
  .cover h1 { font-size: 34px; font-weight: 800; margin-top: 10px; line-height: 1.15; }
  .cover .sub { margin-top: 8px; font-size: 14px; opacity: .9; }
  .cover .date { margin-top: 18px; font-size: 12px; opacity: .85; }

  .summary { margin-top: 28px; }
  .summary h2 { font-size: 13px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
  .summary p { margin-top: 8px; font-size: 15px; }
  .northstar {
    margin-top: 14px; padding: 14px 18px; border-radius: 12px;
    background: #f0fbf6; border: 1px solid #cdeede; color: #0b6b4c; font-size: 14px;
  }
  .northstar b { color: #084d37; }

  .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 28px; margin-top: 26px; }
  .meta-item { display: flex; flex-direction: column; padding-bottom: 8px; border-bottom: 1px solid var(--line); }
  .meta-key { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
  .meta-val { font-size: 14px; margin-top: 2px; }

  .stats { display: flex; gap: 28px; margin-top: 26px; }
  .stat { }
  .stat .n { font-size: 26px; font-weight: 800; color: var(--accent); }
  .stat .l { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }

  .section-title {
    margin-top: 38px; margin-bottom: 16px; font-size: 13px; letter-spacing: .14em;
    text-transform: uppercase; color: var(--muted);
    display: flex; align-items: center; gap: 12px;
  }
  .section-title::after { content: ""; flex: 1; height: 1px; background: var(--line); }

  .day { border: 1px solid var(--line); border-radius: 16px; padding: 22px 24px; margin-bottom: 16px; page-break-inside: avoid; }
  .day-head { display: flex; gap: 14px; align-items: flex-start; }
  .day-num {
    flex: 0 0 auto; width: 34px; height: 34px; border-radius: 10px;
    background: linear-gradient(135deg, #0f9d6e, #0891b2); color: #fff;
    display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 15px;
  }
  .day-head h3 { font-size: 17px; font-weight: 700; }
  .focus { font-size: 13px; color: var(--muted); font-style: italic; margin-top: 2px; }

  .todos { list-style: none; margin-top: 14px; }
  .todos li { display: flex; gap: 10px; align-items: flex-start; padding: 6px 0; font-size: 14px; }
  .todos .box {
    flex: 0 0 auto; width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid #c4ccd6;
    display: flex; align-items: center; justify-content: center; font-size: 12px; color: var(--accent); margin-top: 1px;
  }
  .todos li.done .box { background: #e7f7f0; border-color: var(--accent); }
  .todos li.done .task { color: var(--muted); text-decoration: line-through; }
  .todos .empty { color: var(--muted); font-style: italic; }

  .footer { margin-top: 40px; padding-top: 18px; border-top: 1px solid var(--line); font-size: 12px; color: var(--muted); text-align: center; }

  @media print {
    .page { padding: 0; }
    .cover { border-radius: 0; }
    @page { margin: 16mm; }
  }
</style>
</head>
<body>
  <div class="page">
    <div class="cover">
      <div class="brand">GenXAI Voice Funnel · Campaign Plan</div>
      <h1>${esc(campaign.name)}</h1>
      <div class="sub">7-Day Revenue Execution Plan</div>
      <div class="date">Generated ${esc(today)}</div>
    </div>

    ${
      plan?.summary || plan?.northStarMetric
        ? `<div class="summary">
            <h2>Strategy Overview</h2>
            ${plan?.summary ? `<p>${esc(plan.summary)}</p>` : ""}
            ${
              plan?.northStarMetric
                ? `<div class="northstar"><b>North-star metric:</b> ${esc(plan.northStarMetric)}</div>`
                : ""
            }
          </div>`
        : ""
    }

    ${meta ? `<div class="meta">${meta}</div>` : ""}

    <div class="stats">
      <div class="stat"><div class="n">${plan?.days?.length || 0}</div><div class="l">Days</div></div>
      <div class="stat"><div class="n">${totalTasks}</div><div class="l">Tasks</div></div>
      <div class="stat"><div class="n">${doneTasks}</div><div class="l">Completed</div></div>
    </div>

    <div class="section-title">Daily Execution</div>
    ${days}

    <div class="footer">Built with GenXAI Voice Funnel — turn conversations into revenue.</div>
  </div>
</body>
</html>`;
}
