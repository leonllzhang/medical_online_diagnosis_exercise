/* ========== Admin Dashboard ========== */

var AdminState = { page: 1, perPage: 20 };

document.addEventListener("DOMContentLoaded", function () {
  loadStats();
  loadRecords();
  updateExportLink();

  document.getElementById("btnSearch").addEventListener("click", function () {
    AdminState.page = 1;
    loadRecords();
  });

  // Enter key triggers search
  document.querySelectorAll("#filterName, #filterDepartment, #filterStatus, #filterDateFrom, #filterDateTo").forEach(function (el) {
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter") document.getElementById("btnSearch").click();
    });
  });

  // Modal close
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("detailModal").addEventListener("click", function (e) {
    if (e.target === this) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
  });

  // Update export link when filters change
  document.getElementById("btnSearch").addEventListener("click", updateExportLink);
  document.getElementById("btnExport").addEventListener("click", function (e) {
    // Let the native href handle it
  });
});

function getFilters() {
  return {
    name: document.getElementById("filterName").value.trim(),
    department: document.getElementById("filterDepartment").value.trim(),
    status: document.getElementById("filterStatus").value,
    date_from: document.getElementById("filterDateFrom").value,
    date_to: document.getElementById("filterDateTo").value,
  };
}

function buildQuery(params) {
  var q = [];
  for (var k in params) {
    if (params[k]) q.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
  }
  return q.join("&");
}

function updateExportLink() {
  var f = getFilters();
  var href = "/api/records/export?" + buildQuery(f);
  document.getElementById("btnExport").href = href;
}

/* ---------- Stats ---------- */

function loadStats() {
  fetch("/api/stats")
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res.code !== 0) return;
      var d = res.data;
      document.getElementById("statTotal").textContent = d.total_examinees;
      document.getElementById("statPass").textContent = d.pass_count;
      document.getElementById("statFail").textContent = d.fail_count;
      document.getElementById("statAvg").textContent = d.avg_score;
    })
    .catch(function () {});
}

/* ---------- Records ---------- */

function loadRecords() {
  var f = getFilters();
  f.page = AdminState.page;
  f.per_page = AdminState.perPage;

  var tbody = document.getElementById("recordsBody");
  tbody.innerHTML = '<tr><td colspan="7" class="empty-state">加载中...</td></tr>';

  fetch("/api/records?" + buildQuery(f))
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res.code !== 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">加载失败</td></tr>';
        return;
      }
      renderRecords(res.data);
    })
    .catch(function () {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">网络错误</td></tr>';
    });
}

function renderRecords(data) {
  var tbody = document.getElementById("recordsBody");
  var records = data.records;

  if (!records || records.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">暂无考核记录</td></tr>';
    document.getElementById("pagination").innerHTML = "";
    return;
  }

  tbody.innerHTML = records
    .map(function (r, i) {
      var idx = (data.page - 1) * data.per_page + i + 1;
      var statusCls = r.status === "pass" ? "status-pass" : "status-fail";
      var statusLabel = r.status === "pass" ? "合格" : "不合格";
      var time = formatTime(r.created_at);
      return (
        '<tr class="clickable-row" data-id="' +
        r.id +
        '">' +
        "<td>" + idx + "</td>" +
        "<td>" + escapeHtml(r.name) + "</td>" +
        "<td>" + escapeHtml(r.department) + "</td>" +
        "<td>" + r.score + "/" + r.total + "</td>" +
        "<td>" + r.percentage + "%</td>" +
        '<td><span class="status-badge ' + statusCls + '">' + statusLabel + "</span></td>" +
        "<td>" + time + "</td>" +
        "</tr>"
      );
    })
    .join("");

  // Click row to show detail
  tbody.querySelectorAll(".clickable-row").forEach(function (row) {
    row.addEventListener("click", function () {
      var id = parseInt(this.dataset.id);
      loadDetail(id);
    });
  });

  renderPagination(data);
}

/* ---------- Pagination ---------- */

