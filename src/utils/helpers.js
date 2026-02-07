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
