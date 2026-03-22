// Teste rápido do cálculo do signo para 04/03/1993

const calculateZodiacSign = (birthDate: Date): string => {
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();
    
    console.log(`Mês: ${month}, Dia: ${day}`);
    
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Áries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Touro';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gêmeos';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Câncer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leão';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgem';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Escorpião';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagitário';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricórnio';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquário';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Peixes';
    
    return 'Desconhecido';
};

// Testar com 04/03/1993
const testDate = new Date(1993, 2, 4); // Mês 2 = Março (0-11)
console.log('Data:', testDate.toLocaleDateString('pt-BR'));
console.log('Signo:', calculateZodiacSign(testDate));

// Verificar as condições
const month = testDate.getMonth() + 1;
const day = testDate.getDate();
console.log(`\nVerificando condições:`);
console.log(`month === 3 && day >= 21: ${month === 3 && day >= 21}`);
console.log(`month === 2 && day >= 19: ${month === 2 && day >= 19}`);
console.log(`month === 3 && day <= 20: ${month === 3 && day <= 20}`);
console.log(`Condição Peixes: ${(month === 2 && day >= 19) || (month === 3 && day <= 20)}`);
