document.addEventListener("DOMContentLoaded", function () {

let products = [];
let order = [];

// 🔥 загрузка из JSON (локально)
function loadProducts() {
  const CACHE_KEY = "products_cache";

  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      products = JSON.parse(cached);
      console.log("Прайс из кэша:", products);
    } catch (e) {
      console.warn("Кэш битый");
    }
  }

  fetch("products.json?t=" + Date.now())
    .then(res => res.json())
    .then(data => {
      products = data;
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      console.log("Прайс обновлён:", products);
    })
    .catch((e) => {
      console.warn("Нет интернета, используем кэш");
      if (!products.length) {
        alert("Нет интернета и кэш пуст");
      }
    });
}

loadProducts();


// ===== СУММА ПРОПИСЬЮ (FIXED) =====
function numberToText(num) {
  const ones = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
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
      if (female) {
        if (n === 1) str += "одна ";
        else if (n === 2) str += "две ";
        else str += ones[n] + " ";
      } else {
        str += ones[n] + " ";
      }
    }

    return str;
  }

  let rub = Math.floor(num);
  let kop = Math.round((num - rub) * 100);

  let result = "";

  if (rub === 0) result = "ноль ";

  // 🔥 МИЛЛИОНЫ (фикс безопасный)
if (rub >= 1000000) {
  let millions = Math.floor(rub / 1000000);

  if (millions < 1000) {
    result += parseHundreds(millions);
  } else {
    result += millions + " ";
  }

  result += plural(millions, "миллион", "миллиона", "миллионов") + " ";
  rub %= 1000000;
}

  // 🔥 ТЫСЯЧИ
  if (rub >= 1000) {
    let thousands = Math.floor(rub / 1000);
    result += parseHundreds(thousands, true) + plural(thousands, "тысяча", "тысячи", "тысяч") + " ";
    rub %= 1000;
  }

  // 🔥 ОСТАТОК
  result += parseHundreds(rub);
  result += plural(Math.floor(num), "рубль", "рубля", "рублей");

  if (kop > 0) {
    result += " " + kop + " " + plural(kop, "копейка", "копейки", "копеек");
  }

  return result.trim();
}

// 🔍 поиск (без изменений)
document.getElementById("search").addEventListener("input", function () {
  const value = this.value.toLowerCase();
  const box = document.getElementById("suggestions");

  if (!value || !products.length) return box.innerHTML = "";

  const results = products
    .filter(p => String(p["Артикул"] || "").toLowerCase().includes(value))
    .slice(0, 5);

  box.innerHTML = results.map(p => `
    <div onclick="selectProduct('${p["Артикул"]}', ${Number(p["Цена"])})">
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
    const price = Number(i.price);
    const qty = Number(i.qty);

    total += price * qty;

    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <input value="${i.name}" onchange="order[${index}].name=this.value">
      <input value="${qty}" type="number" onchange="order[${index}].qty=Number(this.value); render();">
      <input value="${price}" type="number" onchange="order[${index}].price=Number(this.value); render();">
      <b>${price * qty} ₽</b>
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



// 🔥 НАКЛАДНАЯ
function getPrintHTML() {

  const name = document.getElementById("name").value;
  const from = document.getElementById("from").value;
  const number = document.getElementById("invoiceNumber").value || "";

  // ✅ ВСЕГДА ПО 8 ПОЗИЦИЙ
  const ITEMS = 8;

  function chunk(arr) {
    let r = [];
    for (let i = 0; i < arr.length; i += ITEMS) {
      r.push(arr.slice(i, i + ITEMS));
    }
    return r;
  }

  const chunks = chunk(order);

  function doc(items) {
    let rows = "";
    let total = 0;

    items.forEach((i, index) => {
      total += i.price * i.qty;

      rows += `
        <tr>
          <td>${index + 1}</td>
          <td>${i.name}</td>
          <td>шт</td>
          <td>${i.qty}</td>
          <td>${i.price}</td>
          <td>${i.price * i.qty}</td>
        </tr>
      `;
    });

    return `
      <div class="doc">
        <div class="date">от «__» __________ 2026 г.</div>
        <h2>НАКЛАДНАЯ № ${number || "________"}</h2>

        <div><b>Кому:</b> ${name || ""}</div>
        <div><b>От кого:</b> ${from}</div>

        <table>
          <tr>
            <th>№</th>
            <th>Наименование</th>
            <th>Ед</th>
            <th>Кол-во</th>
            <th>Цена</th>
            <th>Сумма</th>
          </tr>

          ${rows}

          <tr>
            <td colspan="6" style="text-align:left;">
              <b>Итого:</b> ${total} ₽
              <br>
              ${numberToText(total)}
            </td>
          </tr>
        </table>

        <div class="sign">
          <div class="sign-block">
            Сдал:
            <div class="line"></div>
            <div class="sub">
              <span>подпись</span>
              <span>расшифровка подписи</span>
            </div>
          </div>

          <div class="sign-block">
            Принял:
            <div class="line"></div>
            <div class="sub">
              <span>подпись</span>
              <span>расшифровка подписи</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  let pages = "";

  chunks.forEach(chunk => {
    pages += `
      <div class="page">
        ${doc(chunk)}
        <div class="cut"></div>
        ${doc(chunk)}
      </div>
    `;
  });

  return `
  <html>
  <head>
    <style>
      @page { size: A4; margin: 0; }
      body { font-family: Arial; margin: 0; }

      .page {
        width: 210mm;
        height: 297mm;
        padding: 10mm;
        box-sizing: border-box;
      }

      .doc {
        height: 135mm;
      }

      table {
        width:100%;
        border-collapse:collapse;
        border:2px solid black;
        font-size:12px;
      }

      th,td {
        border:1px solid black;
        padding:5px;
        text-align:center;
      }

      .sign {
        margin-top:15px;
        display:flex;
        justify-content:space-between;
      }

      .sign-block {
        width:45%;
        font-size:12px;
      }

      .line {
        border-bottom:1px solid black;
        height:20px;
        margin-top:5px;
      }

      .sub {
        display:flex;
        justify-content:space-between;
        font-size:10px;
      }

      .date { text-align:right; }

      .cut {
        height:5mm;
        border-top:2px dashed black;
        margin:5mm 0;
      }
    </style>
  </head>
  <body>
    ${pages}
  </body>
  </html>
  `;
}

// 🖨 печать
window.printOrder = function() {
  const win = window.open("", "_blank");

  if (!win) {
    alert("Разреши всплывающие окна");
    return;
  }

  win.document.write(getPrintHTML());
  win.document.close();

  setTimeout(() => win.print(), 300);
};


// 📄 PDF
window.downloadPDF = function() {
  const win = window.open("", "_blank");
  win.document.write(getPrintHTML());
  win.document.close();

  setTimeout(() => {
    win.print();
  }, 300);
};

});