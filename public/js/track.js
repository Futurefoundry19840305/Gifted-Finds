// マナー記事を読んだことを覚え、比較記事の /go/ リンクに付ける（要件 FR-018）
// 個人を特定する情報は扱わない。sessionStorage はタブを閉じると消える。
(function () {
  // 閲覧数：送るのはページのパスだけ（IP・Cookie・端末情報は送らない）
  try { navigator.sendBeacon("/v", location.pathname); } catch (e) {}
  try {
    var el = document.querySelector("[data-manner]");
    if (el) sessionStorage.setItem("from_manner", el.getAttribute("data-manner"));
    var m = sessionStorage.getItem("from_manner");
    if (m && /^[a-z0-9-]{1,80}$/.test(m)) {
      document.querySelectorAll('a[href^="/go/"]').forEach(function (a) {
        a.href = a.getAttribute("href") + "?m=" + encodeURIComponent(m);
      });
    }
    document.querySelectorAll("button.copy[data-copy]").forEach(function (b) {
      b.addEventListener("click", function () {
        var fail = function () { b.textContent = "コピーできませんでした。文例を長押しかドラッグで選んでコピーしてください"; };
        try { navigator.clipboard.writeText(b.getAttribute("data-copy")).then(function () { b.textContent = "コピーしました"; }, fail); } catch (e) { fail(); }
      });
    });
    document.querySelectorAll("[data-back]").forEach(function (a) {
      a.addEventListener("click", function (e) { if (history.length > 1) { e.preventDefault(); history.back(); } else { a.href = "/"; } });
    });
    var fb = document.querySelector("[data-feedback]");
    if (fb) {
      var answer = null, send = function (reason) {
        try { navigator.sendBeacon("/f", location.pathname + "|" + answer + "|" + (reason || "")); } catch (e) {}
      };
      var step = function (n) { fb.querySelectorAll("[data-step]").forEach(function (el) { el.hidden = el.getAttribute("data-step") !== String(n); }); };
      fb.querySelectorAll("[data-answer]").forEach(function (b) {
        b.addEventListener("click", function () {
          answer = b.getAttribute("data-answer"); send("");
          fb.querySelector("[data-yes]").hidden = answer !== "yes";
          fb.querySelector("[data-no]").hidden = answer !== "no";
          step(2); var first = fb.querySelector(answer === "yes" ? "[data-yes] button" : "[data-no] button"); if (first) first.focus();
        });
      });
      fb.querySelectorAll("[data-reason]").forEach(function (b) {
        b.addEventListener("click", function () { send(b.getAttribute("data-reason")); step(3); });
      });
    }
  } catch (e) { /* 失敗しても表示には影響させない */ }
})();
