import express from "express";
import pkg from "pg";
import dotenv from "dotenv";

const app = express(); // Cria uma instância do Express.
const port = 3000; // Define a porta em que o servidor irá "escutar" por requisições.
dotenv.config(); // Executa a função de configuração do 'dotenv' carregando o .env
const { Pool } = pkg;// Extrai a classe 'Pool' do pacote 'pg' que foi importado.


app.get("/", async (req, res) => {

  console.log("Rota GET / solicitada"); // Log no terminal

  // Cria uma nova instância do Pool de conexões com o banco de dados.
  const db = new Pool({
    connectionString: process.env.URL_BD,
  });

  let dbStatus = "ok";

  // Testa a conexão com o banco
  try {
    await db.query("SELECT 1");
  } catch (e) {
    dbStatus = e.message;
  }

  // Envia uma resposta de volta para o cliente.
  res.json({
    descricao: "API para questões da prova",    // Substitua pelo conteúdo da sua API
    autor: "Hugo Barros Correia",     // Substitua pelo seu nome
    statusBD: dbStatus              // Informa se a conexão com o banco de dados foi bem-sucedida ou mostra o erro.
  });
});

// ######
// Local onde o servidor escuta as requisições que chegam
// ######

app.listen(port, () => {
  console.log(`Serviço rodando na porta:  ${port}`);
});