# 🔧 CORREÇÃO - CÁLCULO DO SAQUE NA CARTEIRA DE GANHOS

## 🚨 **PROBLEMA IDENTIFICADO**

### ❌ **Sintoma:**
- **95.321 diamantes disponíveis** ✅
- Ao digitar valor e clicar "Próximo": 
  - **Valor Bruto (BRL): R$ 0,00** ❌
  - **Taxa da Plataforma (20%): R$ 0,00** ❌
  - **Valor a Receber: R$ 0,00** ❌

### 🎯 **Causa:**
**Incompatibilidade entre a resposta da API e o tipo esperado no frontend.**

---

## 🔍 **ANÁLISE DO PROBLEMA**

### ✅ **API Backend (Funcionando Perfeitamente):**
```json
POST /api/wallet/earnings/calculate
Body: { amount: 95321 }

Response: {
  "diamonds": 95321,
  "gross_brl": 794.34,
  "platform_fee_brl": 158.87,
  "net_brl": 635.47,
  "breakdown": {
    "conversion": "95321 diamantes = R$794.34",
    "fee": "Taxa da plataforma (20%): R$158.87",
    "final": "Valor a receber: R$635.47"
  }
}
```

### ❌ **Frontend (Tipos Incorretos):**
```typescript
// Tipo esperado (incorreto)
{ gross_value: number; platform_fee: number; net_value: number }

// Campos usados na exibição (incorretos)
displayData.gross_value    // ❌ Não existe
displayData.platform_fee   // ❌ Não existe  
displayData.net_value      // ❌ Não existe
```

---

## 🔧 **CORREÇÕES APLICADAS**

### 1. **Tipo na API Corrigido**
```typescript
// services/api.ts - LINHA 179
// ANTES (incorreto)
calculateWithdrawal: (amount: number) => callApi<{ 
  gross_value: number; 
  platform_fee: number; 
  net_value: number 
}>('POST', '/api/wallet/earnings/calculate', { amount }),

// DEPOIS (correto)
calculateWithdrawal: (amount: number) => callApi<{ 
  diamonds: number; 
  gross_brl: number; 
  platform_fee_brl: number; 
  net_brl: number; 
  breakdown: { 
    conversion: string; 
    fee: string; 
    final: string; 
  } 
}>('POST', '/api/wallet/earnings/calculate', { amount }),
```

### 2. **Tipo no Frontend Corrigido**
```typescript
// GanhosTab.tsx - LINHA 20
// ANTES (incorreto)
const [calculation, setCalculation] = useState<{ 
  gross_value: number; 
  platform_fee: number; 
  net_value: number 
} | null>(null);

// DEPOIS (correto)
const [calculation, setCalculation] = useState<{ 
  diamonds: number; 
  gross_brl: number; 
  platform_fee_brl: number; 
  net_brl: number; 
  breakdown: { 
    conversion: string; 
    fee: string; 
    final: string; 
  } 
} | null>(null);
```

### 3. **displayData Corrigido**
```typescript
// ANTES (campos inexistentes)
const displayData = calculation || {
    gross_value: earningsInfo?.brl_value || 0,
    platform_fee: 0,
    net_value: earningsInfo?.brl_value || 0
};

// DEPOIS (campos corretos)
const displayData = calculation || {
    diamonds: earningsInfo?.available_diamonds || 0,
    gross_brl: earningsInfo?.brl_value || 0,
    platform_fee_brl: 0,
    net_brl: earningsInfo?.brl_value || 0,
    breakdown: {
        conversion: `${earningsInfo?.available_diamonds || 0} diamantes = R$${(earningsInfo?.brl_value || 0).toFixed(2)}`,
        fee: 'Taxa da plataforma (20%): R$0.00',
        final: 'Valor a receber: R$0.00'
    }
};
```

### 4. **Exibição Corrigida**
```typescript
// ANTES (campos inexistentes)
formatCurrency(displayData.gross_value)     // ❌
formatCurrency(displayData.platform_fee)    // ❌
formatCurrency(displayData.net_value)       // ❌

// DEPOIS (campos corretos)
formatCurrency(displayData.gross_brl)       // ✅
formatCurrency(displayData.platform_fee_brl) // ✅
formatCurrency(displayData.net_brl)         // ✅
```

