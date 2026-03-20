let order = [];

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

function sendToCloud(total) {
  return fetch("https://script.google.com/macros/s/AKfycbwEH-i26FXXk2BYMjO89Oct4GMEwsOL_REuue168DwAjONqOmNbYKbx1RWu2F2x7qYOqw/exec", {
    method: "POST",
    body: JSON.stringify({
      key: "MY_SECRET_123",
      name: document.getElementById("name").value,
      from: document.getElementById("from").value,
      items: order,
      total: total
    })
  });
}

function printOrder() {
  const name = document.getElementById("name").value;
  const from = document.getElementById("from").value;
  let invoice = document.getElementById("invoiceNumber").value || "____";

  let rows = "";
  let total = 0;

  order.forEach((i, index) => {
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

  for (let i = order.length; i < 8; i++) {
    rows += `<tr><td>${i + 1}</td><td></td><td></td><td></td><td></td><td></td></tr>`;
  }

  function doc() {
    return `
      <div style="height:48%;">
        <div style="text-align:right;">от «__» __________ 2026 г.</div>

        <h2 style="text-align:center;">НАКЛАДНАЯ № ${invoice}</h2>

        <div><b>Кому:</b> ${name}</div>
        <div><b>От кого:</b> ${from}</div>

        <table style="width:100%; border-collapse:collapse; border:2px solid black;">
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
            <td><b>${total} ₽</b></td>
          </tr>
        </table>

        <div style="margin-top:30px; display:flex; justify-content:space-between;">
          <div>Сдал: _____________</div>
          <div>Принял: _____________</div>
        </div>
      </div>
    `;
  }

  const html = `
  <html>
  <body style="font-family:Times New Roman; padding:20px;">
    ${doc()}
    <hr style="border-top:2px dashed black;">
    ${doc()}
  </body>
  </html>
  `;

  const win = window.open("");
  win.document.write(html);

  sendToCloud(total)
    .then(() => win.print())
    .catch(() => {
      alert("Ошибка облака");
      win.print();
    });
}