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
import androidx.media3.ui.PlayerView
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import com.livego.app.ExoVideoPlayer
import com.livego.app.PDVOverlayManager
import androidx.cardview.widget.CardView
import androidx.constraintlayout.widget.ConstraintLayout
import android.widget.TextView

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var videoPlayerView: PlayerView
    private var exoVideoPlayer: ExoVideoPlayer? = null
    private var pdvOverlayManager: PDVOverlayManager? = null
    
    // Views do PDV
    private lateinit var pdvOverlay: ConstraintLayout
    private lateinit var donationButton: CardView
    private lateinit var donationCounter: CardView
    private lateinit var donationCount: TextView
    private lateinit var liveIndicator: CardView

    companion object {
        private const val PERMISSION_REQUEST_CODE = 1001
        private val REQUIRED_PERMISSIONS = arrayOf(
            android.Manifest.permission.CAMERA,
            android.Manifest.permission.RECORD_AUDIO,
            android.Manifest.permission.WRITE_EXTERNAL_STORAGE,
            android.Manifest.permission.READ_EXTERNAL_STORAGE
        )
        
        // Permissões Android 13+ (API 33+)
        private val REQUIRED_PERMISSIONS_API_33 = arrayOf(
            android.Manifest.permission.CAMERA,
            android.Manifest.permission.RECORD_AUDIO,
            android.Manifest.permission.READ_MEDIA_IMAGES,
            android.Manifest.permission.READ_MEDIA_VIDEO,
            android.Manifest.permission.READ_MEDIA_AUDIO
        )
        
        // Permissões de notificação
        private val NOTIFICATION_PERMISSIONS = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            arrayOf(android.Manifest.permission.POST_NOTIFICATIONS)
        } else {
            emptyArray()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)
        videoPlayerView = findViewById(R.id.videoPlayerView)
        
        // Inicializar views do PDV
        pdvOverlay = findViewById(R.id.pdvOverlay)
        donationButton = findViewById(R.id.donationButton)
        donationCounter = findViewById(R.id.donationCounter)
        donationCount = findViewById(R.id.donationCount)
        liveIndicator = findViewById(R.id.liveIndicator)

        setupWebView()
        setupExoPlayer()
        setupPDVOverlay()
        checkAndRequestPermissions()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        // Configurar WebView para WebRTC e streaming de vídeo
        WebRTCConfig.configureWebViewForWebRTC(webView)
        LiveVideoPlayer.configureForLiveStreaming(webView)
        
        // Configurar WebChromeClient para permissões WebRTC e mídia
        webView.webChromeClient = object : WebChromeClient() {
            // ACEITAR AUTOMATICAMENTE todas as permissões de câmera e microfone
            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.let {
                    // Conceder TODAS as permissões solicitadas (câmera, microfone, etc.)
                    it.grant(it.resources)
                    
                    // Log para debug
                    android.util.Log.d("MainActivity", "Permissões concedidas: ${it.resources.joinToString()}")
                }
            }
            
            // Suporte para tela cheia em vídeos de live
            override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
                view?.let { customView ->
                    this@MainActivity.setContentView(customView)
                }
            }
            
            override fun onHideCustomView() {
                // Restaurar layout normal ao sair da tela cheia
                setContentView(R.layout.activity_main)
                setupWebView() // Reconfigurar ao voltar
                setupExoPlayer() // Reconfigurar player ao voltar
                setupPDVOverlay() // Reconfigurar PDV ao voltar
            }
            
            // Progresso de vídeo para lives
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                // Opcional: mostrar progresso de carregamento da live
            }
        }
        
        // Configurar WebViewClient para manter navegação interna e detectar lives
        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                super.onPageStarted(view, url, favicon)
                progressBar.visibility = View.VISIBLE
                
                // Verificar se é uma página de live ao começar carregamento
                url?.let { checkForLiveStream(it) }
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
                
                // Verificar se tem player de vídeo na página e configurar ExoPlayer
                checkForVideoPlayer(url)
            }
            
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                // Manter tudo dentro do WebView
                url?.let { 
                    view?.loadUrl(it)
                    // Verificar se nova URL é uma live
                    checkForLiveStream(it)
                    
                    // Se não for mais uma live, limpar o player
                    if (!isLiveStreamUrl(it)) {
                        clearVideoPlayer()
                    }
                }
                return true
            }
            
            /**
             * Verifica se URL é de live
             */
            private fun isLiveStreamUrl(url: String): Boolean {
                return url.contains("/live/") || 
                       url.contains("stream") || 
                       url.contains("live/") ||
                       url.contains("watch") ||
                       url.contains("broadcast")
            }
        }

        // Carregar a URL do seu app dinamicamente
        // O app vai buscar a URL automaticamente
        val webAppUrl = getWebAppUrl()
        webView.loadUrl(webAppUrl)
    }

    private fun checkAndRequestPermissions() {
        val mediaPermissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            REQUIRED_PERMISSIONS_API_33
        } else {
            REQUIRED_PERMISSIONS
        }
        
        // Combinar todas as permissões necessárias
        val allPermissions = mediaPermissions + NOTIFICATION_PERMISSIONS
        
        val permissionsToRequest = mutableListOf<String>()
        val alreadyGranted = mutableListOf<String>()

        for (permission in allPermissions) {
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
            // FORÇAR solicitação imediata das permissões
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

    /**
     * Configura o overlay PDV
     */
    private fun setupPDVOverlay() {
        pdvOverlayManager = PDVOverlayManager.create(this)
        pdvOverlayManager?.initialize(
            pdvOverlay,
            donationButton,
            donationCounter,
            donationCount,
            liveIndicator
        )
        
        // Configurar listener para doações
        pdvOverlayManager?.setOnDonationClickListener {
            handleDonationClick()
        }
        
        android.util.Log.d("MainActivity", "PDV Overlay configurado")
    }
    
    /**
     * Manipula clique no botão de doação
     */
    private fun handleDonationClick() {
        android.util.Log.d("MainActivity", "Doação solicitada")
        
        // Aqui você pode integrar com seu sistema de pagamentos
        // Por enquanto, apenas simula uma doação
        pdvOverlayManager?.addDonation()
        pdvOverlayManager?.showDonationSuccessAnimation()
        
        // Mostrar toast de exemplo
        android.widget.Toast.makeText(
            this,
            "🎉 Doação recebida! Obrigado pelo apoio!",
            android.widget.Toast.LENGTH_SHORT
        ).show()
    }

    override fun onDestroy() {
        exoVideoPlayer?.release()
        pdvOverlayManager?.release()
        webView.destroy()
        super.onDestroy()
    }

    /**
     * Configura o ExoPlayer para reprodução de vídeo
     */
    private fun setupExoPlayer() {
        exoVideoPlayer = ExoVideoPlayer(this)
        
        // Configurar listener para eventos do player
        exoVideoPlayer?.setPlayerListener(object : Player.Listener {
            override fun onPlaybackStateChanged(playbackState: Int) {
                when (playbackState) {
                    Player.STATE_READY -> {
                        // Player pronto para reproduzir
                        android.util.Log.d("ExoPlayer", "Player ready")
                    }
                    Player.STATE_BUFFERING -> {
                        // Carregando conteúdo
                        android.util.Log.d("ExoPlayer", "Buffering")
                    }
                    Player.STATE_ENDED -> {
                        // Reprodução finalizada
                        android.util.Log.d("ExoPlayer", "Playback ended")
                    }
                    Player.STATE_IDLE -> {
                        // Player ocioso
                        android.util.Log.d("ExoPlayer", "Player idle")
                    }
                }
            }
            
            override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
                // Tratar erros de reprodução
                exoVideoPlayer?.handlePlaybackError(error.message ?: "Unknown error")
            }
        })
    }

    /**
     * Verifica se página possui player de vídeo e configura ExoPlayer
     */
    private fun checkForVideoPlayer(url: String?) {
        url?.let { pageUrl ->
            // Detectar se é página de live/streaming
            if (pageUrl.contains("/live/") || pageUrl.contains("stream")) {
                
                // Tentar extrair URL da stream da página
                val streamUrl = extractStreamUrlFromPage(pageUrl)
                if (streamUrl != null) {
                    setupVideoPlayerForStream(streamUrl)
                }
            }
        }
    }

    /**
     * Verifica se a página atual é uma live e configura o player automaticamente
     */
    private fun checkForLiveStream(url: String) {
        android.util.Log.d("MainActivity", "Verificando se é live: $url")
        
        // Padrões de URL que indicam live/streaming
        val isLiveStream = url.contains("/live/") || 
                           url.contains("stream") || 
                           url.contains("live/") ||
                           url.contains("watch") ||
                           url.contains("broadcast")
        
        if (isLiveStream) {
            android.util.Log.d("MainActivity", "Live detectada, preparando player automático")
            
            // Extrair stream ID da URL
            val streamId = extractStreamIdFromUrl(url)
            if (streamId != null) {
                // Construir URL HLS automaticamente
                val streamUrl = buildStreamUrl(streamId)
                android.util.Log.d("MainActivity", "Stream URL construída: $streamUrl")
                
                // Configurar player automaticamente após um pequeno delay
                webView.postDelayed({
                    setupVideoPlayerForStream(streamUrl)
                }, 1000) // 1 segundo de delay para garantir que a página carregou
            }
        }
    }
    
    /**
     * Extrai stream ID da URL
     */
    private fun extractStreamIdFromUrl(url: String): String? {
        return try {
            when {
                url.contains("/live/") -> {
                    val parts = url.split("/live/")
                    if (parts.size > 1) {
                        val afterLive = parts[1]
                        afterLive.split("?")[0].split("/")[0] // Remove query params e paths extras
                    } else null
                }
                url.contains("stream=") -> {
                    val regex = Regex("stream=([^&]+)")
                    val match = regex.find(url)
                    match?.groupValues?.get(1)
                }
                url.contains("/watch/") -> {
                    val parts = url.split("/watch/")
                    if (parts.size > 1) {
                        parts[1].split("?")[0].split("/")[0]
                    } else null
                }
                else -> null
            }
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "Erro ao extrair stream ID: $e")
            null
        }
    }
    
    /**
     * Constrói URL HLS para o stream ID
     */
    private fun buildStreamUrl(streamId: String): String {
        // Detectar se é ambiente local ou produção baseado na URL atual
        val currentUrl = webView.url ?: ""
        val isLocal = currentUrl.contains("localhost") || currentUrl.contains("127.0.0.1") || currentUrl.contains("192.168.")
        
        val baseUrl = if (isLocal) {
            "http://localhost:8080/live/$streamId/master.m3u8"
        } else {
            "https://livego.store:8080/live/$streamId/master.m3u8"
        }
        
        android.util.Log.d("MainActivity", "URL base: $baseUrl (local: $isLocal)")
        return baseUrl
    }

    /**
     * Configura o player de vídeo para stream específica
     */
    private fun setupVideoPlayerForStream(streamUrl: String) {
        try {
            android.util.Log.d("MainActivity", "Configurando stream: $streamUrl")
            
            when {
                ExoVideoPlayer.isWebRTCUrl(streamUrl) -> {
                    android.util.Log.d("MainActivity", "WebRTC detectado - usando WebView: $streamUrl")
                    // WebRTC usa WebView, não ExoPlayer
                    hideVideoPlayer() // Esconder ExoPlayer
                    // O WebView já vai reproduzir WebRTC automaticamente
                    
                    android.widget.Toast.makeText(
                        this,
                        "🔴 WebRTC ativo no WebView",
                        android.widget.Toast.LENGTH_SHORT
                    ).show()
                }
                ExoVideoPlayer.isHLSUrl(streamUrl) -> {
                    android.util.Log.d("MainActivity", "HLS detectado - usando ExoPlayer: $streamUrl")
                    // HLS usa ExoPlayer com multi-bitrate
                    exoVideoPlayer?.initializePlayer()
                    exoVideoPlayer?.setupPlayerView(videoPlayerView)
                    exoVideoPlayer?.playHLSStream(streamUrl)
                    showVideoPlayer()
                    
                    // Mostrar PDV overlay para HLS
                    pdvOverlayManager?.showOverlay()
                    pdvOverlayManager?.setLiveStatus(true)
                    
                    android.util.Log.d("MainActivity", "🎥 HLS Multi-bitrate com PDV ativo")
                }
                else -> {
                    android.util.Log.d("MainActivity", "Stream não reconhecido, tentando HLS: $streamUrl")
                    // Tentar HLS como fallback
                    exoVideoPlayer?.initializePlayer()
                    exoVideoPlayer?.setupPlayerView(videoPlayerView)
                    exoVideoPlayer?.playHLSStream(streamUrl)
                    showVideoPlayer()
                    
                    // Mostrar PDV overlay para fallback
                    pdvOverlayManager?.showOverlay()
                    pdvOverlayManager?.setLiveStatus(true)
                }
            }
            
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "Erro ao configurar player", e)
            android.widget.Toast.makeText(
                this,
                "❌ Erro ao carregar vídeo",
                android.widget.Toast.LENGTH_SHORT
            ).show()
        }
    }

    /**
     * Mostra o container do player de vídeo
     */
    private fun showVideoPlayer() {
        videoPlayerView.visibility = View.VISIBLE
        android.util.Log.d("MainActivity", "Player de vídeo visível")
    }

    /**
     * Esconde o container do player de vídeo
     */
    private fun hideVideoPlayer() {
        videoPlayerView.visibility = View.GONE
        pdvOverlayManager?.hideOverlay()
        android.util.Log.d("MainActivity", "Player de vídeo escondido")
    }
    
    /**
     * Limpa o player quando sai de uma live
     */
    private fun clearVideoPlayer() {
        exoVideoPlayer?.release()
        hideVideoPlayer()
        android.util.Log.d("MainActivity", "Player limpo")
    }

    /**
     * Extrai URL da stream da página (implementação básica)
     */
    private fun extractStreamUrlFromPage(pageUrl: String): String? {
        // Lógica simples para extrair URL - pode ser melhorada
        return when {
            pageUrl.contains("webrtc://") -> pageUrl
            pageUrl.contains(".m3u8") -> pageUrl
            pageUrl.contains("/live/") -> {
                // Extrair ID da stream da URL
                val streamId = pageUrl.substringAfterLast("/live/")
                if (streamId.isNotEmpty()) {
                    ExoVideoPlayer.formatStreamUrl("", streamId)
                } else null
            }
            else -> null
        }
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
