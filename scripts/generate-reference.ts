import * as fs from "fs";
import * as path from "path";

interface Option {
  label: string;
  text: string;
}

interface Question {
  id: number;
  chapterId: number;
  chapterTitle: string;
  type: "single" | "multiple" | "truefalse";
  stem: string;
  options: Option[];
  answer: string[];
}

const questions: Question[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../prisma/data/questions.json"), "utf-8")
);

const TYPE_LABEL: Record<string, string> = {
  single: "单选题",
  multiple: "多选题",
  truefalse: "判断题",
};

// Group by chapter
const chapters = new Map<string, Question[]>();
for (const q of questions) {
  const list = chapters.get(q.chapterTitle) ?? [];
  list.push(q);
  chapters.set(q.chapterTitle, list);
}

// ─── Markdown ────────────────────────────────────────────

function toMarkdown(): string {
  const lines: string[] = [
    "# 题库参考资料",
    "",
    `> 共 ${questions.length} 题 | 生成日期: ${new Date().toISOString().slice(0, 10)}`,
    "",
    "---",
    "",
  ];

  for (const [chapter, qs] of chapters) {
    lines.push(`## ${chapter}（共 ${qs.length} 题）`, "");
    for (const q of qs) {
      lines.push(`### ${q.id}. [${TYPE_LABEL[q.type] ?? q.type}] ${q.stem}`, "");
      if (q.options.length > 0) {
        for (const opt of q.options) {
          const isAnswer = q.answer.includes(opt.label);
          lines.push(`- ${isAnswer ? "**" : ""}${opt.label}. ${opt.text}${isAnswer ? "** ✓" : ""}`);
        }
        lines.push("");
      }
      lines.push(`- **答案**：${q.answer.join("、")}`, "", "---", "");
    }
  }
  return lines.join("\n");
}

// ─── HTML ────────────────────────────────────────────────

