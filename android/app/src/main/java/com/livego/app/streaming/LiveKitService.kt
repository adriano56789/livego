package com.livego.app.streaming

import android.content.Context
import android.util.Log
import io.livekit.android.LiveKit
import io.livekit.android.Room
import io.livekit.android.events.RoomEvent
import io.livekit.android.events.collect
import io.livekit.android.room.participant.LocalParticipant
import io.livekit.android.room.participant.Participant
import io.livekit.android.room.track.LocalVideoTrack
import io.livekit.android.room.track.LocalAudioTrack
import io.livekit.android.room.track.VideoCaptureOptions
import io.livekit.android.room.track.AudioCaptureOptions
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import com.livego.app.auth.AuthService
import com.livego.app.auth.TokenResponse

/**
 * Serviço principal de streaming usando LiveKit
 * Gerencia captura de câmera, áudio e transmissão para sala
 */
class LiveKitService(private val context: Context) {
    
    companion object {
        private const val TAG = "LiveKitService"
    }
    
    private val authService = AuthService()
    private var room: Room? = null
    private var localParticipant: LocalParticipant? = null
    
    // Estado da conexão
    private val _connectionState = MutableStateFlow(ConnectionState.DISCONNECTED)
    val connectionState: StateFlow<ConnectionState> = _connectionState.asStateFlow()
    
    // Estado da transmissão
    private val _isStreaming = MutableStateFlow(false)
    val isStreaming: StateFlow<Boolean> = _isStreaming.asStateFlow()
    
    // Contagem de espectadores
    private val _viewerCount = MutableStateFlow(0)
    val viewerCount: StateFlow<Int> = _viewerCount.asStateFlow()
    
    // Erros
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()
    
    // Callbacks para eventos de stream (equivalente ao roomStreamUpdate)
    var onStreamPublished: ((participantId: String, trackKind: String) -> Unit)? = null
    var onStreamUnpublished: ((participantId: String, trackKind: String) -> Unit)? = null
    var onStreamSubscribed: ((participantId: String, trackKind: String) -> Unit)? = null
    var onStreamUnsubscribed: ((participantId: String, trackKind: String) -> Unit)? = null
    
    enum class ConnectionState {
        DISCONNECTED,
        CONNECTING,
        CONNECTED,
        RECONNECTING,
        FAILED
    }
    
    /**
     * Conecta a uma sala LiveKit como broadcaster
     * @param userToken Token de autenticação do usuário
     * @param roomName Nome da sala
     * @param participantName Nome de exibição
     */
    suspend fun connectAsBroadcaster(
        userToken: String,
        roomName: String,
        participantName: String? = null
    ): Result<Unit> {
        return try {
            _connectionState.value = ConnectionState.CONNECTING
            _error.value = null
            
            // Obter token JWT do backend
            val tokenResult = authService.getLiveKitToken(
                userToken = userToken,
                roomName = roomName,
                participantName = participantName,
                canPublish = true
            )
            
            if (tokenResult.isFailure) {
                throw Exception("Falha ao obter token: ${tokenResult.exceptionOrNull()?.message}")
            }
            
            val tokenResponse = tokenResult.getOrNull()!!
            
            // Conectar ao LiveKit
            room = LiveKit.connect(
                context = context,
                url = tokenResponse.wsUrl,
                token = tokenResponse.token
            ) { room ->
                // Configurar listeners de eventos
                setupRoomListeners(room)
            }
            
            localParticipant = room?.localParticipant
            
            _connectionState.value = ConnectionState.CONNECTED
            Log.d(TAG, "Conectado como broadcaster à sala: $roomName")
            
            Result.success(Unit)
        } catch (e: Exception) {
            _connectionState.value = ConnectionState.FAILED
            _error.value = e.message
            Log.e(TAG, "Erro ao conectar como broadcaster", e)
            Result.failure(e)
        }
    }
    
