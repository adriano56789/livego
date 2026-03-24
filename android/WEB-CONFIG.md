# CONFIGURAÇÃO WEB APP - APK INDEPENDENTE

## OBJETIVO
Configurar APK para funcionar 100% independente do Android, carregando apenas o site web.

## CONFIGURAÇÃO ATUAL

### 1. URL DINÂMICA
- **Arquivo**: `MainActivity.kt` linha 145-155
- **Função**: `getWebAppUrl()`
- **Produção**: `https://www.livego.store/`
- **Desenvolvimento**: `http://192.168.3.12:5174`

### 2. CACHE DESABILITADO
- **Sempre busca do servidor**
- **LOAD_NO_CACHE** ativo
- **AppCache desabilitado**
- **Força reload ao carregar**

### 3. NAVEGAÇÃO INTERNA
- **shouldOverrideUrlLoading** mantém tudo no WebView
- **Sem abrir navegador externo**
- **Experiência nativa**

## COMO USAR

### EM PRODUÇÃO:
1. **Já configurado**: `https://www.livego.store/` (linha 161)
2. Compilar APK
3. Publicar

### EM DESENVOLVIMENTO:
1. Alterar linha 151: `return "http://192.168.3.12:5174"`
2. Compilar APK
3. Testar local

## BENEFÍCIOS

✅ **Independente do Android**: Funciona apenas via web  
✅ **Atualizações automáticas**: Site atualizado = app atualizado  
✅ **Sem cache**: Sempre última versão  
✅ **URL configurável**: Mudar apenas 1 linha  
✅ **Futuro**: Configuração remota via API  

## PRÓXIMOS PASSOS (OPCIONAL)

1. **Servidor de configuração**: URL dinâmica via API
2. **Auto-update**: Verificar versão do site
3. **Offline**: Cache inteligente para fallback

## COMPILAÇÃO

```bash
cd android
./gradlew assembleRelease
```

APK gerado em: `android/app/build/outputs/apk/release/`
