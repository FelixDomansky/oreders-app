let products = [];
let order = [];

// Excel загрузка
document.getElementById("fileInput").addEventListener("change", function(e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function(evt) {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);

    products = json.map(row => ({
      name: String(row["Артикул"]).trim(),
      price: Number(row["Цена"])
    }));

    alert("Прайс загружен");
  };

  reader.readAsArrayBuffer(file);
});

// автоподстановка цены
document.getElementById("search").addEventListener("input", function () {
  const val = this.value.toLowerCase();

  const found = products.find(p =>
    p.name.toLowerCase() === val
  );

  if (found) {
    document.getElementById("price").value = found.price;
  }
});

// добавить товар
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

// рендер
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

// ПЕЧАТЬ С ЧЁТКИМИ ГРАНИЦАМИ
function printOrder() {
  const name = document.getElementById("name").value;
  const from = document.getElementById("from").value;
  let invoice = document.getElementById("invoiceNumber").value || "____";

  function generateDoc(items) {
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

        <div class="date">
          от «__» __________ 2026 г.
        </div>

        <h2>НАКЛАДНАЯ № ${invoice}</h2>

        <div><b>Кому:</b> ${name}</div>
        <div><b>От кого:</b> ${from}</div>

        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>Наименование</th>
              <th>Ед</th>
              <th>Кол-во</th>
              <th>Цена</th>
              <th>Сумма</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="footer">
          <div><b>Итого:</b> ${total} ₽</div>
          <div>В том числе НДС ( )%</div>
        </div>

        <div class="sign">
          <div>Сдал: _____________ /_____________/</div>
          <div>Принял: _____________ /_____________/</div>
        </div>

      </div>
    `;
  }

  // 🔥 динамический расчет строк
  function splitOrder() {
    const approxRowsPerDoc = 8; // оптимум под A4 (не ломается)
    let chunks = [];

    for (let i = 0; i < order.length; i += approxRowsPerDoc) {
      chunks.push(order.slice(i, i + approxRowsPerDoc));
    }

    if (chunks.length === 0) chunks = [[]];

    return chunks;
  }

  const chunks = splitOrder();

  let pagesHTML = "";

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    pagesHTML += `
      <div class="sheet">

        ${generateDoc(chunk)}

        <div class="cut-line"></div>

        ${generateDoc(chunk)}

      </div>
    `;
  }

  const html = `
  <html>
  <head>
    <style>
      body {
        font-family: "Times New Roman";
        margin: 0;
      }

      .sheet {
        width: 210mm;
        height: 297mm;
        padding: 10mm;
        box-sizing: border-box;
        page-break-after: always;
      }

      .doc {
        height: 48%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      h2 {
        text-align: center;
        margin: 5px 0;
      }

      .date {
        text-align: right;
        font-size: 14px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        border: 2px solid black;
        margin-top: 5px;
      }

      th, td {
        border: 1px solid black;
        padding: 3px;
        font-size: 13px;
        text-align: center;
      }

      .footer {
        margin-top: 5px;
        text-align: right;
        font-size: 14px;
      }

      .sign {
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
        font-size: 14px;
      }

      .cut-line {
        border-top: 2px dashed black;
        margin: 8px 0;
      }

      @media print {
        body {
          margin: 0;
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