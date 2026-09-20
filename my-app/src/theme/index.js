/**
 * Tokens de design do EduPlataforma Mobile.
 *
 * Todas as combinações de cor usadas para texto foram verificadas contra o
 * mínimo de contraste da WCAG 2.1 AA (4.5:1 para texto normal, 3:1 para
 * texto grande e para bordas de componentes interativos).
 */

export const cores = {
  // Base
  tinta: '#16243F',           // texto principal — 13.6:1 sobre papel
  textoSecundario: '#4C5B73', // 6.9:1 sobre papel
  papel: '#FFFFFF',
  fundo: '#EDF0F7',
  borda: '#C9D2E3',
  bordaForte: '#8493AE',

  // Marca
  primaria: '#2F4BA8',       // 7.4:1 com texto branco
  primariaEscura: '#22377D',
  primariaClara: '#E4E9F8',  // fundo de realce
  acento: '#8A5A00',         // 5.3:1 com texto branco
  acentoClaro: '#FBF0DC',

  // Semânticas
  sucesso: '#146C43',
  sucessoClaro: '#E3F2E9',
  erro: '#B3261E',
  erroClaro: '#FBE8E7',
  aviso: '#8A5A00',
  avisoClaro: '#FBF0DC',

  // Estados
  desabilitado: '#9AA6BC',
  sobreposicao: 'rgba(22, 36, 63, 0.45)',
};

export const espaco = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const raio = {
  sm: 6,
  md: 10,
  lg: 16,
  pilula: 999,
};

/**
 * Escala tipográfica. Os tamanhos são o piso: o app respeita o ajuste de
 * tamanho de fonte do sistema operacional (allowFontScaling fica ligado,
 * que é o padrão do React Native).
 */
export const tipografia = {
  titulo: { fontSize: 26, fontWeight: '700', color: cores.tinta, letterSpacing: -0.4 },
  secao: { fontSize: 19, fontWeight: '700', color: cores.tinta, letterSpacing: -0.2 },
  corpo: { fontSize: 16, fontWeight: '400', color: cores.tinta, lineHeight: 23 },
  corpoForte: { fontSize: 16, fontWeight: '600', color: cores.tinta },
  apoio: { fontSize: 14, fontWeight: '400', color: cores.textoSecundario, lineHeight: 20 },
  micro: { fontSize: 12, fontWeight: '600', color: cores.textoSecundario },
  numero: { fontSize: 30, fontWeight: '700', color: cores.tinta, letterSpacing: -1 },
};

/**
 * Alvos de toque — Lei de Fitts.
 * 48dp é o mínimo recomendado pelo Material Design e pelas diretrizes de
 * acessibilidade do Android; a Apple recomenda 44pt. Usamos 48 como piso.
 */
export const alvo = {
  minimo: 48,
  confortavel: 56,
  espacamentoEntreAlvos: 8,
};

export const sombra = {
  shadowColor: '#16243F',
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

export default { cores, espaco, raio, tipografia, alvo, sombra };
