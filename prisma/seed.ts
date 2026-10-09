import prisma from "../src/lib/prisma";
import { hashPassword } from "../src/utils/password";

const categories = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    nome: "Eletrônicos",
    descricao: "Equipamentos eletrônicos e componentes.",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    nome: "Periféricos",
    descricao: "Acessórios para computadores e estações de trabalho.",
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    nome: "Cabos",
    descricao: "Cabos e adaptadores para conectividade.",
  },
] as const;

const products = [
  { sku: "ELE-NB-001", nome: "Notebook Pro 14", descricao: "Notebook de 14 polegadas, 16 GB RAM.", preco: 5499.9, quantidade: 12, estoqueMinimo: 5, categoriaId: categories[0].id },
  { sku: "ELE-MON-001", nome: "Monitor IPS 27", descricao: "Monitor IPS com resolução QHD.", preco: 1699.9, quantidade: 3, estoqueMinimo: 4, categoriaId: categories[0].id },
  { sku: "ELE-SSD-001", nome: "SSD NVMe 1 TB", descricao: "Unidade NVMe para armazenamento.", preco: 599.9, quantidade: 2, estoqueMinimo: 5, categoriaId: categories[0].id },
  { sku: "ELE-DOCK-001", nome: "Dock USB-C", descricao: "Dock com HDMI, USB e rede.", preco: 429.9, quantidade: 7, estoqueMinimo: 3, categoriaId: categories[0].id },
  { sku: "PER-MOU-001", nome: "Mouse sem fio", descricao: "Mouse óptico sem fio.", preco: 89.9, quantidade: 24, estoqueMinimo: 8, categoriaId: categories[1].id },
  { sku: "PER-KEY-001", nome: "Teclado mecânico", descricao: "Teclado mecânico ABNT2.", preco: 329.9, quantidade: 6, estoqueMinimo: 8, categoriaId: categories[1].id },
  { sku: "PER-WEB-001", nome: "Webcam Full HD", descricao: "Webcam 1080p com microfone.", preco: 219.9, quantidade: 4, estoqueMinimo: 5, categoriaId: categories[1].id },
  { sku: "CAB-HDMI-001", nome: "Cabo HDMI 2 m", descricao: "Cabo HDMI de alta velocidade.", preco: 39.9, quantidade: 1, estoqueMinimo: 10, categoriaId: categories[2].id },
  { sku: "CAB-USBC-001", nome: "Cabo USB-C 1 m", descricao: "Cabo USB-C para carga e dados.", preco: 29.9, quantidade: 28, estoqueMinimo: 10, categoriaId: categories[2].id },
  { sku: "CAB-ETH-001", nome: "Cabo de rede Cat6", descricao: "Cabo Ethernet Cat6 de 3 metros.", preco: 24.9, quantidade: 0, estoqueMinimo: 5, categoriaId: categories[2].id },
] as const;

async function main(): Promise<void> {
  for (const category of categories) {
    await prisma.categoria.upsert({
      where: { id: category.id },
      create: category,
      update: { nome: category.nome, descricao: category.descricao },
    });
  }

  await prisma.role.upsert({
    where: { name: "USER" },
    create: { name: "USER" },
    update: {},
  });

  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    console.log("Categorias de demonstração criadas. Admin e produtos demo ignorados: SEED_ADMIN_PASSWORD não foi definida.");
    return;
  }
  if (adminPassword.length < 12) {
    throw new Error("Defina SEED_ADMIN_PASSWORD com pelo menos 12 caracteres antes de executar o seed.");
  }

  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    create: { name: "ADMIN" },
    update: {},
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@stockhub.com" },
    create: {
      name: "Administrador StockHub",
      email: "admin@stockhub.com",
      password: await hashPassword(adminPassword),
      roles: { connect: { id: adminRole.id } },
    },
    update: {
      name: "Administrador StockHub",
      password: await hashPassword(adminPassword),
      roles: { connect: { id: adminRole.id } },
    },
  });

  const seededProducts = new Map<string, string>();
  for (const product of products) {
    const savedProduct = await prisma.produto.upsert({
      where: { sku: product.sku },
      create: product,
      update: {
        nome: product.nome,
        descricao: product.descricao,
        preco: product.preco,
        quantidade: product.quantidade,
        estoqueMinimo: product.estoqueMinimo,
        categoriaId: product.categoriaId,
      },
    });
    seededProducts.set(product.sku, savedProduct.id);
  }

  const movements = [
    { id: "20000000-0000-4000-8000-000000000001", sku: "ELE-NB-001", tipo: "ENTRADA", quantidade: 12, observacao: "Estoque inicial de demonstração.", daysAgo: 5 },
    { id: "20000000-0000-4000-8000-000000000002", sku: "ELE-MON-001", tipo: "SAIDA", quantidade: 1, observacao: "Separado para pedido de demonstração.", daysAgo: 4 },
    { id: "20000000-0000-4000-8000-000000000003", sku: "PER-MOU-001", tipo: "ENTRADA", quantidade: 24, observacao: "Reposição de periféricos.", daysAgo: 3 },
    { id: "20000000-0000-4000-8000-000000000004", sku: "CAB-HDMI-001", tipo: "SAIDA", quantidade: 2, observacao: "Saída para pedido de demonstração.", daysAgo: 2 },
    { id: "20000000-0000-4000-8000-000000000005", sku: "CAB-USBC-001", tipo: "ENTRADA", quantidade: 28, observacao: "Recebimento de cabos USB-C.", daysAgo: 1 },
  ] as const;

  for (const movement of movements) {
    const produtoId = seededProducts.get(movement.sku);
    if (!produtoId) {
      throw new Error(`Produto não encontrado no seed: ${movement.sku}`);
    }

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - movement.daysAgo);

    await prisma.movimentacaoEstoque.upsert({
      where: { id: movement.id },
      create: {
        id: movement.id,
        produtoId,
        usuarioId: admin.id,
        tipo: movement.tipo,
        quantidade: movement.quantidade,
        observacao: movement.observacao,
        createdAt,
      },
      update: {
        produtoId,
        usuarioId: admin.id,
        tipo: movement.tipo,
        quantidade: movement.quantidade,
        observacao: movement.observacao,
        createdAt,
      },
    });
  }

  console.log("Seed concluído: 2 perfis, admin, 3 categorias, 10 produtos e 5 movimentações.");
}

main()
  .catch((error: unknown) => {
    console.error("Falha ao executar seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
