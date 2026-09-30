import { useState, type FormEvent, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Link, Route, Switch, useLocation } from 'wouter'
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import * as Dialog from '@radix-ui/react-dialog'
import {
  LayoutDashboard,
  UtensilsCrossed,
  Grid2X2,
  ChefHat,
  ClipboardList,
  Receipt,
  Users,
  ChartColumn,
  Shield,
  LogOut,
  RotateCcw,
  Menu,
  Plus,
  Minus,
} from 'lucide-react'
import { useDemoDB } from './mock/hooks'
import {
  chargeOrder,
  openTable,
  releaseTable,
  resetDemoData,
  saveCustomer,
  saveCategory,
  saveProduct,
  saveRole,
  saveUser,
  setOrderStatus,
  updateOrder,
  type DB,
  type Order,
} from './mock'
const client = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60000, refetchOnWindowFocus: false },
  },
})
const money = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
const day = (date: string) =>
  new Date(date).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
const nav = [
  ['/', 'Dashboard', LayoutDashboard, 'dashboard'],
  ['/pos', 'POS / TPV', UtensilsCrossed, 'pos'],
  ['/tables', 'Mesas', Grid2X2, 'tables'],
  ['/products', 'Productos / Menú', Menu, 'products'],
  ['/kitchen', 'Cocina', ChefHat, 'kitchen'],
  ['/orders', 'Pedidos', ClipboardList, 'orders'],
  ['/sales', 'Ventas', Receipt, 'sales'],
  ['/customers', 'Clientes', Users, 'customers'],
  ['/reports', 'Reportes', ChartColumn, 'reports'],
  ['/users', 'Usuarios', Users, 'users'],
  ['/roles', 'Roles', Shield, 'roles'],
] as const
const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/pos': 'POS / TPV',
  '/tables': 'Mesas',
  '/products': 'Productos / Menú',
  '/kitchen': 'Panel de cocina',
  '/orders': 'Pedidos',
  '/sales': 'Ventas',
  '/customers': 'Clientes',
  '/reports': 'Reportes básicos',
  '/users': 'Usuarios',
  '/roles': 'Roles',
}
const statusText: Record<string, string> = {
  draft: 'Abierto',
  pending: 'Pendiente',
  preparing: 'Preparando',
  ready: 'Listo',
  paid: 'Cobrado',
}
const action = async (fn: () => Promise<unknown>) => {
  try {
    await fn()
  } catch (e) {
    window.alert(e instanceof Error ? e.message : 'Ocurrió un error')
  }
}
function Section({
  title,
  children,
  right,
}: {
  title: string
  children: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  )
}
function Empty({ children }: { children: ReactNode }) {
  return <div className="card p-8 text-center text-slate-500">{children}</div>
}
function Login({ onLogin }: { onLogin: (u: 'demo' | 'mesero') => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  function submit(e: FormEvent) {
    e.preventDefault()
    if (
      (username === 'demo' || username === 'mesero') &&
      password === 'Demo2026!'
    ) {
      onLogin(username)
      return
    }
    setError('Credenciales incorrectas')
  }
  return (
    <main className="min-h-screen grid place-items-center bg-[#eaf1eb] p-5">
      <div className="card w-full max-w-md p-8">
        <img src="/logo.svg" alt="Logo" className="w-32 mb-6" />
        <p className="text-sm font-semibold text-teal-800">Café La Ola</p>
        <h1 className="text-3xl font-bold mb-2">Bienvenido</h1>
        <p className="text-slate-500 mb-7">
          Ingresa a la demo del punto de venta.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="label">Usuario</span>
            <input
              className="field"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="block">
            <span className="label">Contraseña</span>
            <input
              className="field"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <p role="alert" className="text-red-700 text-sm">
              {error}
            </p>
          )}
          <button className="btn w-full">Ingresar</button>
        </form>
        <div className="mt-6 rounded-xl bg-teal-50 p-4 text-sm">
          <p className="font-bold mb-2">Acceso de prueba</p>
          <p>
            Administrador: <code>demo</code> / <code>Demo2026!</code>
          </p>
          <p>
            Mesero: <code>mesero</code> / <code>Demo2026!</code>
          </p>
          <button
            className="mt-3 text-teal-800 font-semibold underline"
            onClick={() => {
              setUsername('demo')
              setPassword('Demo2026!')
              setError('')
            }}
          >
            Autocompletar
          </button>
        </div>
      </div>
    </main>
  )
}
function Layout({
  user,
  onLogout,
  children,
}: {
  user: 'demo' | 'mesero'
  onLogout: () => void
  children: ReactNode
}) {
  const [location] = useLocation()
  const [mobile, setMobile] = useState(false)
  const links = nav.filter(
    ([, , , permission]) =>
      user === 'demo' || !['reports', 'users', 'roles'].includes(permission)
  )
  return (
    <div className="min-h-screen md:flex">
      <aside
        className={`${mobile ? 'block' : 'hidden'} md:block bg-[#103b3a] text-white w-full md:w-60 shrink-0 p-4`}
      >
        <img src="/logo.svg" alt="Logo" className="w-24 mb-2" />
        <p className="text-teal-100 text-sm px-3 mb-5">Café La Ola</p>
        <nav className="space-y-1">
          {links.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobile(false)}
              className={`navlink flex items-center gap-3 ${location === href ? 'active' : ''}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="bg-white border-b border-slate-200 px-4 md:px-7 py-4 flex items-center gap-3">
          <button
            className="md:hidden"
            aria-label="Abrir menú"
            onClick={() => setMobile(!mobile)}
          >
            <Menu />
          </button>
          <h1 className="text-xl font-bold flex-1">
            {titles[location] || 'Comanda'}
          </h1>
          <span className="hidden sm:inline text-sm text-slate-500">
            {user === 'demo' ? 'Administrador' : 'Mesero'}
          </span>
          <button
            className="btn btn-secondary text-xs flex gap-2 items-center"
            onClick={() => {
              if (
                window.confirm('¿Restablecer los datos ficticios de la demo?')
              )
                resetDemoData()
            }}
          >
            <RotateCcw size={15} />
            <span className="hidden sm:inline">
              Restablecer datos de la demo
            </span>
          </button>
          <button title="Salir" onClick={onLogout}>
            <LogOut size={20} />
          </button>
        </header>
        <main className="p-4 md:p-7 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  )
}
function Dashboard({ db }: { db: DB }) {
  const today = new Date().toDateString()
  const todaySales = db.sales.filter(
    x => new Date(x.createdAt).toDateString() === today
  )
  const total = todaySales.reduce((s, x) => s + x.total, 0)
  const active = db.orders.filter(x => x.status !== 'paid')
  const chart = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return {
      name: d.toLocaleDateString('es-CO', { weekday: 'short' }),
      total: db.sales
        .filter(x => new Date(x.createdAt).toDateString() === d.toDateString())
        .reduce((s, x) => s + x.total, 0),
    }
  })
  return (
    <>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
        {[
          ['Ventas de hoy', money(total)],
          ['Órdenes activas', active.length],
          [
            'Mesas ocupadas',
            db.tables.filter(x => x.status === 'occupied').length,
          ],
          ['Ventas de hoy', todaySales.length],
        ].map(([a, b], i) => (
          <div className="card p-5" key={i}>
            <p className="text-sm text-slate-500">{a}</p>
            <p className="text-2xl font-bold mt-2">{b}</p>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-bold mb-5">Ventas de los últimos 7 días</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid vertical={false} stroke="#e5ece8" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={v => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={v => money(Number(v))} />
                <Bar dataKey="total" fill="#2f806a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-bold mb-4">Actividad actual</h2>
          {active.length ? (
            active.slice(0, 6).map(x => (
              <p className="border-b py-3 text-sm" key={x.id}>
                {db.tables.find(t => t.id === x.tableId)?.name}{' '}
                <span className="pill float-right">{statusText[x.status]}</span>
              </p>
            ))
          ) : (
            <p className="text-slate-500">No hay pedidos activos.</p>
          )}
        </div>
      </div>
    </>
  )
}
function Tables({ db, go }: { db: DB; go: (path: string) => void }) {
  return (
    <Section
      title="Mesas"
      right={
        <span className="text-sm text-slate-500">
          {db.tables.filter(t => t.status === 'free').length} disponibles
        </span>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {db.tables.map(table => {
          const order = db.orders.find(
            o => o.tableId === table.id && o.status !== 'paid'
          )
          return (
            <div className="card p-5" key={table.id}>
              <div className="flex justify-between">
                <strong>{table.name}</strong>
                <span className="pill">
                  {table.status === 'free' ? 'Libre' : 'Ocupada'}
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-5">
                {table.zone}
                {order ? ` · ${statusText[order.status]}` : ''}
              </p>
              {table.status === 'free' ? (
                <button
                  className="btn w-full"
                  onClick={() =>
                    action(async () => {
                      const order = await openTable(table.id)
                      if (order)
                        sessionStorage.setItem(
                          'comanda-selected-order',
                          order.id
                        )
                      go('/pos')
                    })
                  }
                >
                  Abrir mesa
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    className="btn flex-1"
                    onClick={() => {
                      if (order)
                        sessionStorage.setItem(
                          'comanda-selected-order',
                          order.id
                        )
                      go('/pos')
                    }}
                  >
                    Ver pedido
                  </button>
                  {order?.status === 'draft' && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => action(() => releaseTable(table.id))}
                    >
                      Liberar
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Section>
  )
}
function POS({ db }: { db: DB }) {
  const [chosen, setChosen] = useState(
    () => sessionStorage.getItem('comanda-selected-order') || ''
  )
  const [category, setCategory] = useState('all')
  const [note, setNote] = useState('')
  const [discount, setDiscount] = useState('0')
  const [payment, setPayment] = useState<'efectivo' | 'tarjeta'>('efectivo')
  const active = db.orders.filter(x => x.status !== 'paid')
  const order = active.find(x => x.id === chosen) || active[0]
  const table = order && db.tables.find(x => x.id === order.tableId)
  const subtotal =
    order?.items.reduce((s, x) => s + x.price * x.quantity, 0) || 0
  const products = db.products.filter(
    x => x.active && (category === 'all' || x.categoryId === category)
  )
  const editable = order?.status === 'draft'
  async function add(product: DB['products'][number]) {
    if (!order) return
    const items = order.items.map(x => ({ ...x }))
    const existing = items.find(
      x => x.productId === product.id && x.note === note
    )
    if (existing) existing.quantity++
    else
      items.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        note,
      })
    await updateOrder(order.id, { items })
    setNote('')
  }
  async function quantity(index: number, delta: number) {
    if (!order) return
    const items = order.items.map(x => ({ ...x }))
    items[index].quantity += delta
    if (items[index].quantity <= 0) items.splice(index, 1)
    await updateOrder(order.id, { items })
  }
  return (
    <div className="grid xl:grid-cols-[1fr_360px] gap-5">
      <div>
        <Section
          title="Tomar pedido"
          right={
            <select
              className="field max-w-48"
              value={order?.id || ''}
              onChange={e => {
                setChosen(e.target.value)
                sessionStorage.setItem('comanda-selected-order', e.target.value)
              }}
            >
              <option value="">Seleccionar mesa</option>
              {active.map(o => (
                <option value={o.id} key={o.id}>
                  {db.tables.find(t => t.id === o.tableId)?.name} ·{' '}
                  {statusText[o.status]}
                </option>
              ))}
            </select>
          }
        >
          {!active.length && (
            <Empty>Abre una mesa desde Mesas para comenzar.</Empty>
          )}
          {order && (
            <>
              <div className="flex gap-2 overflow-auto mb-4">
                <button
                  className={`btn ${category === 'all' ? '' : 'btn-secondary'}`}
                  onClick={() => setCategory('all')}
                >
                  Todos
                </button>
                {db.categories.map(c => (
                  <button
                    key={c.id}
                    className={`btn whitespace-nowrap ${category === c.id ? '' : 'btn-secondary'}`}
                    onClick={() => setCategory(c.id)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
              <label className="block mb-4">
                <span className="label">Nota para el próximo producto</span>
                <input
                  className="field"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  disabled={!editable}
                  placeholder="Ej. sin azúcar"
                />
              </label>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {products.map(p => (
                  <button
                    disabled={!editable}
                    onClick={() => action(() => add(p))}
                    className="card p-4 text-left hover:border-teal-700"
                    key={p.id}
                  >
                    <strong>{p.name}</strong>
                    <p className="text-sm text-slate-500 mt-1">
                      {money(p.price)}
                    </p>
                    {p.toppings && (
                      <p className="text-xs text-teal-700 mt-2">
                        Opciones: {p.toppings.join(', ')}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </Section>
      </div>
      <div className="card p-5 h-fit xl:sticky xl:top-5">
        <h2 className="text-lg font-bold">{table?.name || 'Pedido'}</h2>
        <p className="text-sm text-slate-500 mb-4">
          {order ? statusText[order.status] : 'Selecciona una mesa abierta'}
        </p>
        {order?.items.length ? (
          order.items.map((item, i) => (
            <div className="border-t py-3" key={i}>
              <div className="flex justify-between gap-2">
                <span>
                  {item.name}{' '}
                  <span className="text-slate-500">× {item.quantity}</span>
                </span>
                <strong>{money(item.price * item.quantity)}</strong>
              </div>
              {item.note && (
                <p className="text-xs text-slate-500">{item.note}</p>
              )}
              {editable && (
                <div className="flex gap-2 mt-2">
                  <button
                    aria-label="Quitar uno"
                    className="btn btn-secondary p-1"
                    onClick={() => action(() => quantity(i, -1))}
                  >
                    <Minus size={15} />
                  </button>
                  <button
                    aria-label="Agregar uno"
                    className="btn btn-secondary p-1"
                    onClick={() => action(() => quantity(i, 1))}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500 py-5">Sin productos.</p>
        )}
        {order && (
          <>
            <div className="border-t pt-4 space-y-2 text-sm">
              <p className="flex justify-between">
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </p>
              <label>
                <span className="label">Descuento fijo (COP)</span>
                <input
                  className="field"
                  type="number"
                  min="0"
                  max={subtotal}
                  value={editable ? discount : order.discount}
                  disabled={!editable}
                  onChange={e => setDiscount(e.target.value)}
                />
              </label>
              <p className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>
                  {money(
                    Math.max(
                      0,
                      subtotal - (editable ? Number(discount) : order.discount)
                    )
                  )}
                </span>
              </p>
            </div>
            {editable && (
              <button
                disabled={!order.items.length}
                className="btn w-full mt-4"
                onClick={() =>
                  action(async () => {
                    await updateOrder(order.id, {
                      discount: Math.min(
                        subtotal,
                        Math.max(0, Number(discount) || 0)
                      ),
                    })
                    await setOrderStatus(order.id, 'pending')
                  })
                }
              >
                Enviar a cocina
              </button>
            )}
            {order.status === 'ready' && (
              <div className="mt-4 space-y-3">
                <select
                  className="field"
                  value={payment}
                  onChange={e =>
                    setPayment(e.target.value as 'efectivo' | 'tarjeta')
                  }
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
                <button
                  className="btn w-full"
                  onClick={() => action(() => chargeOrder(order.id, payment))}
                >
                  Cobrar y liberar mesa
                </button>
              </div>
            )}
            {(order.status === 'pending' || order.status === 'preparing') && (
              <p className="text-sm text-teal-800 mt-4">
                La cocina está procesando este pedido.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
function Kitchen({ db }: { db: DB }) {
  const orders = db.orders.filter(o =>
    ['pending', 'preparing', 'ready'].includes(o.status)
  )
  return (
    <Section title="Comandas en cocina">
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {orders.map(o => (
          <div className="card p-5" key={o.id}>
            <div className="flex justify-between mb-3">
              <strong>{db.tables.find(t => t.id === o.tableId)?.name}</strong>
              <span className="pill">{statusText[o.status]}</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              {new Date(o.createdAt).toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            {o.items.map((x, i) => (
              <p key={i} className="py-2 border-t text-sm">
                {x.quantity} × {x.name}
                {x.note && (
                  <span className="block text-slate-500">{x.note}</span>
                )}
              </p>
            ))}
            {o.status !== 'ready' && (
              <button
                className="btn w-full mt-3"
                onClick={() =>
                  action(() =>
                    setOrderStatus(
                      o.id,
                      o.status === 'pending' ? 'preparing' : 'ready'
                    )
                  )
                }
              >
                {o.status === 'pending'
                  ? 'Comenzar preparación'
                  : 'Marcar listo'}
              </button>
            )}
          </div>
        ))}
      </div>
      {!orders.length && <Empty>No hay pedidos en cocina.</Empty>}
    </Section>
  )
}
function Orders({ db }: { db: DB }) {
  return (
    <Section title="Estado de pedidos">
      <div className="card overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-teal-50">
            <tr>
              {['Mesa', 'Fecha', 'Productos', 'Estado', 'Total'].map(x => (
                <th key={x} className="p-3">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {db.orders.map(o => (
              <tr key={o.id} className="border-t">
                <td className="p-3">
                  {db.tables.find(t => t.id === o.tableId)?.name}
                </td>
                <td className="p-3">{day(o.createdAt)}</td>
                <td className="p-3">
                  {o.items.reduce((s, x) => s + x.quantity, 0)}
                </td>
                <td className="p-3">
                  <span className="pill">{statusText[o.status]}</span>
                </td>
                <td className="p-3">
                  {money(
                    o.items.reduce((s, x) => s + x.price * x.quantity, 0) -
                      o.discount
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!db.orders.length && (
          <p className="p-5 text-slate-500">Todavía no hay pedidos nuevos.</p>
        )}
      </div>
    </Section>
  )
}
function Sales({ db }: { db: DB }) {
  return (
    <Section
      title="Ventas"
      right={
        <span className="text-sm text-slate-500">{db.sales.length} ventas</span>
      }
    >
      <div className="card overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-teal-50">
            <tr>
              {['Venta', 'Fecha', 'Mesa', 'Pago', 'Productos', 'Total'].map(
                x => (
                  <th className="p-3" key={x}>
                    {x}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {db.sales.map(s => (
              <tr key={s.id} className="border-t">
                <td className="p-3">{s.id}</td>
                <td className="p-3">{day(s.createdAt)}</td>
                <td className="p-3">{s.tableName}</td>
                <td className="p-3 capitalize">{s.payment}</td>
                <td className="p-3">{s.items.map(x => x.name).join(', ')}</td>
                <td className="p-3 font-bold">{money(s.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}
function Reports({ db }: { db: DB }) {
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return {
      name: d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
      total: db.sales
        .filter(s => new Date(s.createdAt).toDateString() === d.toDateString())
        .reduce((n, s) => n + s.total, 0),
    }
  })
  const totals = new Map<string, number>()
  db.sales.forEach(s =>
    s.items.forEach(i =>
      totals.set(i.name, (totals.get(i.name) || 0) + i.price * i.quantity)
    )
  )
  const products = [...totals]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, total]) => ({ name, total }))
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <div className="card p-5">
        <h2 className="font-bold mb-4">Ventas por día · últimos 30 días</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={days}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" interval={4} />
              <YAxis tickFormatter={v => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={v => money(Number(v))} />
              <Bar dataKey="total" fill="#2f806a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card p-5">
        <h2 className="font-bold mb-4">Ventas por producto</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={products} layout="vertical" margin={{ left: 45 }}>
              <CartesianGrid horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={v => `${Math.round(v / 1000)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 11 }}
              />
              <Tooltip formatter={v => money(Number(v))} />
              <Bar dataKey="total" fill="#72b29a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
function Editor({
  title,
  children,
  onSave,
}: {
  title: string
  children: ReactNode
  onSave: (e: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="btn btn-secondary text-sm">
        {title}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 card p-6 w-[min(95vw,450px)] max-h-[90vh] overflow-auto">
          <Dialog.Title className="text-lg font-bold mb-4">
            {title}
          </Dialog.Title>
          <form onSubmit={onSave} className="space-y-4">
            {children}
            <div className="flex justify-end gap-2">
              <Dialog.Close className="btn btn-secondary">
                Cancelar
              </Dialog.Close>
              <button className="btn">Guardar</button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
function Products({ db }: { db: DB }) {
  const [name, setName] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [categoryId, setCategoryId] = useState(db.categories[0].id)
  const [price, setPrice] = useState('')
  const [toppings, setToppings] = useState('')
  return (
    <Section
      title="Productos / Menú"
      right={
        <div className="flex gap-2">
          <Editor
            title="Nueva categoría"
            onSave={e => {
              e.preventDefault()
              action(() => saveCategory(newCategory))
              setNewCategory('')
            }}
          >
            <label>
              <span className="label">Nombre</span>
              <input
                className="field"
                required
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
              />
            </label>
          </Editor>
          <Editor
            title="Nuevo producto"
            onSave={e => {
              e.preventDefault()
              action(() =>
                saveProduct({
                  name,
                  categoryId,
                  price: Number(price),
                  active: true,
                  toppings: toppings
                    .split(',')
                    .map(x => x.trim())
                    .filter(Boolean),
                })
              )
              setName('')
              setPrice('')
              setToppings('')
            }}
          >
            <label>
              <span className="label">Nombre</span>
              <input
                required
                className="field"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </label>
            <label>
              <span className="label">Categoría</span>
              <select
                className="field"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
              >
                {db.categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">Precio COP</span>
              <input
                required
                type="number"
                min="1"
                className="field"
                value={price}
                onChange={e => setPrice(e.target.value)}
              />
            </label>
            <label>
              <span className="label">
                Opciones simples, separadas por coma
              </span>
              <input
                className="field"
                value={toppings}
                onChange={e => setToppings(e.target.value)}
              />
            </label>
          </Editor>
        </div>
      }
    >
      {db.categories.map(c => (
        <div key={c.id} className="mb-5">
          <h3 className="font-bold mb-3">{c.name}</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {db.products
              .filter(p => p.categoryId === c.id)
              .map(p => (
                <div className="card p-4" key={p.id}>
                  <div className="flex justify-between gap-2">
                    <strong>{p.name}</strong>
                    <span>{money(p.price)}</span>
                  </div>
                  {p.toppings?.length ? (
                    <p className="text-xs text-slate-500 mt-2">
                      {p.toppings.join(' · ')}
                    </p>
                  ) : null}
                  <button
                    className="text-xs underline text-teal-800 mt-3"
                    onClick={() =>
                      action(() => saveProduct({ ...p, active: !p.active }))
                    }
                  >
                    {p.active ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              ))}
          </div>
        </div>
      ))}
    </Section>
  )
}
function Customers({ db }: { db: DB }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  return (
    <Section
      title="Clientes"
      right={
        <Editor
          title="Nuevo cliente"
          onSave={e => {
            e.preventDefault()
            action(() => saveCustomer({ name, email, phone }))
            setName('')
            setEmail('')
            setPhone('')
          }}
        >
          <label>
            <span className="label">Nombre</span>
            <input
              className="field"
              required
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </label>
          <label>
            <span className="label">Correo</span>
            <input
              className="field"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </label>
          <label>
            <span className="label">Teléfono</span>
            <input
              className="field"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </label>
        </Editor>
      }
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {db.customers.map(c => (
          <div className="card p-4" key={c.id}>
            <strong>{c.name}</strong>
            <p className="text-sm text-slate-500">{c.email}</p>
            <p className="text-sm text-slate-500">{c.phone}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}
function UsersPage({ db }: { db: DB }) {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [roleId, setRoleId] = useState(db.roles[0].id)
  return (
    <Section
      title="Usuarios"
      right={
        <Editor
          title="Nuevo usuario ficticio"
          onSave={e => {
            e.preventDefault()
            action(() => saveUser({ name, username, roleId, active: true }))
            setName('')
            setUsername('')
          }}
        >
          <label>
            <span className="label">Nombre</span>
            <input
              className="field"
              required
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </label>
          <label>
            <span className="label">Identificador</span>
            <input
              className="field"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </label>
          <label>
            <span className="label">Rol</span>
            <select
              className="field"
              value={roleId}
              onChange={e => setRoleId(e.target.value)}
            >
              {db.roles.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        </Editor>
      }
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {db.users.map(u => (
          <div className="card p-4" key={u.id}>
            <strong>{u.name}</strong>
            <p className="text-sm text-slate-500">
              {u.username} · {db.roles.find(r => r.id === u.roleId)?.name}
            </p>
            <button
              className="text-xs underline text-teal-800 mt-3"
              onClick={() =>
                action(() => saveUser({ ...u, active: !u.active }))
              }
            >
              {u.active ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        ))}
      </div>
      <p className="text-sm text-slate-500 mt-5">
        Los usuarios añadidos son ilustrativos. El acceso a esta demo usa las
        dos credenciales de prueba.
      </p>
    </Section>
  )
}
function Roles({ db }: { db: DB }) {
  const perms = [
    'pos',
    'tables',
    'kitchen',
    'orders',
    'sales',
    'products',
    'customers',
    'reports',
    'users',
    'roles',
  ]
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  return (
    <Section
      title="Roles"
      right={
        <Editor
          title="Nuevo rol"
          onSave={e => {
            e.preventDefault()
            action(() => saveRole({ name, permissions: selected }))
            setName('')
            setSelected([])
          }}
        >
          <label>
            <span className="label">Nombre</span>
            <input
              className="field"
              required
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </label>
          <div>
            <span className="label">Permisos</span>
            <div className="grid grid-cols-2 gap-2">
              {perms.map(p => (
                <label key={p} className="text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(p)}
                    onChange={e =>
                      setSelected(
                        e.target.checked
                          ? [...selected, p]
                          : selected.filter(x => x !== p)
                      )
                    }
                  />{' '}
                  {p}
                </label>
              ))}
            </div>
          </div>
        </Editor>
      }
    >
      <div className="grid md:grid-cols-3 gap-4">
        {db.roles.map(r => (
          <div className="card p-5" key={r.id}>
            <h3 className="font-bold">{r.name}</h3>
            <p className="text-sm text-slate-500 mt-2">
              {r.permissions.join(', ')}
            </p>
          </div>
        ))}
      </div>
      <p className="text-sm text-slate-500 mt-5">
        El usuario mesero tiene acceso reducido; administrador puede ver todas
        las secciones.
      </p>
    </Section>
  )
}
function Shell() {
  const [user, setUser] = useState<'demo' | 'mesero' | null>(() => {
    const s = sessionStorage.getItem('comanda-session')
    return s === 'demo' || s === 'mesero' ? s : null
  })
  const [location, setLocation] = useLocation()
  const query = useDemoDB()
  function login(u: 'demo' | 'mesero') {
    sessionStorage.setItem('comanda-session', u)
    setUser(u)
    setLocation('/')
  }
  function logout() {
    sessionStorage.removeItem('comanda-session')
    setUser(null)
    setLocation('/login')
  }
  if (!user) return <Login onLogin={login} />
  const forbidden =
    user === 'mesero' && ['/reports', '/users', '/roles'].includes(location)
  if (forbidden)
    return (
      <Layout user={user} onLogout={logout}>
        <Empty>
          Esta sección requiere el rol Administrador.{' '}
          <Link href="/" className="underline">
            Ir al inicio
          </Link>
        </Empty>
      </Layout>
    )
  if (query.isLoading || !query.data)
    return (
      <Layout user={user} onLogout={logout}>
        <p>Cargando datos de la demo…</p>
      </Layout>
    )
  const db = query.data
  return (
    <Layout user={user} onLogout={logout}>
      <Switch>
        <Route path="/">
          <Dashboard db={db} />
        </Route>
        <Route path="/pos">
          <POS db={db} />
        </Route>
        <Route path="/tables">
          <Tables db={db} go={setLocation} />
        </Route>
        <Route path="/products">
          <Products db={db} />
        </Route>
        <Route path="/kitchen">
          <Kitchen db={db} />
        </Route>
        <Route path="/orders">
          <Orders db={db} />
        </Route>
        <Route path="/sales">
          <Sales db={db} />
        </Route>
        <Route path="/customers">
          <Customers db={db} />
        </Route>
        <Route path="/reports">
          <Reports db={db} />
        </Route>
        <Route path="/users">
          <UsersPage db={db} />
        </Route>
        <Route path="/roles">
          <Roles db={db} />
        </Route>
        <Route>
          <Empty>
            Página no encontrada.{' '}
            <Link href="/" className="underline">
              Volver al inicio
            </Link>
          </Empty>
        </Route>
      </Switch>
    </Layout>
  )
}
export default function App() {
  return (
    <QueryClientProvider client={client}>
      <Shell />
    </QueryClientProvider>
  )
}
