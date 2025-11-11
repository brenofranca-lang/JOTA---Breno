
export interface Deal {
    id: string;
    title: string;
    status: 'Ganho' | 'Perdido' | string;
    leadSource: string;
    tier: 'Grandes Contas' | 'SMB' | 'Projetos Grandes Contas' | 'Desconhecido';
    createdDate: Date;
    value: number;
}

export interface Campaign {
    startDate: Date;
    campaignName: string;
    prospects: number;
    mql: number;
    sql: number;
    sal: number;
    won: number;
}

export interface ConversionData {
    name: string;
    total: number;
    won: number;
    lost: number;
    rate: number;
}

export interface FunnelData {
    stage: string;
    value: number;
}

export interface MonthlyGoal {
    quarter: string;
    month: string;
    grandesContas: number;
    smb: number;
}

export interface ProcessedData {
    totalLeads: number;
    totalWon: number;
    totalLost: number;
    inboundLeads: number;
    outboundLeads: number;
    inboundConversionRate: number;
    outboundConversionRate: number;
    totalConversionRate: number;
    inboundBySource: ConversionData[];
    outboundBySource: ConversionData[];
    wonDealsByTier: { name: string; value: number }[];
    campaignFunnelData: FunnelData[];
}
