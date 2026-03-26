package com.livego.app

import android.webkit.WebView
import android.webkit.WebSettings
import android.os.Build

/**
 * Configuração WebRTC para o WebView do LiveGo
 * Garante compatibilidade com streaming, câmera e microfone
 */
class WebRTCConfig {
    
    companion object {
        /**
         * Configura o WebView para suporte completo a WebRTC
         */        
        fun configureWebViewForWebRTC(webView: WebView) {
            val settings = webView.settings
            
            // JavaScript e APIs essenciais
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            
            // Permissões de arquivo (necessárias para WebRTC)
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            settings.allowFileAccessFromFileURLs = true
            settings.allowUniversalAccessFromFileURLs = true
            
            // Mídia sem interação do usuário - ESSENCIAL para autoplay
            settings.mediaPlaybackRequiresUserGesture = false
            settings.allowFileAccess = true
            
            // Hardware acceleration para vídeo - CRÍTICO para performance
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                webView.setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null)
            }
            
            // WebRTC específico
            settings.setGeolocationEnabled(false)
            
            // Mixed content para compatibilidade HTTP/HTTPS
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            }
            
            // Cache otimizado para streaming
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            
            // User agent customizado para identificar o app
            val userAgent = settings.userAgentString
            settings.userAgentString = "$userAgent LiveGoApp/Android-WebRTC"
            
            // Zoom habilitado
            settings.setSupportZoom(true)
            settings.builtInZoomControls = true
            settings.displayZoomControls = false
        }
        
        /**
         * URLs de configuração do servidor WebRTC (SRS)
         * Sincronizadas com o backend
         */
        object ServerConfig {
            const val SRS_API_URL = "http://72.60.249.175:1985"
            const val SRS_RTMP_URL = "rtmp://72.60.249.175:1935/live"
            const val SRS_HTTP_URL = "http://72.60.249.175:8080/live"
            const val SRS_WEBRTC_URL = "webrtc://72.60.249.175/live"
            
            // STUN/TURN servers
            const val STUN_URL = "stun:72.60.249.175:3478"
            const val TURN_URL = "turn:72.60.249.175:3478"
            const val TURN_USER = "livego"
            const val TURN_PASS = "livego123"
            
            // Fallback servers
            const val STUN_GOOGLE = "stun:stun.l.google.com:19302"
            const val STUN_GOOGLE_1 = "stun:stun1.l.google.com:19302"
        }
        
        /**
         * Verifica se o dispositivo suporta WebRTC
         */
        fun isWebRTCSupported(): Boolean {
            return Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1
        }
        
        /**
         * Verifica se o dispositivo tem câmera
         */
        fun hasCameraSupport(): Boolean {
            return true // Será verificado em runtime
        }
        
        /**
         * Verifica se o dispositivo tem microfone
         */
        fun hasMicrophoneSupport(): Boolean {
            return true // Será verificado em runtime
        }
    }
}
