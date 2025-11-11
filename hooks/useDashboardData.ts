
import { useState, useEffect } from 'react';
import { parseCSV, parseCampaignCSV } from '../services/csvParser';
import type { Deal, Campaign, ConversionData, ProcessedData } from '../types';

const DEAL_CSV_DATA = `PASTE_FIRST_CSV_HERE`;
const CAMPAIGN_CSV_DATA = `PASTE_SECOND_CSV_HERE`;

export const useDashboardData = () => {
    const [data, setData] = useState<ProcessedData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const processData = () => {
            try {
                // Replace CSV placeholders with actual data
                const dealCsv = DEAL_CSV_DATA.replace('--- START OF FILE text/csv ---\n\n', '').trim();
                const campaignCsv = CAMPAIGN_CSV_DATA.replace('--- START OF FILE text/csv ---\n\n', '').trim();

                const deals: Deal[] = parseCSV(dealCsv).map((d: any) => {
                    let tier: Deal['tier'] = 'Desconhecido';
                    const tierField = d['Organização - Canal/Tier'] || '';
                    if (tierField.includes('Tier 1') || tierField.includes('T1')) {
                        tier = 'Grandes Contas';
                    } else if (tierField.includes('Tier 2') || tierField.includes('T2')) {
                        tier = 'SMB';
                    } else if (tierField.toLowerCase().includes('projetos grandes contas')) {
                        tier = 'Projetos Grandes Contas';
                    }

                    return {
                        id: d['Negócio - ID'],
                        title: d['Negócio - Título'],
                        status: d['Negócio - Status'],
                        leadSource: d['Negócio - Origem do lead'] || 'Desconhecido',
                        tier: tier,
                        createdDate: new Date(d['Negócio - Negócio criado em']),
                        value: parseFloat(d['Negócio - Valor']) || 0,
                    };
                }).filter(d => !isNaN(d.createdDate.getTime()));

                const campaigns: Campaign[] = parseCampaignCSV(campaignCsv);

                const totalLeads = deals.length;
                const wonDeals = deals.filter(d => d.status === 'Ganho');
                const totalWon = wonDeals.length;
                const totalLost = deals.filter(d => d.status === 'Perdido').length;

                const inboundDeals = deals.filter(d => d.leadSource.toLowerCase().includes('inbound'));
                const outboundDeals = deals.filter(d => d.leadSource.toLowerCase().includes('outbound'));
                
                const inboundLeads = inboundDeals.length;
                const outboundLeads = outboundDeals.length;

                const inboundWon = inboundDeals.filter(d => d.status === 'Ganho').length;
                const outboundWon = outboundDeals.filter(d => d.status === 'Ganho').length;

                const calculateConversion = (won: number, total: number) => total > 0 ? (won / total) * 100 : 0;

                const groupAndCalculateConversion = (dealList: Deal[]): ConversionData[] => {
                    const sourceMap = new Map<string, { total: number; won: number }>();

                    dealList.forEach(deal => {
                        const sourceData = sourceMap.get(deal.leadSource) || { total: 0, won: 0 };
                        sourceData.total += 1;
                        if (deal.status === 'Ganho') {
                            sourceData.won += 1;
                        }
                        sourceMap.set(deal.leadSource, sourceData);
                    });

                    const result: ConversionData[] = [];
                    sourceMap.forEach((data, name) => {
                        result.push({
                            name,
                            total: data.total,
                            won: data.won,
                            lost: data.total - data.won,
                            rate: calculateConversion(data.won, data.total),
                        });
                    });

                    return result.sort((a, b) => b.rate - a.rate);
                };
                
                const wonDealsByTierMap = new Map<string, number>();
                wonDeals.forEach(deal => {
                    wonDealsByTierMap.set(deal.tier, (wonDealsByTierMap.get(deal.tier) || 0) + 1);
                });

                const wonDealsByTier = Array.from(wonDealsByTierMap.entries()).map(([name, value]) => ({ name, value }));

                const processedData: ProcessedData = {
                    totalLeads,
                    totalWon,
                    totalLost,
                    inboundLeads,
                    outboundLeads,
                    inboundConversionRate: calculateConversion(inboundWon, inboundLeads),
                    outboundConversionRate: calculateConversion(outboundWon, outboundLeads),
                    totalConversionRate: calculateConversion(totalWon, totalLeads),
                    inboundBySource: groupAndCalculateConversion(inboundDeals),
                    outboundBySource: groupAndCalculateConversion(outboundDeals),
                    wonDealsByTier,
                    campaignFunnelData: campaigns.length > 0 ? [
                        { stage: 'Prospects', value: campaigns.reduce((acc, c) => acc + c.prospects, 0) },
                        { stage: 'MQLs', value: campaigns.reduce((acc, c) => acc + c.mql, 0) },
                        { stage: 'SQLs', value: campaigns.reduce((acc, c) => acc + c.sql, 0) },
                        { stage: 'SALs', value: campaigns.reduce((acc, c) => acc + c.sal, 0) },
                        { stage: 'Ganhos', value: campaigns.reduce((acc, c) => acc + c.won, 0) },
                    ] : [],
                };

                setData(processedData);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.');
            } finally {
                setLoading(false);
            }
        };

        processData();
    }, []);

    return { data, loading, error };
};

