let products = [];
let order = [];

// загрузка прайса
fetch("https://opensheet.elk.sh/166XC1AbpeiyA6Q_Zo0Va_KpEzfzoCNLXlF66-mprS7M/Лист1")
  .then(res => res.json())
  .then(data => {
    products = data;
  });

// перевод суммы в текст (упрощенный)
function numberToText(num) {
  if (!num) return "ноль рублей";
  return num + " рублей";
}

// поиск
function searchProduct() {
  const value = document.getElementById("search").value.toLowerCase();
  const box = document.getElementById("suggestions");

  if (!value) {
    box.innerHTML = "";
    return;
  }

  const results = products.filter(p =>
    String(p["Артикул"] || "").toLowerCase().includes(value)
  ).slice(0, 5);

  box.innerHTML = results.map(p => `
    <div onclick="selectProduct(\`${p["Артикул"]}\`, ${p["Цена"]})"
         style="padding:8px;border:1px solid #ccc;background:white;cursor:pointer;">
      ${p["Артикул"]} (${p["Цена"]} ₽)
    </div>
  `).join("");
}

// выбор
function selectProduct(article, price) {
  document.getElementById("search").value = article;
  document.getElementById("price").value = price;
  document.getElementById("suggestions").innerHTML = "";
}

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

// добавить
function addItem() {
  const name = document.getElementById("search").value;
  let price = Number(document.getElementById("price").value);
  const qty = Number(document.getElementById("qty").value) || 1;

  if (!name) return;
  if (!price) price = 0;

  order.push({ name, price, qty });

  document.getElementById("search").value = "";
  document.getElementById("price").value = "";
  document.getElementById("qty").value = "";

  render();
}

// отрисовка
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
      <button onclick="order.splice(${index},1); render();">❌</button>
    `;

    box.appendChild(div);
  });

  document.getElementById("total").innerText = "Итого: " + total + " ₽";
}

// очистка
function clearOrder() {
  order = [];
  render();
}

// печать
function printOrder() {
  const name = document.getElementById("name").value;
  const from = document.getElementById("from").value;
  const number = document.getElementById("invoiceNumber").value || "";

  const ITEMS_PER_DOC = 10;

  function chunkArray(arr, size) {
    let result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  const chunks = chunkArray(order, ITEMS_PER_DOC);

  function createDoc(items) {
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
            <td colspan="5" style="text-align:right;"><b>Итого:</b></td>
            <td>
              <b>${total} ₽</b><br>
              <small>${numberToText(total)}</small>
            </td>
          </tr>
        </table>

        <div class="sign">
          <div>Сдал: _____________</div>
          <div>Принял: _____________</div>
        </div>
      </div>
    `;
  }

  let pages = "";

  chunks.forEach(chunk => {
    pages += `
      <div class="page">
        ${createDoc(chunk)}
        <div class="cut"></div>
        ${createDoc(chunk)}
      </div>
    `;
  });

  const html = `
  <html>
  <head>
    <style>
      @page { margin: 0; }

      @media print {
        body { margin:0; }

        .page {
          height: 277mm;
          padding: 10mm;
          box-sizing: border-box;
          page-break-after: always;
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

        h2 {
          text-align:center;
        }

        .date {
          text-align:right;
        }

        .cut {
          height:5mm;
          border-top:2px dashed black;
          margin:5mm 0;
        }
      }
    </style>
  </head>

  <body>
    ${pages}
  </body>
  </html>
  `;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.print();
}