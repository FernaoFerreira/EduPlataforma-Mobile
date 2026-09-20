/**
 * Dados iniciais em memória.
 *
 * A Etapa 2 não exige persistência nem comunicação com servidor, então estes
 * dados vivem apenas no estado da aplicação e são recarregados a cada
 * execução. O formato reproduz o modelo usado pelo projeto web de origem
 * (Plataforma de Cursos Online), para que a troca por chamadas HTTP reais
 * afete apenas a camada de acesso a dados.
 */

export const categoriasIniciais = [
  { id: 'cat-1', nome: 'Programação', descricao: 'Lógica, linguagens e engenharia de software' },
  { id: 'cat-2', nome: 'Design', descricao: 'Interface, ilustração e identidade visual' },
  { id: 'cat-3', nome: 'Negócios', descricao: 'Gestão, finanças e empreendedorismo' },
];

export const usuariosIniciais = [
  { id: 'usr-1', nome: 'Ana Ribeiro', email: 'ana.ribeiro@exemplo.com', perfil: 'Professor' },
  { id: 'usr-2', nome: 'Bruno Tavares', email: 'bruno.tavares@exemplo.com', perfil: 'Professor' },
  { id: 'usr-3', nome: 'Carla Menezes', email: 'carla.menezes@exemplo.com', perfil: 'Aluno' },
  { id: 'usr-4', nome: 'Diego Prado', email: 'diego.prado@exemplo.com', perfil: 'Aluno' },
  { id: 'usr-5', nome: 'Elisa Nunes', email: 'elisa.nunes@exemplo.com', perfil: 'Aluno' },
  { id: 'usr-6', nome: 'Fábio Correia', email: 'fabio.correia@exemplo.com', perfil: 'Administrador' },
];

export const cursosIniciais = [
  {
    id: 'cur-1',
    titulo: 'React Native do zero',
    descricao: 'Construção de aplicativos móveis multiplataforma com Expo.',
    categoriaId: 'cat-1',
    professorId: 'usr-1',
    cargaHoraria: 40,
    preco: 249.9,
    publicado: true,
  },
  {
    id: 'cur-2',
    titulo: 'Banco de dados relacional',
    descricao: 'Modelagem, normalização e SQL aplicado.',
    categoriaId: 'cat-1',
    professorId: 'usr-2',
    cargaHoraria: 32,
    preco: 189.9,
    publicado: true,
  },
  {
    id: 'cur-3',
    titulo: 'Fundamentos de interface',
    descricao: 'Hierarquia visual, tipografia e acessibilidade na prática.',
    categoriaId: 'cat-2',
    professorId: 'usr-1',
    cargaHoraria: 24,
    preco: 159.9,
    publicado: false,
  },
];

export const modulosIniciais = [
  { id: 'mod-1', cursoId: 'cur-1', titulo: 'Preparando o ambiente', ordem: 1 },
  { id: 'mod-2', cursoId: 'cur-1', titulo: 'Componentes e navegação', ordem: 2 },
  { id: 'mod-3', cursoId: 'cur-2', titulo: 'Modelo entidade-relacionamento', ordem: 1 },
  { id: 'mod-4', cursoId: 'cur-3', titulo: 'Contraste e legibilidade', ordem: 1 },
];

export const aulasIniciais = [
  { id: 'aul-1', moduloId: 'mod-1', titulo: 'Instalando o Expo', duracaoMin: 12, ordem: 1 },
  { id: 'aul-2', moduloId: 'mod-1', titulo: 'Primeiro projeto', duracaoMin: 18, ordem: 2 },
  { id: 'aul-3', moduloId: 'mod-2', titulo: 'Pilhas e abas', duracaoMin: 25, ordem: 1 },
  { id: 'aul-4', moduloId: 'mod-2', titulo: 'Passagem de parâmetros', duracaoMin: 15, ordem: 2 },
  { id: 'aul-5', moduloId: 'mod-3', titulo: 'Entidades e atributos', duracaoMin: 20, ordem: 1 },
  { id: 'aul-6', moduloId: 'mod-4', titulo: 'Medindo contraste', duracaoMin: 14, ordem: 1 },
];

export const matriculasIniciais = [
  { id: 'mat-1', cursoId: 'cur-1', alunoId: 'usr-3', data: '2026-03-02', concluida: true, certificadoEmitido: true },
  { id: 'mat-2', cursoId: 'cur-1', alunoId: 'usr-4', data: '2026-04-11', concluida: false, certificadoEmitido: false },
  { id: 'mat-3', cursoId: 'cur-2', alunoId: 'usr-5', data: '2026-05-20', concluida: true, certificadoEmitido: false },
  { id: 'mat-4', cursoId: 'cur-2', alunoId: 'usr-3', data: '2026-06-01', concluida: false, certificadoEmitido: false },
];

export const planosIniciais = [
  { id: 'pln-1', nome: 'Mensal', valor: 49.9, periodicidade: 'Mensal' },
  { id: 'pln-2', nome: 'Anual', valor: 479.0, periodicidade: 'Anual' },
];

export const assinaturasIniciais = [
  { id: 'ass-1', planoId: 'pln-1', alunoId: 'usr-3', ativa: true, inicio: '2026-03-01' },
  { id: 'ass-2', planoId: 'pln-2', alunoId: 'usr-5', ativa: true, inicio: '2026-01-15' },
  { id: 'ass-3', planoId: 'pln-1', alunoId: 'usr-4', ativa: false, inicio: '2025-11-08' },
];

export const pagamentosIniciais = [
  { id: 'pag-1', assinaturaId: 'ass-1', valor: 49.9, data: '2026-09-01', status: 'Pago' },
  { id: 'pag-2', assinaturaId: 'ass-2', valor: 479.0, data: '2026-01-15', status: 'Pago' },
  { id: 'pag-3', assinaturaId: 'ass-1', valor: 49.9, data: '2026-10-01', status: 'Pendente' },
];