### 5. **Logs Adicionados para Depuração**
```typescript
useEffect(() => {
    const amount = parseInt(withdrawAmount);
    console.log(`🔍 [CALCULO] Valor digitado: ${amount}`);
    
    if (!isNaN(amount) && amount > 0) {
        setIsCalculating(true);
        const timer = setTimeout(() => {
            console.log(`🔍 [CALCULO] Chamando API para calcular: ${amount} diamantes`);
            api.calculateWithdrawal(amount)
                .then((result) => {
                    console.log(`✅ [CALCULO] Resultado da API:`, result);
                    setCalculation(result);
                })
                .catch((error) => {
                    console.error(`❌ [CALCULO] Erro na API:`, error);
                    setCalculation(null);
                })
                .finally(() => setIsCalculating(false));
        }, 300);
        return () => clearTimeout(timer);
    } else {
        console.log(`🔍 [CALCULO] Valor inválido, limpando cálculo`);
        setCalculation(null);
    }
}, [withdrawAmount]);
```

---

## 🎯 **FLUXO ESPERADO APÓS CORREÇÃO**

### ✅ **1. Usuário Digita Valor**
```
Usuário digita: 95321
    ↓
useEffect disparado
    ↓
console.log: "🔍 [CALCULO] Valor digitado: 95321"
```

### ✅ **2. API é Chamada**
```
API chamada após 300ms (debounce)
    ↓
POST /api/wallet/earnings/calculate
Body: { amount: 95321 }
    ↓
console.log: "🔍 [CALCULO] Chamando API para calcular: 95321 diamantes"
```

### ✅ **3. API Retorna Cálculo**
```
API retorna: {
  diamonds: 95321,
  gross_brl: 794.34,
  platform_fee_brl: 158.87,
  net_brl: 635.47
}
    ↓
console.log: "✅ [CALCULO] Resultado da API: {...}"
    ↓
setCalculation(result)
```

### ✅ **4. Valores Exibidos**
```
displayData.gross_brl = 794.34       → R$ 794,34
displayData.platform_fee_brl = 158.87 → R$ 158,87
displayData.net_brl = 635.47         → R$ 635,47
```

---

## 📊 **CÁLCULO CORRETO APLICADO**

### ✅ **Para 95.321 diamantes:**
- **Taxa usada:** R$0,008333 por diamante (pacote de 3.000 = R$25)
- **Valor bruto:** 95.321 × R$0,008333 = **R$ 794,34**
- **Taxa plataforma (20%):** R$ 794,34 × 20% = **R$ 158,87**
- **Valor líquido:** R$ 794,34 - R$ 158,87 = **R$ 635,47**

---

## 📋 **CHECKLIST DE VERIFICAÇÃO**

- [x] Tipo da API corrigido
- [x] Tipo no frontend corrigido
- [x] displayData atualizado
- [x] Campos de exibição corrigidos
- [x] Logs de depuração adicionados
- [ ] Testar no aplicativo

---

## 🚀 **PRÓXIMOS PASSOS**

1. **Testar no aplicativo**
2. **Digitar valor de saque (ex: 95321)**
3. **Abrir console do navegador**
4. **Verificar os logs:**
   ```
   🔍 [CALCULO] Valor digitado: 95321
   🔍 [CALCULO] Chamando API para calcular: 95321 diamantes
   ✅ [CALCULO] Resultado da API: {...}
   ```
5. **Confirmar valores exibidos:**
   - Valor Bruto: R$ 794,34
   - Taxa (20%): R$ 158,87
   - Valor a Receber: R$ 635,47

---

## 💡 **RESUMO**

**Problema:** Tipos incompatíveis entre API e frontend  
**Solução:** Alinhar tipos e campos de resposta  
**Resultado:** Cálculo automático com taxa de 20% aplicada corretamente  

**🎉 AS CORREÇÕES FORAM APLICADAS! O CÁLCULO DO SAQUE AGORA DEVE FUNCIONAR CORRETAMENTE COM A TAXA DE 20% APLICADA AUTOMATICAMENTE!**
