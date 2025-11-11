
import type { Deal, Campaign } from '../types';

const parseCsvLine = (line: string): string[] => {
    const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
    return line.split(regex).map(field => {
        // Trim quotes and whitespace
        let cleanField = field.trim();
        if (cleanField.startsWith('"') && cleanField.endsWith('"')) {
            cleanField = cleanField.substring(1, cleanField.length - 1).replace(/""/g, '"');
        }
        return cleanField;
    });
};

export const parseCSV = (csvString: string): any[] => {
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = parseCsvLine(lines[0].trim());
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = parseCsvLine(line);
        if (values.length >= headers.length) {
            const entry: { [key: string]: string } = {};
            headers.forEach((header, index) => {
                entry[header] = values[index];
            });
            data.push(entry);
        }
    }
    return data;
};


export const parseCampaignCSV = (csvString: string): Campaign[] => {
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = parseCsvLine(lines[0].trim());
    const data: Campaign[] = [];
    
    const getIndex = (name: string) => headers.findIndex(h => h.trim().toLowerCase() === name.toLowerCase());

    const dateIndex = getIndex('DATA INÍCIO');
    const nameIndex = getIndex('TAG/EVENTO CONVERSÃO RD');
    const prospectIndex = getIndex('PROSPECT');
    const mqlIndex = getIndex('MQL');
    const sqlIndex = getIndex('SQL');
    const salIndex = getIndex('SAL');
    const wonIndex = getIndex('LIVE (Qtd)');

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCsvLine(line);
        if (values.length >= headers.length) {
            try {
                const startDate = new Date(values[dateIndex]);
                if (isNaN(startDate.getTime())) continue;

                data.push({
                    startDate,
                    campaignName: values[nameIndex] || 'N/A',
                    prospects: parseInt(values[prospectIndex]) || 0,
                    mql: parseInt(values[mqlIndex]) || 0,
                    sql: parseInt(values[sqlIndex]) || 0,
                    sal: parseInt(values[salIndex]) || 0,
                    won: parseInt(values[wonIndex]) || 0,
                });
            } catch (e) {
                console.error(`Skipping invalid campaign line: ${line}`, e);
            }
        }
    }
    return data;
}
