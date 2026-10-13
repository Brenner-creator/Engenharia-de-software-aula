import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Activity,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  ChartNoAxesCombined,
  Check,
  CircleAlert,
  CircleDollarSign,
  ClipboardList,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Tags,
  Trash2,
  X,
} from 'lucide-react';

type User = { id: string; username: string; name?: string; email: string; roles?: string[] };
type Category = { id: string; nome: string; descricao?: string | null };
type Product = {
  id: string;
  nome: string;
  sku: string;
  descricao?: string | null;
  preco: number | string;
  quantidade: number;
  estoqueMinimo: number;
  categoriaId: string;
};
type Metrics = {
  totalProdutos: number;
  valorTotalEmEstoque: number;
  quantidadeTotal: number;
  produtosEstoqueBaixo: number;
};
type Movement = {
  id: string;
  tipo: 'ENTRADA' | 'SAIDA';
  quantidade: number;
  observacao?: string | null;
  createdAt: string;
  produtoId?: string;
  produto?: { id: string; nome: string; sku: string };
};
type View = 'overview' | 'products' | 'movements' | 'categories';
type AuthMode = 'login' | 'register' | 'forgot' | 'reset';
type Notice = { kind: 'success' | 'error'; text: string } | null;

const emptyMetrics: Metrics = {
  totalProdutos: 0,
  valorTotalEmEstoque: 0,
  quantidadeTotal: 0,
  produtosEstoqueBaixo: 0,
};

function readSession() {
  try {
    const token = localStorage.getItem('stockhub.token');
    const user = localStorage.getItem('stockhub.user');
    return {
      token,
      user: user ? (JSON.parse(user) as User) : null,
    };
  } catch {
    return { token: null, user: null };
  }
}

