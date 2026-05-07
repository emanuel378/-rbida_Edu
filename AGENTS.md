# AGENTS.md

## Stack Tecnológica
React 19 + Vite 8 + TypeScript 6 + Tailwind CSS 4 + Zustand 5 + React Router 7

## Comandos
- `npm run dev` - Inicia o servidor de desenvolvimento (http://localhost:5173)
- `npm run build` - Executa verificação de tipos e build (`tsc && vite build`)
- `npm run preview` - Visualiza a build de produção

Não há comandos de teste ou lint configurados.

## Arquitetura
- **Entrada**: `src/main.tsx` → `src/App.tsx` (rotas do React Router)
- **Estado**: Stores Zustand em `src/store/` (auth, course, question, ui)
- **Persistência**: Todos os dados no `localStorage` (sem backend)
- **Dados mockados**: `src/data/mock.ts` inicializa o `localStorage` no primeiro carregamento
- **Páginas**: `src/pages/` com rotas aninhadas em `dashboard/`
- **Componentes**: `src/components/` (compartilhados) e `src/components/layout/`

## Particularidades
- `src/counter.ts` não é utilizado (resto de template do Vite)
- `dist/` existe no repositório, mas provavelmente deveria estar no `.gitignore`
- O título no `index.html` é "ÓrbitaEdu"; o README cita "IF Preparatório"
- O Tailwind 4 usa o plugin do Vite (`@tailwindcss/vite`), não configuração tradicional
- TypeScript: as opções `noUnusedLocals` e `noUnusedParameters` estão desativadas no tsconfig
