// Disciplina/assunto usados tanto na criação de questões (professor) quanto
// nos filtros do banco de questões (aluno). Precisam ser a MESMA fonte —
// antes o filtro do aluno usava os módulos/tópicos dos cursos (IDs diferentes),
// por isso filtrar por disciplina/assunto nunca encontrava nada.
export const DISCIPLINAS = [
  { value: 'conhecimentos_educacionais', label: 'Conhecimentos Educacionais' },
  { value: 'legislacao', label: 'Legislação' },
  { value: 'portugues', label: 'Português' },
]

export const TOPICOS_POR_DISCIPLINA: Record<string, string[]> = {
  portugues: [
    'Interpretação e Compreensão de Texto', 'Tipologia e Gêneros Textuais',
    'Coesão e Coerência Textual', 'Sintaxe da Norma Padrão', 'Morfologia',
    'Semântica e Léxico', 'Sintaxe do Período', 'Variação Linguística',
    'Estilística e Figuras de Linguagem', 'Fonética e Fonologia',
    'Redação Oficial', 'Análise do Discurso',
  ],
  legislacao: [
    'Constituição Federal de 1988', 'Regime Jurídico Único da União – Lei nº 8.112/1990',
    'Código de Ética Profissional - Decreto nº 1.171/1994',
    'Lei de Acesso à Informação (LAI) - Lei nº 12.527/2011',
    'Lei Geral de Proteção de Dados (LGPD) - Lei nº 13.709/2018',
    'Processo Administrativo Federal - LEI nº 9.784/1999',
    'Licitações e Contratos Administrativos - Lei nº 14.133/2021',
    'Lei de Improbidade Administrativa - Lei nº 8.429/1992',
    'Criação dos Institutos Federais - Lei nº 11.892/2008',
    'Estrutura do Plano de Carreira dos Técnico-Administrativos - Lei nº 11.091/2005',
    'Plano de carreiras e cargos docentes - Lei nº 12.772/2012',
    'Lei de Diretrizes e Bases da Educação (LDB) - Lei nº 9.394/1996',
    'Decreto nº 5.154/2004', 'Decreto nº 5.840/2006',
    'Diretrizes Gerais para EPT - Resolução CNE/CP nº 1/2021',
    'Estatuto da Criança e do Adolescente (ECA) - Lei nº 8.069/1990',
    'Inclusão e Acessibilidade', 'Diretrizes e Planos Educacionais',
    'Normas específicas de cada instituição',
  ],
  conhecimentos_educacionais: [
    'Didática Geral e Formação Docente', 'Tendências Pedagógicas',
    'Planejamento Escolar e Pedagógico', 'Avaliação no Processo de Ensino-Aprendizagem',
    'Psicologia da Aprendizagem e do Desenvolvimento', 'Educação de Jovens e Adultos',
    'Tecnologias de Informação e Comunicação (TICs) na Educação',
    'Metodologias Ativas de Aprendizagem', 'Inclusão na Educação Escolar',
    'Gestão Escolar', 'Base Nacional Comum Curricular',
    'Conhecimentos sobre Educação Profissional e Tecnológica', 'Outros Temas Educacionais',
  ],
}

export const getDisciplinaLabel = (value?: string) =>
  DISCIPLINAS.find(d => d.value === value)?.label || value || ''
