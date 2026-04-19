package com.livego.app.streaming

import android.Manifest
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.livego.app.databinding.ActivityStreamingBinding
import com.livego.app.permissions.PermissionManager
import com.livego.app.auth.AuthService
import kotlinx.coroutines.launch

/**
 * Activity principal de streaming
 * Gerencia interface de broadcaster com câmera, controles e transmissão
 */
class StreamingActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityStreamingBinding
    private lateinit var permissionManager: PermissionManager
    private lateinit var liveKitService: LiveKitService
    private val authService = AuthService()
    
    // ViewModel para gerenciar estado
    private val viewModel: StreamingViewModel by viewModels()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Configurar tela cheia para streaming
        window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_FULLSCREEN or
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
        )
        
        binding = ActivityStreamingBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Inicializar serviços
        permissionManager = PermissionManager(this)
        liveKitService = LiveKitService(this)
        
        // Configurar UI
        setupUI()
        setupObservers()
        
        // Verificar permissões ao iniciar
        checkAndRequestPermissions()
    }
    
    private fun setupUI() {
        // Botões de controle
        binding.btnStartStream.setOnClickListener {
            startStreaming()
        }
        
        binding.btnStopStream.setOnClickListener {
            stopStreaming()
        }
        
        binding.btnToggleCamera.setOnClickListener {
            toggleCamera()
        }
        
        binding.btnToggleMic.setOnClickListener {
            toggleMicrophone()
        }
        
        binding.btnSwitchCamera.setOnClickListener {
            switchCamera()
        }
        
        binding.btnEndStream.setOnClickListener {
            showEndStreamDialog()
        }
        
        binding.btnInviteGuest.setOnClickListener {
            showInviteGuestDialog()
        }
        
        // Estado inicial dos botões
        updateUIState()
    }
    
    private fun setupObservers() {
        // Observar estado da conexão
        lifecycleScope.launch {
            liveKitService.connectionState.collect { state ->
                runOnUiThread {
                    when (state) {
                        LiveKitService.ConnectionState.CONNECTED -> {
                            binding.statusText.text = "Conectado"
                            binding.statusIndicator.setBackgroundColor(getColor(android.R.color.holo_green_dark))
                        }
                        LiveKitService.ConnectionState.CONNECTING -> {
                            binding.statusText.text = "Conectando..."
                            binding.statusIndicator.setBackgroundColor(getColor(android.R.color.holo_orange_dark))
                        }
                        LiveKitService.ConnectionState.DISCONNECTED -> {
                            binding.statusText.text = "Desconectado"
                            binding.statusIndicator.setBackgroundColor(getColor(android.R.color.holo_red_dark))
                        }
                        LiveKitService.ConnectionState.RECONNECTING -> {
                            binding.statusText.text = "Reconectando..."
                            binding.statusIndicator.setBackgroundColor(getColor(android.R.color.holo_orange_dark))
                        }
                        LiveKitService.ConnectionState.FAILED -> {
                            binding.statusText.text = "Falha na conexão"
                            binding.statusIndicator.setBackgroundColor(getColor(android.R.color.holo_red_dark))
                        }
                    }
                }
            }
        }
        
        // Observar estado do streaming
        lifecycleScope.launch {
            liveKitService.isStreaming.collect { isStreaming ->
                runOnUiThread {
                    updateUIState()
                }
            }
        }
        
        // Observar contagem de espectadores
        lifecycleScope.launch {
            liveKitService.viewerCount.collect { count ->
                runOnUiThread {
                    binding.viewerCount.text = "Espectadores: $count"
                }
            }
        }
        
        // Observar erros
        lifecycleScope.launch {
            liveKitService.error.collect { error ->
                error?.let {
                    runOnUiThread {
                        showError(it)
                    }
                }
            }
        }
    }
    
    private fun checkAndRequestPermissions() {
        if (!permissionManager.hasAllStreamingPermissions()) {
            permissionManager.requestCameraAndAudioPermissionWithRationale(
                rationale = "Permissões de câmera e microfone são necessárias para transmitir ao vivo. Sem elas, não será possível iniciar a transmissão."
            ) { granted ->
                if (granted) {
                    Toast.makeText(this, "Permissões concedidas", Toast.LENGTH_SHORT).show()
                } else {
                    showPermissionDeniedDialog()
                }
            }
        }
    }
    
    private fun startStreaming() {
        if (!permissionManager.hasAllStreamingPermissions()) {
            checkAndRequestPermissions()
            return
        }
        
        // Obter dados da intent
        val streamName = intent.getStringExtra("STREAM_NAME") ?: "Live ao Vivo"
        val userToken = intent.getStringExtra("USER_TOKEN") ?: return
        val userId = intent.getStringExtra("USER_ID") ?: return
        
        lifecycleScope.launch {
            try {
                // Primeiro, criar stream no backend
                val createStreamResult = authService.createStream(
                    userToken = userToken,
                    streamData = com.livego.app.auth.CreateStreamRequest(
                        name = streamName,
                        tags = listOf("live", "mobile"),
                        message = "Transmitindo pelo Android"
                    )
                )
                
                if (createStreamResult.isFailure) {
                    throw Exception("Falha ao criar stream: ${createStreamResult.exceptionOrNull()?.message}")
                }
                
                val streamResponse = createStreamResult.getOrNull()
                if (!streamResponse?.success!!) {
                    throw Exception(streamResponse.error ?: "Erro desconhecido ao criar stream")
                }
                
                val roomName = streamResponse.stream?.roomId ?: userId
                
                // Conectar como broadcaster
                val connectResult = liveKitService.connectAsBroadcaster(
                    userToken = userToken,
                    roomName = roomName,
                    participantName = streamName
                )
                
                if (connectResult.isSuccess) {
                    // Iniciar captura de vídeo e áudio
                    val streamResult = liveKitService.startStreaming()
                    if (streamResult.isSuccess) {
                        Toast.makeText(this@StreamingActivity, "Transmissão iniciada!", Toast.LENGTH_SHORT).show()
                    } else {
                        throw Exception(streamResult.exceptionOrNull()?.message)
                    }
                } else {
                    throw Exception(connectResult.exceptionOrNull()?.message)
                }
                
            } catch (e: Exception) {
                showError("Erro ao iniciar transmissão: ${e.message}")
            }
        }
    }
    
    private fun stopStreaming() {
        liveKitService.stopStreaming()
        Toast.makeText(this, "Transmissão pausada", Toast.LENGTH_SHORT).show()
    }
    
    private fun toggleCamera() {
        val isEnabled = liveKitService.toggleCamera()
        binding.btnToggleCamera.text = if (isEnabled) "Câmera ON" else "Câmera OFF"
        Toast.makeText(this, if (isEnabled) "Câmera ligada" else "Câmera desligada", Toast.LENGTH_SHORT).show()
    }
    
    private fun toggleMicrophone() {
        val isEnabled = liveKitService.toggleMicrophone()
        binding.btnToggleMic.text = if (isEnabled) "Mic ON" else "Mic OFF"
        Toast.makeText(this, if (isEnabled) "Microfone ligado" else "Microfone desligado", Toast.LENGTH_SHORT).show()
    }
    
    private fun switchCamera() {
        lifecycleScope.launch {
            val result = liveKitService.switchCamera()
            if (result.isSuccess) {
                Toast.makeText(this@StreamingActivity, "Câmera trocada", Toast.LENGTH_SHORT).show()
            } else {
                showError("Erro ao trocar câmera")
            }
        }
    }
    
    private fun showInviteGuestDialog() {
        val builder = AlertDialog.Builder(this)
        val inflater = layoutInflater
        val dialogView = inflater.inflate(R.layout.dialog_invite_guest, null)
        
        val etGuestId = dialogView.findViewById<EditText>(R.id.etGuestId)
        val etGuestName = dialogView.findViewById<EditText>(R.id.etGuestName)
        
        builder.setView(dialogView)
            .setTitle("Convidar Usuário para a Live")
            .setPositiveButton("Convidar") { dialog, _ ->
                val guestId = etGuestId.text.toString().trim()
                val guestName = etGuestName.text.toString().trim()
                
                if (guestId.isEmpty()) {
                    Toast.makeText(this, "Digite o ID do usuário", Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }
                
                // Validar formato do ID (alfanumérico)
                if (!guestId.matches(Regex("^[a-zA-Z0-9_]{4,30}$"))) {
                    Toast.makeText(this, "ID inválido. Use apenas letras, números e underscore", Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }
                
                // Prevenir IDs falsos
                val forbiddenPatterns = listOf("temp_", "fake_", "test_", "demo_", "guest_", "anon_")
                if (forbiddenPatterns.any { guestId.lowercase().startsWith(it) }) {
                    Toast.makeText(this, "ID não permitido. Use um ID real do sistema", Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }
                
                // Enviar convite usando o serviço
                lifecycleScope.launch {
                    try {
                        val callService = CallInvitationService.getInstance(this)
                        val result = callService.inviteGuest(
                            userToken = getCurrentUserToken() ?: "",
                            guestId = guestId,
                            guestName = guestName.ifEmpty { "Convidado" },
                            streamId = getCurrentStreamId() ?: ""
                        )
                        
                        if (result.isSuccess) {
                            Toast.makeText(this@StreamingActivity, "Convite enviado com sucesso!", Toast.LENGTH_SHORT).show()
                        } else {
                            Toast.makeText(this@StreamingActivity, "Erro ao enviar convite: ${result.exceptionOrNull()?.message}", Toast.LENGTH_SHORT).show()
                        }
                    } catch (e: Exception) {
                        Toast.makeText(this@StreamingActivity, "Erro ao convidar usuário: ${e.message}", Toast.LENGTH_SHORT).show()
                    }
                }
            }
            .setNegativeButton("Cancelar") { dialog, _ ->
                dialog.dismiss()
            }
            .show()
    }
    
    private fun getCurrentUserToken(): String? {
        val prefs = getSharedPreferences("user_prefs", MODE_PRIVATE)
        return prefs.getString("user_token", null)
    }
    
    private fun getCurrentStreamId(): String? {
        return viewModel.streamId.value
    }
    
    private fun showEndStreamDialog() {
        AlertDialog.Builder(this)
            .setTitle("Finalizar Transmissão")
            .setMessage("Tem certeza que deseja finalizar a transmissão?")
            .setPositiveButton("Finalizar") { _, _ ->
                endStream()
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }
    
    private fun endStream() {
        liveKitService.disconnect()
        finish()
    }
    
    private fun updateUIState() {
        val isStreaming = liveKitService.isStreaming.value
        val isConnected = liveKitService.connectionState.value == LiveKitService.ConnectionState.CONNECTED
        
        binding.btnStartStream.visibility = if (!isStreaming && isConnected) View.VISIBLE else View.GONE
        binding.btnStopStream.visibility = if (isStreaming) View.VISIBLE else View.GONE
        binding.btnEndStream.visibility = View.VISIBLE
        
        binding.btnToggleCamera.isEnabled = isConnected
        binding.btnToggleMic.isEnabled = isConnected
        binding.btnSwitchCamera.isEnabled = isConnected
        
        // Atualizar textos dos botões
        binding.btnToggleCamera.text = if (liveKitService.localParticipant?.isCameraEnabled() == true) "Câmera ON" else "Câmera OFF"
        binding.btnToggleMic.text = if (liveKitService.localParticipant?.isMicrophoneEnabled() == true) "Mic ON" else "Mic OFF"
    }
    
    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }
    
    private fun showPermissionDeniedDialog() {
        AlertDialog.Builder(this)
            .setTitle("Permissões Necessárias")
            .setMessage("Para transmitir ao vivo, você precisa conceder permissões de câmera e microfone. Vá para Configurações > Aplicativos > LiveGo e conceda as permissões.")
            .setPositiveButton("Configurações") { _, _ ->
                // Abrir configurações do app
                val intent = android.content.Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = android.net.Uri.fromParts("package", packageName, null)
                }
                startActivity(intent)
            }
            .setNegativeButton("Sair") { _, _ ->
                finish()
            }
            .setCancelable(false)
            .show()
    }
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        permissionManager.onRequestPermissionsResult(requestCode, permissions, grantResults)
    }
    
    override fun onDestroy() {
        super.onDestroy()
        liveKitService.cleanup()
    }
    
    override fun onBackPressed() {
        // Confirmar antes de sair durante transmissão
        if (liveKitService.isStreaming.value) {
            showEndStreamDialog()
        } else {
            super.onBackPressed()
        }
    }
}
