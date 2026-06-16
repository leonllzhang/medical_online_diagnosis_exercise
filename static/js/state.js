/* ========== Application State Machine ========== */

var AppState = {
  screen: "loading", // 'loading' | 'register' | 'exam' | 'result'
  user: { name: "", department: "" },
  allQuestions: [], // full question bank (fetched from API or loaded from JS)
  questions: [], // shuffled subset for this exam
  questionIndex: 0,
  userAnswers: [], // [{ selected: string[], revealed: boolean }] per question
  results: [], // computed on finish
};

/* ---------- Init ---------- */

function initApp() {
  var saved = loadState();
  if (saved && saved.screen === "exam") {
    // Restore from localStorage
    Object.assign(AppState, saved);
    render(AppState.screen);
  } else {
    // Load questions and show register
    loadQuestions(function (err, questions) {
      if (err) {
        document.getElementById("app").innerHTML = renderError("加载题目失败: " + err);
        return;
      }
      AppState.allQuestions = questions;
      AppState.screen = "register";
      render("register");
    });
  }
}

function loadQuestions(callback) {
  // If QUESTIONS was loaded via script tag (questions.js), use it
  if (typeof QUESTIONS !== "undefined" && Array.isArray(QUESTIONS) && QUESTIONS.length > 0) {
    callback(null, QUESTIONS);
    return;
  }
  // Fallback: load from JSON file
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/static/js/questions.json", true);
  xhr.onload = function () {
    if (xhr.status === 200) {
      try {
        var data = JSON.parse(xhr.responseText);
        callback(null, data);
      } catch (e) {
        callback("JSON 解析失败");
      }
    } else {
      callback("HTTP " + xhr.status);
    }
  };
  xhr.onerror = function () {
    callback("网络错误");
  };
  xhr.send();
}

/* ---------- Routing ---------- */

function render(screen) {
  AppState.screen = screen;
  var app = document.getElementById("app");
  switch (screen) {
    case "register":
      app.innerHTML = renderRegisterScreen();
      break;
    case "exam":
      app.innerHTML = renderExamScreen(AppState);
      break;
    case "result":
      app.innerHTML = renderResultScreen(AppState);
      break;
    default:
      app.innerHTML = renderLoading();
  }
  saveState(AppState);
}

/* ---------- Event Delegation ---------- */

document.addEventListener("DOMContentLoaded", function () {
  initApp();
  document.getElementById("app").addEventListener("click", handleClick);
});

function handleClick(e) {
  var target = e.target.closest("button");
  if (!target) return;

  switch (target.id) {
    case "register-form":
      // handled via form submit
      break;
    case "btn-next":
      handleNext();
      break;
    case "btn-finish":
      handleFinish();
      break;
    case "btn-restart":
      handleRestart();
      break;
    default:
      if (target.classList.contains("option-btn") && !target.classList.contains("disabled")) {
        handleOptionClick(target);
      }
  }
}

// Form submit via event delegation
document.addEventListener("DOMContentLoaded", function () {
  document.addEventListener("submit", function (e) {
    if (e.target.id === "register-form") {
      e.preventDefault();
      handleRegister();
    }
  });
});

/* ---------- Handlers ---------- */

function handleRegister() {
  var name = document.getElementById("name").value.trim();
  var department = document.getElementById("department").value.trim();
  if (!name) {
    alert("请输入姓名");
    return;
  }
  if (!department) {
    alert("请输入科室");
    return;
  }
  AppState.user = { name: name, department: department };
  startExam();
}

function startExam() {
  if (!AppState.allQuestions || AppState.allQuestions.length === 0) {
    alert("题库为空");
    return;
  }
  // Use all questions, shuffled
  AppState.questions = shuffleArray(AppState.allQuestions);
  AppState.questionIndex = 0;
  AppState.userAnswers = AppState.questions.map(function () {
    return null;
  });
  AppState.results = [];
  clearState();
  render("exam");
}

function handleOptionClick(button) {
  var optList = button.closest(".options-list");
  var qid = parseInt(optList.dataset.qid);
  var question = AppState.questions[AppState.questionIndex];
  var label = button.dataset.label;
  var ua = AppState.userAnswers[AppState.questionIndex] || { selected: [], revealed: false };

  if (question.type === "single" || question.type === "truefalse") {
    ua.selected = [label];
    ua.revealed = true;
  } else {
    // Multiple choice
    var idx = ua.selected.indexOf(label);
    if (idx === -1) {
      ua.selected.push(label); // add
    } else {
      ua.selected.splice(idx, 1); // remove
    }
    ua.revealed = true; // reveal immediately on change
  }

  AppState.userAnswers[AppState.questionIndex] = ua;
  saveState(AppState);
  render("exam");
}

function handleNext() {
  AppState.questionIndex++;
  // Auto-save
  saveState(AppState);
  render("exam");
}

function handleFinish() {
  // Compute results
  AppState.results = AppState.questions.map(function (q, i) {
    var ua = AppState.userAnswers[i];
    var selected = ua ? ua.selected : [];
    var result = checkAnswer(q, selected);
    return {
      questionIndex: i,
      questionId: q.id,
      selected: selected,
      correct: result.correct,
      correctAnswer: q.answer,
    };
  });

  // Submit to API
  submitResult(function (err, response) {
    if (err) {
      console.warn("提交结果失败:", err);
    } else {
      console.log("结果已保存, ID:", response.data.id);
    }
  });

  clearState();
  render("result");
}

function handleRestart() {
  clearState();
  AppState.screen = "register";
  AppState.user = { name: "", department: "" };
  AppState.questions = [];
  AppState.questionIndex = 0;
  AppState.userAnswers = [];
  AppState.results = [];
  render("register");
}

/* ---------- API Submission ---------- */

function submitResult(callback) {
  var payload = {
    name: AppState.user.name,
    department: AppState.user.department,
    answers: AppState.results.map(function (r) {
      return {
        questionId: r.questionId,
        selected: r.selected,
      };
    }),
  };

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/submit", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onload = function () {
    if (xhr.status === 200) {
      try {
        callback(null, JSON.parse(xhr.responseText));
      } catch (e) {
        callback("解析响应失败");
      }
    } else {
      callback("HTTP " + xhr.status);
    }
  };
  xhr.onerror = function () {
    callback("网络错误");
  };
  xhr.send(JSON.stringify(payload));
}
