const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "StockHub API",
    version: "1.0.0",
    description: "API de estoque, produtos, autenticação e movimentações.",
  },
  servers: [{ url: "/api" }],
  tags: [
    { name: "Autenticação" },
    { name: "Produtos" },
    { name: "Movimentações" },
    { name: "Dashboard" },
  ],
  paths: {
    "/auth/login": {
      post: {
        tags: ["Autenticação"],
        summary: "Autentica um usuário",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "Login realizado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string" },
                    user: { $ref: "#/components/schemas/AuthUser" },
                  },
                },
              },
            },
          },
          "401": { description: "Credenciais inválidas" },
          "429": { description: "Limite de tentativas excedido" },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Autenticação"],
        summary: "Cria uma conta com papel USER",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterInput" } } },
        },
        responses: {
          "201": { description: "Conta criada e autenticada" },
          "409": { description: "E-mail já cadastrado" },
          "429": { description: "Limite de cadastros excedido" },
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Autenticação"],
        summary: "Solicita link de recuperação por e-mail",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ForgotPasswordInput" } } },
        },
        responses: {
          "202": { description: "Resposta uniforme, sem revelar se o e-mail está cadastrado" },
          "429": { description: "Limite de solicitações excedido" },
        },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Autenticação"],
        summary: "Redefine a senha com token de uso único",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ResetPasswordInput" } } },
        },
        responses: {
          "204": { description: "Senha redefinida" },
          "400": { description: "Token inválido, expirado ou senha fraca" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Autenticação"],
        summary: "Retorna o usuário autenticado",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Usuário autenticado" },
          "401": { description: "Não autenticado" },
        },
      },
    },
    "/produtos": {
      get: {
        tags: ["Produtos"],
        summary: "Lista produtos com paginação e busca",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/Page" },
          { $ref: "#/components/parameters/Limit" },
          { $ref: "#/components/parameters/Search" },
        ],
        responses: { "200": { description: "Lista de produtos" } },
      },
      post: {
        tags: ["Produtos"],
        summary: "Cadastra um produto",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProdutoInput" },
            },
          },
        },
        responses: {
          "201": { description: "Produto criado" },
          "409": { description: "SKU já cadastrado" },
        },
      },
    },
    "/produtos/alertas/estoque-baixo": {
      get: {
        tags: ["Produtos"],
        summary: "Lista produtos no nível mínimo ou abaixo dele",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Produtos com estoque baixo" } },
      },
    },
    "/produtos/{id}": {
      parameters: [{ $ref: "#/components/parameters/Id" }],
      get: {
        tags: ["Produtos"],
        summary: "Busca produto por ID",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Produto encontrado" }, "404": { description: "Produto não encontrado" } },
      },
      put: {
        tags: ["Produtos"],
        summary: "Atualiza produto",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProdutoUpdate" },
            },
          },
        },
        responses: { "200": { description: "Produto atualizado" }, "404": { description: "Produto não encontrado" } },
      },
      delete: {
        tags: ["Produtos"],
        summary: "Remove produto",
        security: [{ bearerAuth: [] }],
        responses: { "204": { description: "Produto removido" }, "404": { description: "Produto não encontrado" } },
      },
    },
    "/movimentacoes": {
      get: {
        tags: ["Movimentações"],
        summary: "Lista histórico de movimentações",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/Page" },
          { $ref: "#/components/parameters/Limit" },
          { $ref: "#/components/parameters/Search" },
          { name: "produtoId", in: "query", schema: { type: "string" } },
          { name: "dataInicio", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "dataFim", in: "query", schema: { type: "string", format: "date-time" } },
        ],
        responses: { "200": { description: "Movimentações encontradas" } },
      },
      post: {
        tags: ["Movimentações"],
        summary: "Registra entrada ou saída de estoque em transação",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MovimentacaoInput" },
            },
          },
        },
        responses: {
          "201": { description: "Movimentação registrada" },
          "409": { description: "Estoque insuficiente" },
        },
      },
    },
    "/movimentacoes/produto/{produtoId}": {
      get: {
        tags: ["Movimentações"],
        summary: "Lista o histórico de um produto",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "produtoId", in: "path", required: true, schema: { type: "string" } },
          { $ref: "#/components/parameters/Page" },
          { $ref: "#/components/parameters/Limit" },
        ],
        responses: { "200": { description: "Histórico do produto" } },
      },
    },
    "/dashboard/metricas": {
      get: {
        tags: ["Dashboard"],
        summary: "Retorna métricas gerais de estoque",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Métricas consolidadas",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DashboardMetrics" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    parameters: {
      Id: { name: "id", in: "path", required: true, schema: { type: "string" } },
      Page: { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
      Limit: { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 10 } },
      Search: { name: "q", in: "query", schema: { type: "string", maxLength: 100 } },
    },
    schemas: {
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
        },
      },
      RegisterInput: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 100 },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 12, maxLength: 72, description: "Exige letras maiúsculas, minúsculas e números." },
        },
      },
      ForgotPasswordInput: {
        type: "object",
        required: ["email"],
        properties: { email: { type: "string", format: "email" } },
      },
      ResetPasswordInput: {
        type: "object",
        required: ["token", "password"],
        properties: {
          token: { type: "string" },
          password: { type: "string", minLength: 12, maxLength: 72 },
        },
      },
      AuthUser: {
        type: "object",
        properties: {
          id: { type: "string" },
          username: { type: "string" },
          email: { type: "string", format: "email" },
          roles: { type: "array", items: { type: "string" } },
        },
      },
      ProdutoInput: {
        type: "object",
        required: ["nome", "sku", "preco", "categoriaId"],
        properties: {
          nome: { type: "string" },
          sku: { type: "string" },
          descricao: { type: "string", nullable: true },
          preco: { type: "number", minimum: 0 },
          quantidade: { type: "integer", minimum: 0, default: 0 },
          estoqueMinimo: { type: "integer", minimum: 0, default: 5 },
          categoriaId: { type: "string" },
        },
      },
      ProdutoUpdate: {
        type: "object",
        properties: {
          nome: { type: "string" },
          sku: { type: "string" },
          descricao: { type: "string", nullable: true },
          preco: { type: "number", minimum: 0 },
          quantidade: { type: "integer", minimum: 0 },
          estoqueMinimo: { type: "integer", minimum: 0 },
          categoriaId: { type: "string" },
        },
      },
      MovimentacaoInput: {
        type: "object",
        required: ["tipo", "quantidade", "produtoId"],
        properties: {
          tipo: { type: "string", enum: ["ENTRADA", "SAIDA"] },
          quantidade: { type: "integer", minimum: 1 },
          produtoId: { type: "string" },
          observacao: { type: "string", nullable: true },
        },
      },
      DashboardMetrics: {
        type: "object",
        properties: {
          totalProdutos: { type: "integer" },
          valorTotalEmEstoque: { type: "number" },
          quantidadeTotal: { type: "integer" },
          produtosEstoqueBaixo: { type: "integer" },
        },
      },
    },
  },
};

export default swaggerDocument;