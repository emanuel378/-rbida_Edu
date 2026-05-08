import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
} from 'lucide-react'

const teachers = [
  { name: 'Carlos Silva', specialty: 'Matemática', experience: '12 anos', formation: 'Doutorando em Matemática - USP', avatar: 'CS' },
  { name: 'Maria Santos', specialty: 'Português', experience: '8 anos', formation: 'Mestre em Letras - UNICAMP', avatar: 'MS' },
  { name: 'João Oliveira', specialty: 'Física', experience: '10 anos', formation: 'Doutor em Física - UFRJ', avatar: 'JO' },
  { name: 'Ana Costa', specialty: 'Química', experience: '6 anos', formation: 'Mestre em Química - UFMG', avatar: 'AC' },
  { name: 'Pedro Lima', specialty: 'Biologia', experience: '9 anos', formation: 'Doutorando em Biologia - USP', avatar: 'PL' },
  { name: 'Lucia Ferreira', specialty: 'História', experience: '15 anos', formation: 'Doutora em História - UNB', avatar: 'LF' },
]

const plans = [
  {
    name: 'Gratuito',
    price: '0',
    period: '',
    description: 'Para conhecer a plataforma',
    features: [
      'Acesso a 2 aulas demonstrativas',
      '5 questões por dia',
      '1 simulado por mês',
      'Fórum da comunidade',
    ],
    cta: 'Começar Grátis',
    highlighted: false,
    color: 'gray',
  },
  {
    name: 'Premium',
    price: '29',
    period: '/mês',
    description: 'O mais escolhido pelos alunos',
    features: [
      'Todas as aulas disponíveis',
      'Questões ilimitadas',
      'Simulados semanais',
      'Correção de redação',
      'Cronograma personalizado',
      'Suporte prioritário',
    ],
    cta: 'Assine Já',
    highlighted: true,
    color: 'blue',
    badge: 'Recomendado',
  },
  {
    name: 'VIP',
    price: '59',
    period: '/mês',
    description: 'Preparação completa e intensiva',
    features: [
      'Tudo do plano Premium',
      'Aulas ao vivo semanais',
      'Mentoria individual',
      'Grupo exclusivo WhatsApp',
      'Material em PDF completo',
      'Garantia de aprovação',
    ],
    cta: 'Garantir Vaga',
    highlighted: false,
    color: 'purple',
  },
]

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

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src="/logo-full.png" alt="ÓrbitaEdu" className="h-20 w-auto" />
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Recursos</a>
              <a href="#plans" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Planos</a>
              <a href="#teachers" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Professores</a>
              <a href="#faq" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">FAQ</a>
            </div>
            <div className="flex items-center gap-3">
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
                  href="#plans"
                  className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-medium px-8 py-4 rounded-xl text-lg transition-all border border-white/20"
                >
                  Ver Planos
                </a>
              </div>
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

      {/* Plans Section */}
      <section id="plans" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Planos
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Escolha o plano ideal para você
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Planos flexíveis que cabem no seu bolso. Comece grátis e faça upgrade quando quiser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-2xl p-8 transition-all animate-scale ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-xl shadow-blue-200 scale-105'
                    : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-lime-400 text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className={`text-xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-4 ${plan.highlighted ? 'text-blue-100' : 'text-gray-500'}`}>
                    {plan.description}
                  </p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-sm ${plan.highlighted ? 'text-blue-200' : 'text-gray-500'}`}>R$</span>
                    <span className={`text-5xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ${plan.highlighted ? 'text-blue-200' : 'text-gray-500'}`}>
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3">
                      <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        plan.highlighted ? 'text-lime-400' : 'text-green-500'
                      }`} />
                      <span className={`text-sm ${plan.highlighted ? 'text-blue-50' : 'text-gray-600'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/login')}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.highlighted
                      ? 'bg-lime-400 hover:bg-lime-500 text-gray-900 shadow-sm hover:shadow-md'
                      : plan.color === 'purple'
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teachers Section */}
      <section id="teachers" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Equipe
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Professores especializados
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Nossa equipe é formada por professores com anos de experiência em preparação para concursos de Institutos Federais.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {teachers.map((teacher, index) => (
              <div key={index} className="group relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer">
                <div className="aspect-square bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">{teacher.avatar}</span>
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{teacher.name}</h3>
                  <p className="text-xs text-blue-600 font-medium">{teacher.specialty}</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900 via-blue-800 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                  <h3 className="text-white font-bold text-sm mb-1">{teacher.name}</h3>
                  <p className="text-blue-200 text-xs mb-2">{teacher.specialty} • {teacher.experience}</p>
                  <p className="text-blue-100 text-xs leading-relaxed">{teacher.formation}</p>
                </div>
              </div>
            ))}
          </div>
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
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">WhatsApp</a></li>
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
