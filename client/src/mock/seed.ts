export type OrderStatus = 'draft' | 'pending' | 'preparing' | 'ready' | 'paid'
export type Product = {
  id: string
  name: string
  categoryId: string
  price: number
  active: boolean
  toppings?: string[]
}
export type Table = {
  id: string
  name: string
  zone: string
  status: 'free' | 'occupied'
}
export type Item = {
  productId: string
  name: string
  price: number
  quantity: number
  note: string
}
export type Order = {
  id: string
  tableId: string
  status: OrderStatus
  items: Item[]
  discount: number
  createdAt: string
  customerId?: string
}
export type Sale = {
  id: string
  orderId: string
  tableName: string
  items: Item[]
  subtotal: number
  discount: number
  total: number
  payment: 'efectivo' | 'tarjeta'
  createdAt: string
}
export type Customer = {
  id: string
  name: string
  email: string
  phone: string
}
export type User = {
  id: string
  name: string
  username: string
  roleId: string
  active: boolean
}
export type Role = { id: string; name: string; permissions: string[] }
export type DB = {
  categories: { id: string; name: string }[]
  products: Product[]
  tables: Table[]
  orders: Order[]
  sales: Sale[]
  customers: Customer[]
  users: User[]
  roles: Role[]
}
const menus: [string, string[]][] = [
  [
    'Café',
    ['Espresso', 'Americano', 'Capuchino', 'Latte', 'Mocaccino', 'Café frío'],
  ],
  [
    'Bebidas',
    [
      'Limonada de coco',
      'Jugo de mango',
      'Té frío',
      'Chocolate caliente',
      'Agua con gas',
      'Soda de frutos rojos',
    ],
  ],
  [
    'Desayunos',
    [
      'Tostadas con aguacate',
      'Huevos al gusto',
      'Waffle de frutas',
      'Croissant de queso',
      'Granola de la casa',
      'Arepa con queso',
    ],
  ],
  [
    'Platos',
    [
      'Sándwich de pollo',
      'Ensalada de temporada',
      'Pasta cremosa',
      'Arroz con vegetales',
      'Hamburguesa de la casa',
      'Sopa del día',
    ],
  ],
  [
    'Postres',
    [
      'Torta de zanahoria',
      'Brownie',
      'Cheesecake de maracuyá',
      'Galleta de avena',
      'Flan de vainilla',
      'Helado artesanal',
    ],
  ],
]
const first = [
  'Luna',
  'Nora',
  'Elio',
  'Mara',
  'Dario',
  'Vera',
  'Ivo',
  'Sara',
  'Bruno',
  'Lia',
  'Tomas',
  'Nina',
  'Leo',
  'Alma',
  'Noel',
  'Eva',
  'Gael',
  'Ines',
  'Rita',
  'Hugo',
]
const last = [
  'Rivera',
  'Morales',
  'Castro',
  'Paz',
  'Sierra',
  'Rojas',
  'Vega',
  'Lagos',
  'Salas',
  'Prado',
]
export function makeSeed(): DB {
  const categories = menus.map(([name], i) => ({ id: `c${i + 1}`, name }))
  const products = menus.flatMap(([, names], ci) =>
    names.map((name, pi) => ({
      id: `p${ci * 6 + pi + 1}`,
      name,
      categoryId: `c${ci + 1}`,
      price:
        (ci === 0
          ? 6500
          : ci === 1
            ? 8500
            : ci === 2
              ? 16000
              : ci === 3
                ? 28000
                : 12000) +
        pi * 1200,
      active: true,
      toppings: ci === 0 ? ['Leche vegetal', 'Canela'] : undefined,
    }))
  )
  const tables = Array.from({ length: 12 }, (_, i) => ({
    id: `t${i + 1}`,
    name: `Mesa ${i + 1}`,
    zone: i < 6 ? 'Salón' : 'Terraza',
    status: 'free' as const,
  }))
  const customers = first.map((name, i) => ({
    id: `u${i + 1}`,
    name: `${name} ${last[i % last.length]}`,
    email: `cliente${String(i + 1).padStart(2, '0')}@example.com`,
    phone: `300 000 ${String(i + 1).padStart(4, '0')}`,
  }))
  const roles = [
    {
      id: 'admin',
      name: 'Administrador',
      permissions: [
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
      ],
    },
    {
      id: 'waiter',
      name: 'Mesero',
      permissions: [
        'pos',
        'tables',
        'kitchen',
        'orders',
        'sales',
        'products',
        'customers',
      ],
    },
    { id: 'cook', name: 'Cocina', permissions: ['kitchen', 'orders'] },
  ]
  const users = [
    {
      id: 'staff1',
      name: 'Nora Sierra',
      username: 'demo',
      roleId: 'admin',
      active: true,
    },
    {
      id: 'staff2',
      name: 'Leo Paz',
      username: 'mesero',
      roleId: 'waiter',
      active: true,
    },
    {
      id: 'staff3',
      name: 'Alma Vega',
      username: 'cocina',
      roleId: 'cook',
      active: true,
    },
    {
      id: 'staff4',
      name: 'Ivo Prado',
      username: 'caja',
      roleId: 'waiter',
      active: true,
    },
    {
      id: 'staff5',
      name: 'Vera Lagos',
      username: 'apoyo',
      roleId: 'waiter',
      active: true,
    },
  ]
  const sales = Array.from({ length: 30 }, (_, i) => {
    const a = products[(i * 7) % products.length],
      b = products[(i * 11 + 3) % products.length]
    const items = [
      {
        productId: a.id,
        name: a.name,
        price: a.price,
        quantity: 1 + (i % 2),
        note: '',
      },
      { productId: b.id, name: b.name, price: b.price, quantity: 1, note: '' },
    ]
    const subtotal = items.reduce((sum, x) => sum + x.price * x.quantity, 0)
    const date = new Date()
    date.setDate(date.getDate() - (i % 30))
    date.setHours(9 + (i % 10), 20, 0, 0)
    return {
      id: `v${i + 1}`,
      orderId: `historico${i + 1}`,
      tableName: tables[i % 12].name,
      items,
      subtotal,
      discount: 0,
      total: subtotal,
      payment: (i % 2 ? 'tarjeta' : 'efectivo') as 'tarjeta' | 'efectivo',
      createdAt: date.toISOString(),
    }
  })
  return {
    categories,
    products,
    tables,
    orders: [],
    sales,
    customers,
    users,
    roles,
  }
}
