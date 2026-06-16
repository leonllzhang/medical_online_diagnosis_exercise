#!/usr/bin/env python3
"""从 PDF 提取习题集，输出结构化 JSON/JS 题库"""
import json
import os
import re
import sys

import pypdf

CHAPTER_KEYWORDS = {
    "互联网+医疗健康发展政策": {"id": 1, "pages": (4, 23)},
    "医务人员管理": {"id": 2, "pages": (24, 32)},
    "互联网诊疗服务行为": {"id": 3, "pages": (33, 56)},
    "信息安全": {"id": 4, "pages": (57, 64)},
}

# PDF 中实际章节标题 → 映射到章节 ID
CHAPTER_HEADER_MAP = [
    (r"互联网\+医疗健康", 1, "互联网+医疗健康发展政策"),
    (r"医务人员管理", 2, "医务人员管理"),
    (r"互联网诊疗行为", 3, "互联网诊疗服务行为"),
    (r"信息安全", 4, "信息安全"),
]

# 【答案C】 / 【答案A、B、C】 / 【答案是】 / 【答案否】
ANS_RE = re.compile(
    r"[【\[]?答案[】\]：:〔(]?\s*([A-Z○×、\s是正确错误否]+)[】\]〕)]?"
)


def extract_pages(pdf_path):
    reader = pypdf.PdfReader(pdf_path)
    return [page.extract_text() for page in reader.pages]


def parse_questions(pages):
    questions = []
    current_q = None
    full_text = "\n".join(pages[4:])  # skip TOC

    # 当前章节追踪（从章节标题行检测）
    current_chapter_id = 0
    current_chapter_title = ""

    # 章节标题模式（行首出现，用于跳过行+切换章节）
    CHAPTER_PAT = re.compile(r"^\s*[第终][一二三四五六七八九十\d]+[章节篇课条]|^\s*(?:下列|以下|附件|附录|参考)")

    for line in full_text.split("\n"):
        raw = line
        line = line.strip()

        # ---- 章节标题检测（优先于所有其他处理） ----
        is_chapter_header = False
        for pattern, cid, ctitle in CHAPTER_HEADER_MAP:
            if re.search(pattern, line):
                current_chapter_id = cid
                current_chapter_title = ctitle
                is_chapter_header = True
                break
        if is_chapter_header:
            continue

        # ---- 空行 / 页码 / 噪声 ----
        if not line:
            continue
        if re.match(r"^\d+$", line):
            continue
        # 行首大量空白 + 尾部短文本 → 页眉页脚
        leading_spaces = len(raw) - len(raw.lstrip())
        if leading_spaces > 40 and len(line) < 12:
            continue
        # 只有特殊字符的行
        if re.match(r"^[\s\"\'\+\(\)\[\]<>，。、：；？！…—·％]+$", line):
            continue

        # ---- 新题目 ----
        m = re.match(r"^(\d+)[\.、]\s*(.*)", line)
        if m:
            if current_q:
                _finalize_question(questions, current_q)
            current_q = {
                "id": int(m.group(1)),
                "stem": m.group(2).strip(),
                "options": [],
                "answer": [],
                "chapterId": current_chapter_id,
                "chapterTitle": current_chapter_title,
                "_tf": False,
                "_has_opts": False,  # 是否已开始收集选项
            }
            continue

        if current_q is None:
            continue

        # ---- 选项行 A. xxx ----
        m = re.match(r"^\s*([A-H])[\.、]\s*(.*)", line)
        if m and "答案" not in m.group(2)[:4]:
            current_q["options"].append({"label": m.group(1), "text": m.group(2).strip()})
            current_q["_has_opts"] = True
            continue

        # ---- 答案（答案行之后终止续行） ----
        m = ANS_RE.search(line)
        if m:
            ans_str = m.group(1).strip().replace(" ", "").replace("、", "")
            current_q["answer"] = list(ans_str)
            current_q["_done"] = True
            continue

        # ---- 续行处理 ----
        # 没有匹配任何模式 → 可能是题干续行或选项续行
        # 但跳过章节标题（例如 "第一节 互联网+医疗健康篇"）
        if CHAPTER_PAT.search(line):
            continue
        # 【解析】等解释性内容，跳过且不再续行到此题的选项/题干中
        if re.search(r"【解析|【分析|【说明|【注释|【考点|【难度", line):
            current_q["_done"] = True
            continue
        if current_q.get("_done"):
            continue
        if not current_q["_has_opts"]:
            # 还没看到选项 → 续到题干
            if current_q["stem"]:
                current_q["stem"] += line
            else:
                current_q["stem"] = line
        else:
            # 已经看到选项 → 续到最后一条选项文本
            if current_q["options"]:
                current_q["options"][-1]["text"] += line

    if current_q:
        _finalize_question(questions, current_q)

    return questions


