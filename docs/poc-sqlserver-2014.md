# POC Técnica - Conexão com SQL Server 2014

## Objetivo

Comparar duas abordagens para conexão futura com SQL Server 2014 no contexto do sistema legado:
- Driver `mssql`
- `TypeORM` com SQL Server

A decisão final deve priorizar seguranca, performance, compatibilidade com SQL Server 2014 e manutencao de longo prazo.

## Escopo da POC

- Sem uso de dados sensiveis no repositório.
- Sem alterar schema.
- Sem implementar regra de negócio.
- Sem presumir tabelas/relacionamentos antes do inventario.
- Testes técnicos controlados em leitura.

## Criterios de Avaliação

1. Compatibilidade com SQL Server 2014
- suporte real a recursos e tipos encontrados no inventario;
- estabilidade de conexão e comportamento de timeout;
- capacidade de lidar com constraints e chaves compostas.

2. Seguranca
- suporte a TLS e configuracoes de certificacao;
- protecao de credenciais (env, secret manager);
- possibilidade de parametrizacao segura de consultas.

3. Performance
- latencia media e p95 em leitura;
- controle de pool de conexoes;
- overhead do framework/ORM vs driver direto.

4. Manutencao
- clareza do codigo de integração;
- curva de aprendizado do time;
- testabilidade e observabilidade.

5. Riscos Operacionais
- lock-in de tecnologia;
- risco de abstracoes esconderem comportamento critico;
- dificuldade de tuning em queries criticas.

## Matriz Comparativa (Preliminar)

| Criterio | mssql (driver) | TypeORM (SQL Server) |
|---|---|---|
| Controle fino de conexão e SQL | Alto | Medio |
| Velocidade para CRUD simples | Medio | Alto |
| Transparencia de performance | Alta | Media |
| Curva de aprendizagem (time Nest) | Media | Baixa/Media |
| Risco de acoplamento a ORM | Baixo | Medio/Alto |
| Facilidade para anti-corruption layer | Alta | Media |
| Compatibilidade legada (a validar) | A validar | A validar |
| Debug de problemas SQL | Mais direto | Pode exigir analise de geracao SQL |

## Hipotese Inicial

- `mssql` tende a ser melhor quando precisarmos de controle fino e previsibilidade em leitura legada.
- `TypeORM` tende a ser melhor para acelerar produtividade se a compatibilidade com SQL Server 2014 e o comportamento de SQL gerado forem satisfatorios.

## Plano de Execucao da POC (após inventario CSV)

1. Definir 3 a 5 cenarios de leitura representativos (sem regra de negócio).
2. Implementar adaptadores minimos paralelos:
- `MssqlLegacyClient`
- `TypeormLegacyClient`
3. Medir:
- tempo medio, p95 e p99;
- consumo de conexoes;
- tratamento de erro e timeout;
- qualidade de logs e rastreabilidade.
4. Registrar resultado em relatorio objetivo e atualizar ADR 0004.

## Riscos da POC

- inventario incompleto pode enviesar resultado;
- benchmark com baixa carga pode mascarar gargalos;
- diferencas de configuracao de pool podem gerar comparacoes injustas.

## Mitigacoes

- usar mesmos cenarios e limites para ambas abordagens;
- padronizar timeout, pool e retries na comparacao;
- validar resultados com revisao técnica conjunta.



