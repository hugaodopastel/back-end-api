import express from "express";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;
const app = express();
const port = 3000;

// Middleware para interpretar requisições com corpo em JSON
app.use(express.json());

let pool = null;

function conectarBD() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.URL_BD,
    });
  }
  return pool;
}

const db = conectarBD();

let dbStatus = "ok";
try {
  await db.query("SELECT 1");
  console.log("Conexão com o banco de dados estabelecida com sucesso!");
} catch (e) {
  dbStatus = e.message;
  console.error("Erro na conexão com o banco de dados:", dbStatus);
}

// ==========================================
// ROTA PRINCIPAL
// ==========================================
app.get("/", async (req, res) => {
  console.log("Rota GET / solicitada");
  res.json({
    message: "API para atividade",
    author: "Hugo Barros Correia",
    statusBD: dbStatus,
  });
});

// ==========================================
// CRUD DE QUESTOES
// ==========================================
app.get("/questoes", async (req, res) => {
  console.log("Rota GET /questoes solicitada");
  try {
    const resultado = await db.query("SELECT * FROM questoes");
    res.json(resultado.rows);
  } catch (e) {
    console.error("Erro ao buscar questões:", e);
    res.status(500).json({
      erro: "Erro interno do servidor",
      mensagem: "Não foi possível buscar as questões",
    });
  }
});

app.get("/questoes/:id", async (req, res) => {
  console.log("Rota GET /questoes/:id solicitada");
  try {
    const id = req.params.id;
    const resultado = await db.query("SELECT * FROM questoes WHERE id = $1", [id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: "Questão não encontrada" });
    }
    res.json(resultado.rows);
  } catch (e) {
    console.error("Erro ao buscar questão:", e);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

app.post("/questoes", async (req, res) => {
  console.log("Rota POST /questoes solicitada");
  try {
    const data = req.body;
    if (!data.enunciado || !data.disciplina || !data.tema || !data.nivel) {
      return res.status(400).json({
        erro: "Dados inválidos",
        mensagem: "Todos os campos (enunciado, disciplina, tema, nivel) são obrigatórios.",
      });
    }

    const consulta =
      "INSERT INTO questoes (enunciado, disciplina, tema, nivel) VALUES ($1, $2, $3, $4)";
    await db.query(consulta, [data.enunciado, data.disciplina, data.tema, data.nivel]);
    res.status(201).json({ mensagem: "Questão criada com sucesso!" });
  } catch (e) {
    console.error("Erro ao inserir questão:", e);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

app.put("/questoes/:id", async (req, res) => {
  console.log("Rota PUT /questoes/:id solicitada");
  try {
    const id = req.params.id;
    const resultado = await db.query("SELECT * FROM questoes WHERE id = $1", [id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ message: "Questão não encontrada" });
    }

    const questaoAtual = resultado.rows[0];
    const data = req.body;

    const enunciado = data.enunciado || questaoAtual.enunciado;
    const disciplina = data.disciplina || questaoAtual.disciplina;
    const tema = data.tema || questaoAtual.tema;
    const nivel = data.nivel || questaoAtual.nivel;

    const consulta =
      "UPDATE questoes SET enunciado = $1, disciplina = $2, tema = $3, nivel = $4 WHERE id = $5";
    await db.query(consulta, [enunciado, disciplina, tema, nivel, id]);

    res.status(200).json({ message: "Questão atualizada com sucesso!" });
  } catch (e) {
    console.error("Erro ao atualizar questão:", e);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

app.delete("/questoes/:id", async (req, res) => {
  console.log("Rota DELETE /questoes/:id solicitada");
  try {
    const id = req.params.id;
    const resultado = await db.query("SELECT * FROM questoes WHERE id = $1", [id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: "Questão não encontrada" });
    }

    await db.query("DELETE FROM questoes WHERE id = $1", [id]);
    res.status(200).json({ mensagem: "Questão excluída com sucesso!" });
  } catch (e) {
    console.error("Erro ao excluir questão:", e);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

// ==========================================
// NOVO CRUD DE USUÁRIOS
// ==========================================

// [GET] /usuarios - lista todos os usuários
app.get("/usuarios", async (req, res) => {
  console.log("Rota GET /usuarios solicitada");
  try {
    const resultado = await db.query("SELECT * FROM usuarios ORDER BY id ASC");
    res.json(resultado.rows);
  } catch (e) {
    console.error("Erro ao buscar usuários:", e);
    res.status(500).json({ erro: "Erro interno ao buscar usuários" });
  }
});

// [GET] /usuarios/:id - busca um usuário por ID
app.get("/usuarios/:id", async (req, res) => {
  console.log("Rota GET /usuarios/:id solicitada");
  try {
    const { id } = req.params;
    const resultado = await db.query("SELECT * FROM usuarios WHERE id = $1", [id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: "Usuário não encontrado" });
    }
    res.json(resultado.rows[0]);
  } catch (e) {
    console.error("Erro ao buscar usuário:", e);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

// [POST] /usuarios - cria novo usuário
app.post("/usuarios", async (req, res) => {
  console.log("Rota POST /usuarios solicitada");
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        erro: "Dados inválidos. Todos os campos (nome, email, senha) são obrigatórios.",
      });
    }

    const consulta =
      "INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING *";
    const resultado = await db.query(consulta, [nome, email, senha]);

    res.status(201).json({
      mensagem: "Usuário criado com sucesso!",
      usuario: resultado.rows[0],
    });
  } catch (e) {
    console.error("Erro ao criar usuário:", e);
    res.status(500).json({ erro: "Erro interno ao criar usuário" });
  }
});

// [PUT] /usuarios/:id - atualiza um usuário
app.put("/usuarios/:id", async (req, res) => {
  console.log("Rota PUT /usuarios/:id solicitada");
  try {
    const { id } = req.params;
    const { nome, email, senha } = req.body;

    const usuario = await db.query("SELECT * FROM usuarios WHERE id = $1", [id]);
    if (usuario.rows.length === 0) {
      return res.status(404).json({ mensagem: "Usuário não encontrado" });
    }

    const dadosAtuais = usuario.rows[0];
    const novoNome = nome || dadosAtuais.nome;
    const novoEmail = email || dadosAtuais.email;
    const novaSenha = senha || dadosAtuais.senha;

    const consulta =
      "UPDATE usuarios SET nome = $1, email = $2, senha = $3 WHERE id = $4 RETURNING *";
    const resultado = await db.query(consulta, [novoNome, novoEmail, novaSenha, id]);

    res.status(200).json({
      mensagem: "Usuário atualizado com sucesso!",
      usuario: resultado.rows[0],
    });
  } catch (e) {
    console.error("Erro ao atualizar usuário:", e);
    res.status(500).json({ erro: "Erro interno ao atualizar usuário" });
  }
});

// [DELETE] /usuarios/:id - remove um usuário
app.delete("/usuarios/:id", async (req, res) => {
  console.log("Rota DELETE /usuarios/:id solicitada");
  try {
    const { id } = req.params;

    const usuario = await db.query("SELECT * FROM usuarios WHERE id = $1", [id]);
    if (usuario.rows.length === 0) {
      return res.status(404).json({ mensagem: "Usuário não encontrado" });
    }

    await db.query("DELETE FROM usuarios WHERE id = $1", [id]);
    res.json({ mensagem: "Usuário excluído com sucesso!" });
  } catch (e) {
    console.error("Erro ao excluir usuário:", e);
    res.status(500).json({ erro: "Erro interno ao excluir usuário" });
  }
});

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================
app.listen(port, () => {
  console.log(`Serviço rodando na porta: ${port}`);
});