def _finalize_question(questions, q):
    """完成题目：处理判断题的选项和答案"""
    if q.get("answer") and not q.get("options"):
        ans = q["answer"]
        if ans in (["是"], ["正确"]):
            q["options"] = [{"label": "○", "text": "正确"}, {"label": "×", "text": "错误"}]
            q["answer"] = ["○"]
        elif ans in (["否"], ["错误"]):
            q["options"] = [{"label": "○", "text": "正确"}, {"label": "×", "text": "错误"}]
            q["answer"] = ["×"]

    if q.get("options"):
        questions.append(q)


def _clean_stem(stem):
    """清洗题干：去掉误带入的选项标记（如 ○是○否）"""
    s = stem.strip()
    # 去掉尾部的 ○是○否 / ×正确×错误 等模式（含前面的括号和空白）
    s = re.sub(
        r"\s*[（(][^）)]*[）)]?\s*[○〇×✗✕]\s*(正确|是)\s*[○〇×✗✕]\s*(错误|否)\s*$",
        "",
        s,
    )
    # 再去掉尾部残留的独立选项标记
    s = re.sub(r"\s*[○〇×✗✕]\s*(正确|是)\s*[○〇×✗✕]\s*(错误|否)\s*$", "", s)
    # 恢复标准填空标记
    s = re.sub(r"\s*[（(]\s*[）)]\s*$", "（    ）", s)
    s = re.sub(r"\s*[○〇×✗✕]\s*$", "", s)
    return s.strip()


def post_process(questions):
    """后处理：去重、类型识别、重编号、题干清洗"""
    seen = set()
    result = []

    for q in questions:
        stem = _clean_stem(q["stem"])
        if len(stem) < 2 or not q["options"] or not q["answer"]:
            continue

        key = (q.get("chapterId", 0), stem[:30])
        if key in seen:
            continue
        seen.add(key)

        q["stem"] = stem

        labels = {o["label"] for o in q["options"]}
        if labels == {"○", "×"} or labels == {"×", "○"}:
            q["type"] = "truefalse"
            q["options"] = [{"label": "○", "text": "正确"}, {"label": "×", "text": "错误"}]
        elif len(q["answer"]) > 1:
            q["type"] = "multiple"
        else:
            q["type"] = "single"
        result.append(q)

    for i, q in enumerate(result, 1):
        q["id"] = i

    return result


def export(questions, output_dir):
    os.makedirs(output_dir, exist_ok=True)

    data = []
    for q in questions:
        item = {
            "id": q["id"],
            "chapterId": q.get("chapterId", 0),
            "chapterTitle": q.get("chapterTitle", ""),
            "type": q["type"],
            "stem": q["stem"],
            "options": q["options"],
            "answer": q["answer"],
        }
        data.append(item)

    json_path = os.path.join(output_dir, "questions.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    js_path = os.path.join(output_dir, "questions.js")
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("const QUESTIONS = ")
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    single = sum(1 for q in data if q["type"] == "single")
    multiple = sum(1 for q in data if q["type"] == "multiple")
    tf = sum(1 for q in data if q["type"] == "truefalse")

    print(f"OK: {len(data)} questions (single={single}, multiple={multiple}, tf={tf})")
    print(f"  -> {json_path}")
    print(f"  -> {js_path}")


def main():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pdf_path = os.path.join(base, "exercise_pdf", "附件：北京市互联网诊疗医务人员准入习题集.pdf")

    if not os.path.exists(pdf_path):
        print(f"ERROR: PDF not found: {pdf_path}")
        sys.exit(1)

    pages = extract_pages(pdf_path)
    raw = parse_questions(pages)
    questions = post_process(raw)
    export(questions, os.path.join(base, "static", "js"))


if __name__ == "__main__":
    main()
