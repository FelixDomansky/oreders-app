document.addEventListener("DOMContentLoaded", function () {

let products = [];
let order = [];

// 🔥 загрузка из JSON (вместо Google Sheets)
fetch("products.json?t=" + Date.now())
  .then(res => res.json())
  .then(data => {
    products = data;
    console.log("Прайс загружен:", products);
  })
  .catch(() => alert("Ошибка загрузки прайса"));


// ===== СУММА ПРОПИСЬЮ (НЕ ТРОГАЛ) =====
function numberToText(num) {
  const ones = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
  const onesFemale = ["", "одна", "две"];
  const teens = ["десять","одиннадцать","двенадцать","тринадцать","четырнадцать","пятнадцать","шестнадцать","семнадцать","восемнадцать","девятнадцать"];
  const tens = ["","","двадцать","тридцать","сорок","пятьдесят","шестьдесят","семьдесят","восемьдесят","девяносто"];
  const hundreds = ["","сто","двести","триста","четыреста","пятьсот","шестьсот","семьсот","восемьсот","девятьсот"];

  function plural(n, one, two, five) {
    n = Math.abs(n) % 100;
    let n1 = n % 10;
    if (n > 10 && n < 20) return five;
    if (n1 > 1 && n1 < 5) return two;
    if (n1 == 1) return one;
    return five;
  }

  function parseHundreds(n, female = false) {
    let str = "";

    if (n >= 100) {
      str += hundreds[Math.floor(n / 100)] + " ";
      n %= 100;
    }

    if (n >= 10 && n <= 19) {
      str += teens[n - 10] + " ";
      return str;
    }

    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }

    if (n > 0) {
      if (female && n <= 2) str += onesFemale[n] + " ";
      else str += ones[n] + " ";
    }

    return str;
  }

  let rub = Math.floor(num);
  let kop = Math.round((num - rub) * 100);

  let result = "";

  if (rub === 0) result = "ноль ";

  if (rub >= 1000) {
    let thousands = Math.floor(rub / 1000);
    result += parseHundreds(thousands, true);
    result += plural(thousands, "тысяча", "тысячи", "тысяч") + " ";
    rub %= 1000;
  }

  result += parseHundreds(rub);
  result += plural(Math.floor(num), "рубль", "рубля", "рублей");

  if (kop > 0) {
    result += " " + kop + " " + plural(kop, "копейка", "копейки", "копеек");
  }

  return result.trim();
}


// 🔍 поиск (чуть улучшен, но логика та же)
document.getElementById("search").addEventListener("input", function () {
  const value = this.value.toLowerCase().replace(/\s/g, "").replace(/\./g, "");
  const box = document.getElementById("suggestions");

  if (!value) return box.innerHTML = "";

  const results = products
    .filter(p => {
      const art = String(p["Артикул"] || "")
        .toLowerCase()
        .replace(/\s/g, "")
        .replace(/\./g, "");
      return art.includes(value);
    })
    .slice(0, 5);

  box.innerHTML = results.map(p => `
    <div onclick="selectProduct('${p["Артикул"]}', ${p["Цена"]})">
      ${p["Артикул"]} (${p["Цена"]} ₽)
    </div>
  `).join("");
});

window.selectProduct = function(article, price) {
  document.getElementById("search").value = article;
  document.getElementById("price").value = price;
  document.getElementById("suggestions").innerHTML = "";
};


// ENTER
document.getElementById("search").addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    const first = document.querySelector("#suggestions div");
    if (first) first.click();
    addItem();
  }
});

document.getElementById("qty").addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    addItem();
  }
});


// ➕ добавить
window.addItem = function() {
  const name = document.getElementById("search").value;
  let price = Number(document.getElementById("price").value);
  const qty = Number(document.getElementById("qty").value) || 1;

  if (!name) return;

  order.push({ name, price: price || 0, qty });

  document.getElementById("search").value = "";
  document.getElementById("price").value = "";
  document.getElementById("qty").value = "";

  render();
};


// ❌ удаление
window.removeItem = function(index) {
  order.splice(index, 1);
  render();
};


// 🔄 отрисовка
function render() {
  const box = document.getElementById("order");
  box.innerHTML = "";

  let total = 0;

  order.forEach((i, index) => {
    total += i.price * i.qty;

    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <input value="${i.name}" onchange="order[${index}].name=this.value">
      <input value="${i.qty}" type="number" onchange="order[${index}].qty=this.value; render();">
      <input value="${i.price}" type="number" onchange="order[${index}].price=this.value; render();">
      <b>${i.price * i.qty} ₽</b>
      <button onclick="removeItem(${index})">Удалить</button>
    `;

    box.appendChild(div);
  });

  document.getElementById("total").innerText = "Итого: " + total + " ₽";
}


// 🧹 очистка
window.clearOrder = function() {
  order = [];
  render();
};


// 🖨 печать (НЕ ТРОГАЛ)
window.printOrder = function() {
  const win = window.open("", "_blank");
  win.document.write(getPrintHTML());
  win.document.close();
  setTimeout(() => win.print(), 300);
};


// 📄 PDF (НЕ ТРОГАЛ)
window.downloadPDF = function() {
  const win = window.open("", "_blank");
  win.document.write(getPrintHTML());
  win.document.close();

  setTimeout(() => {
    win.print();
  }, 300);
};

});