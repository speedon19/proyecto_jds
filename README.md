# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Configuración de Supabase

1. Crea un archivo `.env` en la raíz del proyecto con tus credenciales:

   ```
   VITE_SUPABASE_URL=tu-url
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   SUPABASE_SERVICE_ROLE=solo-para-scripts-locales
   ADMIN_EMAIL=JDS@empresa.com
   ADMIN_PASSWORD=JDS123!
   ADMIN_FULL_NAME=Administrador General
   ADMIN_POSITION=Administrador
   ```

2. Instala dependencias y levanta la app:

   ```
   npm install
   npm run dev
   ```

3. Para crear o actualizar el usuario administrador en Supabase ejecuta:

   ```
   npm run seed:admin
   ```

   El script utiliza la clave `SUPABASE_SERVICE_ROLE`, por lo que debe ejecutarse únicamente en entornos de desarrollo seguros.