function toHtml(): string {
  const chapterHtml = () => {
    const parts: string[] = [];
    for (const [chapter, qs] of chapters) {
      const questionsHtml = qs
        .map(
          (q) => `
        <div class="question" data-chapter="${escapeHtml(chapter)}">
          <div class="q-header">
            <span class="q-id">#${q.id}</span>
            <span class="q-type type-${q.type}">${TYPE_LABEL[q.type] ?? q.type}</span>
          </div>
          <div class="q-stem">${escapeHtml(q.stem)}</div>
          <div class="q-options">
            ${q.options
              .map(
                (opt) =>
                  `<div class="opt ${q.answer.includes(opt.label) ? "correct" : ""}">
                <span class="opt-label">${escapeHtml(opt.label)}</span>
                <span class="opt-text">${escapeHtml(opt.text)}</span>
                ${q.answer.includes(opt.label) ? '<span class="opt-mark">✓</span>' : ""}
              </div>`
              )
              .join("\n            ")}
          </div>
          <div class="q-answer">答案：${q.answer.join("、")}</div>
        </div>`
        )
        .join("\n        ");

      parts.push(`
      <div class="chapter">
        <div class="chapter-header" onclick="this.parentElement.classList.toggle('collapsed')">
          <span class="chapter-toggle">▼</span>
          <span class="chapter-title">${escapeHtml(chapter)}</span>
          <span class="chapter-count">${qs.length} 题</span>
        </div>
        <div class="chapter-body">
          ${questionsHtml}
        </div>
      </div>`);
    }
    return parts.join("\n    ");
  };

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>题库参考资料</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", sans-serif;
    background: #f5f5f7;
    color: #1d1d1f;
    line-height: 1.6;
    padding: 20px;
  }
  .container { max-width: 860px; margin: 0 auto; }
  h1 { font-size: 28px; margin-bottom: 8px; }
  .subtitle { color: #86868b; font-size: 14px; margin-bottom: 24px; }
  .search-box {
    width: 100%;
    padding: 12px 16px;
    font-size: 16px;
    border: 1px solid #d2d2d7;
    border-radius: 10px;
    outline: none;
    margin-bottom: 24px;
    background: #fff;
    transition: border-color .2s;
  }
  .search-box:focus { border-color: #007aff; }
  .chapter {
    background: #fff;
    border-radius: 12px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,.08);
    overflow: hidden;
  }
  .chapter-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px;
    cursor: pointer;
    user-select: none;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;
  }
  .chapter-header:hover { background: #fafafa; }
  .chapter-toggle { font-size: 12px; color: #86868b; transition: transform .2s; }
  .collapsed .chapter-toggle { transform: rotate(-90deg); }
  .chapter-title { font-size: 16px; font-weight: 600; flex: 1; }
  .chapter-count { font-size: 13px; color: #86868b; }
  .collapsed .chapter-body { display: none; }
  .question {
    padding: 20px;
    border-bottom: 1px solid #f0f0f0;
  }
  .question:last-child { border-bottom: none; }
  .q-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
  .q-id { font-weight: 600; font-size: 14px; color: #007aff; }
  .q-type {
    font-size: 11px; padding: 2px 8px; border-radius: 4px;
    background: #f0f0f0; color: #666;
  }
  .type-multiple { background: #e8f0fe; color: #1967d2; }
  .type-truefalse { background: #fce8e6; color: #c5221f; }
  .q-stem { font-size: 15px; margin-bottom: 12px; line-height: 1.7; }
  .q-options { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
  .opt {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px; border-radius: 8px;
    background: #fafafa; border: 1px solid #eee;
  }
  .opt.correct { background: #e8f5e9; border-color: #a5d6a7; }
  .opt-label {
    font-weight: 600; font-size: 13px;
    width: 24px; height: 24px; display: flex;
    align-items: center; justify-content: center;
    border-radius: 50%; background: #e0e0e0;
  }
  .opt.correct .opt-label { background: #4caf50; color: #fff; }
  .opt-mark { margin-left: auto; color: #4caf50; font-weight: 700; }
  .q-answer {
    font-size: 13px; color: #666; padding: 8px 12px;
    background: #f5f5f5; border-radius: 6px;
  }
  .search-highlight { background: #fff176; padding: 0 2px; border-radius: 2px; }
  .no-results { text-align: center; padding: 40px; color: #86868b; font-size: 16px; }
  @media print {
    body { background: #fff; padding: 0; }
    .search-box { display: none; }
    .chapter { break-inside: avoid; box-shadow: none; border: 1px solid #ddd; }
    .chapter-header { cursor: default; }
    .chapter-toggle { display: none; }
    .collapsed .chapter-body { display: block !important; }
  }
</style>
</head>
<body>
<div class="container">
  <h1>题库参考资料</h1>
  <div class="subtitle">共 ${questions.length} 题 | ${chapters.size} 个章节 | 生成日期: ${new Date().toISOString().slice(0, 10)}</div>
  <input class="search-box" type="text" placeholder="搜索题目..." id="search" autofocus>
  <div id="list">${chapterHtml()}</div>
  <div id="noResults" class="no-results" style="display:none">没有匹配的题目</div>
</div>
<script>
  const search = document.getElementById('search');
  const list = document.getElementById('list');
  const noResults = document.getElementById('noResults');

  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    let visible = 0;
    document.querySelectorAll('.question').forEach(el => {
      const text = el.textContent.toLowerCase();
      const match = !q || text.includes(q);
      el.style.display = match ? '' : 'none';
      if (match) visible++;
    });
    document.querySelectorAll('.chapter').forEach(el => {
      const has = [...el.querySelectorAll('.question')].some(q => q.style.display !== 'none');
      el.style.display = has ? '' : 'none';
      if (!q) el.classList.remove('collapsed');
      else if (has) el.classList.remove('collapsed');
    });
    noResults.style.display = visible === 0 ? '' : 'none';
  });
</script>
</body>
</html>`;
}

// ─── Helpers ─────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ─── Main ────────────────────────────────────────────────

const root = path.resolve(__dirname, "..");

fs.writeFileSync(path.join(root, "题库参考资料.md"), toMarkdown(), "utf-8");
console.log("✅ 已生成 题库参考资料.md");

fs.writeFileSync(path.join(root, "题库参考资料.html"), toHtml(), "utf-8");
console.log("✅ 已生成 题库参考资料.html");

console.log(`\n共 ${questions.length} 题，${chapters.size} 个章节`);
