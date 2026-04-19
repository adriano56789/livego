package com.livego.app.videocall

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.livego.app.databinding.ActivityLiveCallBinding
import com.livego.app.streaming.LiveKitService
import kotlinx.coroutines.launch

/**
 * Activity de chamada de vídeo para convidados na live
 * Usa LiveKit existente para WebRTC
 */
class LiveCallActivity : AppCompatActivity() {
    
    companion object {
        private const val TAG = "LiveCallActivity"
        
        // Parâmetros da Intent
        const val EXTRA_INVITATION_ID = "invitation_id"
        const val EXTRA_GUEST_ID = "guest_id"
        const val EXTRA_GUEST_NAME = "guest_name"
        const val EXTRA_ROOM_ID = "room_id"
        const val EXTRA_TOKEN = "token"
        const val EXTRA_WS_URL = "ws_url"
        const val EXTRA_IS_INCOMING = "is_incoming"
        const val EXTRA_STREAM_ID = "stream_id"
        
        fun newCallIntent(
            context: android.content.Context,
            invitationId: String,
            guestId: String,
            guestName: String,
            roomId: String,
            token: String,
            wsUrl: String,
            streamId: String
        ): Intent {
            return Intent(context, LiveCallActivity::class.java).apply {
                putExtra(EXTRA_INVITATION_ID, invitationId)
                putExtra(EXTRA_GUEST_ID, guestId)
                putExtra(EXTRA_GUEST_NAME, guestName)
                putExtra(EXTRA_ROOM_ID, roomId)
                putExtra(EXTRA_TOKEN, token)
                putExtra(EXTRA_WS_URL, wsUrl)
                putExtra(EXTRA_IS_INCOMING, false)
                putExtra(EXTRA_STREAM_ID, streamId)
            }
        }
        
        fun incomingCallIntent(
            context: android.content.Context,
            invitationId: String,
            hostId: String,
            hostName: String,
            roomId: String,
            token: String,
            wsUrl: String,
            streamId: String
        ): Intent {
            return Intent(context, LiveCallActivity::class.java).apply {
                putExtra(EXTRA_INVITATION_ID, invitationId)
                putExtra(EXTRA_GUEST_ID, hostId) // Como guest, o host é o "convidado"
                putExtra(EXTRA_GUEST_NAME, hostName)
                putExtra(EXTRA_ROOM_ID, roomId)
                putExtra(EXTRA_TOKEN, token)
                putExtra(EXTRA_WS_URL, wsUrl)
                putExtra(EXTRA_IS_INCOMING, true)
                putExtra(EXTRA_STREAM_ID, streamId)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
        }
    }
    
    private lateinit var binding: ActivityLiveCallBinding
    private lateinit var callService: CallInvitationService
    private lateinit var liveKitService: LiveKitService
    private var isIncoming = false
    private var invitationId = ""
    private var guestId = ""
    private var guestName = ""
    private var roomId = ""
    private var token = ""
    private var wsUrl = ""
    private var streamId = ""
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        binding = ActivityLiveCallBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Inicializar serviços
        callService = CallInvitationService.getInstance(this)
        liveKitService = LiveKitService(this)
        
        // Configurar tela cheia
        setupFullScreenMode()
        
        // Processar intent
        processIntent()
    }
    
    private fun setupFullScreenMode() {
        window.addFlags(
            android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
            android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN or
            android.view.WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
            android.view.WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
        )
        supportActionBar?.hide()
    }
    
    private fun processIntent() {
        invitationId = intent.getStringExtra(EXTRA_INVITATION_ID) ?: ""
        guestId = intent.getStringExtra(EXTRA_GUEST_ID) ?: ""
        guestName = intent.getStringExtra(EXTRA_GUEST_NAME) ?: ""
        roomId = intent.getStringExtra(EXTRA_ROOM_ID) ?: ""
        token = intent.getStringExtra(EXTRA_TOKEN) ?: ""
        wsUrl = intent.getStringExtra(EXTRA_WS_URL) ?: ""
        streamId = intent.getStringExtra(EXTRA_STREAM_ID) ?: ""
        isIncoming = intent.getBooleanExtra(EXTRA_IS_INCOMING, false)
        
        if (token.isEmpty() || roomId.isEmpty()) {
            Toast.makeText(this, "Dados da chamada inválidos", Toast.LENGTH_SHORT).show()
            finish()
            return
        }
        
        // Configurar UI
        setupUI()
        
        // Conectar ao LiveKit
        connectToLiveKit()
    }
    
    private fun setupUI() {
        // Informações da chamada
        binding.txtGuestName.text = guestName
        binding.txtCallStatus.text = if (isIncoming) "Chamada recebida" else "Conectando..."
        
        // Configurar visibilidade
        binding.layoutIncomingCall.visibility = if (isIncoming) View.VISIBLE else View.GONE
        binding.layoutOutgoingCall.visibility = if (!isIncoming) View.VISIBLE else View.GONE
        binding.layoutCallControls.visibility = View.GONE
        
        // Configurar botões para chamada recebida
        if (isIncoming) {
            setupIncomingCallButtons()
        }
    }
    
