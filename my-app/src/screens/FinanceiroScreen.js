import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Tela, { Grade } from '../components/Tela';
import { Cartao, Etiqueta, TituloSecao, EstadoVazio } from '../components/Cartao';
import { CartaoMetrica } from '../components/Trilha';
import { BotaoAcao } from '../components/LinhaLista';
import { useDados } from '../context/DadosContext';
import { useFeedback } from '../context/FeedbackContext';
import { cores, espaco, tipografia } from '../theme';

const moeda = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function FinanceiroScreen() {
  const dados = useDados();
  const { mostrar } = useFeedback();

  const ativas = dados.assinaturas.filter((a) => a.ativa).length;

  return (
    <Tela>
      <Grade>
        <CartaoMetrica
          rotulo="Receita confirmada"
          valor={moeda(dados.receitaConfirmada())}
          apoio="Pagamentos com status Pago"
        />
        <CartaoMetrica
          rotulo="A receber"
          valor={moeda(dados.receitaPendente())}
          apoio="Pagamentos pendentes"
        />
      </Grade>

      <TituloSecao texto="Planos" apoio={`${ativas} assinaturas ativas no momento.`} />
      {dados.planos.map((plano) => {
        const assinantes = dados.assinaturas.filter((a) => a.planoId === plano.id && a.ativa).length;
        return (
          <Cartao key={plano.id} estilo={estilos.item}>
            <View style={estilos.linha}>
              <View style={{ flex: 1 }}>
                <Text style={tipografia.corpoForte}>{plano.nome}</Text>
                <Text style={tipografia.apoio}>{plano.periodicidade}</Text>
              </View>
              <Text style={tipografia.corpoForte}>{moeda(plano.valor)}</Text>
            </View>
            <Etiqueta
              texto={`${assinantes} ${assinantes === 1 ? 'assinante ativo' : 'assinantes ativos'}`}
              tom={assinantes > 0 ? 'info' : 'neutro'}
            />
          </Cartao>
        );
      })}

      <TituloSecao texto="Assinaturas" />
      {dados.assinaturas.map((assinatura) => {
        const aluno = dados.usuarioPorId(assinatura.alunoId);
        const plano = dados.planos.find((p) => p.id === assinatura.planoId);
        return (
          <Cartao
            key={assinatura.id}
            estilo={estilos.item}
            faixa={assinatura.ativa ? cores.sucesso : cores.borda}
          >
            <Text style={tipografia.corpoForte}>{aluno?.nome ?? 'Pessoa removida'}</Text>
            <Text style={tipografia.apoio}>
              Plano {plano?.nome ?? '—'} · desde {new Date(assinatura.inicio).toLocaleDateString('pt-BR')}
            </Text>
            <Etiqueta
              texto={assinatura.ativa ? 'Ativa' : 'Cancelada'}
              tom={assinatura.ativa ? 'sucesso' : 'neutro'}
            />
            <BotaoAcao
              texto={assinatura.ativa ? 'Cancelar' : 'Reativar'}
              destrutivo={assinatura.ativa}
              rotulo={`${assinatura.ativa ? 'Cancelar' : 'Reativar'} assinatura de ${aluno?.nome ?? 'pessoa'}`}
              dica={assinatura.ativa ? 'Encerra a assinatura' : 'Volta a cobrar o plano'}
              onPress={() => {
                dados.alternarAssinatura(assinatura.id);
                mostrar(assinatura.ativa ? 'Assinatura cancelada.' : 'Assinatura reativada.', assinatura.ativa ? 'info' : 'sucesso');
              }}
            />
          </Cartao>
        );
      })}

      <TituloSecao texto="Pagamentos" />
      {dados.pagamentos.length === 0 ? (
        <EstadoVazio titulo="Sem pagamentos" descricao="Os lançamentos das assinaturas aparecem aqui." />
      ) : (
        dados.pagamentos.map((pagamento) => {
          const pago = pagamento.status === 'Pago';
          return (
            <Cartao key={pagamento.id} estilo={estilos.item} faixa={pago ? cores.sucesso : cores.aviso}>
              <View style={estilos.linha}>
                <View style={{ flex: 1 }}>
                  <Text style={tipografia.corpoForte}>{moeda(pagamento.valor)}</Text>
                  <Text style={tipografia.apoio}>
                    Vencimento {new Date(pagamento.data).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
                <Etiqueta texto={pagamento.status} tom={pago ? 'sucesso' : 'aviso'} />
              </View>
              {!pago && (
                <BotaoAcao
                  texto="Registrar pagamento"
                  rotulo={`Registrar pagamento de ${moeda(pagamento.valor)}`}
                  dica="Marca o lançamento como pago"
                  onPress={() => {
                    dados.registrarPagamento(pagamento.id);
                    mostrar('Pagamento registrado.');
                  }}
                />
              )}
            </Cartao>
          );
        })
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  item: { marginBottom: espaco.md, gap: espaco.sm },
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: espaco.md },
});
