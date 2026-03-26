package com.livego.app

import android.content.Context
import android.net.Uri
import android.view.View
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.hls.HlsMediaSource
import androidx.media3.ui.PlayerView
import androidx.media3.datasource.DefaultDataSource

/**
 * Player de vídeo otimizado para streaming WebRTC/HLS usando Media3 ExoPlayer
 * Biblioteca oficial do Google para reprodução de mídia no Android
 */
class ExoVideoPlayer(private val context: Context) {
    
    private var exoPlayer: ExoPlayer? = null
    private var playerView: PlayerView? = null
    private var isPlaying = false
    
    /**
     * Inicializa o player de vídeo
     */
    fun initializePlayer(): ExoPlayer {
        exoPlayer = ExoPlayer.Builder(context).build()
        return exoPlayer!!
    }
    
    /**
     * Configura o PlayerView para o ExoPlayer
     */
    fun setupPlayerView(view: PlayerView) {
        this.playerView = view
        view.player = exoPlayer
        view.useController = true
        view.controllerAutoShow = false
    }
    
    /**
     * Inicia reprodução de stream WebRTC (usa WebView, não ExoPlayer)
     * WebRTC não funciona com ExoPlayer - precisa ser reproduzido no WebView
     */
    fun playWebRTCStream(webrtcUrl: String) {
        // WebRTC deve ser reproduzido diretamente no WebView
        // ExoPlayer não suporta WebRTC
        android.util.Log.d("ExoVideoPlayer", "WebRTC URL deve ser reproduzida no WebView: $webrtcUrl")
        
        // Não fazer nada aqui - o WebView vai cuidar do WebRTC
        isPlaying = true
    }
    
    /**
     * Inicia reprodução de stream HLS com suporte a multi-bitrate
     */
    fun playHLSStream(hlsUrl: String) {
        exoPlayer?.let { player ->
            try {
                android.util.Log.d("ExoVideoPlayer", "Tocando HLS Multi-bitrate: " + hlsUrl)
                
                // Tentar master playlist para multi-bitrate primeiro
                val masterUrl = if (hlsUrl.contains(".m3u8") && !hlsUrl.contains("master")) {
                    hlsUrl.replace(".m3u8", "/master.m3u8")
                } else {
                    hlsUrl
                }
                
                android.util.Log.d("ExoVideoPlayer", "URL Master: " + masterUrl)
                
                val dataSourceFactory = DefaultDataSource.Factory(context)
                val hlsMediaSource = HlsMediaSource.Factory(dataSourceFactory)
                    .createMediaSource(MediaItem.fromUri(Uri.parse(masterUrl)))
                
                player.setMediaSource(hlsMediaSource)
                player.prepare()
                player.playWhenReady = true
                isPlaying = true
                
                android.util.Log.d("ExoVideoPlayer", "HLS multi-bitrate player iniciado com sucesso")
            } catch (e: Exception) {
                android.util.Log.e("ExoVideoPlayer", "Erro ao reproduzir HLS multi-bitrate: " + hlsUrl, e)
                
                // Fallback para single-bitrate
                try {
                    android.util.Log.d("ExoVideoPlayer", "Tentando fallback para single-bitrate: " + hlsUrl)
                    val dataSourceFactory = DefaultDataSource.Factory(context)
                    val hlsMediaSource = HlsMediaSource.Factory(dataSourceFactory)
                        .createMediaSource(MediaItem.fromUri(Uri.parse(hlsUrl)))
                    
                    player.setMediaSource(hlsMediaSource)
                    player.prepare()
                    player.playWhenReady = true
                    isPlaying = true
                    
                    android.util.Log.d("ExoVideoPlayer", "HLS single-bitrate fallback iniciado")
                } catch (fallbackError: Exception) {
                    android.util.Log.e("ExoVideoPlayer", "Erro no fallback HLS: " + hlsUrl, fallbackError)
                    e.printStackTrace()
                }
            }
        }
    }
    
    /**
     * Verifica se URL é WebRTC
     */
    fun isWebRTCUrl(url: String): Boolean {
        return url.startsWith("webrtc://") || url.contains("rtc") || url.contains(":8000")
    }
    
    /**
     * Verifica se URL é HLS
     */
    fun isHLSUrl(url: String): Boolean {
        return url.endsWith(".m3u8") || url.contains(".m3u8") || 
               url.startsWith("http") && (url.contains("playlist") || url.contains("hls"))
    }
    
    /**
     * Pausa reprodução
     */
    fun pause() {
        exoPlayer?.let { player ->
            if (player.isPlaying) {
                player.pause()
                isPlaying = false
            }
        }
    }
    
    /**
     * Retoma reprodução
     */
    fun resume() {
        exoPlayer?.let { player ->
            if (!player.isPlaying) {
                player.play()
                isPlaying = true
            }
        }
    }
    
    /**
     * Para reprodução e libera recursos
     */
    fun release() {
        exoPlayer?.let { player ->
            player.release()
            exoPlayer = null
        }
        playerView?.let { view ->
            view.player = null
        }
        isPlaying = false
    }
    
    /**
     * Verifica se está reproduzindo
     */
    fun isCurrentlyPlaying(): Boolean = isPlaying
    
    /**
     * Obtém duração atual do conteúdo
     */
    fun getCurrentPosition(): Long {
        return exoPlayer?.currentPosition ?: 0L
    }
    
    /**
     * Obtém duração total do conteúdo
     */
    fun getDuration(): Long {
        return exoPlayer?.duration ?: 0L
    }
    
    /**
     * Define listener para eventos do player
     */
    fun setPlayerListener(listener: Player.Listener) {
        exoPlayer?.addListener(listener)
    }
    
    /**
     * Trata erros de reprodução
     */
    fun handlePlaybackError(error: String) {
        // Log de erro para debugging
        android.util.Log.e("ExoVideoPlayer", "Playback error: " + error)
        
        // Tentar reiniciar reprodução automaticamente
        exoPlayer?.let { player ->
            if (player.isPlaying) {
                player.pause()
                player.play()
            }
        }
    }
    
    companion object {
        /**
         * Verifica se URL é WebRTC
         */
        fun isWebRTCUrl(url: String): Boolean {
            return url.startsWith("webrtc://") || url.contains("rtc")
        }
        
        /**
         * Verifica se URL é HLS
         */
        fun isHLSUrl(url: String): Boolean {
            return url.endsWith(".m3u8") || url.contains(".m3u8") || 
                   url.startsWith("http") && (url.contains("playlist") || url.contains("hls"))
        }
        
        /**
         * Obtém URL formatada para streaming com suporte multi-bitrate
         */
        fun formatStreamUrl(url: String, streamId: String? = null): String {
            return when {
                isWebRTCUrl(url) -> url
                isHLSUrl(url) -> url
                streamId != null -> {
                    // Tentar detectar formato baseado no streamId
                    when {
                        streamId.contains("live") -> {
                            // Para HLS, tentar master playlist primeiro
                            "https://72.60.249.175:8080/live/" + streamId + "/master.m3u8"
                        }
                        else -> "webrtc://72.60.249.175:8000/live/" + streamId
                    }
                }
                else -> url
            }
        }
        
        /**
         * Verifica se URL suporta multi-bitrate
         */
        fun supportsMultiBitrate(url: String): Boolean {
            return isHLSUrl(url) && (url.contains("master") || url.contains("/live/"))
        }
    }
}
