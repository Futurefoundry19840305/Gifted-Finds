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
    var msg = function (t) { res.innerHTML = ""; var p = document.createElement("p"); p.className = "result"; p.textContent = t; res.appendChild(p); };
    c.querySelector("input").addEventListener("input", function (e) {
      var age = Number(e.target.value);
      if (e.target.value === "" || !Number.isInteger(age) || age < 0 || age > 120) { msg("年齢を入れると、これから迎える長寿祝いが表示されます。"); return; }
      var next = rows.filter(function (r) { return r.age >= age; });
      if (!next.length) { msg("早見表の長寿祝い（百寿まで）はすべて迎えられています。"); return; }
      res.innerHTML = "";
      var ul = document.createElement("ul"); ul.className = "chouju-list";
      next.forEach(function (r) {
        var left = r.age - age;
        var li = document.createElement("li");
        var when = left === 0 ? "今年の誕生日（" + year + "年）" : "あと" + left + "年・" + (year + left) + "年の誕生日";
        li.textContent = r.name + "（" + r.age + "歳・色は" + r.color + "）　" + when;
        ul.appendChild(li);
      });
      res.appendChild(ul);
    });
  }
})();