    /**
     * Conecta como viewer (apenas assiste)
     */
    suspend fun connectAsViewer(
        roomName: String,
        viewerName: String? = null
    ): Result<Unit> {
        return try {
            _connectionState.value = ConnectionState.CONNECTING
            _error.value = null
            
            val tokenResult = authService.getViewerToken(
                roomName = roomName,
                viewerName = viewerName
            )
            
            if (tokenResult.isFailure) {
                throw Exception("Falha ao obter token de viewer: ${tokenResult.exceptionOrNull()?.message}")
            }
            
            val tokenResponse = tokenResult.getOrNull()!!
            
            room = LiveKit.connect(
                context = context,
                url = tokenResponse.wsUrl,
                token = tokenResponse.token
            ) { room ->
                setupRoomListeners(room)
            }
            
            // Atualizar contagem de espectadores da resposta
            tokenResponse.streamInfo?.let { streamInfo ->
                _viewerCount.value = streamInfo.viewers
            }
            
            _connectionState.value = ConnectionState.CONNECTED
            Log.d(TAG, "Conectado como viewer à sala: $roomName")
            
            // Sincronizar streams existentes na sala
            synchronizeExistingStreams()
            
            Result.success(Unit)
        } catch (e: Exception) {
            _connectionState.value = ConnectionState.FAILED
            _error.value = e.message
            Log.e(TAG, "Erro ao conectar como viewer", e)
            Result.failure(e)
        }
    }
    
    /**
     * Inicia transmissão de vídeo e áudio
     */
    suspend fun startStreaming(): Result<Unit> {
        return try {
            if (_connectionState.value != ConnectionState.CONNECTED) {
                throw Exception("Não conectado à sala")
            }
            
            val localParticipant = localParticipant ?: throw Exception("Participante local não disponível")
            
            // Configurar captura de vídeo
            val videoOptions = VideoCaptureOptions(
                deviceId = null, // Usar câmera padrão
                width = 1280,
                height = 720,
                fps = 30
            )
            
            // Configurar captura de áudio
            val audioOptions = AudioCaptureOptions(
                deviceId = null, // Usar microfone padrão
                echoCancellation = true,
                noiseSuppression = true,
                autoGainControl = true
            )
            
            // Habilitar câmera
            val videoTrack = localParticipant.setCameraEnabled(true, videoOptions)
            if (videoTrack != null) {
                Log.d(TAG, "Câmera habilitada com sucesso")
            } else {
                throw Exception("Falha ao habilitar câmera")
            }
            
            // Habilitar microfone
            val audioTrack = localParticipant.setMicrophoneEnabled(true, audioOptions)
            if (audioTrack != null) {
                Log.d(TAG, "Microfone habilitado com sucesso")
            } else {
                throw Exception("Falha ao habilitar microfone")
            }
            
            _isStreaming.value = true
            Log.d(TAG, "Streaming iniciado com sucesso")
            
            Result.success(Unit)
        } catch (e: Exception) {
            _error.value = e.message
            Log.e(TAG, "Erro ao iniciar streaming", e)
            Result.failure(e)
        }
    }
    
    /**
     * Para transmissão
     */
    fun stopStreaming() {
        try {
            localParticipant?.let { participant ->
                participant.setCameraEnabled(false)
                participant.setMicrophoneEnabled(false)
            }
            
            _isStreaming.value = false
            Log.d(TAG, "Streaming parado")
        } catch (e: Exception) {
            _error.value = e.message
            Log.e(TAG, "Erro ao parar streaming", e)
        }
    }
    
    /**
     * Desconecta da sala
     */
    fun disconnect() {
        try {
            stopStreaming()
            room?.disconnect()
            room = null
            localParticipant = null
            
            _connectionState.value = ConnectionState.DISCONNECTED
            _isStreaming.value = false
            _viewerCount.value = 0
            
            Log.d(TAG, "Desconectado da sala")
        } catch (e: Exception) {
            _error.value = e.message
            Log.e(TAG, "Erro ao desconectar", e)
        }
    }
    
