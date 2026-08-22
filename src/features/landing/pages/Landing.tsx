import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCourseStore } from '../../courses/data/courseStore'
import {
  BookOpen,
  PlayCircle,
  FileText,
  Trophy,
  MessageSquare,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Star,
  Users,
  Clock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  MonitorPlay,
  Target,
  BarChart3,
  GraduationCap,
  DollarSign,
  Mail,
  Phone,
} from 'lucide-react'
import {
  CONTACT_EMAIL,
  CONTACT_WHATSAPP_DISPLAY,
  CONTACT_WHATSAPP_LINK,
  CONTACT_INSTAGRAM_HANDLE,
  CONTACT_INSTAGRAM_LINK,
} from '../../../shared/constants/contact'

const faqData = [
  {
    question: 'Como funciona o acesso às aulas?',
     answer: 'Após a matrícula, você tem acesso imediato a todas as aulas gravadas do seu módulo. As aulas ficam disponíveis 24h por dia, 7 dias por semana, e você pode assistir quantas vezes quiser.',
  },
  {
    question: 'Posso cancelar minha assinatura a qualquer momento?',
    answer: 'Sim! Você pode cancelar sua assinatura a qualquer momento sem multas ou taxas adicionais. Seu acesso continua ativo até o final do período já pago.',
  },
  {
    question: 'Os simulados são semelhantes à prova real?',
    answer: 'Nossos simulados são elaborados por professores especializados e seguem o mesmo formato, nível de dificuldade e distribuição de temas das provas oficiais dos institutos federais.',
  },
  {
    question: 'Preciso de internet para assistir às aulas?',
    answer: 'Sim, é necessário conexão com a internet para acessar a plataforma. Recomendamos uma conexão mínima de 5Mbps para uma experiência de vídeo fluida.',
  },
  {
    question: 'Como funciona a correção de redação?',
    answer: 'No plano Premium e VIP, você pode enviar até 4 redações por mês. Cada redação é corrigida por um professor especializado com feedback detalhado e nota baseada nos critérios oficiais.',
  },
  {
    question: 'Existe garantia de satisfação?',
    answer: 'Oferecemos garantia de 7 dias. Se não ficar satisfeito com a plataforma, devolvemos 100% do seu investimento sem perguntas.',
  },
]

const testimonials = [
  {
    name: 'Fernanda Rodrigues',
    text: 'Consegui minha vaga no IFSP graças à plataforma! As aulas são muito bem explicadas e os simulados me prepararam perfeitamente.',
    rating: 5,
    course: 'Aprovada no IFSP',
  },
  {
    name: 'Lucas Mendes',
    text: 'O banco de questões é incrível. Pratiquei muito e quando fiz a prova, já estava familiarizado com todos os tipos de questão.',
    rating: 5,
    course: 'Aprovado no IFMG',
  },
  {
    name: 'Beatriz Almeida',
    text: 'A correção de redação fez toda diferença. Recebi feedbacks detalhados que melhoraram muito minha escrita.',
    rating: 5,
    course: 'Aprovada no IFRJ',
  },
]