function renderPagination(data) {
  var el = document.getElementById("pagination");
  if (data.pages <= 1) {
    el.innerHTML = "";
    return;
  }

  var html = "";
  // Prev
  html +=
    '<button class="page-btn" id="pagePrev" ' +
    (data.page <= 1 ? "disabled" : "") +
    ">&laquo; 上一页</button>";

  // Page numbers
  var start = Math.max(1, data.page - 2);
  var end = Math.min(data.pages, data.page + 2);
  for (var i = start; i <= end; i++) {
    html +=
      '<button class="page-btn' +
      (i === data.page ? " active" : "") +
      '" data-page="' +
      i +
      '">' +
      i +
      "</button>";
  }

  // Next
  html +=
    '<button class="page-btn" id="pageNext" ' +
    (data.page >= data.pages ? "disabled" : "") +
    ">下一页 &raquo;</button>";

  html += '<span class="page-info">共 ' + data.total + " 条</span>";

  el.innerHTML = html;

  // Bind page clicks
  el.querySelectorAll("[data-page]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      AdminState.page = parseInt(this.dataset.page);
      loadRecords();
    });
  });

  document.getElementById("pagePrev").addEventListener("click", function () {
    if (AdminState.page > 1) {
      AdminState.page--;
      loadRecords();
    }
  });

  document.getElementById("pageNext").addEventListener("click", function () {
    if (AdminState.page < data.pages) {
      AdminState.page++;
      loadRecords();
    }
  });
}

/* ---------- Detail Modal ---------- */

function loadDetail(id) {
  var modal = document.getElementById("detailModal");
  var body = document.getElementById("modalBody");
  body.innerHTML = '<div class="loading-screen" style="min-height:200px"><div class="loading-spinner"></div></div>';
  modal.classList.add("show");

  fetch("/api/records/" + id)
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res.code !== 0) {
        body.innerHTML = "<p>加载失败</p>";
        return;
      }
      renderDetail(res.data);
    })
    .catch(function () {
      body.innerHTML = "<p>网络错误</p>";
    });
}

function renderDetail(data) {
  // Info section
  var infoHtml =
    '<div class="modal-info-item"><span class="label">姓名：</span><span class="value">' +
    escapeHtml(data.name) +
    "</span></div>" +
    '<div class="modal-info-item"><span class="label">科室：</span><span class="value">' +
    escapeHtml(data.department) +
    "</span></div>" +
    '<div class="modal-info-item"><span class="label">得分：</span><span class="value">' +
    data.score +
    "/" +
    data.total +
    " (" +
    data.percentage +
    "%)</span></div>" +
    '<div class="modal-info-item"><span class="label">结果：</span><span class="value">' +
    (data.status === "pass" ? "合格" : "不合格") +
    "</span></div>" +
    '<div class="modal-info-item"><span class="label">时间：</span><span class="value">' +
    formatTime(data.created_at) +
    "</span></div>";

  document.getElementById("modalInfo").innerHTML = infoHtml;

  // Answers
  var answersEl = document.getElementById("modalAnswers");
  if (!data.answers || data.answers.length === 0) {
    answersEl.innerHTML = "<p style='color:var(--text-light)'>无详细答题记录</p>";
    return;
  }

  // Load questions to show stem text
  var questionsMap = {};
  if (typeof QUESTIONS !== "undefined") {
    QUESTIONS.forEach(function (q) {
      questionsMap[q.id] = q;
    });
  }

  answersEl.innerHTML = '<h3 style="font-size:15px;font-weight:600;margin-bottom:12px">逐题详情</h3>';
  data.answers.forEach(function (a, i) {
    var cls = a.correct ? "correct" : "wrong";
    var icon = a.correct ? "&#10004;" : "&#10008;";
    var q = questionsMap[a.questionId] || null;
    var stem = q ? q.stem : ("题目 #" + a.questionId);
    var selectedText = a.selected.length ? a.selected.join("、") : "未作答";
    var correctText = a.correctAnswer.join("、");

    answersEl.innerHTML +=
      '<div class="answer-detail ' +
      cls +
      '">' +
      '<div class="q-title">' +
      icon +
      " " +
      (i + 1) +
      ". " +
      escapeHtml(stem) +
      "</div>" +
      '<div class="q-detail">你的答案：' +
      escapeHtml(selectedText) +
      " &nbsp;|&nbsp; 正确答案：" +
      escapeHtml(correctText) +
      "</div>" +
      "</div>";
  });
}

function closeModal() {
  document.getElementById("detailModal").classList.remove("show");
}

/* ---------- Helpers ---------- */

function formatTime(isoStr) {
  if (!isoStr) return "";
  try {
    var d = new Date(isoStr);
    var pad = function (n) { return n < 10 ? "0" + n : n; };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  } catch (e) {
    return isoStr;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
