package com.livego.app

import android.content.Context
import android.net.Uri
import android.view.View
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.dash.DashMediaSource
import androidx.media3.ui.PlayerView
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.exoplayer.hls.HlsMediaSource
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.trackselection.DefaultTrackSelector
import androidx.media3.extractor.DefaultExtractorsFactory
import androidx.media3.upstream.DefaultAllocator

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
        exoPlayer = ExoPlayer.Builder(context)
            .setLoadControl(DefaultLoadControl())
            .setTrackSelector(DefaultTrackSelector(context))
            .build()
            
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
     * Inicia reprodução de stream WebRTC
     */
    fun playWebRTCStream(webrtcUrl: String) {
        exoPlayer?.let { player ->
            try {
                val mediaItem = MediaItem.fromUri(Uri.parse(webrtcUrl))
                player.setMediaItem(mediaItem)
                player.prepare()
                player.playWhenReady = true
                isPlaying = true
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
    
    /**
     * Inicia reprodução de stream HLS
     */
    fun playHLSStream(hlsUrl: String) {
        exoPlayer?.let { player ->
            try {
                val dataSourceFactory = DefaultDataSource.Factory(context)
                val hlsMediaSource = HlsMediaSource.Factory(dataSourceFactory)
                    .createMediaSource(MediaItem.fromUri(Uri.parse(hlsUrl)))
                
                player.setMediaSource(hlsMediaSource)
                player.prepare()
                player.playWhenReady = true
                isPlaying = true
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
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
        android.util.Log.e("ExoVideoPlayer", "Playback error: $error")
        
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
         * Obtém URL formatada para streaming
         */
        fun formatStreamUrl(url: String, streamId: String? = null): String {
            return when {
                isWebRTCUrl(url) -> url
                isHLSUrl(url) -> url
                streamId != null -> {
                    // Tentar detectar formato baseado no streamId
                    when {
                        streamId.contains("live") -> "https://72.60.249.175/live/$streamId.m3u8"
                        else -> "webrtc://72.60.249.175/live/$streamId"
                    }
                }
                else -> url
            }
        }
    }
}
