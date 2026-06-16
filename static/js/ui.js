/* ========== UI Rendering Functions ========== */

function renderLoading() {
  return '<div class="loading-screen"><div class="loading-spinner"></div><p>加载中...</p></div>';
}

function renderError(msg) {
  return '<div class="error-screen"><p style="color:red;text-align:center;padding:40px">' + msg + "</p></div>";
}

/* ---------- Register Screen ---------- */

function renderRegisterScreen() {
  return (
    '<div class="app-container">' +
    '<div class="card register-card">' +
    '<div class="logo-area">' +
    '<h1 class="title">北京市互联网诊疗<br/>医务人员准入考试</h1>' +
    '<p class="subtitle">在线练习系统</p>' +
    "</div>" +
    '<form id="register-form">' +
    '<div class="form-group">' +
    '<label for="name">姓名</label>' +
    '<input type="text" id="name" placeholder="请输入您的姓名" required autocomplete="name" />' +
    "</div>" +
    '<div class="form-group">' +
    '<label for="department">科室</label>' +
    '<input type="text" id="department" placeholder="请输入您所在的科室" required autocomplete="organization" />' +
    "</div>" +
    '<button type="submit" class="btn btn-primary btn-block">开始答题</button>' +
    "</form>" +
    "</div>" +
    "</div>"
  );
}

/* ---------- Exam Screen ---------- */

function renderExamScreen(state) {
  var q = state.questions[state.questionIndex];
  var ua = state.userAnswers[state.questionIndex] || null;
  var total = state.questions.length;
  var index = state.questionIndex;
  var progress = Math.round(((index + 1) / total) * 100);

  var typeLabel = q.type === "single" ? "单选题" : q.type === "multiple" ? "多选题" : "判断题";

  // Build options
  var optionsHtml = q.options
    .map(function (opt) {
      return renderOption(q, opt, ua);
    })
    .join("");

  // Feedback
  var feedbackHtml = "";
  if (ua && ua.revealed) {
    feedbackHtml = renderFeedback(q, ua);
  }

  // Next/Finish button
  var navBtn = "";
  if (ua && ua.revealed) {
    if (index < total - 1) {
      navBtn = '<button class="btn btn-primary btn-block" id="btn-next">下一题</button>';
    } else {
      navBtn = '<button class="btn btn-primary btn-block" id="btn-finish">完成答题</button>';
    }
  }

  return (
    '<div class="app-container exam-container">' +
    '<div class="exam-header">' +
    '<div class="progress-bar"><div class="progress-fill" style="width:' +
    progress +
    '%"></div></div>' +
    '<div class="meta-row">' +
    '<span class="question-counter">第 ' +
    (index + 1) +
    " / " +
    total +
    " 题</span>" +
    '<span class="type-tag type-' +
    q.type +
    '">' +
    typeLabel +
    "</span>" +
    "</div>" +
    "</div>" +
    '<div class="question-card">' +
    '<div class="question-stem">' +
    (index + 1) +
    ". " +
    q.stem +
    "</div>" +
    '<div class="options-list" data-qid="' +
    q.id +
    '">' +
    optionsHtml +
    "</div>" +
    feedbackHtml +
    "</div>" +
    '<div class="exam-footer">' +
    navBtn +
    "</div>" +
    "</div>"
  );
}

function renderOption(question, opt, userAnswer) {
  var isSelected = userAnswer && userAnswer.selected.indexOf(opt.label) !== -1;
  var isCorrectAnswer = question.answer.indexOf(opt.label) !== -1;
  var cssClass = "option-btn";

  if (userAnswer && userAnswer.revealed) {
    if (isCorrectAnswer) cssClass += " correct";
    if (isSelected && !isCorrectAnswer) cssClass += " wrong";
    else if (isSelected) cssClass += " selected";
    cssClass += " disabled";
  } else if (isSelected) {
    cssClass += " selected";
  }

  var prefix = question.type === "multiple" ? "☐" : "○";

  return (
    '<button class="' +
    cssClass +
    '" data-label="' +
    opt.label +
    '">' +
    '<span class="option-prefix">' +
    prefix +
    "</span>" +
    '<span class="option-label">' +
    opt.label +
    ".</span>" +
    '<span class="option-text">' +
    opt.text +
    "</span>" +
    "</button>"
  );
}

function renderFeedback(question, userAnswer) {
  var result = checkAnswer(question, userAnswer.selected);
  var isCorrect = result.correct;
  var icon = isCorrect ? "&#10004;" : "&#10008;";
  var text = isCorrect ? "回答正确！" : "回答错误";
  var cls = isCorrect ? "feedback-correct" : "feedback-wrong";

  return (
    '<div class="feedback ' +
    cls +
    '">' +
    '<div class="feedback-icon">' +
    icon +
    "</div>" +
    '<div class="feedback-text">' +
    text +
    "</div>" +
    '<div class="feedback-answer">正确答案：' +
    question.answer.join("、") +
    "</div>" +
    "</div>"
  );
}

/* ---------- Result Screen ---------- */

function renderResultScreen(result) {
  var scoreData = calculateScore(result.results);
  if (!scoreData) return renderError("无法计算成绩");

  var passed = scoreData.percentage >= 60;
  var statusText = passed ? "合格" : "不合格";
  var statusCls = passed ? "pass" : "fail";

  var reviewHtml = "";
  if (result.results) {
    reviewHtml =
      '<div class="review-section">' +
      '<h3 class="review-title">答题详情</h3>' +
      '<div class="review-list">' +
      result.results
        .map(function (r, i) {
          var cls = r.correct ? "item-correct" : "item-wrong";
          var icon = r.correct ? "&#10004;" : "&#10008;";
          return (
            '<div class="review-item ' +
            cls +
            '">' +
            '<span class="review-icon">' +
            icon +
            "</span>" +
            '<span class="review-q">第 ' +
            (i + 1) +
            " 题</span>" +
            '<span class="review-answer">正确答案：' +
            r.correctAnswer.join("、") +
            "</span>" +
            '<span class="review-your">你的答案：' +
            (r.selected.length ? r.selected.join("、") : "未作答") +
            "</span>" +
            "</div>"
          );
        })
        .join("") +
      "</div>" +
      "</div>";
  }

  return (
    '<div class="app-container result-container">' +
    '<div class="result-card card">' +
    '<h2 class="result-heading">答题结果</h2>' +
    '<div class="result-meta">' +
    '<span>' +
    result.user.name +
    "</span>" +
    '<span class="meta-sep">|</span>' +
    '<span>' +
    result.user.department +
    "</span>" +
    "</div>" +
    '<div class="score-circle ' +
    statusCls +
    '">' +
    '<span class="score-num">' +
    scoreData.score +
    "</span>" +
    '<span class="score-divider">/</span>' +
    '<span class="score-total">' +
    scoreData.total +
    "</span>" +
    "</div>" +
    '<div class="score-details">' +
    '<div class="score-row"><span>正确</span><span class="text-green">' +
    scoreData.score +
    " 题</span></div>" +
    '<div class="score-row"><span>错误</span><span class="text-red">' +
    (scoreData.total - scoreData.score) +
    " 题</span></div>" +
    '<div class="score-row"><span>正确率</span><span>' +
    scoreData.percentage +
    "%</span></div>" +
    '<div class="score-row result-status ' +
    statusCls +
    '"><span>结果</span><span>' +
    statusText +
    "</span></div>" +
    "</div>" +
    reviewHtml +
    '<button class="btn btn-primary btn-block" id="btn-restart">重新答题</button>' +
    "</div>" +
    "</div>"
  );
}