    /**
     * Alterna câmera frontal/traseira
     */
    suspend fun switchCamera(): Result<Unit> {
        return try {
            localParticipant?.let { participant ->
                val videoTrack = participant.getVideoTracks().firstOrNull() as? LocalVideoTrack
                videoTrack?.let { track ->
                    // Implementar troca de câmera
                    // Isso depende da implementação específica do LiveKit Android
                    Log.d(TAG, "Trocando câmera")
                    Result.success(Unit)
                } ?: throw Exception("Track de vídeo não encontrado")
            } ?: throw Exception("Participante não disponível")
        } catch (e: Exception) {
            _error.value = e.message
            Result.failure(e)
        }
    }
    
    /**
     * Liga/desliga microfone
     */
    fun toggleMicrophone(): Boolean {
        return try {
            localParticipant?.let { participant ->
                val isEnabled = participant.isMicrophoneEnabled()
                participant.setMicrophoneEnabled(!isEnabled)
                !isEnabled
            } ?: false
        } catch (e: Exception) {
            _error.value = e.message
            false
        }
    }
    
    /**
     * Liga/desliga câmera
     */
    fun toggleCamera(): Boolean {
        return try {
            localParticipant?.let { participant ->
                val isEnabled = participant.isCameraEnabled()
                participant.setCameraEnabled(!isEnabled)
                _isStreaming.value = !isEnabled
                !isEnabled
            } ?: false
        } catch (e: Exception) {
            _error.value = e.message
            false
        }
    }
    
    /**
     * Configura listeners de eventos da sala
     */
    private fun setupRoomListeners(room: Room) {
        // Listener para eventos de conexão
        room.events.collect { event ->
            when (event) {
                is RoomEvent.Connected -> {
                    _connectionState.value = ConnectionState.CONNECTED
                    Log.d(TAG, "Conectado à sala")
                }
                is RoomEvent.Disconnected -> {
                    _connectionState.value = ConnectionState.DISCONNECTED
                    _isStreaming.value = false
                    Log.d(TAG, "Desconectado da sala")
                }
                is RoomEvent.Reconnecting -> {
                    _connectionState.value = ConnectionState.RECONNECTING
                    Log.d(TAG, "Reconectando à sala")
                }
                is RoomEvent.Reconnected -> {
                    _connectionState.value = ConnectionState.CONNECTED
                    Log.d(TAG, "Reconectado à sala")
                }
                is RoomEvent.ConnectionQualityChanged -> {
                    Log.d(TAG, "Qualidade da conexão alterada: ${event.quality}")
                }
                is RoomEvent.ParticipantConnected -> {
                    // Participante conectou (viewer entrou)
                    updateViewerCount()
                    Log.d(TAG, "Viewer conectado: ${event.participant.identity}")
                }
                is RoomEvent.ParticipantDisconnected -> {
                    // Participante desconectou (viewer saiu)
                    updateViewerCount()
                    Log.d(TAG, "Viewer desconectado: ${event.participant.identity}")
                }
                is RoomEvent.TrackPublished -> {
                    // Stream publicado (equivalente ao roomStreamUpdate ADD)
                    Log.d(TAG, "Stream publicado: ${event.participant.identity} - ${event.track.kind}")
                    updateViewerCount()
                    
                    // Notificar Activity sobre novo stream
                    onStreamPublished?.invoke(event.participant.identity, event.track.kind)
                }
                is RoomEvent.TrackUnpublished -> {
                    // Stream removido (equivalente ao roomStreamUpdate DELETE)
                    Log.d(TAG, "Stream removido: ${event.participant.identity} - ${event.track.kind}")
                    updateViewerCount()
                    
                    // Notificar Activity sobre stream removido
                    onStreamUnpublished?.invoke(event.participant.identity, event.track.kind)
                }
                is RoomEvent.TrackSubscribed -> {
                    // Stream subscrito com sucesso
                    Log.d(TAG, "Stream subscrito: ${event.participant.identity} - ${event.track.kind}")
                    
                    // Notificar Activity que stream está disponível para reprodução
                    onStreamSubscribed?.invoke(event.participant.identity, event.track.kind)
                }
                is RoomEvent.TrackUnsubscribed -> {
                    // Stream desinscrito
                    Log.d(TAG, "Stream desinscrito: ${event.participant.identity} - ${event.track.kind}")
                    
                    // Notificar Activity que stream não está mais disponível
                    onStreamUnsubscribed?.invoke(event.participant.identity, event.track.kind)
                }
                else -> {
                    Log.d(TAG, "Evento não tratado: ${event::class.simpleName}")
                }
            }
        }
    }
    
