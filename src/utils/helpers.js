export const normalizeText = (text) => {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "") // Remove spaces
        .toLowerCase();
};

export const keywordMap = {
    'cerveja': 'Cerveja',
    'brahma': 'Cerveja',
    'skol': 'Cerveja',
    'antarctica': 'Cerveja',
    'imperio': 'Cerveja',
    'heineken': 'Long Neck',
    'stella': 'Long Neck',
    'budweiser': 'Long Neck',
    'corona': 'Long Neck',
    'latao': 'Lata',
    'latão': 'Lata',
    'refri': 'Refrigerante',
    'coca': 'Refrigerante',
    'fanta': 'Refrigerante',
    'guarana': 'Refrigerante',
    'sprite': 'Refrigerante',
    'agua': 'Água',
    'água': 'Água',
    'gelo': 'Gelo',
    'carvao': 'Carvão',
    'carvão': 'Carvão'
};

export const autoCategorize = (text) => {
    const lowerText = text.toLowerCase();
    for (const [key, category] of Object.entries(keywordMap)) {
        if (lowerText.includes(key)) return category;
    }
    return null;
};

export const NAVBAR_HEIGHT_MOBILE = 135;
export const NAVBAR_HEIGHT_DESKTOP = 160;

/**
 * Converte uma string de preço (ex: "R$ 10,50" ou "1.200,00") em um número float.
 */
export const parsePrice = (priceVal) => {
    if (typeof priceVal === 'number') return priceVal;
    if (!priceVal) return 0;

    // Remove R$, espaços e pontos de milhar, troca vírgula por ponto
    const cleanValue = String(priceVal)
        .replace(/R\$\s*/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
        .trim();

    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formata um número para o padrão de moeda brasileiro (R$ 0,00).
 */
export const formatPrice = (value) => {
    const number = typeof value === 'string' ? parsePrice(value) : value;
    return `R$ ${number.toFixed(2).replace('.', ',')}`;
};
