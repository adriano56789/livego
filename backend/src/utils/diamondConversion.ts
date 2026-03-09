// Tabela de conversão de diamantes para dinheiro baseada nos pacotes
export const DIAMOND_PACKAGES = [
    { diamonds: 800, brl: 7.00 },
    { diamonds: 3000, brl: 25.00 },
    { diamonds: 6000, brl: 60.00 },
    { diamonds: 20000, brl: 180.00 },
    { diamonds: 36000, brl: 350.00 },
    { diamonds: 65000, brl: 600.00 }
];

// Taxa da plataforma (20%)
export const PLATFORM_FEE_RATE = 0.20;

/**
 * Calcular valor em BRL baseado nos diamantes usando a tabela de pacotes
 * Usa o pacote com melhor custo-benefício (menor valor por diamante)
 */
export const calculateBRLFromDiamonds = (diamonds: number): number => {
    if (diamonds <= 0) return 0;
    
    // Encontrar o pacote com melhor custo-benefício (menor valor por diamante)
    const bestPackage = DIAMOND_PACKAGES.reduce((best, current) => {
        const currentValuePerDiamond = current.brl / current.diamonds;
        const bestValuePerDiamond = best.brl / best.diamonds;
        return currentValuePerDiamond < bestValuePerDiamond ? current : best;
    });
    
    // Usar a taxa do melhor pacote para converter
    const ratePerDiamond = bestPackage.brl / bestPackage.diamonds;
    return diamonds * ratePerDiamond;
};

/**
 * Calcular earnings líquidos do streamer após desconto da plataforma
 */
export const calculateNetEarnings = (diamonds: number): { gross: number; platformFee: number; net: number } => {
    const gross = calculateBRLFromDiamonds(diamonds);
    const platformFee = gross * PLATFORM_FEE_RATE;
    const net = gross - platformFee;
    
    return {
        gross,
        platformFee,
        net
    };
};
