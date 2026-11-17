// 豆知識ツールの計算（サーバーに何も送らない）
(function () {
  var yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });
  var o = document.querySelector("[data-okaeshi]");
  if (o) {
    var min = Number(o.dataset.min), max = Number(o.dataset.max), out = o.querySelector("[data-result]");
    o.querySelector("input").addEventListener("input", function (e) {
      var v = Number(e.target.value);
      if (!v || v < 0) { out.textContent = "金額を入れると、目安が表示されます。"; return; }
      var lo = Math.round(v * min / 500) * 500, hi = Math.round(v * max / 500) * 500;
      out.textContent = "お返しの目安は " + yen.format(lo) + "〜" + yen.format(hi) + " です。";
    });
  }
  var c = document.querySelector("[data-chouju]");
  if (c) {
    var rows = JSON.parse(c.dataset.rows), res = c.querySelector("[data-result]");
    var year = new Date().getFullYear();
    c.querySelector("input").addEventListener("input", function (e) {
      var b = Number(e.target.value);
      if (!b || b < 1900 || b > year) { res.textContent = "生まれ年を入れると、次の長寿祝いが表示されます。"; return; }
      var next = rows.find(function (r) { return b + r.age >= year; });
      res.textContent = next
        ? next.name + "（" + next.age + "歳・色は" + next.color + "）は " + (b + next.age) + "年です。"
        : "早見表の範囲を超えています。";
    });
  }
})();
