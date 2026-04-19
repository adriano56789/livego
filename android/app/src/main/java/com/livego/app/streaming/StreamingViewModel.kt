package com.livego.app.streaming

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * ViewModel para gerenciar estado da streaming
 * Centraliza lógica de negócio e estado da UI
 */
class StreamingViewModel(application: Application) : AndroidViewModel(application) {
    
    private val context = getApplication<Application>().applicationContext
    private val liveKitService = LiveKitService(context)
    
    // Estado da conexão
    val connectionState: StateFlow<LiveKitService.ConnectionState> = liveKitService.connectionState
    
    // Estado do streaming
    val isStreaming: StateFlow<Boolean> = liveKitService.isStreaming
    
    // Contagem de espectadores
    val viewerCount: StateFlow<Int> = liveKitService.viewerCount
    
    // Erros
    val error: StateFlow<String?> = liveKitService.error
    
    // Configurações da stream
    private val _streamConfig = MutableStateFlow(StreamConfig())
    val streamConfig: StateFlow<StreamConfig> = _streamConfig.asStateFlow()
    
    data class StreamConfig(
        val title: String = "Live ao Vivo",
        val description: String = "",
        val tags: List<String> = emptyList(),
        val isPrivate: Boolean = false,
        val category: String = "live",
        val quality: String = "HD",
        val enableChat: Boolean = true,
        val enableGifts: Boolean = true
    )
    
    /**
     * Inicia streaming como broadcaster
     */
    fun startStreaming(
        userToken: String,
        roomName: String,
        participantName: String? = null
    ) = viewModelScope.launch {
        liveKitService.connectAsBroadcaster(userToken, roomName, participantName)
            .onSuccess {
                liveKitService.startStreaming()
            }
    }
    
    /**
     * Conecta como viewer
     */
    fun connectAsViewer(
        roomName: String,
        viewerName: String? = null
    ) = viewModelScope.launch {
        liveKitService.connectAsViewer(roomName, viewerName)
    }
    
    /**
     * Para streaming
     */
    fun stopStreaming() {
        liveKitService.stopStreaming()
    }
    
    /**
     * Desconecta da sala
     */
    fun disconnect() {
        liveKitService.disconnect()
    }
    
    /**
     * Alterna câmera
     */
    fun toggleCamera(): Boolean {
        return liveKitService.toggleCamera()
    }
    
    /**
     * Alterna microfone
     */
    fun toggleMicrophone(): Boolean {
        return liveKitService.toggleMicrophone()
    }
    
    /**
     * Troca câmera frontal/traseira
     */
    fun switchCamera() = viewModelScope.launch {
        liveKitService.switchCamera()
    }
    
    /**
     * Atualiza configurações da stream
     */
    fun updateStreamConfig(config: StreamConfig) {
        _streamConfig.value = config
    }
    
    /**
     * Limpa recursos
     */
    override fun onCleared() {
        super.onCleared()
        liveKitService.cleanup()
    }
}
