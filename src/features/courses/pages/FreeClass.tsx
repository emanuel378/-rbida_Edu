import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Breadcrumb from '../../../shared/components/Breadcrumb'
import { getFreeClass } from '../data/freeClasses'

export default function FreeClass() {
  const { videoId } = useParams()
  const freeClass = getFreeClass(videoId || '')

  if (!freeClass) return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto text-center py-20">
      <p className="text-gray-500 mb-4">Aula não encontrada.</p>
      <Link to="/dashboard" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">
        Ver cursos disponíveis
      </Link>
    </div>
  )

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <Breadcrumb items={[{ label: 'Dashboard', to: '/dashboard' }, { label: freeClass.title }]} />
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium mb-4">
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{freeClass.title}</h1>
      <p className="text-gray-600 mb-6">{freeClass.description}</p>

      <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${freeClass.videoId}?rel=0&modestbranding=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={freeClass.title}
          />
        </div>
      </div>
    </div>
  )
}
