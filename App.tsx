
import React, { useState, useMemo } from 'react';
import { useDashboardData } from './hooks/useDashboardData';
import { ChartComponent } from './components/ChartComponent';
import { DashboardCard } from './components/DashboardCard';
import { GoalTracker } from './components/GoalTracker';
import { TargetIcon, TrendingUpIcon, TrendingDownIcon, UsersIcon, DollarSignIcon, FilterIcon, BarChartIcon, GoalIcon } from './components/Icons';
import type { MonthlyGoal } from './types';

const App: React.FC = () => {
    const { data, loading, error } = useDashboardData();
    const [activeTab, setActiveTab] = useState<'geral' | 'inbound' | 'outbound'>('geral');

    const quarterlyGoals: { [key: string]: { grandesContas: number; smb: number } } = {
        'Q1': { grandesContas: 450, smb: 670 },
        'Q2': { grandesContas: 500, smb: 650 },
        'Q3': { grandesContas: 300, smb: 650 },
        'Q4': { grandesContas: 300, smb: 650 },
    };

    const monthlyGoals: MonthlyGoal[] = useMemo(() => {
        const goals: MonthlyGoal[] = [];
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        Object.entries(quarterlyGoals).forEach(([quarter, values], qIndex) => {
            for (let i = 0; i < 3; i++) {
                const monthIndex = qIndex * 3 + i;
                goals.push({
                    quarter,
                    month: months[monthIndex],
                    grandesContas: Math.ceil(values.grandesContas / 3),
                    smb: Math.ceil(values.smb / 3),
                });
            }
        });
        return goals;
    }, []);
    
    // Assuming current month is January for demonstration
    const currentMonthData = data ? {
        grandesContas: data.wonDealsByTier.find(d => d.name === 'Grandes Contas')?.value ?? 0,
        smb: data.wonDealsByTier.find(d => d.name === 'SMB')?.value ?? 0,
    } : { grandesContas: 0, smb: 0 };


    const renderContent = () => {
        if (loading) return <div className="text-center text-white p-10">Carregando dados...</div>;
        if (error) return <div className="text-center text-red-500 p-10">Erro ao carregar dados: {error}</div>;
        if (!data) return <div className="text-center text-white p-10">Nenhum dado para exibir.</div>;

        const bestInbound = data.inboundBySource[0];
        const worstInbound = data.inboundBySource[data.inboundBySource.length - 1];
        const bestOutbound = data.outboundBySource.length > 0 ? data.outboundBySource[0] : null;
        const worstOutbound = data.outboundBySource.length > 0 ? data.outboundBySource[data.outboundBySource.length - 1] : null;

        switch (activeTab) {
            case 'geral':
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <DashboardCard title="Total de Leads" value={data.totalLeads} icon={<UsersIcon />} />
                            <DashboardCard title="Taxa de Conversão Geral" value={`${data.totalConversionRate.toFixed(1)}%`} icon={<TargetIcon />} />
                            <DashboardCard title="Conversão Inbound" value={`${data.inboundConversionRate.toFixed(1)}%`} icon={<TrendingUpIcon />} />
                            <DashboardCard title="Conversão Outbound" value={`${data.outboundConversionRate.toFixed(1)}%`} icon={<TrendingDownIcon />} />
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                                <h3 className="text-xl font-semibold text-white mb-4">Distribuição de Leads (Inbound vs Outbound)</h3>
                                <ChartComponent
                                    type="pie"
                                    data={[{ name: 'Inbound', value: data.inboundLeads }, { name: 'Outbound', value: data.outboundLeads }]}
                                    colors={['#34d399', '#f87171']}
                                />
                            </div>
                            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                                 <h3 className="text-xl font-semibold text-white mb-4">Negócios Ganhos por Categoria</h3>
                                <ChartComponent
                                    type="pie"
                                    data={data.wonDealsByTier}
                                    colors={['#60a5fa', '#a78bfa', '#facc15']}
                                />
                            </div>
                        </div>
                        
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center"><GoalIcon /> Metas Mensais - Inbound MKT (Q1)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            {monthlyGoals.slice(0,3).map((goal) => (
                                <div key={goal.month} className="bg-slate-800 p-6 rounded-lg shadow-lg">
                                     <h3 className="text-xl font-semibold text-white mb-4 text-center">{goal.month}</h3>
                                     <div className="space-y-4">
                                        <GoalTracker label="Grandes Contas" current={currentMonthData.grandesContas} goal={goal.grandesContas} />
                                        <GoalTracker label="SMB" current={currentMonthData.smb} goal={goal.smb} />
                                     </div>
                                </div>
                            ))}
                        </div>
                    </>
                );
            case 'inbound':
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                           <DashboardCard title="Total de Leads Inbound" value={data.inboundLeads} icon={<UsersIcon />} />
                           <DashboardCard title="Melhor Estratégia" value={bestInbound?.name || 'N/A'} subValue={`${bestInbound?.rate.toFixed(1) || 0}% conv.`} icon={<TrendingUpIcon />} />
                           <DashboardCard title="Pior Estratégia" value={worstInbound?.name || 'N/A'} subValue={`${worstInbound?.rate.toFixed(1) || 0}% conv.`} icon={<TrendingDownIcon />} />
                        </div>
                        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                            <h3 className="text-xl font-semibold text-white mb-4">Taxa de Conversão por Estratégia Inbound</h3>
                            <ChartComponent 
                                type="bar" 
                                data={data.inboundBySource} 
                                dataKey="rate" 
                                nameKey="name" 
                                unit="%"
                                label="Taxa de Conversão"
                                colors={['#38bdf8']} 
                            />
                        </div>
                    </>
                );
            case 'outbound':
                 return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                           <DashboardCard title="Total de Leads Outbound" value={data.outboundLeads} icon={<UsersIcon />} />
                           <DashboardCard title="Melhor Estratégia" value={bestOutbound?.name || 'N/A'} subValue={`${bestOutbound?.rate.toFixed(1) || 0}% conv.`} icon={<TrendingUpIcon />} />
                           <DashboardCard title="Pior Estratégia" value={worstOutbound?.name || 'N/A'} subValue={`${worstOutbound?.rate.toFixed(1) || 0}% conv.`} icon={<TrendingDownIcon />} />
                        </div>
                        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                            <h3 className="text-xl font-semibold text-white mb-4">Taxa de Conversão por Estratégia Outbound</h3>
                            <ChartComponent 
                                type="bar" 
                                data={data.outboundBySource} 
                                dataKey="rate" 
                                nameKey="name" 
                                unit="%"
                                label="Taxa de Conversão"
                                colors={['#fb923c']}
                             />
                        </div>
                    </>
                );
        }
    };
    
    const TabButton: React.FC<{tab: 'geral' | 'inbound' | 'outbound'; label: string; icon: React.ReactNode}> = ({tab, label, icon}) => (
         <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-300 hover:bg-slate-700 hover:text-white'
            }`}
        >
            {icon}
            {label}
        </button>
    )

    return (
        <div className="min-h-screen bg-slate-900 text-gray-200 font-sans">
            <header className="bg-slate-800 shadow-md p-4 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Dashboard de Marketing e Vendas</h1>
            </header>
            <main className="p-6">
                <div className="mb-6 bg-slate-800 p-2 rounded-lg shadow-md inline-flex items-center space-x-2">
                    <TabButton tab="geral" label="Visão Geral" icon={<BarChartIcon />} />
                    <TabButton tab="inbound" label="Análise Inbound" icon={<TrendingUpIcon />} />
                    <TabButton tab="outbound" label="Análise Outbound" icon={<TrendingDownIcon />} />
                </div>
                {renderContent()}
            </main>
        </div>
    );
};

export default App;