    /**
     * Atualiza contagem de espectadores
     */
    private fun updateViewerCount() {
        room?.let { room ->
            val remoteParticipants = room.remoteParticipants.size
            _viewerCount.value = remoteParticipants
            Log.d(TAG, "Viewers atuais: $remoteParticipants")
        }
    }
    
    /**
     * Sincroniza streams existentes na sala (equivalente ao roomStreamUpdate inicial)
     */
    private fun synchronizeExistingStreams() {
        room?.let { room ->
            Log.d(TAG, "Sincronizando streams existentes na sala...")
            
            // Verificar todos os participantes remotos
            room.remoteParticipants.forEach { (participantId, participant) ->
                Log.d(TAG, "Participante encontrado: $participantId")
                
                // Verificar tracks publicados por este participante
                participant.videoTracks.forEach { videoTrack ->
                    if (videoTrack.isPublished) {
                        Log.d(TAG, "Stream de vídeo encontrado: $participantId")
                        onStreamPublished?.invoke(participantId, "video")
                    }
                }
                
                participant.audioTracks.forEach { audioTrack ->
                    if (audioTrack.isPublished) {
                        Log.d(TAG, "Stream de áudio encontrado: $participantId")
                        onStreamPublished?.invoke(participantId, "audio")
                    }
                }
            }
            
            // Verificar também se o local participant está publicando (para host)
            room.localParticipant?.let { localParticipant ->
                localParticipant.videoTracks.forEach { videoTrack ->
                    if (videoTrack.isPublished) {
                        Log.d(TAG, "Stream de vídeo local encontrado")
                        onStreamPublished?.invoke(localParticipant.identity, "video")
                    }
                }
                
                localParticipant.audioTracks.forEach { audioTrack ->
                    if (audioTrack.isPublished) {
                        Log.d(TAG, "Stream de áudio local encontrado")
                        onStreamPublished?.invoke(localParticipant.identity, "audio")
                    }
                }
            }
            
            Log.d(TAG, "Sincronização de streams concluída")
        }
    }
    
    /**
     * Obtém lista de streams ativos na sala
     */
    fun getActiveStreams(): List<StreamInfo> {
        val activeStreams = mutableListOf<StreamInfo>()
        
        room?.let { room ->
            // Adicionar streams de participantes remotos
            room.remoteParticipants.forEach { (participantId, participant) ->
                participant.videoTracks.forEach { videoTrack ->
                    if (videoTrack.isPublished) {
                        activeStreams.add(StreamInfo(
                            participantId = participantId,
                            trackKind = "video",
                            isLocal = false
                        ))
                    }
                }
                
                participant.audioTracks.forEach { audioTrack ->
                    if (audioTrack.isPublished) {
                        activeStreams.add(StreamInfo(
                            participantId = participantId,
                            trackKind = "audio",
                            isLocal = false
                        ))
                    }
                }
            }
            
            // Adicionar streams do participante local
            room.localParticipant?.let { localParticipant ->
                localParticipant.videoTracks.forEach { videoTrack ->
                    if (videoTrack.isPublished) {
                        activeStreams.add(StreamInfo(
                            participantId = localParticipant.identity,
                            trackKind = "video",
                            isLocal = true
                        ))
                    }
                }
                
                localParticipant.audioTracks.forEach { audioTrack ->
                    if (audioTrack.isPublished) {
                        activeStreams.add(StreamInfo(
                            participantId = localParticipant.identity,
                            trackKind = "audio",
                            isLocal = true
                        ))
                    }
                }
            }
        }
        
        return activeStreams
    }
    
    /**
     * Informações de stream
     */
    data class StreamInfo(
        val participantId: String,
        val trackKind: String,
        val isLocal: Boolean
    )
    
    /**
     * Limpa recursos
     */
    fun cleanup() {
        disconnect()
    }
}
