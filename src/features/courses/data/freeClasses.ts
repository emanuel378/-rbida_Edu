// Aulões abertos do YouTube: aparecem em "Cursos Disponíveis" e não exigem matrícula.
export interface FreeClass {
  videoId: string
  title: string
  description: string
}

export const FREE_CLASSES: FreeClass[] = [
  {
    videoId: 'RWX2INCsb_A',
    title: 'Aulão 1 - Conhecimentos Educacionais/Pedagógicos',
    description: 'Conhecimentos educacionais e pedagógicos para concursos, com resolução de questões.',
  },
  {
    videoId: 'jvipt43PlME',
    title: 'Aula 2 - Legislação para IFs e SEDUC/CE (LDB)',
    description: 'Legislação educacional para Institutos Federais e SEDUC/CE, com foco na LDB.',
  },
]

export const getFreeClass = (videoId: string) => FREE_CLASSES.find(c => c.videoId === videoId)
