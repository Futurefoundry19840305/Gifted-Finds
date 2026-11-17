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
        navigator.clipboard.writeText(b.getAttribute("data-copy")).then(function () { b.textContent = "コピーしました"; });
      });
    });
  } catch (e) { /* 失敗しても表示には影響させない */ }
})();
