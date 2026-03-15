const DIAMOND_PACKAGES = [
    { diamonds: 800, brl: 7.00 },
    { diamonds: 3000, brl: 25.00 },
    { diamonds: 6000, brl: 60.00 },
    { diamonds: 20000, brl: 180.00 },
    { diamonds: 36000, brl: 350.00 },
    { diamonds: 65000, brl: 600.00 }
];

console.log('=== ANÁLISE DOS PACOTES ===');
DIAMOND_PACKAGES.forEach(pkg => {
    const taxaPorDiamante = pkg.brl / pkg.diamonds;
    console.log(`${pkg.diamonds} diamantes = R$${pkg.brl.toFixed(2)} (Taxa: R$${taxaPorDiamante.toFixed(6)} por diamante)`);
});

// Encontrar o melhor pacote
const bestPackage = DIAMOND_PACKAGES.reduce((best, current) => {
    const currentValuePerDiamond = current.brl / current.diamonds;
    const bestValuePerDiamond = best.brl / best.diamonds;
    return currentValuePerDiamond < bestValuePerDiamond ? current : best;
});

console.log('');
console.log('💎 MELHOR PACOTE ESCOLHIDO:');
console.log(`${bestPackage.diamonds} diamantes = R$${bestPackage.brl.toFixed(2)}`);
console.log(`Taxa: R$${(bestPackage.brl / bestPackage.diamonds).toFixed(6)} por diamante`);

// Calcular 95.321 diamantes
const diamantes = 95321;
const taxaPorDiamante = bestPackage.brl / bestPackage.diamonds;
const valorCalculado = diamantes * taxaPorDiamante;

console.log('');
console.log('=== CÁLCULO PARA 95.321 DIAMANTES ===');
console.log(`Taxa usada: R$${taxaPorDiamante.toFixed(6)} por diamante`);
console.log(`Valor calculado: R$${valorCalculado.toFixed(2)}`);
console.log(`Valor da API: R$794.34`);
console.log(`Diferença: R$${Math.abs(valorCalculado - 794.34).toFixed(2)}`);

// Comparação com 800 = 7 reais
const taxaSimples = 7 / 800;
const valorSimples = diamantes * taxaSimples;

console.log('');
console.log('=== COMPARAÇÃO COM TAXA SIMPLES (800 = R$7) ===');
console.log(`Taxa simples: R$${taxaSimples.toFixed(6)} por diamante`);
console.log(`Valor com taxa simples: R$${valorSimples.toFixed(2)}`);
console.log(`Diferença vs API: R$${Math.abs(valorSimples - 794.34).toFixed(2)}`);
console.log(`Diferença vs calculado: R$${Math.abs(valorSimples - valorCalculado).toFixed(2)}`);
