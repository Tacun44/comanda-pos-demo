import {
  makeSeed,
  type DB,
  type Order,
  type OrderStatus,
  type Item,
  type Sale,
} from './seed'
export type { DB, Order, OrderStatus, Product, Sale } from './seed'
const KEY = 'comanda-demo-db'
const delay = () =>
  new Promise<void>(resolve =>
    setTimeout(resolve, 120 + Math.floor(Math.random() * 281))
  )
function read(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const db = JSON.parse(raw) as DB
      if (db.categories && db.orders && db.sales) return db
    }
  } catch {}
  const db = makeSeed()
  localStorage.setItem(KEY, JSON.stringify(db))
  return db
}
function save(db: DB) {
  localStorage.setItem(KEY, JSON.stringify(db))
  window.dispatchEvent(new Event('comanda:changed'))
}
export async function getDB() {
  await delay()
  return read()
}
export function resetDemoData() {
  localStorage.removeItem(KEY)
  save(makeSeed())
}
export async function openTable(tableId: string) {
  await delay()
  const db = read()
  const table = db.tables.find(x => x.id === tableId)
  if (!table) throw Error('Mesa no encontrada')
  if (table.status === 'occupied')
    return db.orders.find(x => x.tableId === tableId && x.status !== 'paid')
  table.status = 'occupied'
  const order: Order = {
    id: `o${Date.now()}`,
    tableId,
    status: 'draft',
    items: [],
    discount: 0,
    createdAt: new Date().toISOString(),
  }
  db.orders.unshift(order)
  save(db)
  return order
}
export async function updateOrder(
  id: string,
  patch: Partial<Pick<Order, 'items' | 'discount' | 'customerId'>>
) {
  await delay()
  const db = read()
  const order = db.orders.find(x => x.id === id)
  if (!order || order.status !== 'draft')
    throw Error('El pedido ya fue enviado')
  Object.assign(order, patch)
  save(db)
  return order
}
export async function setOrderStatus(id: string, status: OrderStatus) {
  await delay()
  const db = read()
  const order = db.orders.find(x => x.id === id)
  if (!order) throw Error('Pedido no encontrado')
  const allowed: Record<OrderStatus, OrderStatus[]> = {
    draft: ['pending'],
    pending: ['preparing'],
    preparing: ['ready'],
    ready: [],
    paid: [],
  }
  if (!allowed[order.status].includes(status))
    throw Error('Cambio de estado inválido')
  if (status === 'pending' && !order.items.length)
    throw Error('Agrega productos antes de enviar')
  order.status = status
  save(db)
  return order
}
export async function chargeOrder(id: string, payment: 'efectivo' | 'tarjeta') {
  await delay()
  const db = read()
  const order = db.orders.find(x => x.id === id)
  if (!order || order.status !== 'ready')
    throw Error('El pedido debe estar listo para cobrar')
  const table = db.tables.find(x => x.id === order.tableId)!
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const sale: Sale = {
    id: `v${Date.now()}`,
    orderId: id,
    tableName: table.name,
    items: order.items.map((x: Item) => ({ ...x })),
    subtotal,
    discount: order.discount,
    total: Math.max(0, subtotal - order.discount),
    payment,
    createdAt: new Date().toISOString(),
  }
  db.sales.unshift(sale)
  order.status = 'paid'
  table.status = 'free'
  save(db)
  return sale
}
export async function releaseTable(id: string) {
  await delay()
  const db = read()
  const table = db.tables.find(x => x.id === id)
  if (!table) throw Error('Mesa no encontrada')
  const order = db.orders.find(x => x.tableId === id && x.status === 'draft')
  if (!order || order.items.length)
    throw Error('Solo se puede liberar una mesa sin pedido enviado')
  db.orders = db.orders.filter(x => x.id !== order.id)
  table.status = 'free'
  save(db)
}
export async function saveProduct(input: {
  id?: string
  name: string
  categoryId: string
  price: number
  active: boolean
  toppings?: string[]
}) {
  await delay()
  const db = read()
  if (input.id) {
    const p = db.products.find(x => x.id === input.id)
    if (!p) throw Error('Producto no encontrado')
    Object.assign(p, input)
  } else db.products.push({ ...input, id: `p${Date.now()}` })
  save(db)
}
export async function saveCustomer(input: {
  id?: string
  name: string
  email: string
  phone: string
}) {
  await delay()
  const db = read()
  if (input.id) {
    const c = db.customers.find(x => x.id === input.id)
    if (!c) throw Error('Cliente no encontrado')
    Object.assign(c, input)
  } else db.customers.push({ ...input, id: `u${Date.now()}` })
  save(db)
}
export async function saveUser(input: {
  id?: string
  name: string
  username: string
  roleId: string
  active: boolean
}) {
  await delay()
  const db = read()
  if (input.id) {
    const user = db.users.find(x => x.id === input.id)
    if (!user) throw Error('Usuario no encontrado')
    Object.assign(user, input)
  } else db.users.push({ ...input, id: `staff${Date.now()}` })
  save(db)
}
export async function saveRole(input: {
  id?: string
  name: string
  permissions: string[]
}) {
  await delay()
  const db = read()
  if (input.id) {
    const role = db.roles.find(x => x.id === input.id)
    if (!role) throw Error('Rol no encontrado')
    Object.assign(role, input)
  } else db.roles.push({ ...input, id: `role${Date.now()}` })
  save(db)
}

export async function saveCategory(name: string) {
  await delay()
  const db = read()
  if (!name.trim()) throw Error('Escribe una categoría')
  db.categories.push({ id: `c${Date.now()}`, name: name.trim() })
  save(db)
}
