package com.livego.app.videocall

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * Serviço de convite de chamada para Android
 * Gerencia convites via API REST e WebSocket
 */
class CallInvitationService private constructor(private val context: Context) {
    
    companion object {
        private const val TAG = "CallInvitationService"
        private const val PREFS_NAME = "call_invitation_prefs"
        private const val BASE_URL = "https://livego.store"
        
        @Volatile
        private var INSTANCE: CallInvitationService? = null
        
        fun getInstance(context: Context): CallInvitationService {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: CallInvitationService(context.applicationContext).also { INSTANCE = it }
            }
        }
    }
    
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
    
    private val gson = Gson()
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    
    // Estado da chamada atual
    private val _currentCall = MutableStateFlow<CallInvitation?>(null)
    val currentCall: StateFlow<CallInvitation?> = _currentCall.asStateFlow()
    
    // Estado da conexão
    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()
    
    data class CallInvitation(
        val id: String,
        val hostId: String,
        val hostName: String,
        val guestId: String?,
        val guestName: String?,
        val roomId: String,
        val streamId: String,
        val streamTitle: String?,
        val token: String?,
        val wsUrl: String?
    )
    
    data class InviteRequest(
        val guestId: String,
        val guestName: String,
        val streamId: String
    )
    
    data class RespondRequest(
        val invitationId: String,
        val response: String // "accept" ou "decline"
    )
    
    data class ApiResponse<T>(
        val success: Boolean,
        val error: String?,
        val data: T? = null
    )
    
    /**
     * Convidar usuário para entrar na live
     */
    suspend fun inviteGuest(
        userToken: String,
        guestId: String,
        guestName: String,
        streamId: String
    ): Result<CallInvitation> {
        return try {
            val request = InviteRequest(guestId, guestName, streamId)
            val json = gson.toJson(request)
            val body = json.toRequestBody("application/json".toMediaType())
            
            val httpRequest = Request.Builder()
                .url("$BASE_URL/api/call-invitation/invite")
                .addHeader("Authorization", "Bearer $userToken")
                .addHeader("Content-Type", "application/json")
                .post(body)
                .build()
            
            client.newCall(httpRequest).execute().use { response ->
                val responseBody = response.body?.string()
                if (response.isSuccessful && responseBody != null) {
                    val apiResponse = gson.fromJson(responseBody, object : TypeToken<ApiResponse<Map<String, String>>>() {}.type)
                    if (apiResponse.success) {
                        val invitationId = apiResponse.data?.get("invitationId") ?: ""
                        val invitation = CallInvitation(
                            id = invitationId,
                            hostId = getCurrentUserId(),
                            hostName = getCurrentUserName(),
                            guestId = guestId,
                            guestName = guestName,
                            roomId = "", // Será preenchido quando aceito
                            streamId = streamId,
                            streamTitle = null,
                            token = null,
                            wsUrl = null
                        )
                        _currentCall.value = invitation
                        Result.success(invitation)
                    } else {
                        Result.failure(Exception(apiResponse.error ?: "Erro desconhecido"))
                    }
                } else {
                    Result.failure(Exception("Erro na requisição: ${response.code}"))
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao convidar usuário", e)
            Result.failure(e)
        }
    }
    
    /**
     * Responder a um convite
     */
    suspend fun respondToInvitation(
        userToken: String,
        invitationId: String,
        response: String
    ): Result<String> {
        return try {
            val request = RespondRequest(invitationId, response)
            val json = gson.toJson(request)
            val body = json.toRequestBody("application/json".toMediaType())
            
            val httpRequest = Request.Builder()
                .url("$BASE_URL/api/call-invitation/respond")
                .addHeader("Authorization", "Bearer $userToken")
                .addHeader("Content-Type", "application/json")
                .post(body)
                .build()
            
            client.newCall(httpRequest).execute().use { response ->
                val responseBody = response.body?.string()
                if (response.isSuccessful && responseBody != null) {
                    val apiResponse = gson.fromJson(responseBody, object : TypeToken<ApiResponse<Map<String, String>>>() {}.type)
                    if (apiResponse.success) {
                        Result.success(apiResponse.data?.get("status") ?: response)
                    } else {
                        Result.failure(Exception(apiResponse.error ?: "Erro desconhecido"))
                    }
                } else {
                    Result.failure(Exception("Erro na requisição: ${response.code}"))
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao responder convite", e)
            Result.failure(e)
        }
    }
    
    /**
     * Encerrar chamada
     */
    suspend fun endCall(
        userToken: String,
        invitationId: String
    ): Result<Unit> {
        return try {
            val json = JSONObject().apply {
                put("invitationId", invitationId)
            }.toString()
            val body = json.toRequestBody("application/json".toMediaType())
            
            val httpRequest = Request.Builder()
                .url("$BASE_URL/api/call-invitation/end")
                .addHeader("Authorization", "Bearer $userToken")
                .addHeader("Content-Type", "application/json")
                .post(body)
                .build()
            
            client.newCall(httpRequest).execute().use { response ->
                val responseBody = response.body?.string()
                if (response.isSuccessful && responseBody != null) {
                    val apiResponse = gson.fromJson(responseBody, object : TypeToken<ApiResponse<Unit>>() {}.type)
                    if (apiResponse.success) {
                        _currentCall.value = null
                        Result.success(Unit)
                    } else {
                        Result.failure(Exception(apiResponse.error ?: "Erro desconhecido"))
                    }
                } else {
                    Result.failure(Exception("Erro na requisição: ${response.code}"))
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao encerrar chamada", e)
            Result.failure(e)
        }
    }
    
    /**
     * Obter token do usuário atual
     */
    private fun getCurrentUserToken(): String? {
        return prefs.getString("user_token", null)
    }
    
    /**
     * Obter ID do usuário atual
     */
    private fun getCurrentUserId(): String {
        return prefs.getString("user_id", "") ?: ""
    }
    
    /**
     * Obter nome do usuário atual
     */
    private fun getCurrentUserName(): String {
        return prefs.getString("user_name", "") ?: ""
    }
    
    /**
     * Salvar chamada atual
     */
    fun saveCurrentCall(call: CallInvitation) {
        val json = gson.toJson(call)
        prefs.edit()
            .putString("current_call", json)
            .apply()
        _currentCall.value = call
    }
    
    /**
     * Obter chamada atual salva
     */
    fun getCurrentCall(): CallInvitation? {
        val json = prefs.getString("current_call", null)
        return if (json != null) {
            gson.fromJson(json, CallInvitation::class.java)
        } else null
    }
    
    /**
     * Limpar chamada atual
     */
    fun clearCurrentCall() {
        prefs.edit()
            .remove("current_call")
            .apply()
        _currentCall.value = null
    }
    
    /**
     * Verificar se está em chamada
     */
    fun isInCall(): Boolean {
        return _currentCall.value != null
    }
    
    /**
     * Atualizar estado da conexão
     */
    fun setConnected(connected: Boolean) {
        _isConnected.value = connected
    }
    
    /**
     * Limpar recursos
     */
    fun cleanup() {
        clearCurrentCall()
        _isConnected.value = false
    }
}
