package com.livego.app.auth

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Serviço de autenticação para comunicação com backend LiveGo
 * Responsável por obter tokens JWT para LiveKit e gerenciar sessões
 */
data class TokenRequest(
    val roomName: String,
    val participantName: String? = null,
    val canPublish: Boolean = false
)

data class TokenResponse(
    val success: Boolean,
    val token: String,
    val wsUrl: String,
    val roomName: String,
    val identity: String,
    val canPublish: Boolean,
    val streamInfo: StreamInfo? = null
)

data class StreamInfo(
    val id: String,
    val name: String,
    val hostId: String,
    val viewers: Int
)

data class CreateStreamRequest(
    val name: String,
    val tags: List<String> = emptyList(),
    val message: String = "",
    val isPrivate: Boolean = false,
    val category: String = "live"
)

data class StreamResponse(
    val success: Boolean,
    val stream: StreamData? = null,
    val error: String? = null
)

data class StreamData(
    val id: String,
    val roomId: String,
    val streamKey: String,
    val rtmpIngestUrl: String,
    val playbackUrl: String
)

interface AuthApi {
    @POST("/api/livekit/token")
    suspend fun getToken(@Header("Authorization") authorization: String, @Body request: TokenRequest): TokenResponse
    
    @POST("/api/livekit/token/viewer")
    suspend fun getViewerToken(@Body request: TokenRequest): TokenResponse
    
    @POST("/api/streams")
    suspend fun createStream(@Header("Authorization") authorization: String, @Body request: CreateStreamRequest): StreamResponse
    
    @GET("/api/livekit/health")
    suspend fun healthCheck(): Map<String, Any>
}

class AuthService {
    companion object {
        private const val BASE_URL = "https://livego.store"
        private const val API_BASE_URL = "https://livego.store/api/"
    }
    
    private val api: AuthApi by lazy {
        val logging = HttpLoggingInterceptor()
        logging.setLevel(HttpLoggingInterceptor.Level.BODY)
        
        val client = OkHttpClient.Builder()
            .addInterceptor(logging)
            .build()
        
        Retrofit.Builder()
            .baseUrl(API_BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(AuthApi::class.java)
    }
    
    /**
     * Obtém token JWT para conectar ao LiveKit
     * @param userToken Token de autenticação do usuário
     * @param roomName Nome da sala/stream
     * @param participantName Nome de exibição do participante
     * @param canPublish Se pode publicar vídeo/áudio (broadcaster)
     */
    suspend fun getLiveKitToken(
        userToken: String,
        roomName: String,
        participantName: String? = null,
        canPublish: Boolean = false
    ): Result<TokenResponse> = withContext(Dispatchers.IO) {
        try {
            val request = TokenRequest(
                roomName = roomName,
                participantName = participantName,
                canPublish = canPublish
            )
            
            val response = api.getToken("Bearer $userToken", request)
            if (response.success) {
                Result.success(response)
            } else {
                Result.failure(Exception("Falha ao obter token"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    /**
     * Obtém token para viewer (sem autenticação obrigatória)
     * @param roomName Nome da sala/stream
     * @param viewerName Nome do viewer
     */
    suspend fun getViewerToken(
        roomName: String,
        viewerName: String? = null
    ): Result<TokenResponse> = withContext(Dispatchers.IO) {
        try {
            val request = TokenRequest(
                roomName = roomName,
                participantName = viewerName,
                canPublish = false
            )
            
            val response = api.getViewerToken(request)
            if (response.success) {
                Result.success(response)
            } else {
                Result.failure(Exception("Stream não encontrada ou offline"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    /**
     * Cria uma nova stream no backend
     * @param userToken Token de autenticação do usuário
     * @param streamData Dados da stream
     */
    suspend fun createStream(
        userToken: String,
        streamData: CreateStreamRequest
    ): Result<StreamResponse> = withContext(Dispatchers.IO) {
        try {
            val response = api.createStream("Bearer $userToken", streamData)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    /**
     * Verifica saúde do servidor LiveKit
     */
    suspend fun checkHealth(): Result<Map<String, Any>> = withContext(Dispatchers.IO) {
        try {
            val response = api.healthCheck()
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    /**
     * Gera nome de sala único baseado no ID do usuário
     */
    fun generateRoomName(userId: String): String {
        return "live_${userId}_${System.currentTimeMillis()}"
    }
    
    /**
     * Extrai ID do usuário de um token JWT (simplificado)
     * Em produção, usar biblioteca JWT proper
     */
    fun extractUserIdFromToken(token: String): String? {
        return try {
            // Implementação simplificada - em produção usar JWT library
            val parts = token.split(".")
            if (parts.size >= 2) {
                val payload = String(android.util.Base64.decode(parts[1], android.util.Base64.DEFAULT))
                // Extrair userId do payload JSON
                // Por enquanto, retornar um valor fixo para testes
                "user_${(1000..9999).random()}"
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }
}
