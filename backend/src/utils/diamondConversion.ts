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
 * Calcula baseado em pacotes completos + proporção do pacote parcial
 */
export const calculateBRLFromDiamonds = (diamonds: number): number => {
    if (diamonds <= 0) return 0;
    
    // Encontrar pacotes em ordem crescente para cálculo correto
    const sortedPackages = [...DIAMOND_PACKAGES].sort((a, b) => a.diamonds - b.diamonds);
    
    let remainingDiamonds = diamonds;
    let totalBRL = 0;
    
    for (const package_ of sortedPackages) {
        if (remainingDiamonds <= 0) break;
        
        const packagesCount = Math.floor(remainingDiamonds / package_.diamonds);
        
        if (packagesCount > 0) {
            totalBRL += packagesCount * package_.brl;
            remainingDiamonds -= packagesCount * package_.diamonds;
        }
    }
    
    // Se ainda restarem diamantes, usar o menor pacote para o restante
    if (remainingDiamonds > 0 && sortedPackages.length > 0) {
        const smallestPackage = sortedPackages[0];
        const ratePerDiamond = smallestPackage.brl / smallestPackage.diamonds;
        totalBRL += remainingDiamonds * ratePerDiamond;
    }
    
    return totalBRL;
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
