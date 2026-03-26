package com.livego.app

import android.webkit.WebView
import android.webkit.WebSettings
import android.os.Build

/**
 * Player de Vídeo para LiveGo - Integrado com WebView
 * Gerencia reprodução de streams WebRTC do mesmo servidor do site
 */
class LiveVideoPlayer {
    
    companion object {
        /**
         * Configura o WebView para reprodução otimizada de lives
         */
        fun configureForLiveStreaming(webView: WebView) {
            val settings = webView.settings
            
            // Configurações essenciais para vídeo streaming
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            
            // WebRTC e streaming
            settings.mediaPlaybackRequiresUserGesture = false
            settings.allowFileAccessFromFileURLs = true
            settings.allowUniversalAccessFromFileURLs = true
            
            // Hardware acceleration para vídeo
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                webView.setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null)
            }
            
            // Mixed content para streams HTTP/HTTPS
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            }
            
            // Cache otimizado para streaming
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            
            // User agent identificado como LiveGo App
            val userAgent = settings.userAgentString
            settings.userAgentString = "$userAgent LiveGoApp/VideoPlayer"
        }
        
        /**
         * Injeta JavaScript para otimizar reprodução de vídeo
         */
        fun injectVideoOptimizations(webView: WebView) {
            val videoOptimizationScript = """
                // Otimizações para player de vídeo LiveGo
                (function() {
                    // Auto-play para vídeos
                    const videos = document.querySelectorAll('video');
                    videos.forEach(video => {
                        video.autoplay = true;
                        video.playsInline = true;
                        video.muted = true; // Permitir auto-play
                        
                        // Prevenção de freeze
                        video.addEventListener('stalled', () => {
                            console.log('Video stalled, attempting recovery');
                            video.load();
                        });
                        
                        // Otimização de buffer
                        video.addEventListener('loadstart', () => {
                            video.currentTime = 0.1; // Prevenir tela preta
                        });
                    });
                    
                    // WebRTC optimizations
                    if (typeof RTCPeerConnection !== 'undefined') {
                        console.log('WebRTC supported - LiveGo ready');
                    }
                })();
            """.trimIndent()
            
            webView.evaluateJavascript(videoOptimizationScript, null)
        }
        
        /**
         * Verifica se a página atual contém player de vídeo
         */
        fun hasVideoPlayer(webView: WebView, callback: (Boolean) -> Unit) {
            webView.evaluateJavascript(
                "!!(document.querySelector('video') || document.querySelector('.live-player') || document.querySelector('#live-video'))"
            ) { result ->
                callback(result == "true")
            }
        }
        
        /**
         * Força reprodução automática de vídeos na página
         */
        fun autoplayVideos(webView: WebView) {
            val autoplayScript = """
                document.querySelectorAll('video').forEach(video => {
                    if (video.paused) {
                        video.play().catch(e => console.log('Autoplay failed:', e));
                    }
                });
            """.trimIndent()
            
            webView.evaluateJavascript(autoplayScript, null)
        }
        
        /**
         * Verifica status do streaming WebRTC
         */
        fun checkWebRTCStatus(webView: WebView, callback: (String) -> Unit) {
            val statusScript = """
                (function() {
                    if (typeof webrtcService !== 'undefined') {
                        return webrtcService.getState ? webrtcService.getState() : 'unknown';
                    }
                    return 'webrtc-not-loaded';
                })();
            """.trimIndent()
            
            webView.evaluateJavascript(statusScript) { result ->
                callback(result ?: "error")
            }
        }
        
        /**
         * Recupera stream em caso de falha
         */
        fun recoverStream(webView: WebView) {
            val recoverScript = """
                (function() {
                    // Tentar reconectar WebRTC
                    if (typeof webrtcService !== 'undefined' && webrtcService.reconnect) {
                        webrtcService.reconnect();
                        return 'reconnecting';
                    }
                    
                    // Recarregar vídeo
                    const videos = document.querySelectorAll('video');
                    videos.forEach(video => {
                        video.load();
                        video.play().catch(e => console.log('Recovery play failed:', e));
                    });
                    
                    return 'recovery-attempted';
                })();
            """.trimIndent()
            
            webView.evaluateJavascript(recoverScript, null)
        }
    }
}
