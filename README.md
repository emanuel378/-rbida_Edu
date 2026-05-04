# IF Preparatório - MVP Front-End

Plataforma educacional para preparação de concursos de Institutos Federais (IFs).

## 🛠️ Stack

- React + Vite + TypeScript
- React Router
- Zustand (estado global)
- Tailwind CSS

## 🚀 Como rodar

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`

## 👤 Usuários Mockados

Selecione um usuário no login:

| Nome | Tipo | Status |
|------|------|--------|
| Ana Aluna | Aluno | Ativo |
| Bruno Aluno | Aluno | Ativo |
| Carlos Professor | Professor | ✅ Aprovado |
| Daniela Prof | Professor | ⏳ Pendente |
| Eduardo Admin | Admin | Ativo |

## 📋 Funcionalidades

### Aluno
- Dashboard com cursos e progresso
- Navegação: Curso → Disciplina → Aula
- Player de vídeo (YouTube)
- Download de PDF
- Campo de dúvidas (comentários)
- Banco de questões com filtros
- Simulado com timer e ranking

### Professor
- Criar cursos, disciplinas, aulas e questões

### Admin
- Visualizar usuários
- Listar cursos
- Aprovar professores

## 💾 Persistência

Todos os dados são salvos no `localStorage` (sem backend).

## 📁 Estrutura

```
src/
├── components/    # ProtectedRoute, Layout, ProgressBar
├── pages/         # Login, Dashboard, Course, Lesson, etc
├── store/         # Zustand stores (auth, course, question)
├── data/          # Mock data
└── hooks/         # (futuros hooks customizados)
```
