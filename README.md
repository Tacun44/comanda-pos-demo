# Comanda · POS demo

Este proyecto nace de un sistema de restaurante en el que trabajé; aquí solo hay código de interfaz, marca y datos ficticios. La operación corresponde al negocio inventado **Café La Ola** y está recortada a un flujo básico de restaurante.

## Ejecutar

```sh
pnpm install
pnpm dev
```

Acceso: `demo` / `Demo2026!` (administrador) o `mesero` / `Demo2026!` (sin Usuarios, Roles ni Reportes).

## Stack y estructura

React, TypeScript, Vite, Tailwind, Radix Dialog, React Query, wouter y Recharts. `client/src/App.tsx` contiene pantallas y rutas; `client/src/mock/` contiene los datos ficticios y operaciones asíncronas; `client/public/` contiene la marca SVG. Los datos se guardan en `localStorage` y la sesión en `sessionStorage`. El botón de restablecimiento regenera el conjunto inicial. No hay servidor de datos ni llamadas de red en la aplicación.

## Qué aprendí y qué me costó

- Modelar el avance de un pedido desde borrador hasta listo y cobrado.
- Mantener la ocupación de mesas coherente con pedidos abiertos y cobros.
- Invalidar la caché de React Query después de cada cambio local.
- Reducir el alcance sin dejar rutas ni dependencias de funciones descartadas.
