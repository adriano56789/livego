package com.livego.app

import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.PermissionRequest
import android.widget.ProgressBar
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.livego.app.WebRTCConfig
import com.livego.app.LiveVideoPlayer

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar

    companion object {
        private const val PERMISSION_REQUEST_CODE = 1001
        private val REQUIRED_PERMISSIONS = arrayOf(
            android.Manifest.permission.CAMERA,
            android.Manifest.permission.RECORD_AUDIO,
            android.Manifest.permission.WRITE_EXTERNAL_STORAGE,
            android.Manifest.permission.READ_EXTERNAL_STORAGE
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)

        setupWebView()
        checkAndRequestPermissions()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        // Configurar WebView para WebRTC e streaming de vídeo
        WebRTCConfig.configureWebViewForWebRTC(webView)
        LiveVideoPlayer.configureForLiveStreaming(webView)
        
        // Configurar WebChromeClient para permissões WebRTC e mídia
        webView.webChromeClient = object : WebChromeClient() {
            // Aceitar automaticamente permissões de câmera e microfone
            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.grant(request.resources)
            }
            
            // Suporte para tela cheia em vídeos de live
            override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
                // Implementar tela cheia para transmissões
                view?.let { customView ->
                    this@MainActivity.setContentView(customView)
                }
            }
            
            override fun onHideCustomView() {
                // Restaurar layout normal ao sair da tela cheia
                setContentView(R.layout.activity_main)
                setupWebView() // Reconfigurar ao voltar
            }
            
            // Progresso de vídeo para lives
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                // Opcional: mostrar progresso de carregamento da live
            }
        }
        
        // Configurar WebViewClient para manter navegação interna
        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                super.onPageStarted(view, url, favicon)
                progressBar.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
                
                // Forçar atualização em tempo real
                webView.settings.cacheMode = WebSettings.LOAD_NO_CACHE
                
                // Otimizações para player de vídeo
                LiveVideoPlayer.injectVideoOptimizations(webView)
                
                // Auto-play para vídeos de live
                LiveVideoPlayer.autoplayVideos(webView)
                
                // Verificar se tem player de vídeo na página
                LiveVideoPlayer.hasVideoPlayer(webView) { hasVideo ->
                    if (hasVideo) {
                        // Página tem player de vídeo - otimizado
                        android.widget.Toast.makeText(
                            this@MainActivity, 
                            "🎥 Player de live detectado e otimizado", 
                            android.widget.Toast.LENGTH_SHORT
                        ).show()
                    }
                }
            }
            
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                // Manter tudo dentro do WebView
                url?.let { view?.loadUrl(it) }
                return true
            }
        }

        // Carregar a URL do seu app dinamicamente
        // O app vai buscar a URL automaticamente
        val webAppUrl = getWebAppUrl()
        webView.loadUrl(webAppUrl)
    }

    private fun checkAndRequestPermissions() {
        val permissionsToRequest = mutableListOf<String>()
        val alreadyGranted = mutableListOf<String>()

        for (permission in REQUIRED_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(permission)
            } else {
                alreadyGranted.add(permission)
            }
        }

        // Mostrar status inicial das permissões
        if (alreadyGranted.isNotEmpty()) {
            showPermissionStatus(alreadyGranted, permissionsToRequest)
        }

        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                permissionsToRequest.toTypedArray(),
                PERMISSION_REQUEST_CODE
            )
        } else {
            // Todas as permissões já concedidas
            showAllPermissionsGranted()
        }
    }
    
    /**
     * Mostra status inicial das permissões
     */
    private fun showPermissionStatus(granted: List<String>, denied: List<String>) {
        if (denied.isEmpty()) {
            // Todas já concedidas
            return
        }
        
        val message = "Permissões já concedidas:\n" +
            granted.map { permission ->
                when (permission) {
                    android.Manifest.permission.CAMERA -> "✅ Câmera"
                    android.Manifest.permission.RECORD_AUDIO -> "✅ Microfone"
                    android.Manifest.permission.WRITE_EXTERNAL_STORAGE -> "✅ Armazenamento"
                    android.Manifest.permission.READ_EXTERNAL_STORAGE -> "✅ Acesso a fotos"
                    else -> "✅ $permission"
                }
            }.joinToString("\n") +
            "\n\nAinda precisamos de:\n" +
            denied.map { permission ->
                when (permission) {
                    android.Manifest.permission.CAMERA -> "❌ Câmera"
                    android.Manifest.permission.RECORD_AUDIO -> "❌ Microfone"
                    android.Manifest.permission.WRITE_EXTERNAL_STORAGE -> "❌ Armazenamento"
                    android.Manifest.permission.READ_EXTERNAL_STORAGE -> "❌ Acesso a fotos"
                    else -> "❌ $permission"
                }
            }.joinToString("\n")
            
        // Mostrar toast rápido com status
        android.widget.Toast.makeText(this, "Solicitando permissões restantes...", android.widget.Toast.LENGTH_SHORT).show()
    }
    
    /**
     * Mostra confirmação quando todas as permissões são concedidas
     */
    private fun showAllPermissionsGranted() {
        android.widget.Toast.makeText(this, "✅ Todas as permissões concedidas! App pronto para lives.", android.widget.Toast.LENGTH_LONG).show()
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            val allGranted = grantResults.all { it == PackageManager.PERMISSION_GRANTED }
            
            if (allGranted) {
                // Todas as permissões concedidas - continuar normalmente
                // App já está configurado para WebRTC
                webView.reload() // Recarregar para aplicar configurações
            } else {
                // Algumas permissões foram negadas - mostrar explicação
                handleDeniedPermissions(permissions, grantResults)
            }
        }
    }
    
    /**
     * Lida com permissões negadas pelo usuário
     */
    private fun handleDeniedPermissions(permissions: Array<out String>, grantResults: IntArray) {
        val deniedPermissions = mutableListOf<String>()
        
        permissions.forEachIndexed { index, permission ->
            if (grantResults[index] != PackageManager.PERMISSION_GRANTED) {
                when (permission) {
                    android.Manifest.permission.CAMERA -> {
                        deniedPermissions.add("Câmera (necessária para lives)")
                    }
                    android.Manifest.permission.RECORD_AUDIO -> {
                        deniedPermissions.add("Microfone (necessário para áudio)")
                    }
                    android.Manifest.permission.WRITE_EXTERNAL_STORAGE -> {
                        deniedPermissions.add("Armazenamento (para salvar fotos)")
                    }
                    android.Manifest.permission.READ_EXTERNAL_STORAGE -> {
                        deniedPermissions.add("Armazenamento (para acessar fotos)")
                    }
                    else -> {
                        deniedPermissions.add(permission)
                    }
                }
            }
        }
        
        if (deniedPermissions.isNotEmpty()) {
            // Mostrar alerta explicando a importância das permissões
            showPermissionDeniedDialog(deniedPermissions)
        }
    }
    
    /**
     * Mostra diálogo explicativo sobre permissões negadas
     */
    private fun showPermissionDeniedDialog(deniedPermissions: List<String>) {
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Permissões Necessárias")
            .setMessage(
                "O LiveGo precisa das seguintes permissões para funcionar:\n\n" +
                "• " + deniedPermissions.joinToString("\n• ") + "\n\n" +
                "Sem essas permissões, você não poderá:\n" +
                "• Iniciar transmissões ao vivo\n" +
                "• Enviar mensagens com áudio/vídeo\n" +
                "• Usar todas as funcionalidades do app\n\n" +
                "Vá para Configurações > Aplicativos > LiveGo e conceda as permissões."
            )
            .setPositiveButton("Configurações") { _, _ ->
                // Abrir configurações do aplicativo
                openAppSettings()
            }
            .setNegativeButton("Cancelar") { _, _ ->
                // Continuar sem permissões (funcionalidade limitada)
                showLimitedFunctionalityWarning()
            }
            .setCancelable(false)
            .show()
    }
    
    /**
     * Abre as configurações do aplicativo
     */
    private fun openAppSettings() {
        val intent = android.content.Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = android.net.Uri.fromParts("package", packageName, null)
        }
        startActivity(intent)
    }
    
    /**
     * Mostra aviso sobre funcionalidade limitada
     */
    private fun showLimitedFunctionalityWarning() {
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Funcionalidade Limitada")
            .setMessage(
                "Sem as permissões necessárias, algumas funcionalidades estarão indisponíveis:\n\n" +
                "❌ Não será possível iniciar lives\n" +
                "❌ Não será possível enviar áudio/vídeo\n" +
                "❌ Recursos de mídia estarão bloqueados\n\n" +
                "Você ainda pode assistir lives de outros usuários."
            )
            .setPositiveButton("Entendi") { _, _ ->
                // Continuar com funcionalidade limitada
            }
            .setCancelable(true)
            .show()
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    /**
     * Obtém a URL do app web dinamicamente.
     * Em produção, pode buscar de um servidor de configuração
     * ou usar URL fixa do seu site.
     */
    private fun getWebAppUrl(): String {
        // URL do seu site em produção
        // Altere apenas aqui quando mudar de domínio
        return "https://www.livego.store/"
        
        // Para desenvolvimento local:
        // return "http://192.168.3.12:5174"
        
        // Exemplo futuro - buscar de servidor de config:
        // return getConfigFromServer()
    }

    /**
     * Método futuro para buscar configuração de servidor remoto
     * Permite alterar a URL sem precisar atualizar o APK
     */
    /*
    private fun getConfigFromServer(): String {
        // Buscar URL de servidor de configuração
        // Ex: https://config.seu-dominio.com/api/app-config
        // Retorna a URL do site atual
        return "https://seu-dominio.com"
    }
    */
}
