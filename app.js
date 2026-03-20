let order = [];
let products = {};

// 👉 ВСТАВЬ СЮДА СВОЙ GOOGLE SCRIPT URL
const API_URL = "ТВОЙ_URL";

// загрузка прайса
fetch(API_URL)
  .then(res => res.json())
  .then(data => {
    data.forEach(p => {
      products[p.article] = p.price;
    });
  });

// автоподстановка цены
document.getElementById("search").addEventListener("input", function () {
  const val = this.value;
  if (products[val]) {
    document.getElementById("price").value = products[val];
  }
});

function addItem() {
  const name = document.getElementById("search").value;
  const price = Number(document.getElementById("price").value);
  const qty = Number(document.getElementById("qty").value);

  if (!name || !price || !qty) return;

  order.push({ name, price, qty });

  document.getElementById("search").value = "";
  document.getElementById("price").value = "";
  document.getElementById("qty").value = "";

  render();
}

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

function clearOrder() {
  order = [];
  render();
}

function printOrder() {
  const name = document.getElementById("name").value;
  const from = document.getElementById("from").value;
  let baseNumber = parseInt(document.getElementById("invoiceNumber").value) || 1;

  // создаём временный контейнер для расчёта
  const temp = document.createElement("div");
  temp.style.position = "absolute";
  temp.style.visibility = "hidden";
  temp.style.width = "210mm";
  temp.style.padding = "10mm";
  temp.style.fontFamily = "Times New Roman";

  temp.innerHTML = `
    <table style="width:100%; border-collapse:collapse;">
      <tr>
        <td style="border:1px solid black; padding:5px;">Тест</td>
      </tr>
    </table>
  `;

  document.body.appendChild(temp);

  const rowHeight = temp.querySelector("td").offsetHeight;

  // высота под одну накладную (~половина листа)
  const availableHeight = 140; // мм примерно
  const pxPerMm = temp.offsetWidth / 210;

  const rowsPerDoc = Math.floor((availableHeight * pxPerMm) / rowHeight);

  document.body.removeChild(temp);

  // разбиваем заказ
  let chunks = [];
  for (let i = 0; i < order.length; i += rowsPerDoc) {
    chunks.push(order.slice(i, i + rowsPerDoc));
  }

  if (chunks.length === 0) chunks.push([]);

  function createDoc(items, number) {
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

        <h2>НАКЛАДНАЯ № ${number}</h2>

        <div><b>Кому:</b> ${name}</div>
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
            <td colspan="5" class="right"><b>Итого:</b></td>
            <td><b>${total} ₽</b></td>
          </tr>

          <tr>
            <td colspan="6" class="right">В том числе НДС ( )%</td>
          </tr>
        </table>

        <div class="sign">
          <div>Сдал: _____________</div>
          <div>Принял: _____________</div>
        </div>
      </div>
    `;
  }

  let pagesHTML = "";
  let docIndex = 0;

  while (docIndex < chunks.length) {
    const doc1 = createDoc(chunks[docIndex], baseNumber + docIndex);
    const doc2 = createDoc(
      chunks[docIndex + 1] || [],
      baseNumber + docIndex + 1
    );

    pagesHTML += `
      <div class="page">
        ${doc1}
        <hr>
        ${doc2}
      </div>
    `;

    docIndex += 2;
  }

  const html = `
  <html>
  <head>
    <style>
      body {
        font-family: "Times New Roman";
        margin: 0;
      }

      .page {
        height: 297mm;
        padding: 10mm;
        page-break-after: always;
      }

      .doc {
        height: 48%;
      }

      h2 {
        text-align: center;
        margin: 5px 0;
      }

      .date {
        text-align: right;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        border: 2px solid black;
        margin-top: 10px;
      }

      th, td {
        border: 1px solid black;
        padding: 5px;
        font-size: 14px;
        text-align: center;
      }

      .right {
        text-align: right;
      }

      .sign {
        margin-top: 20px;
        display: flex;
        justify-content: space-between;
      }

      hr {
        border-top: 2px dashed black;
        margin: 5px 0;
      }

      @media print {
        .page {
          page-break-after: always;
        }
      }
    </style>
  </head>

  <body>
    ${pagesHTML}
  </body>
  </html>
  `;

  const win = window.open("");
  win.document.write(html);
  win.print();
}