// Raw CSV data placeholders. These will be replaced by the actual CSV content.
const PASTE_FIRST_CSV_HERE = `Negócio - ID,Negócio - Título,Negócio - Valor,Negócio - Tipo Receita,Negócio - Produto negociado,Negócio - Proprietário,Negócio - Funil,Negócio - Etapa,Negócio - Status,Organização - Funcionários,Negócio - Negócio criado em,Negócio - Ganho em,Organização - Número de funcionários,Negócio - Data de perda,Negócio - Negócio fechado em,Negócio - Motivo da perda,Negócio - Origem,Negócio - Canal de origem,Negócio - Organização,Negócio - Pessoa de contato,Negócio - Etiqueta,Negócio - URL da proposta,Negócio - URL P&L,Negócio - URL Planilha Usuários,Negócio - Uso Expert,Negócio - Grupo de Whatsapp?,Negócio - Tipo Pessoa,Negócio - Nº Crédito Contratado Expert,Negócio - Limite de Nº Usuários Contratado,Negócio - Resumo (negociação/degustação),Negócio - Origem,Negócio - Origem do lead,Negócio - Campanha,Negócio - Origem Canal Última Conversão,Negócio - Origem Canal Primeira Conversão,Negócio - Lead trazido por (tags),Negócio - Reunião realizada,Negócio - Degustação,Negócio - Qualificação,Negócio - URL card Qualificação,Negócio - Pré-Vendedor,Negócio - Lead convertido em negócio?,Negócio - Produto Ofertado Prospecção,Negócio - Tag operação,Negócio - Contrato Multiano,Negócio - Intervalo Pagamento,Negócio - Próximo aniversário de contrato,Negócio - Data de término de contrato,Negócio - Data Assinatura (Contrato),Negócio - Termos de pagamento,Negócio - Índice Contrato,Negócio - Índice aplicado,Negócio - Data de Entrada em Contratos,Negócio - Razão Social (pagador),Negócio - CNPJ (pagador),Negócio - Soft/Agência (pagador),Negócio - Retomada comercial?,"Negócio - Data de retomada comercial (se, SIM data futura | se, NÃO selecionar data da perda):",Negócio - Resumo card anterior para retomada,Negócio - Produto contrato anterior,Negócio - Degustação MQL Tier 1,Negócio - Reunião realizada MQL,Organização - ID,Pessoa - ID,Pessoa - Persona (Contato),Pessoa - Sub-persona (Contato),Pessoa - Nome,Pessoa - E-mail - Trabalho,Pessoa - E-mail - Residencial,Pessoa - E-mail - Outros,Pessoa - Linkedin,Pessoa - Telefone - Trabalho,Pessoa - Telefone - Residencial,Pessoa - Telefone - Celular,Pessoa - Telefone - Outros,Pessoa - Mensagem Zendesk,Pessoa - Cargo ,Organização - Setor,Organização - Canal/Tier,Organização - Setor,Organização - Tipo de Organização,Negócio - Atualizado em,Negócio - Última alteração de etapa,Negócio - Próxima atividade em,Negócio - Data da última atividade,Negócio - Visível para,Negócio - Total de atividades,Negócio - Atividades concluídas,Negócio - Atividades para fazer,Negócio - Número de mensagens de e-mail,Negócio - Criado por,Negócio - Último e-mail recebido,Negócio - Último e-mail enviado,Negócio - Moeda de Valor ponderado,Negócio - Valor ponderado,Negócio - Quantidade de produtos,Negócio - Valor de produtos,Negócio - Nome do produto,Negócio - Moeda de MRR,Negócio - MRR,Negócio - Moeda de ARR,Negócio - ARR,Negócio - Moeda de ACV,Negócio - ACV,Negócio - ID de origem,Negócio - ID do canal de origem,Negócio - Status de arquivamento,Negócio - Horário do arquivamento,Negócio - Moeda de Valor,Negócio - Moeda de Valor Novo (Minuta),Negócio - Valor Novo (Minuta),Negócio - Moeda de Antigo Valor anual de contrato,Negócio - Vigência do contrato (início),Negócio - URL Link Contrato(s),Negócio - Data de Encerramento do Contrato,Negócio - Data Vencimento Boleto,Negócio - Validação Financeiro,Negócio - Emissão NF após pagamento,Negócio - Prazo de pagamento,Negócio - Vencimento da próxima cobrança,Negócio - Pagamento de comissão a terceiro,Negócio - Deseja card cópia em Atendimento GC?,Negócio - Experimento (nome),Negócio - Informe tipo e-mail lead,Negócio - Excluir logo site e materiais?,Negócio - Uso de logo autorizado em contrato anterior,Negócio - Mercado,Negócio - Tipo,Negócio - URL histórico da conta,Negócio - Como conheceu o JOTA PRO?,Negócio - [antigo] Atendimento Executivo Founder,Negócio - [antigo] ID Card Cópia Atendimento,Negócio - Lead trazido por,Negócio - Probabilidade,Negócio - Data de fechamento esperada,Negócio - Moeda de Valor incremental multiano para comissão,Negócio - Moeda de Valor Incremental,Negócio - Valor Incremental,Negócio - Executivo/CS atribuído,Negócio - Site,Negócio - [antigo] Etiqueta Lead Projetos,Negócio - Setor Cliente - Agência,Negócio - Data de Assinatura (Contrato) - Formato por extenso,Negócio - Valor Novo (Minuta) - Formato por extenso,Negócio - Quantidade de meses do multiano,Negócio - Quantidade de meses do multiano por extenso,Negócio - Moeda de Valor total,Negócio - Valor total,Negócio - Valor total por extenso,Negócio - Tipo de contrato,Negócio - Modelo de Atendimento,Negócio - Oportunidade de Cross sell,Negócio - Agência / Intermediário,Negócio - Segmento da Agência
47947,RWR CONTABILIDADE LTDA (cópia),7428,Recorrente,JOTA PRO Tributos Insights,Fernando Petente,NOVO - VENDAS INTERNAS,Proposta apresentada (SAL),Perdido,4 a 10,2025-01-02 09:15:49,,,2025-01-15 13:06:00,2025-01-15 13:06:00,Lead/Cliente alegou falta de interesse no momento,API,,RWR CONTABILIDADE LTDA,PAULO JUNIOR DA SILVA COSTA,,https://docs.google.com/presentation/d/1ynfGIoWdeC3yWK2JXgnwGuhKvjewPQqmeCoWcB-tlpo/edit#slide=id.g2d6f3f152e8_0_4,,https://docs.google.com/spreadsheets/d/1WwFRV3rjZVuGUnwrRHiJgvGm2HKAVTFuT-f227AbsVg/edit?gid=486216470#gid=486216470,,,PJ,,,"-Interesse em JOTA PRO Tributos
-Não tem historico no pipe 
------------------------------------------
Info Empresa: Atividades de Contabilidade",sdr-inbound-pagina-pro,Inbound,,,Busca Orgânica | Google,,NÃO,Degustação JOTA PRO Tributos II,Novo - Tier 2,https://jotajornalismo.pipedrive.com/deal/47641,Ana Júlia Pereira,,,,,,,,,,,,,,,,NÃO,2025-01-15,/ Em caso de call (interesse):,,,NÃO,27571,43100,Persona Marcos Medeiros,Sub-persona Marcos Tributário,PAULO JUNIOR DA SILVA COSTA,paulo.junior@pjcontabilidade.cnt.br,,,https://www.linkedin.com/in/paulo-j%C3%BAnior-da-silva-costa-a59541242/,,,,+55 (21) 96413-1652,,SÓCIO DIRETOR,,Tier 2 (Atendimento Remoto),Serviços especializados,Escritório de contabilidade,2025-01-15 13:06:00,2025-01-02 12:22:47,,2025-01-15,Grupo de visibilidade do proprietário do item,4,4,0,0,Fernando Petente,2024-12-16 10:27:51,2024-12-16 10:36:14,BRL,1485.6,12,7428,JOTA PRO Tributos Insights,BRL,0,BRL,0,BRL,7428,,,Não arquivado,,BRL,,0,,,,,,,,,,,,,E-mail lead corporativo,,,,,,,,,,,,,BRL,0,,,,,,,,,,0,,,,,,
47949,Schreiner Advocacia (cópia),9708,Recorrente,JOTA PRO Tributos Insights,Lysa Bastos,NOVO - VENDAS INTERNAS,Proposta apresentada (SAL),Perdido,4 a 10,2025-01-02 09:58:39,,,2025-01-21 15:33:59,2025-01-21 15:33:59,Tentativas de contato esgotadas,API,,Schreiner Advocacia,FABIANA LESKE DO NASCIMENTO SCHREINER,,https://docs.google.com/presentation/d/1qSgE0DYhkAgGLwBhAtK1A9tikBtAraJO83pjrddHs50/edit,,https://docs.google.com/spreadsheets/d/11VejZhPoqFn4QNSxoCc8yJaNsowKOmf0V2SAEL_Ea4g/edit?gid=486216470#gid=486216470,,,PJ,,,"/ Em caso de call (interesse): Interesse em testar o JOTA PRO e participar da call
___________________________________________
- Interesse em JOTA PRO Tributos
- Tem histórico no Pipe, o mais recente é https://jotajornalismo.pipedrive.com/deal/39604",03-12-2024-rdstation-lp-call-tributos-regulamentacao-reforma-conversao-mql-call-marketing-tributos,Inbound,03-12-2024-rdstation-email-call-tributos-regulamentacao-reforma-conversao-mql-call-marketing-tributos,Email,Tráfego Direto,"[marketing] interesse em saúde,[marketing] inscritos na saideira de tributos,[marketing] saideira - tributos,[marketing] interesse em tributos",NÃO,Degustação JOTA PRO Tributos II,Novo - Tier 2,https://jotajornalismo.pipedrive.com/deal/47745,Ana Júlia Pereira,,,,,,,,,,,,,,,,NÃO,2025-01-21,,,,NÃO,23032,43161,Persona Marcos Medeiros,Sub-persona Marcos Tributário,FABIANA LESKE DO NASCIMENTO SCHREINER,rs.fabianaschreiner@grupostudio.com.br,,,https://www.linkedin.com/in/fabiana-schreiner-133aba16a/?fbclid=PAZXh0bgNhZW0CMTEAAac7I6DBYOjhCLUAxGtHmFpoVkNzQa7GJ_qREgzQxWJ0eLyyS2RZ6S-S11Y3AQ_aem_RXyepJ36R0noIw5NK1Mnwg,,,,+55 (55) 98434-0398,,Advogada,,Tier 2 (Atendimento Remoto),Direito,Escritório de advocacia,2025-01-21 15:34:00,2025-01-02 11:04:06,,2025-01-13,Grupo de visibilidade do proprietário do item,4,4,0,2,Lysa Bastos,2025-01-03 11:21:33,2025-01-02 11:04:23,BRL,1941.6,12,9708,JOTA PRO Tributos Insights,BRL,0,BRL,0,BRL,9708,,,Não arquivado,,BRL,,0,,,,,,,,,,,,,E-mail lead corporativo,,,,,,,,,,,,,BRL,0,,,,,,,,,,0,,,,,,
47997,ERO BRASIL,24000,Recorrente,JOTA PRO Tributos Insights,Guilherme Fabro,NOVO - GRANDES CONTAS,Proposta apresentada (SAL),Perdido,1.001 a 5.000,2025-01-06 14:30:14,,,2025-02-20 11:02:03,2025-02-20 11:02:03,Outras prioridades que não o PRO,API,,ERO BRASIL,Bárbara Helen Nunes Sampaio,,https://docs.google.com/presentation/d/1zBoJfJOOYcmrAnrMwmz0AMMB7YJ8alP0UPOo2WgwLw8/edit#slide=id.g2c83a0c8fc1_0_0,,https://docs.google.com/spreadsheets/d/1lk0w5ni9eCJcjobRqnLNNJBCj0ivZ11MdJeslgQg_HM/edit?gid=486216470#gid=486216470,,,PJ,,,"Inicio da degustação 23/12

Tx1 (06/01) 5%
Tx2 (08/01) 5%

-Interesse em PRO Tributos
-Com histórico no pipe: https://jotajornalismo.pipedrive.com/deal/45249
--------------------------
Info Empresa: Nascemos no coração do Brasil. Fazemos parte de um grupo global que em sua bagagem carrega tecnologia e pesquisa, embarcados em know-how canadense. Hoje, a EroBrasil é composta pelas unidades: Caraíba, Tucumã e Xavantina. Já nascemos no alto de uma história de mais de meio século, sempre pautados no respeito, na superação e na transformação das regiões onde estão localizadas nossas unidades de negócio",marketing-formulario-conversao-pro-tributos-jota-unico,Inbound,,,Referência | jota.info,"[marketing] saideira - poder,[marketing] ex-degustação,[jota info] mais lidas da semana,[marketing] saideira - tributos,""últimas notícias"",[jota info] últimas notícias,[marketing] saideira - saúde",SIM,Degustação JOTA PRO Tributos,Novo - Tier 1,https://jotajornalismo.pipedrive.com/deal/47826,Ana Júlia Pereira,,,,,,,,,,,,,,,,SIM,2025-05-26,,,,NÃO,22442,41712,Persona Patrícia Porto,Sub-persona Patricia Tributária,Bárbara Helen Nunes Sampaio,barbara.sampaio@erobr.com,,,https://www.linkedin.com/in/b%C3%A1rbara-sampaio-5b5218176/,,,,+55 (87) 98806-2070,,Advogada,,Tier 1 (Atendimento Presencial),Mineração e Metais,Empresa,2025-02-20 11:02:04,2025-01-16 15:01:37,,2025-01-28,Grupo de visibilidade do proprietário do item,6,6,0,2,Ana Júlia Pereira,2025-01-08 16:07:17,2024-12-23 09:00:02,BRL,4560,12,24000,JOTA PRO Tributos Insights,BRL,0,BRL,0,BRL,24000,,,Não arquivado,,BRL,,0,,,,,,,,,,,,,E-mail lead corporativo,,,Mineração,,,,,,,,,,BRL,0,,,,,,,,,,0,,,,,,
47999,Biofarm (cópia),0,,JOTA PRO Tributos Insights,Grace Kelly Ramiro,NOVO - GRANDES CONTAS,Qualificado (SQL),Perdido,201 a 1.000,2025-01-06 17:11:04,,,2025-01-28 16:29:00,2025-01-28 16:29:00,Reunião não realizada,API,,Biofarm,luiz,,https://docs.google.com/presentation/d/1QIByv3rJUt-YWmZ4H6YtW9JXMGwe98s5alrDmoaujsE/edit?usp=sharing,,https://docs.google.com/spreadsheets/d/1FuRhnpv3BE0skaYnX-PUE0pVc5g_fJR61xDsvKv4Xz0/edit?gid=486216470#gid=486216470,,,PJ,,,"Inicio da degustação 07/01

-Interesse em JOTA PRO Tributos 
-Não tem historico no pipe 
------------------------------------------
Conversa via Whatsapp: [16:13, 06/01/2025] Ana Julia - Analista De Novos Negócios: Olá, tudo bem? 
Sou a Ana Júlia do JOTA. Muito prazer
[16:13, 06/01/2025] Ana Julia - Analista De Novos Negócios: Escrevo porque recebi sua solicitação para degustação do JOTA PRO Tributos
[16:13, 06/01/2025] Ana Julia - Analista De Novos Negócios: Minha proposta é durante a degustação do JOTA PRO Tributos conversarmos com a analista de relações institucionais do meu time para aprofundarmos entregas, explicar como funciona a personalização dos conteúdos e, claro, apresentarmos uma proposta comercial que faça sentido com a necessidade da sua empresa.
[16:13, 06/01/2025] Ana Julia - Analista De Novos Negócios: Já solicitei pro meu time de tech te colocar na degustação. Fico à disposição para agendarmos o melhor horário para conversarmos
[16:14, 06/01/2025] +55 16 99991-0003: ola, Ana
legal como esta sua disponibilidade para quarta depois das 10:00?
[16:44, 06/01/2025] Ana Julia - Analista De Novos Negócios: Podemos agendar as 10h30?
[16:55, 06/01/2025] +55 16 99991-0003: pode ser na sexta, meu parceiro não consegue na quarta
[16:56, 06/01/2025] Ana Julia - Analista De Novos Negócios: Com certeza! Na sexta às 10h funciona pra vocês?
[16:56, 06/01/2025] +55 16 99991-0003: sim
[16:56, 06/01/2025] Ana Julia - Analista De Novos Negócios: Perfeito! Vou te encaminhar o invite agora mesmo
[16:57, 06/01/2025] Ana Julia - Analista De Novos Negócios: Aproveito a oportunidade para entender mais o lado de vocês, assim na conversa já conseguimos direcionar melhor, se puder me contar um pouco, vocês tem buscado informações ou acompanhamento sobre algum tema específico? Quais fontes costuma consultar?
[17:01, 06/01/2025] +55 16 99991-0003: Tributos
[17:17, 06/01/2025] +55 16 99991-0003: consultamos IOB / Econect
[17:17, 06/01/2025] Ana Julia - Analista De Novos Negócios: Ah legal, obrigada pelo contexto! Nos ajuda a direcionar melhor o papo e termos uma conversa mais produtiva :) até lá

---------------------------------------
Info Empresa: Fundada em 1994 em Jaboticabal, SP, nossa jornada de crescimento começou sem devaneios. Pouco tempo após nosso nascimento, já alcançamos forte atuação em todos os estados, nos tornando referência no mercado. Sem nunca perder o foco e a preocupação com o meio ambiente e os animais, em 2006 começamos e levamos nossa marca para fora do Brasil, continuamente investindo em tecnologia e inovação para atender nossos clientes, através de profissionais altamente qualificados que, como nós, são apaixonados por saúde animal.",sdr-inbound-pagina-pro,Inbound,,,Desconhecido,"[jota info] mais lidas da semana,""últimas notícias"",[jota info] últimas notícias",NÃO,Degustação JOTA PRO Tributos,Novo - Tier 1,https://jotajornalismo.pipedrive.com/deal/47993,Ana Júlia Pereira,,,,,,,,,,,,,,,,NÃO,2025-01-28,,,,NÃO,27671,43245,Persona Patrícia Porto,Sub-persona Patricia Tributária,luiz,luiz.camassutti@biofarm.com.br,,,https://www.linkedin.com/in/luiz-fernando-camassutti-sant-anna-053a594a/,,,,+55 (16) 99991-0003,,Coordenador Fsical,,Tier 1 (Atendimento Presencial),Farmacêutica,Empresa,2025-01-28 16:29:03,2025-01-06 17:11:08,,2025-01-23,Grupo de visibilidade do proprietário do item,1,1,0,6,Ana Júlia Pereira,2025-01-15 10:33:53,2025-01-07 17:31:01,BRL,0,,,,,0,,0,,0,,,Não arquivado,,BRL,,0,,,,,,,,,,,,,E-mail lead corporativo,,,,,,,,,,,,,BRL,0,,,,,,,,,,0,,,,,,
`;
const PASTE_SECOND_CSV_HERE = `DATA INÍCIO,TAG/EVENTO CONVERSÃO RD,NOME DA AÇÃO,OBJETIVO/DESCRIÇÃO,ABORDAGEM,PRODUTO OFERTADO,ORIGEM BASE,CATEGORIA LISTA,CRITÉRIO BASE,OFERECER,STATUS,DATA ENCERRADO,PROSPECT,MQL,CR1 (10%),SQL,CR2 (20%),SAL,CR3 (80%),LIVE (Qtd),LIVE (Receita),% PROSP,% MQL,% SQL,CONCLUSÃO
19/05/2021,retomada2021-tier2,Retomada Tier 2 - 2021,Abordagem de retomada para oportunidades perdidas em Tier 2,Retomada na negociação com condição especial (modelo aqui),,Retomada,,"Perdidos em Novo - Vendas Internas (não filtrei por SAL, pois entendo que os SQLs já são oportunidades aceitas - mesma pessoa que qualifica, é a pessoa que irá tocar a venda)
Período: jan/20 à mar/21
Produto: Oportunidades registradas com produto Tributos Insights
Persona: Sem Carlos Andrade",,Encerrado,21/06/2021,8,8,100.00%,8,100.00%,8,100.00%,1,"$3,828.00",12.50%,12.50%,12.50%,"Ação pontual para suprir necessidade de oportunidade em Tier 2. Como há um volume alto de oportunidades declinadas, (uma base inicial em torno de 590 leads declinados), me parece ser uma boa fonte para suprir necessidades pontuais, ou até mesmo entrar no radar pra criar um processo contínuo de abordagem."
10/07/2021,lista-chambers,Outbound  Tier 2 - Lista Chambers,"Abordagem de escritórios com potencial via linkedin e RD, em ultimo caso",Abordagem para conhecer o PRO aqui,,Lista Externa,,Fazem parte da lista de escritírios influentes lista Chambers,,Encerrado,25/08/2021,448,46,10.27%,19,41.30%,19,100.00%,4,"$55,302.00",0.89%,8.70%,21.05%,
26/08/21,prospeccao-retomada-tier2,Prospecção Outbound - Retomada Tier 2,"Abordagem/retomada via RD, por automação com cadencia de 3 e-mails, dos leads que receberam proposta desde janeiro 2020 até março 2021 para apresentação da plataforma PRO Tributos Beta",Cadencia de e-mails abordagem se encontra aqui,,Retomada,,Perdidos vendas internas em SQL de 01/2020 a 03/2021,,Encerrado,30/09/2021,445,50,11.24%,31,62.00%,31,100.00%,6,"$23,197.20",1.35%,12.00%,19.35%,
14/10/2021,lista-linkedin-Q4-2021,PROSPECÇÃO OUTBOUND - LISTA LINKEDIN- T2 - Q4,"Vamos pegar 100 leads de cada tamanho (11 a 50 - 51 a 200 - 200 a 1000 - 1000 a 5000), dentro do possivel e compensando em outros setores caso não consigamos 100 em algum setor até chegar a média de 400 Prospects. A Abordagem vai ofertar Tributos, Poder ou Saúde a depender da pessoa e dos setores possíveis dentro do escritório.",Abordagem via Conexão linkedin: https://docs.google.com/document/d/1k6G3wwpSZoFwaYf7pvZOQsHZ0iU2kyU2kSBZHEHl7rs/edit,,Lista Externa,,Escritórios a partir de 11 funcionários em listagem geral dentro do prório linkedin,,Encerrado,31/10/2021,450,54,12.00%,18,33.33%,18,100.00%,1,"$8,628.00",0.22%,1.85%,5.56%,
11/10/2021,lista-consultorialinkedin-Q4-2021,Prospecção Outbound - Lista Consultoria Linkedin - Q4,"Prospectar 100 leads de cada tamanho (11 a 50 - 51 a 200 - 200 a 1000 - 1000 a 5000), filtrando por consultoria tributária/contábil no Linkedin. A Abordagem vai ofertar Tributos, a princípio.",Abordagem consultorias tributárias e contábeis,,Lista Externa,,Consultorias a partir de 4 funcionários em listagem geral dentro do prório linkedin,,Encerrado,22/11/2021,389,39,10.03%,9,23.08%,9,100.00%,,,0.00%,0.00%,0.00%,
23/11/2021,retomada-poder-Q4-2021,Prospecção Outbound - Retomada Leads Pro Poder Perdidos em 2021,Leads que foram perdidos no ano de 2021 que pediram PRO Poder vão ser prospectados novamente via RD,Lista e-mails; cadência de e-mails,,Lista Interna,,"Escritórios e Consultorias a partir de 10 funcionários que tenham se interessado por PRO Poder no ano de 2021, mas que não chegaram a efetuar a compra",,Encerrado,10/12/2021,91,3,3.30%,3,100.00%,3,100.00%,,,0.00%,0.00%,0.00%,
01/02/2022,[OUTBOUND T2] - Base info Tier2,Prospecção clientes INFO sem PRO,Pegamos a lista do Backoffice dos clientes INFO de escritórios de advocacia que não são clientes do PRO,cadência de emails; base e-mails,Pro Tributos,Lista Interna,,"Qualquer e-mail cadastrado como pertencente a um escritório de advocacia que assina o info ou que possui cadastro gratuito (como o backoffice não filtra por tier, o filtro que usamos foi pegar pela palavra ""advocacia' ou 'advogados'",,Encerrado,31/01/2022,1531,52,3.40%,30,57.69%,30,100.00%,4,"$22,452.00",0.26%,7.69%,13.33%,
22/06/2022,t2-q3 2022-perdidos,Prospecção MQLs perdidos Jan 2021- Jun 2022,Leads que foram perdidos no Filtro 1 e 2 do Funil de qualificação tier 2 entre Janeiro de 2021 e Junho 2022, Ação | Prospecção MQLs - T2  Q3 - 2022,Pro Tributos,Lista Interna,,Perdidos acima de 4 funcionários que não receberam proposta anterior,,Encerrado,01/07/2022,1000,42,4.20%,41,97.62%,41,100.00%,4,"$25,404.00",0.40%,9.52%,9.76%,
25/07/2022,lista-chambers-perdidos2021-tributos,Perdidos em MQL da ação da Lista Chambers ,Leads que foram perdidos ou que não pediram degustação mas que fazem parte da lista trabalhada dentro da RD da Chambers 2021,Ação Outboud  T2  -  lista-chambers-perdidos2021-tributos,Pro Tributos,Lista Interna,,Perdidos ou que não entraram em d egustação da lista chambers 2021,,Encerrado,02/08/2022,179,6,3.35%,2,33.33%,2,100.00%,0,$0.00,,,,
02/08/2022,"
lista-perdidos-até-negociação-VI -01-21-03-22",Retomada perdidos PRO Tributos Jan 2021 - Março 2022,"Tentar retomar contato com os cards PRO Tributos perdidos no período 01/01/2021 até 31/03/2022, até a etapa 'negociação' no funil Novos Vendas Internas, ",Lista e-mails; cadência de e-mails,Pro Tributos,Retomada,,Perdidos acima de 4 funcionários que deram perdido até a etapa Negociação no funil Novo Vendas Internas,,Encerrado,12/08/2022,497,52,10.46%,23,44.23%,23,100.00%,1,"$4,188.00",0.20%,1.92%,4.35%,
13/10/2022,lista-fenalaw-t2-tributos,Lista Fenalaw T2 Tributos,Envio de uma cadência de quatro e-mails chamando pra degustação gratuíta. Essa foi uma lista que a Wania nos encaminhou no email como sugestão ,Lista e-mails (aba fenalaw apenas); cadência de e-mails,Pro Tributos,Lista Externa,Lista Externa - Participantes de Eventos, Escritórios que palestraram na Fenalaw 2022,Trial,Encerrado,24/10/2022,52,1,1.92%,0,,,,,,0.00%,0.00%,0.00%,
19/10/22,lista-analise22-advogadas,Lista Análise Advocacia Mulher - 2022,"Abordagem para trial do PRO Tributos das melhores advogadas tributárias de 2022, segundo a edição Análise Advocacia 2022",lista e-mail; Cadência,Pro Tributos,Lista Externa,Lista Externa - Anuários,Advogadas escolhidas para fazer parte do ranking melhores advogadas tributárias do Análise Advocacia,Trial,Encerrado,26/10/2022,30,3,10.00%,2,,,,,,0.00%,0.00%,0.00%,
19/10/22,lista-analise22-advogados,Lista Análise Advocacia Homem - 2021,"Abordagem para trial do PRo Tributos dos melhores advogados tributários de 2022, segundo a edição Análise Advocacia 2021","lista e-mail, Cadência",Pro Tributos,Lista Externa,Lista Externa - Anuários,Advogados escolhidos para fazer parte do ranking melhores advogados tributários do Análise Advocacia,Trial,Encerrado,26/10/2022,72,6,8.33%,5,,,,,,0.00%,0.00%,0.00%,
20/10/2022,lista-timeadvogados-análise22,Lista de Advogados Tributários do Análise 2022,Abordagem para trial Pro Tributos dos demais advogados tributários dos escritórios citados nas listas Análise Mulher e Análise Homem,Lista e-mails; Cadência,Pro Tributos,Lista Externa,Lista Externa - Anuários,"Advogados dos escritórios do ranking Análise, referente as duas listas acima",Trial,Encerrado,28/10/2022,148,2,1.35%,1,,,,,,0.00%,0.00%,0.00%,
03/11/2022,lista-perdidos-novovi-2019-2020,Lista perdidos Novo Vendas Internas entre 2019-2020,Abordagem para tiral e proposta para todos os leads perdidos no funil VI no período de 2019 - 2020,Lista e-mails (aba lista final); Cadência,Pro Tributos,Lista Interna,Lista Interna - Segmentação Pipedrive (CRM),Todos os cards perdidos no funil Novo Vendas Internas no período de 2019-2020,Trial + Reunião,Encerrado,,840,37,4.40%,11,,,,,,0.00%,0.00%,0.00%,
25/04/2023,lista-assinantesinfot2,Lista de assinantes INFO T2 ativos em 2023 (plano anual),"Abordagem para vender PRO Tributos para assinantes do site, ativos em 2023",Leads; Cadência,PRO Tributos,Lista Interna,Lista Interna - assinantes INFO,"Assinantes info ativos em 2023, com perfil T2",Trial,Encerrado,,,,,,,,,,,0.00%,0.00%,0.00%,
11/10/2023,lista-novaprecificacaot2,Lista Nova Precificação Tributos T2,Abordagem para tentar resgatar leads com a nova precificação de Tributos para escritórios/consultorias T2,"SALs Pipe de janeiro a out/2023. Wania fez a primeira abordagem direto pelo e-mail dela, para quem responde, encaminha para o executivo responsável",PRO Tributos,Lista Interna,Lista Interna - Segmentação Pipedrive (CRM),"SALs de PRO Tributos, Novo T2, declinados de escritórios e consultorias (perfil impactado pela nova precificação)",Reunião + Proposta,Encerrado,,272,,,,,,,,,0.00%,0.00%,0.00%,
30/01/2023,lista-novaprecificacaot2-pro-saude,Lista Nova Precificação Saúde T2,Abordagem para tentar resgatar leads com a nova precificação de Saúde ,Contatos via e-mail e WhatsApp,PRO Saúde,Lista Interna,Lista Interna - Segmentação Pipedrive (CRM),"SALs de PRO Saúde, Novo T2, declinados (perfil impactado pela nova precificação)",Trial + Proposta,Encerrado,,32,,,,,,,,,,,,
22/02/2023,lista-novaprecificacaot2-pro-poder,Lista Nova Precificação Poder T2,Abordagem para tentar resgatar leads com a nova precificação de Saúde ,Contatos via e-mail e WhatsApp,PRO Poder,Lista Interna,Lista Interna - Segmentação Pipedrive (CRM),"SALs de PRO Poder, Novo T2, declinados (perfil impactado pela nova precificação)",Trial + Proposta,Encerrado,,22,,,,,,,,,0.00%,0.00%,0.00%,
17/07/2024,lista-secretarias-de-estado-ubirajara-julho-2024,Lista Ubirajara ,Um lead indicou outras 17 pessoas para o PRO e nos passou os números de telefone para o contato. Os detalhes da ação estão neste doc ,Contatos via WhatsApp e Ligação,"JOTA PRO Poder, Saúde e Tributos ",Lista Externa,Lista Externa - Funcionários de uma determinada empresa,Leads indicados ,Trial,Encerrado,,17,,,,,,,,,0.00%,0.00%,0.00%,
08/07/2024,lista-declinados-dia-do-advogado,Retomada - Ação dia do Advogado,"Abordar leads declinados no período de Jan a Julho de 2024, no funil novo vendas internas - somente escritórios de advocacia. Informar sobre desconto especial na contratação do PRO em comemoração ao dia do Advogado (11/08). Ofertar trial + proposta atualizada",Contatos via e-mail e WhatsApp,PRO Tiibutos,Lista Interna,Lista Interna - Retomada,"Leads declinados no período de Jan a Julho de 2024, no funil novo vendas internas - somente escritórios de advocacia  Planilha",Trial + Proposta,Encerrado,,222,,,,,,,,,0.00%,0.00%,0.00%,
15/10/2024,lista-rescisoes-2023,Prospecção Ex-Clientes,Abordar clientes que rescindiram o contrato no período de janeiro a outubro de 2023 a fim de verificar o interesse em retomar a assinatura,"Contatos via e-mail,  WhatsApp e Ligação","JOTA PRO Poder, Saúde e Tributos ",Lista Interna,Lista Interna - Segmentação Pipedrive (CRM),"Clientes perdidos no período de janeiro a outubro de 2023, que: não sejam T3, não sejam clientes, não tenham sido declinado por inacimplência, empresa não esteja com card aberto no pipe",Trial + Proposta,Encerrado,30/10/2024,12,,,,,,,,,0.00%,0.00%,0.00%,
29/10/2024,lista-rescisoes-2022,Prospecção Ex-Clientes,Abordar clientes que rescindiram o contrato no período de janeiro a dezembro de 2022 a fim de verificar o interesse em retomar a assinatura,"Contatos via e-mail,  WhatsApp e Ligação","JOTA PRO Poder, Saúde e Tributos ",Lista Interna,Lista Interna - Segmentação Pipedrive (CRM),"Clientes perdidos no período de janeiro a dezembro de 2022, que: não sejam T3, não sejam clientes, não tenham sido declinado por inacimplência, empresa não esteja com card aberto no pipe",Trial + Proposta,Encerrado,18/11/2024,9,,,,,,,,,0.00%,0.00%,0.00%,
17/10/2024,lista-rescisoes-2021,Prospecção Ex-Clientes,Abordar clientes que rescindiram o contrato no período de janeiro a dezembro de 2021 a fim de verificar o interesse em retomar a assinatura,"Contatos via e-mail,  WhatsApp e Ligação","JOTA PRO Poder, Saúde e Tributos ",Lista Interna,Lista Interna - Segmentação Pipedrive (CRM),"Clientes perdidos no período de janeiro a dezembro de 2021, que: não sejam T3, não sejam clientes, não tenham sido declinado por inacimplência, empresa não esteja com card aberto no pipe",Trial + Proposta,Encerrado,29/11/2024,18,,,,,,,,,0.00%,0.00%,0.00%,
21/11/2024,lista-rescisoes-2020,Prospecção Ex-Clientes,Abordar clientes que rescindiram o contrato no período de janeiro a dezembro de 2020 a fim de verificar o interesse em retomar a assinatura,"Contatos via e-mail,  WhatsApp e Ligação","JOTA PRO Poder, Saúde e Tributos ",Lista Interna,Lista Interna - Segmentação Pipedrive (CRM),"Clientes perdidos no período de janeiro a dezembro de 2020, que: não sejam T3, não sejam clientes, não tenham sido declinado por inacimplência, empresa não esteja com card aberto no pipe",Trial + Proposta,Encerrado,02/12/2024,15,,,,,,,,,0.00%,0.00%,0.00%,
11/11/2024,lista-rescisoes-2019,Prospecção Ex-Clientes,Abordar clientes que rescindiram o contrato no período de janeiro a dezembro de 2019 a fim de verificar o interesse em retomar a assinatura,"Contatos via e-mail,  WhatsApp e Ligação","JOTA PRO Poder, Saúde e Tributos ",Lista Interna,Lista Interna - Segmentação Pipedrive (CRM),"Clientes perdidos no período de janeiro a dezembro de 2019, que: não sejam T3, não sejam clientes, não tenham sido declinado por inacimplência, empresa não esteja com card aberto no pipe",Trial + Proposta,Encerrado,28/11/2024,11,,,,,,,,,0.00%,0.00%,0.00%,
11/11/2024,lista-rescisoes-2018,Prospecção Ex-Clientes,Abordar clientes que rescindiram o contrato no período de janeiro a dezembro de 2018 a fim de verificar o interesse em retomar a assinatura,"Contatos via e-mail,  WhatsApp e Ligação","JOTA PRO Poder, Saúde e Tributos ",Lista Interna,Lista Interna - Segmentação Pipedrive (CRM),"Clientes perdidos no período de janeiro a dezembro de 2018, que: não sejam T3, não sejam clientes, não tenham sido declinado por inacimplência, empresa não esteja com card aberto no pipe",Trial + Proposta,Encerrado,18/11/2024,2,,,,,,,,,0.00%,0.00%,0.00%,
04/11/2025,lista-campanha-desconto-trabalhista-t2,Campanha de desconto T2,"Entrar em contato com os leads do JOTA PRO Trabalhista - porte de 4 a 200 funcionários - incluindo clientes (funil crescimento) que receberam proposta, mas optaram por não fechar no primeiro trimestre de 2025. Oferecer 50% de desconto sobre o valor originalmente apresentado. Planilha da ação: Link","Contatos via e-mail,  WhatsApp e Ligação",JOTA PRO Trabalhista,Lista Interna,Lista Interna - Retomada,Leads declinados no período de Janeiro a Março de 2025 no funil NOVO e Crescimento na etapa de proposta apresentada. ,Proposta,Encerrado,25/04/2025,72,,,,,,,,,0.00%,0.00%,0.00%,
08/05/2025,lista-leads-dia-do-advogado-2025,Retomada - Ação dia do Advogado,"Abordar leads declinados no período de agosto de 2024 a Julho de 2025, no funil qualificação outbound - somente escritórios de advocacia. Informar sobre desconto especial na contratação do PRO em comemoração ao dia do Advogado (11/08). Ofertar trial + proposta atualizada","Contatos via e-mail, ligação e WhatsApp",PRO Tributos,Lista Interna,Lista Interna - Retomada,https://docs.google.com/spreadsheets/d/14Z2HbU24KNSx7-HD5P1tRAJa18HlTSAt/edit?gid=902614144#gid=902614144,Trial + Proposta,Encerrado,31/08/2025,152,,,,,,,,,0.00%,0.00%,0.00%,
20/08/2025,lista-leads-linkedin-stela-personas-marcos-tributário,Prospecção Digital,"Stela prospecta Marcos Tributário de diferentes setores (ação de prospecção que foca na Persona, não no setor)",Stela prospecta através do próprio Linkedin ,PRO Tributos / PRO Saúde / PRO Poder,Lista Externa,Lista Externa - Segmentação Sales Navigator / Linkedin,Profissionais na área tributária/saúde de empresas e escritórios que se encaixam nos critérios de persona e organizações Tier 2 ,Trial,Em andamento,,276,,,,,,,,,0.00%,0.00%,0.00%,
25/08/2025,lista-leads-linkedin-Corporate-Legal-Executive-Summit-Tier2,Prospecção Digital,"Stela e Wellington prospectam participantes e empresas com peril Tier 2 do evento Corporate Legal Executive Summit 2025 compartilhada com o JOTA, pelo linkedin",Stela e Wellington prospectam  através dos próprios Linkedins ,"JOTA PRO Poder, Saúde, Trabalhista e Tributos ",Lista Interna,Lista Externa - Participantes de Eventos,Participantes do envento com perfil Tier 2,Trial,Encerrado,,7,,,,,,,,,0.00%,0.00%,0.00%,
27/08/2025,lista-leads-linkedin-stela-personas-marcos-trabalhista,Prospecção Digital,"Stela prospecta Marcos Tabalhista de diferentes setores (ação de prospecção que foca na Persona, não no setor)",Stela prospecta através do próprio Linkedin ,JOTA PRO Trabalhista,Lista Externa,Lista Externa - Segmentação Sales Navigator / Linkedin,Profissionais na área trabalhista de empresas e escritórios que se encaixam nos critérios de persona e organizações Tier 2 ,Trial,Em andamento,,121,,,,,,,,,0.00%,0.00%,0.00%,
,lista-leads-linkedin-wellington-personas-marcos-trabalhista,Prospecção Digital,"Wellington prospecta Marcos Trabalhista de diferentes setores (ação de prospecção que foca na Persona, não no setor)",Wellington prospecta através do próprio Linkedin ,JOTA PRO Trabalhista,Lista Externa,Lista Externa - Segmentação Sales Navigator / Linkedin,Profissionais na área trabalhista de empresas e escritórios que se encaixam nos critérios de persona e organizações Tier 2 ,Trial,Em andamento,,54,,,,,,,,,,,,
,lista-leads-linkedin-wellington-personas-marcos-tributário,Prospecção Digital,"Wellington prospecta Marcos Tributário de diferentes setores (ação de prospecção que foca na Persona, não no setor)",Wellington prospecta através do próprio Linkedin ,JOTA PRO Tributos ,Lista Externa,Lista Externa - Segmentação Sales Navigator / Linkedin,Profissionais na área tributário de empresas e escritórios que se encaixam nos critérios de persona e organizações Tier 2 ,Trial,Em andamento,,119,,,,,,,,,0.00%,0.00%,0.00%,
`;
