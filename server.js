const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const PDFDocument = require('pdfkit');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('SQLite conectado');

    db.run(`
      CREATE TABLE IF NOT EXISTS dias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT UNIQUE,
        tipo INTEGER
      )
    `);
  }
});

const VALOR = 5.5;

// salvar dia
app.post('/dia', (req, res) => {
  const { data, tipo } = req.body;

  const query = `
    INSERT INTO dias (data, tipo)
    VALUES (?, ?)
    ON CONFLICT(data) DO UPDATE SET tipo = excluded.tipo
  `;

  db.run(query, [data, tipo], function (err) {
    if (err) return res.status(500).json(err.message);
    res.json({ ok: true });
  });
});

// listar por mês
app.get('/dias', (req, res) => {
  const { mes, ano } = req.query;

  let query = `SELECT * FROM dias`;
  let params = [];

  if (mes && ano) {
    query += ` WHERE strftime('%m', data) = ? AND strftime('%Y', data) = ?`;
    params = [mes.padStart(2, '0'), ano];
  }

  query += ` ORDER BY data`;

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json(err.message);
    res.json(rows);
  });
});

// gerar PDF por mês
app.get('/pdf', (req, res) => {
  const { mes, ano } = req.query;

  const query = `
    SELECT * FROM dias
    WHERE strftime('%m', data) = ? AND strftime('%Y', data) = ?
    ORDER BY data
  `;

  db.all(query, [mes, ano], (err, rows) => {
    if (err) return res.status(500).send(err.message);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    doc.fontSize(18).text(`Relatório - Let Soares -  ${mes}/${ano}`, { align: 'center' });
    doc.moveDown();

    let total = 0;

    rows.forEach(d => {
    if (d.tipo == 0) return; // 👈 IGNORA dias vazios
      let valor = 0;
      let texto = '-';

      if (d.tipo == 1) { valor = VALOR; texto = 'Ida'; }
      if (d.tipo == 2) { valor = VALOR; texto = 'Volta'; }
      if (d.tipo == 3) { valor = VALOR * 2; texto = 'Ida e Volta'; }

      total += valor;

      doc.text(`${d.data} - ${texto} - R$ ${valor.toFixed(2)}`);
    });

    doc.moveDown();
    doc.text(`Total: R$ ${total.toFixed(2)}`);

    doc.end();
  });
});

app.delete('/dia/:data', (req, res) => {
  const { data } = req.params;

  db.run(`DELETE FROM dias WHERE data = ?`, [data], function (err) {
    if (err) return res.status(500).json(err.message);
    res.json({ ok: true });
  });
});

app.listen(3000, () => {
  console.log('http://localhost:3000');
});