export default function Landing() {
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const { courses, getTeacherName } = useCourseStore()
  const [publishedCourses, setPublishedCourses] = useState<typeof courses>([])

  useEffect(() => {
    setPublishedCourses(courses.filter(c => c.published))
  }, [courses])

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src="/logo-full.png" alt="ÓrbitaEdu" className="h-20 w-auto" />
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Recursos</a>
              <a href="#cursos" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Cursos</a>
              <a href="#faq" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">FAQ</a>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/questoes')}
                className="hidden sm:flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-50"
              >
                <FileText className="w-4 h-4" />
                Conheça o Banco de Questões
              </button>
              <button
                onClick={() => navigate('/login')}
                className="text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium px-4 py-2"
              >
                Entrar
              </button>
              <button
                onClick={() => navigate('/login')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                Começar Agora
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-blue-300 rounded-full blur-3xl" />
          <div className="absolute top-40 right-40 w-24 h-24 bg-purple-300 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                <span>Plataforma #1 para Institutos Federais</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Sua aprovação no
                <span className="block text-blue-200">Instituto Federal</span>
                <span className="block">começa aqui</span>
              </h1>
       <p className="text-lg text-blue-100 mb-8 max-w-lg">
         Aulas completas, banco de questões com milhares de exercícios, simulados cronometrados e acompanhamento de desempenho. Tudo em um só lugar.
       </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center justify-center gap-2 bg-lime-400 hover:bg-lime-500 text-gray-900 font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-lg hover:shadow-xl animate-scale"
                >
                  Começar Agora
                  <ArrowRight className="w-5 h-5" />
                </button>
                <a
                  href="#cursos"
                  className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-medium px-8 py-4 rounded-xl text-lg transition-all border border-white/20"
                >
                  Ver Cursos
                </a>
              </div>
              <button
                onClick={() => navigate('/questoes')}
                className="inline-flex items-center gap-2 mt-4 text-blue-100 hover:text-white transition-colors text-sm font-medium underline decoration-blue-300/50 underline-offset-4"
              >
                <FileText className="w-4 h-4" />
                Ou conheça o Banco de Questões gratuitamente
              </button>
              <div className="flex items-center gap-6 mt-10">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-200" />
                  <span className="text-sm text-blue-100">+5.000 alunos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm text-blue-100">4.9/5 avaliação</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-blue-200" />
                  <span className="text-sm text-blue-100">92% aprovação</span>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 bg-white/10 backdrop-blur-sm rounded-3xl rotate-6 absolute -top-4 -right-4" />
                <div className="w-80 h-80 bg-gradient-to-br from-blue-400/30 to-purple-400/30 backdrop-blur-sm rounded-3xl -rotate-3 relative">
                  <div className="w-full h-full flex flex-col items-center justify-center text-white p-8">
                    <MonitorPlay className="w-16 h-16 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">+500 Aulas</h3>
                    <p className="text-blue-100 text-center text-sm">Em todos os módulos para sua preparação</p>
                    <div className="grid grid-cols-2 gap-4 mt-6 w-full">
                      <div className="bg-white/15 rounded-xl p-3 text-center">
                        <FileText className="w-6 h-6 mx-auto mb-1" />
                        <p className="text-xs">Redação</p>
                      </div>
                      <div className="bg-white/15 rounded-xl p-3 text-center">
                        <Target className="w-6 h-6 mx-auto mb-1" />
                        <p className="text-xs">Questões</p>
                      </div>
                      <div className="bg-white/15 rounded-xl p-3 text-center">
                        <BarChart3 className="w-6 h-6 mx-auto mb-1" />
                        <p className="text-xs">Desempenho</p>
                      </div>
                      <div className="bg-white/15 rounded-xl p-3 text-center">
                        <MessageSquare className="w-6 h-6 mx-auto mb-1" />
                        <p className="text-xs">Fórum</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Recursos
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Tudo que você precisa para ser aprovado
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Uma plataforma completa com as melhores ferramentas de estudo para sua preparação nos Institutos Federais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: PlayCircle,
                title: 'Aulas em Vídeo',
                description: 'Centenas de aulas gravadas em HD com professores especializados, disponíveis 24h.',
                color: 'blue',
              },
               {
                 icon: FileText,
                 title: 'Banco de Questões',
                 description: 'Milhares de questões organizadas por módulo, dificuldade e instituição.',
                 color: 'green',
               },
              {
                icon: Trophy,
                title: 'Simulados Cronometrados',
                description: 'Simulados fiéis às provas reais com ranking e análise de desempenho.',
                color: 'purple',
              },
              {
                icon: BookOpen,
                title: 'Redação Corrigida',
                description: 'Envie suas redações e receba correções detalhadas de professores especialistas.',
                color: 'orange',
              },
               {
                 icon: BarChart3,
                 title: 'Desempenho Detalhado',
                 description: 'Acompanhe seu progresso com gráficos e estatísticas por módulo.',
                 color: 'pink',
               },
              {
                icon: MessageSquare,
                title: 'Fórum de Dúvidas',
                description: 'Tire suas dúvidas com professores e colegas na nossa comunidade ativa.',
                color: 'teal',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  feature.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                  feature.color === 'green' ? 'bg-green-50 text-green-600' :
                  feature.color === 'purple' ? 'bg-purple-50 text-purple-600' :
                  feature.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                  feature.color === 'pink' ? 'bg-pink-50 text-pink-600' :
                  'bg-teal-50 text-teal-600'
                }`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="cursos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Cursos
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Escolha seu curso e comece agora
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Cursos completos com aulas, questões e simulados. Pagamento único por curso, sem assinatura.
            </p>
          </div>

          {publishedCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-500">Nenhum curso disponível ainda</h3>
              <p className="text-gray-400 mt-2">Em breve novos cursos serão publicados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {publishedCourses.map((course) => (
                <div key={course.id}
                  className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-600" />
                  <div className="p-6">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description || 'Sem descrição'}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <GraduationCap className="w-4 h-4" />
                      <span>{getTeacherName(course.teacherId)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm text-gray-500">R$</span>
                        <span className="text-2xl font-bold text-gray-900">{course.price.toFixed(2).replace('.', ',')}</span>
                      </div>
                      <button
                        onClick={() => navigate('/login')}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm shadow-blue-200">
                        Matricular-se
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Depoimentos
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              O que nossos alunos dizem
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Milhares de alunos já conquistaram sua vaga nos Institutos Federais com nossa plataforma.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-xs text-green-600 font-medium">{testimonial.course}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Atendimento
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Fale com a gente
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Nossos canais oficiais de atendimento. Fique atento a golpes: só usamos os contatos abaixo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="flex flex-col items-center text-center bg-gray-50 hover:bg-gray-100 rounded-2xl p-8 border border-gray-100 transition-colors"
            >
              <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Mail className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">E-mail</h3>
              <p className="text-sm text-gray-600 break-all">{CONTACT_EMAIL}</p>
            </a>

            <a
              href={CONTACT_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center text-center bg-gray-50 hover:bg-gray-100 rounded-2xl p-8 border border-gray-100 transition-colors"
            >
              <div className="w-14 h-14 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
                <Phone className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">WhatsApp</h3>
              <p className="text-sm text-gray-600">{CONTACT_WHATSAPP_DISPLAY}</p>
            </a>

            <a
              href={CONTACT_INSTAGRAM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center text-center bg-gray-50 hover:bg-gray-100 rounded-2xl p-8 border border-gray-100 transition-colors"
            >
              <div className="w-14 h-14 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Instagram</h3>
              <p className="text-sm text-gray-600">{CONTACT_INSTAGRAM_HANDLE}</p>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Perguntas frequentes
            </h2>
            <p className="text-lg text-gray-600">
              Tire suas dúvidas sobre a plataforma.
            </p>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-base font-semibold text-gray-900 pr-4">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ShieldCheck className="w-12 h-12 text-blue-200 mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Pronto para conquistar sua vaga?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de alunos que já estão se preparando conosco. Comece gratuitamente hoje mesmo.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-500 text-gray-900 font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-lg hover:shadow-xl animate-scale"
          >
            Começar Gratuitamente
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-blue-100">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-lime-400" />
              Sem cartão de crédito
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-lime-400" />
              7 dias de garantia
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-lime-400" />
              Cancele quando quiser
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo-small.png" alt="ÓrbitaEdu" className="h-20 w-20 rounded-xl object-cover" />
                <span className="text-lg font-bold text-white">ÓrbitaEdu</span>
              </div>
              <p className="text-sm leading-relaxed">
                A plataforma completa para sua aprovação nos Institutos Federais.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Plataforma</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#plans" className="hover:text-white transition-colors">Planos</a></li>
                <li><a href="#teachers" className="hover:text-white transition-colors">Professores</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#contato" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white transition-colors">{CONTACT_EMAIL}</a></li>
                <li><a href={CONTACT_WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp: {CONTACT_WHATSAPP_DISPLAY}</a></li>
                <li><a href={CONTACT_INSTAGRAM_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram: {CONTACT_INSTAGRAM_HANDLE}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm">
              © 2026 ÓrbitaEdu. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>Feito com dedicação para seus estudos</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