async function request<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    let message = `Erro ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function currency(value: number | string) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function App() {
  const [session, setSession] = useState(readSession);
  const [view, setView] = useState<View>('overview');
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'product' | 'movement' | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [loginError, setLoginError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>(() =>
    new URLSearchParams(window.location.search).has('token') ? 'reset' : 'login',
  );
  const [busy, setBusy] = useState(false);
  const [movementType, setMovementType] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const lowStockProducts = useMemo(
    () => products.filter((product) => product.quantidade <= product.estoqueMinimo),
    [products],
  );
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    if (!query) return products;
    return products.filter((product) =>
      `${product.nome} ${product.sku}`.toLocaleLowerCase('pt-BR').includes(query),
    );
  }, [products, search]);

  async function loadData(token: string) {
    setLoading(true);
    try {
      const [nextMetrics, nextProducts, nextCategories, nextMovements] = await Promise.all([
        request<Metrics>('/dashboard/metricas', token),
        request<Product[]>('/produtos?limit=100', token),
        request<Category[]>('/categorias?limit=100', token),
        request<Movement[]>('/movimentacoes?limit=100', token),
      ]);
      setMetrics(nextMetrics);
      setProducts(nextProducts);
      setCategories(nextCategories);
      setMovements(nextMovements);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível carregar os dados.';
      if (message.toLowerCase().includes('token') || message.includes('401')) {
        signOut();
      } else {
        setNotice({ kind: 'error', text: message });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session.token) void loadData(session.token);
  }, [session.token]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function signOut() {
    localStorage.removeItem('stockhub.token');
    localStorage.removeItem('stockhub.user');
    setSession({ token: null, user: null });
    setView('overview');
    setProducts([]);
    setMovements([]);
    setMetrics(emptyMetrics);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError('');
    setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      const result = await request<{ token: string; user: User }>('/auth/login', '', {
        method: 'POST',
        body: JSON.stringify({
          email: data.get('email'),
          password: data.get('password'),
        }),
      });
      localStorage.setItem('stockhub.token', result.token);
      localStorage.setItem('stockhub.user', JSON.stringify(result.user));
      setSession({ token: result.token, user: result.user });
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Não foi possível entrar.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError('');
    setAuthMessage('');
    setBusy(true);
    const data = new FormData(event.currentTarget);
    if (data.get('password') !== data.get('confirmPassword')) {
      setLoginError('As senhas não coincidem.');
      setBusy(false);
      return;
    }
    try {
      const result = await request<{ token: string; user: User }>('/auth/register', '', {
        method: 'POST',
        body: JSON.stringify({ name: data.get('name'), email: data.get('email'), password: data.get('password') }),
      });
      localStorage.setItem('stockhub.token', result.token);
      localStorage.setItem('stockhub.user', JSON.stringify(result.user));
      setSession({ token: result.token, user: result.user });
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Não foi possível criar sua conta.');
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError('');
    setAuthMessage('');
    setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      const result = await request<{ message: string }>('/auth/forgot-password', '', {
        method: 'POST',
        body: JSON.stringify({ email: data.get('email') }),
      });
      setAuthMessage(result.message);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Não foi possível solicitar a recuperação.');
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError('');
    setAuthMessage('');
    setBusy(true);
    const data = new FormData(event.currentTarget);
    if (data.get('password') !== data.get('confirmPassword')) {
      setLoginError('As senhas não coincidem.');
      setBusy(false);
      return;
    }
    try {
      await request<void>('/auth/reset-password', '', {
        method: 'POST',
        body: JSON.stringify({ token: new URLSearchParams(window.location.search).get('token'), password: data.get('password') }),
      });
      window.history.replaceState({}, '', '/');
      setAuthMode('login');
      setAuthMessage('Senha redefinida. Entre com sua nova senha.');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Não foi possível redefinir a senha.');
    } finally {
      setBusy(false);
    }
  }

  function changeAuthMode(mode: AuthMode) {
    setAuthMode(mode);
    setLoginError('');
    setAuthMessage('');
    if (mode !== 'reset' && window.location.search) window.history.replaceState({}, '', '/');
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session.token) return;
    setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      await request<Product>('/produtos', session.token, {
        method: 'POST',
        body: JSON.stringify({
          nome: data.get('nome'),
          sku: data.get('sku'),
          descricao: data.get('descricao') || undefined,
          preco: Number(data.get('preco')),
          quantidade: Number(data.get('quantidade')),
          estoqueMinimo: Number(data.get('estoqueMinimo')),
          categoriaId: data.get('categoriaId'),
        }),
      });
      setModal(null);
      setNotice({ kind: 'success', text: 'Produto cadastrado.' });
      await loadData(session.token);
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Falha ao cadastrar produto.' });
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session.token) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const category = await request<Category>('/categorias', session.token, {
        method: 'POST',
        body: JSON.stringify({ nome: data.get('nome'), descricao: data.get('descricao') || null }),
      });
      setCategories((current) => [...current, category]);
      setShowCategoryForm(false);
      setNotice({ kind: 'success', text: 'Categoria criada.' });
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Falha ao criar categoria.' });
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteProduct(product: Product) {
    if (!session.token || !window.confirm(`Excluir o produto "${product.nome}"? Esta ação não pode ser desfeita.`)) return;
    setBusy(true);
    try {
      await request<void>(`/produtos/${product.id}`, session.token, { method: 'DELETE' });
      setNotice({ kind: 'success', text: 'Produto excluído.' });
      await loadData(session.token);
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Falha ao excluir produto.' });
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteCategory(category: Category) {
    if (!session.token || !window.confirm(`Excluir a categoria "${category.nome}"? Esta ação não pode ser desfeita.`)) return;
    setBusy(true);
    try {
      await request<void>(`/categorias/${category.id}`, session.token, { method: 'DELETE' });
      setNotice({ kind: 'success', text: 'Categoria excluída.' });
      await loadData(session.token);
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Falha ao excluir categoria.' });
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session.token) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await request<Movement>('/movimentacoes', session.token, {
        method: 'POST',
        body: JSON.stringify({
          tipo: movementType,
          produtoId: data.get('produtoId'),
          quantidade: Number(data.get('quantidade')),
          observacao: data.get('observacao') || undefined,
        }),
      });
      setModal(null);
      setNotice({ kind: 'success', text: movementType === 'ENTRADA' ? 'Entrada registrada.' : 'Saída registrada.' });
      await loadData(session.token);
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Falha ao registrar movimentação.' });
    } finally {
      setBusy(false);
    }
  }

  if (!session.token) {
    const authCopy: Record<AuthMode, { eyebrow: string; title: string; description: string }> = {
      login: { eyebrow: 'ACESSO À CONTA', title: 'Boas-vindas', description: 'Entre com suas credenciais para continuar.' },
      register: { eyebrow: 'NOVA CONTA', title: 'Criar acesso', description: 'Seu cadastro terá permissões de usuário.' },
      forgot: { eyebrow: 'RECUPERAÇÃO DE ACESSO', title: 'Esqueceu a senha?', description: 'Enviaremos um link seguro para o e-mail informado.' },
      reset: { eyebrow: 'NOVA SENHA', title: 'Redefinir acesso', description: 'Escolha uma senha forte para sua conta.' },
    };
    const copy = authCopy[authMode];
    return (
      <div className="login-shell">
        <aside className="login-aside">
          <div className="brand brand-light"><span className="brand-mark"><Boxes size={21} /></span>stockhub</div>
          <div className="login-message">
            <span className="eyebrow">CONTROLE DE ESTOQUE</span>
            <h1>Seu estoque,<br /><em>em movimento.</em></h1>
            <p>Uma visão clara do que entra, sai e precisa de atenção.</p>
          </div>
          <div className="login-aside-foot"><span className="status-dot" /> SISTEMA OPERACIONAL</div>
        </aside>
        <main className="login-main">
          <div className="login-card">
            <div className="login-icon"><ShieldCheck size={22} /></div>
            <span className="eyebrow">{copy.eyebrow}</span>
            <h2>{copy.title}</h2>
            <p className="muted">{copy.description}</p>
            {authMode === 'login' && <form className="stack-form" onSubmit={handleLogin}>
              <label>E-mail<input name="email" type="email" autoComplete="username" placeholder="voce@empresa.com" required /></label>
              <label>Senha<input name="password" type="password" autoComplete="current-password" placeholder="Sua senha" required /></label>
              {loginError && <p className="form-error" role="alert">{loginError}</p>}
              {authMessage && <p className="form-success" role="status">{authMessage}</p>}
              <button className="button button-primary button-wide" type="submit" disabled={busy}>{busy ? 'Entrando...' : 'Entrar'} <ArrowRight size={17} /></button>
              <button className="auth-link" type="button" onClick={() => changeAuthMode('forgot')}>Esqueci minha senha</button>
              <div className="auth-switch">Ainda não tem conta? <button type="button" onClick={() => changeAuthMode('register')}>Criar conta</button></div>
            </form>}
            {authMode === 'register' && <form className="stack-form" onSubmit={handleRegister}>
              <label>Nome<input name="name" autoComplete="name" placeholder="Seu nome" minLength={2} maxLength={100} required /></label>
              <label>E-mail<input name="email" type="email" autoComplete="email" placeholder="voce@empresa.com" required /></label>
              <label>Senha<input name="password" type="password" autoComplete="new-password" minLength={12} placeholder="Mínimo de 12 caracteres" required /><small className="input-hint">Use letras maiúsculas, minúsculas e números.</small></label>
              <label>Confirmar senha<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} placeholder="Digite a senha novamente" required /></label>
              {loginError && <p className="form-error" role="alert">{loginError}</p>}
              <button className="button button-primary button-wide" type="submit" disabled={busy}>{busy ? 'Criando conta...' : 'Criar minha conta'} <ArrowRight size={17} /></button>
              <div className="auth-switch">Já tem uma conta? <button type="button" onClick={() => changeAuthMode('login')}>Entrar</button></div>
            </form>}
            {authMode === 'forgot' && <form className="stack-form" onSubmit={handleForgotPassword}>
              <label>E-mail<input name="email" type="email" autoComplete="email" placeholder="voce@empresa.com" required /></label>
              {loginError && <p className="form-error" role="alert">{loginError}</p>}
              {authMessage && <div className="recovery-success" role="status"><Check size={17} /><span>{authMessage}<small>Na demonstração local, confira a caixa de entrada do <a href="http://localhost:8025" target="_blank" rel="noreferrer">Mailpit</a>.</small></span></div>}
              <button className="button button-primary button-wide" type="submit" disabled={busy}>{busy ? 'Enviando...' : 'Enviar link de recuperação'} <ArrowRight size={17} /></button>
              <div className="auth-switch"><button type="button" onClick={() => changeAuthMode('login')}>Voltar ao login</button></div>
            </form>}
            {authMode === 'reset' && <form className="stack-form" onSubmit={handleResetPassword}>
              <label>Nova senha<input name="password" type="password" autoComplete="new-password" minLength={12} placeholder="Mínimo de 12 caracteres" required /><small className="input-hint">Use letras maiúsculas, minúsculas e números.</small></label>
              <label>Confirmar senha<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} placeholder="Digite a senha novamente" required /></label>
              {loginError && <p className="form-error" role="alert">{loginError}</p>}
              <button className="button button-primary button-wide" type="submit" disabled={busy}>{busy ? 'Salvando...' : 'Salvar nova senha'} <ArrowRight size={17} /></button>
              <div className="auth-switch"><button type="button" onClick={() => changeAuthMode('login')}>Voltar ao login</button></div>
            </form>}
            <div className="login-foot"><span>STOCKHUB</span><span>GESTÃO DE INVENTÁRIO</span></div>
          </div>
        </main>
      </div>
    );
  }

  const isAdmin = session.user?.roles?.includes('ADMIN') ?? false;
  const title = view === 'overview'
    ? 'Visão geral'
    : view === 'products'
      ? 'Produtos'
      : view === 'categories'
        ? 'Categorias'
        : 'Movimentações';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#inicio" onClick={(event) => { event.preventDefault(); setView('overview'); }}>
          <span className="brand-mark"><Boxes size={21} /></span>stockhub<span className="brand-period">.</span>
        </a>
        <div className="workspace-label">ESPAÇO DE TRABALHO</div>
        <nav className="side-nav" aria-label="Navegação principal">
          <button className={view === 'overview' ? 'nav-item active' : 'nav-item'} onClick={() => setView('overview')}><ChartNoAxesCombined size={18} /> Visão geral</button>
          <button className={view === 'products' ? 'nav-item active' : 'nav-item'} onClick={() => setView('products')}><Package size={18} /> Produtos <span className="nav-count">{products.length}</span></button>
          <button className={view === 'movements' ? 'nav-item active' : 'nav-item'} onClick={() => setView('movements')}><ArrowLeftRight size={18} /> Movimentações</button>
          {isAdmin && <button className={view === 'categories' ? 'nav-item active' : 'nav-item'} onClick={() => setView('categories')}><Tags size={18} /> Categorias <span className="nav-count">{categories.length}</span></button>}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-status"><span className="status-dot" /><span>Banco conectado</span><Check size={14} /></div>
          <button className="profile-button" onClick={signOut} title="Sair da conta">
            <span className="avatar">{session.user?.name?.slice(0, 1).toUpperCase() || 'U'}</span>
            <span className="profile-copy"><strong>{session.user?.username || session.user?.name || 'Usuário'}</strong><small>{session.user?.email || 'Sessão ativa'}</small></span>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>StockHub</span><span className="crumb-slash">/</span><strong>{title}</strong></div>
          <div className="topbar-actions">
            <button className="icon-button" title="Atualizar dados" onClick={() => void loadData(session.token!)} disabled={loading}><RefreshCw size={17} className={loading ? 'spin' : ''} /></button>
            <span className="topbar-divider" />
            <span className="today-label">{new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'long' }).format(new Date())}</span>
            <button className="button button-primary top-action" onClick={() => { setMovementType('ENTRADA'); setModal('movement'); }}><Plus size={16} /> Nova movimentação</button>
          </div>
        </header>

        <div className="page-content">
          {view === 'overview' && (
            <>
              <section className="page-heading">
                <div><span className="eyebrow">RESUMO DO INVENTÁRIO</span><h1>Visão geral<span className="heading-period">.</span></h1><p>Acompanhe o ritmo do seu estoque hoje.</p></div>
                <button className="button button-outline" onClick={() => setView('products')}><ClipboardList size={16} /> Ver catálogo</button>
              </section>
              <section className="metrics-grid" aria-label="Indicadores de estoque">
                <MetricCard label="Produtos cadastrados" value={metrics.totalProdutos.toLocaleString('pt-BR')} icon={<Package size={19} />} tone="green" detail={`${categories.length} categorias ativas`} />
                <MetricCard label="Unidades em estoque" value={metrics.quantidadeTotal.toLocaleString('pt-BR')} icon={<Boxes size={19} />} tone="blue" detail="Saldo total disponível" />
                <MetricCard label="Valor em estoque" value={currency(metrics.valorTotalEmEstoque)} icon={<CircleDollarSign size={19} />} tone="gold" detail="Com base no preço cadastrado" />
                <MetricCard label="Atenção necessária" value={metrics.produtosEstoqueBaixo.toLocaleString('pt-BR')} icon={<CircleAlert size={19} />} tone="red" detail="Produtos no mínimo ou abaixo" alert={metrics.produtosEstoqueBaixo > 0} />
              </section>
              <section className="overview-grid">
                <div className="panel attention-panel">
                  <div className="panel-heading"><div><span className="eyebrow">REPOSIÇÃO</span><h2>Estoque baixo</h2></div><span className={`count-pill ${lowStockProducts.length ? 'count-alert' : ''}`}>{lowStockProducts.length} itens</span></div>
                  {lowStockProducts.length ? (
                    <div className="low-stock-list">{lowStockProducts.slice(0, 5).map((product) => (
                      <div className="stock-row" key={product.id}><span className="product-initial">{product.nome.slice(0, 1).toUpperCase()}</span><span className="stock-product"><strong>{product.nome}</strong><small>{product.sku}</small></span><span className="stock-quantity"><strong>{product.quantidade}</strong><small>mín. {product.estoqueMinimo}</small></span><span className="stock-indicator" /></div>
                    ))}</div>
                  ) : <EmptyState icon={<Check size={19} />} title="Tudo em ordem" detail="Nenhum produto precisa de reposição agora." />}
                  {lowStockProducts.length > 5 && <button className="text-link" onClick={() => setView('products')}>Ver todos os alertas <ArrowRight size={14} /></button>}
                </div>
                <div className="panel activity-panel">
                  <div className="panel-heading"><div><span className="eyebrow">ÚLTIMAS ATIVIDADES</span><h2>Movimentações recentes</h2></div><button className="icon-button subtle" title="Abrir histórico" onClick={() => setView('movements')}><ArrowRight size={17} /></button></div>
                  {movements.length ? (
                    <div className="activity-list">{movements.slice(0, 6).map((movement) => <MovementRow key={movement.id} movement={movement} product={products.find((product) => product.id === movement.produtoId)} />)}</div>
                  ) : <EmptyState icon={<Activity size={19} />} title="Sem movimentações" detail="As entradas e saídas aparecerão aqui." />}
                </div>
              </section>
              <section className="bottom-strip"><div className="strip-icon"><Activity size={18} /></div><div><strong>Estoque em tempo real</strong><span>Os indicadores refletem os dados registrados na API.</span></div><button className="text-link" onClick={() => setView('movements')}>Abrir histórico <ArrowRight size={14} /></button></section>
            </>
          )}

          {view === 'products' && (
            <>
              <section className="page-heading">
                <div><span className="eyebrow">CATÁLOGO</span><h1>Produtos<span className="heading-period">.</span></h1><p>{products.length} itens no inventário</p></div>
                <button className="button button-primary" onClick={() => { setShowCategoryForm(false); setModal('product'); }}><Plus size={16} /> Cadastrar produto</button>
              </section>
              <section className="panel catalog-panel">
                <div className="catalog-toolbar"><div className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome ou SKU" aria-label="Buscar produtos" /></div><span className="table-count">{filteredProducts.length} resultados</span></div>
                <div className="table-scroll"><table><thead><tr><th>PRODUTO</th><th>CATEGORIA</th><th>PREÇO</th><th>QUANTIDADE</th><th>STATUS</th>{isAdmin && <th>AÇÕES</th>}</tr></thead><tbody>
                  {filteredProducts.map((product) => <tr key={product.id}><td><div className="table-product"><span className="product-initial">{product.nome.slice(0, 1).toUpperCase()}</span><span><strong>{product.nome}</strong><small>{product.sku}</small></span></div></td><td>{categories.find((category) => category.id === product.categoriaId)?.nome || 'Sem categoria'}</td><td className="price-cell">{currency(product.preco)}</td><td><strong>{product.quantidade}</strong><span className="unit-label"> un.</span></td><td><StockStatus product={product} /></td>{isAdmin && <td><button className="icon-button danger" type="button" title="Excluir produto" aria-label={`Excluir produto ${product.nome}`} disabled={busy} onClick={() => void handleDeleteProduct(product)}><Trash2 size={16} /></button></td>}</tr>)}
                  {!filteredProducts.length && <tr><td colSpan={isAdmin ? 6 : 5}><EmptyState icon={<Package size={19} />} title={search ? 'Nenhum resultado' : 'Catálogo vazio'} detail={search ? 'Tente outro nome ou SKU.' : 'Cadastre o primeiro produto para começar.'} /></td></tr>}
                </tbody></table></div>
              </section>
            </>
          )}

          {view === 'categories' && isAdmin && (
            <>
              <section className="page-heading">
                <div><span className="eyebrow">ORGANIZAÇÃO DO CATÁLOGO</span><h1>Categorias<span className="heading-period">.</span></h1><p>{categories.length} categorias cadastradas</p></div>
              </section>
              <section className="panel catalog-panel category-admin-panel">
                <form className="category-create category-page-form" onSubmit={handleCreateCategory}>
                  <div className="category-form-title"><Tags size={17} /><strong>Nova categoria</strong></div>
                  <label>Nome<input name="nome" placeholder="Ex.: Eletrônicos" maxLength={100} required /></label>
                  <label>Descrição<input name="descricao" placeholder="Descrição (opcional)" maxLength={255} /></label>
                  <button className="button button-primary" type="submit" disabled={busy}><Plus size={15} />{busy ? 'Salvando...' : 'Cadastrar categoria'}</button>
                </form>
                <div className="catalog-toolbar"><div className="toolbar-title"><Tags size={17} /><strong>Categorias cadastradas</strong></div><span className="table-count">{categories.length} registros</span></div>
                <div className="table-scroll"><table><thead><tr><th>NOME</th><th>DESCRIÇÃO</th><th>PRODUTOS</th><th>AÇÕES</th></tr></thead><tbody>
                  {categories.map((category) => <tr key={category.id}><td><strong>{category.nome}</strong></td><td className="category-description">{category.descricao || '—'}</td><td>{products.filter((product) => product.categoriaId === category.id).length}</td><td><button className="icon-button danger" type="button" title="Excluir categoria" aria-label={`Excluir categoria ${category.nome}`} disabled={busy} onClick={() => void handleDeleteCategory(category)}><Trash2 size={16} /></button></td></tr>)}
                  {!categories.length && <tr><td colSpan={4}><EmptyState icon={<Tags size={19} />} title="Nenhuma categoria" detail="Cadastre uma categoria para começar a organizar o catálogo." /></td></tr>}
                </tbody></table></div>
              </section>
            </>
          )}

          {view === 'movements' && (
            <>
              <section className="page-heading">
                <div><span className="eyebrow">HISTÓRICO DO ESTOQUE</span><h1>Movimentações<span className="heading-period">.</span></h1><p>Entradas e saídas registradas na operação.</p></div>
                <button className="button button-primary" onClick={() => { setMovementType('ENTRADA'); setModal('movement'); }}><Plus size={16} /> Registrar movimentação</button>
              </section>
              <section className="panel catalog-panel">
                <div className="catalog-toolbar"><div className="toolbar-title"><ArrowLeftRight size={17} /><strong>Histórico recente</strong></div><span className="table-count">{movements.length} registros</span></div>
                <div className="table-scroll"><table><thead><tr><th>TIPO</th><th>PRODUTO</th><th>QUANTIDADE</th><th>OBSERVAÇÃO</th><th>DATA</th></tr></thead><tbody>
                  {movements.map((movement) => {
                    const product = products.find((item) => item.id === movement.produtoId);
                    return <tr key={movement.id}><td><span className={`movement-tag ${movement.tipo === 'ENTRADA' ? 'tag-in' : 'tag-out'}`}>{movement.tipo === 'ENTRADA' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}{movement.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}</span></td><td><div className="table-product"><span><strong>{product?.nome || movement.produto?.nome || 'Produto'}</strong><small>{product?.sku || movement.produto?.sku || 'Item do inventário'}</small></span></div></td><td><strong>{movement.quantidade}</strong><span className="unit-label"> un.</span></td><td className="observation-cell">{movement.observacao || '—'}</td><td className="date-cell">{dateLabel(movement.createdAt)}</td></tr>;
                  })}
                  {!movements.length && <tr><td colSpan={5}><EmptyState icon={<ArrowLeftRight size={19} />} title="Histórico vazio" detail="Registre uma entrada ou saída para começar." /></td></tr>}
                </tbody></table></div>
              </section>
            </>
          )}
        </div>
      </main>

      {modal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-header"><div><span className="eyebrow">{modal === 'product' ? 'CATÁLOGO' : 'ESTOQUE'}</span><h2 id="modal-title">{modal === 'product' ? 'Novo produto' : 'Nova movimentação'}</h2></div><button className="icon-button" onClick={() => setModal(null)} aria-label="Fechar"><X size={18} /></button></div>
          {modal === 'product' ? <>
            {categories.length === 0 && !showCategoryForm && <div className="inline-notice"><CircleAlert size={17} /><span>{isAdmin ? 'Crie uma categoria antes de cadastrar o primeiro produto.' : 'Peça a um administrador para cadastrar a primeira categoria.'}</span>{isAdmin && <button className="text-link" onClick={() => setShowCategoryForm(true)}>Criar categoria</button>}</div>}
            {showCategoryForm && <form className="category-create" onSubmit={handleCreateCategory}><div className="category-form-title"><strong>Nova categoria</strong><button type="button" className="icon-button subtle" onClick={() => setShowCategoryForm(false)} aria-label="Cancelar"><X size={15} /></button></div><label>Nome<input name="nome" placeholder="Ex.: Eletrônicos" required /></label><label>Descrição<input name="descricao" placeholder="Opcional" /></label><button className="button button-outline button-small" type="submit" disabled={busy}>Salvar categoria</button></form>}
            {categories.length > 0 && !showCategoryForm && isAdmin && <button className="text-link add-category-link" onClick={() => setShowCategoryForm(true)}><Plus size={14} /> Adicionar categoria</button>}
            <form className="stack-form modal-form" onSubmit={handleCreateProduct}>
              <div className="form-pair"><label>Nome do produto<input name="nome" placeholder="Ex.: Teclado mecânico" required /></label><label>SKU<input name="sku" placeholder="Ex.: PER-KEY-001" required /></label></div>
              <label>Categoria<select name="categoriaId" required defaultValue=""><option value="" disabled>Selecione uma categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.nome}</option>)}</select></label>
              <label>Descrição<textarea name="descricao" rows={2} placeholder="Detalhes do produto (opcional)" /></label>
              <div className="form-pair"><label>Preço (R$)<input name="preco" type="number" min="0.01" step="0.01" placeholder="0,00" required /></label><label>Quantidade inicial<input name="quantidade" type="number" min="0" step="1" defaultValue="0" required /></label></div>
              <label>Estoque mínimo<input name="estoqueMinimo" type="number" min="0" step="1" defaultValue="5" required /></label>
              <div className="modal-actions"><button type="button" className="button button-outline" onClick={() => setModal(null)}>Cancelar</button><button type="submit" className="button button-primary" disabled={busy || categories.length === 0}>{busy ? 'Salvando...' : 'Cadastrar produto'}</button></div>
            </form>
          </> : <form className="stack-form modal-form" onSubmit={handleCreateMovement}>
            <div className="segmented-control" role="group" aria-label="Tipo de movimentação"><button type="button" className={movementType === 'ENTRADA' ? 'selected' : ''} onClick={() => setMovementType('ENTRADA')}><ArrowDownLeft size={16} /> Entrada</button><button type="button" className={movementType === 'SAIDA' ? 'selected' : ''} onClick={() => setMovementType('SAIDA')}><ArrowUpRight size={16} /> Saída</button></div>
            <label>Produto<select name="produtoId" required defaultValue=""><option value="" disabled>Selecione um produto</option>{products.map((product) => <option key={product.id} value={product.id}>{product.nome} · {product.quantidade} un.</option>)}</select></label>
            <label>Quantidade<input name="quantidade" type="number" min="1" step="1" placeholder="1" required /></label>
            <label>Observação<textarea name="observacao" rows={3} maxLength={500} placeholder="Motivo ou referência (opcional)" /></label>
            {!products.length && <p className="form-hint">Cadastre um produto antes de registrar movimentações.</p>}
            <div className="modal-actions"><button type="button" className="button button-outline" onClick={() => setModal(null)}>Cancelar</button><button type="submit" className="button button-primary" disabled={busy || !products.length}>{busy ? 'Registrando...' : 'Confirmar movimentação'}</button></div>
          </form>}
        </section>
      </div>}

      {notice && <div className={`toast toast-${notice.kind}`} role="status"><span className="toast-icon">{notice.kind === 'success' ? <Check size={16} /> : <CircleAlert size={16} />}</span>{notice.text}<button onClick={() => setNotice(null)} aria-label="Dispensar aviso"><X size={15} /></button></div>}
      {loading && <div className="loading-bar" aria-hidden="true" />}
    </div>
  );
}

function MetricCard({ label, value, icon, tone, detail, alert = false }: { label: string; value: string; icon: React.ReactNode; tone: string; detail: string; alert?: boolean }) {
  return <article className={`metric-card tone-${tone}`}><div className="metric-top"><span>{label}</span><span className="metric-icon">{icon}</span></div><strong className="metric-value">{value}</strong><span className={`metric-detail ${alert ? 'detail-alert' : ''}`}>{detail}</span></article>;
}

function EmptyState({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return <div className="empty-state"><span className="empty-icon">{icon}</span><strong>{title}</strong><span>{detail}</span></div>;
}

function StockStatus({ product }: { product: Product }) {
  const isOut = product.quantidade === 0;
  const isLow = product.quantidade <= product.estoqueMinimo;
  return <span className={`stock-status ${isOut ? 'status-out' : isLow ? 'status-low' : 'status-ok'}`}><span />{isOut ? 'Sem estoque' : isLow ? 'Estoque baixo' : 'Disponível'}</span>;
}

function MovementRow({ movement, product }: { movement: Movement; product?: Product }) {
  const isEntry = movement.tipo === 'ENTRADA';
  return <div className="activity-row"><span className={`activity-icon ${isEntry ? 'activity-in' : 'activity-out'}`}>{isEntry ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</span><span className="activity-copy"><strong>{isEntry ? 'Entrada de estoque' : 'Saída de estoque'}</strong><small>{product?.nome || movement.produto?.nome || 'Produto'} · {dateLabel(movement.createdAt)}</small></span><span className={isEntry ? 'activity-amount amount-in' : 'activity-amount amount-out'}>{isEntry ? '+' : '−'}{movement.quantidade}</span></div>;
}