    private fun setupIncomingCallButtons() {
        binding.btnAcceptCall.setOnClickListener {
            acceptCall()
        }
        
        binding.btnDeclineCall.setOnClickListener {
            declineCall()
        }
    }
    
    private fun connectToLiveKit() {
        lifecycleScope.launch {
            try {
                // Conectar ao LiveKit usando o serviço existente
                val result = liveKitService.connectAsGuest(
                    wsUrl = wsUrl,
                    token = token,
                    roomId = roomId,
                    participantName = guestName
                )
                
                result.onSuccess {
                    Log.d(TAG, "Conectado ao LiveKit com sucesso")
                    runOnUiThread {
                        onCallConnected()
                    }
                }
                
                result.onFailure { error ->
                    Log.e(TAG, "Erro ao conectar ao LiveKit", error)
                    runOnUiThread {
                        Toast.makeText(this@LiveCallActivity, "Erro na chamada: ${error.message}", Toast.LENGTH_LONG).show()
                        finish()
                    }
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Exceção ao conectar ao LiveKit", e)
                runOnUiThread {
                    Toast.makeText(this, "Erro ao iniciar chamada", Toast.LENGTH_LONG).show()
                    finish()
                }
            }
        }
    }
    
    private fun onCallConnected() {
        // Esconder layouts de chamada recebida/enviada
        binding.layoutIncomingCall.visibility = View.GONE
        binding.layoutOutgoingCall.visibility = View.GONE
        binding.layoutCallControls.visibility = View.VISIBLE
        
        // Atualizar status
        binding.txtCallStatus.text = "Em chamada"
        
        // Configurar controles da chamada
        setupCallControls()
        
        // Notificar serviço de convite que aceitou
        if (isIncoming) {
            lifecycleScope.launch {
                callService.respondToInvitation(
                    userToken = getCurrentUserToken() ?: "",
                    invitationId = invitationId,
                    response = "accept"
                )
            }
        }
    }
    
    private fun setupCallControls() {
        binding.btnEndCall.setOnClickListener {
            endCall()
        }
        
        binding.btnToggleVideo.setOnClickListener {
            toggleVideo()
        }
        
        binding.btnToggleAudio.setOnClickListener {
            toggleAudio()
        }
        
        binding.btnSwitchCamera.setOnClickListener {
            switchCamera()
        }
    }
    
    private fun acceptCall() {
        lifecycleScope.launch {
            val result = callService.respondToInvitation(
                userToken = getCurrentUserToken() ?: "",
                invitationId = invitationId,
                response = "accept"
            )
            
            result.onSuccess {
                Log.d(TAG, "Chamada aceita")
                // A conexão será feita automaticamente
            }
            
            result.onFailure { error ->
                Log.e(TAG, "Erro ao aceitar chamada", error)
                Toast.makeText(this@LiveCallActivity, "Erro ao aceitar chamada: ${error.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun declineCall() {
        lifecycleScope.launch {
            val result = callService.respondToInvitation(
                userToken = getCurrentUserToken() ?: "",
                invitationId = invitationId,
                response = "decline"
            )
            
            result.onSuccess {
                Log.d(TAG, "Chamada recusada")
                finish()
            }
            
            result.onFailure { error ->
                Log.e(TAG, "Erro ao recusar chamada", error)
                Toast.makeText(this@LiveCallActivity, "Erro ao recusar chamada: ${error.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun endCall() {
        lifecycleScope.launch {
            // Desconectar do LiveKit
            liveKitService.disconnect()
            
            // Notificar backend
            val result = callService.endCall(
                userToken = getCurrentUserToken() ?: "",
                invitationId = invitationId
            )
            
            result.onSuccess {
                Log.d(TAG, "Chamada encerrada")
                finish()
            }
            
            result.onFailure { error ->
                Log.e(TAG, "Erro ao encerrar chamada", error)
                Toast.makeText(this@LiveCallActivity, "Erro ao encerrar chamada: ${error.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun toggleVideo() {
        try {
            liveKitService.toggleCamera()
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao alternar vídeo", e)
        }
    }
    
    private fun toggleAudio() {
        try {
            liveKitService.toggleMicrophone()
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao alternar áudio", e)
        }
    }
    
    private fun switchCamera() {
        try {
            liveKitService.switchCamera()
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao trocar câmera", e)
        }
    }
    
    private fun getCurrentUserToken(): String? {
        val prefs = getSharedPreferences("user_prefs", MODE_PRIVATE)
        return prefs.getString("user_token", null)
    }
    
    override fun onBackPressed() {
        // Impedir saída durante chamada ativa
        if (liveKitService.isStreaming.value) {
            showEndCallDialog()
        } else {
            super.onBackPressed()
        }
    }
    
    private fun showEndCallDialog() {
        AlertDialog.Builder(this)
            .setTitle("Finalizar Chamada")
            .setMessage("Tem certeza que deseja finalizar a chamada?")
            .setPositiveButton("Finalizar") { _, _ ->
                endCall()
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        try {
            liveKitService.cleanup()
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao destruir activity", e)
        }
    }
}
