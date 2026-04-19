package com.livego.app.permissions

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import pub.devrel.easypermissions.EasyPermissions
import pub.devrel.easypermissions.PermissionRequest

/**
 * Gerenciador de permissões para streaming
 * Lida com câmera, microfone e outras permissões necessárias
 */
class PermissionManager(private val activity: Activity) : EasyPermissions.PermissionCallbacks {
    
    companion object {
        private const val TAG = "PermissionManager"
        
        // Códigos de requisição
        const val CAMERA_AUDIO_PERMISSION_CODE = 1001
        const val STORAGE_PERMISSION_CODE = 1002
        const val NOTIFICATION_PERMISSION_CODE = 1003
        
        // Permissões essenciais para streaming
        val CAMERA_AUDIO_PERMISSIONS = arrayOf(
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO
        )
        
        // Permissões de armazenamento (Android < 13)
        val STORAGE_PERMISSIONS = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            arrayOf(
                Manifest.permission.READ_MEDIA_IMAGES,
                Manifest.permission.READ_MEDIA_VIDEO
            )
        } else {
            arrayOf(
                Manifest.permission.READ_EXTERNAL_STORAGE,
                Manifest.permission.WRITE_EXTERNAL_STORAGE
            )
        }
        
        // Permissão de notificação (Android 13+)
        val NOTIFICATION_PERMISSION = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            arrayOf(Manifest.permission.POST_NOTIFICATIONS)
        } else {
            emptyArray()
        }
    }
    
    private var permissionCallback: ((Boolean) -> Unit)? = null
    
    /**
     * Verifica se todas as permissões essenciais para streaming foram concedidas
     */
    fun hasAllStreamingPermissions(): Boolean {
        return CAMERA_AUDIO_PERMISSIONS.all { permission ->
            ContextCompat.checkSelfPermission(activity, permission) == PackageManager.PERMISSION_GRANTED
        }
    }
    
    /**
     * Verifica se tem permissão de câmera
     */
    fun hasCameraPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            activity,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    /**
     * Verifica se tem permissão de microfone
     */
    fun hasMicrophonePermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            activity,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    /**
     * Verifica se tem permissões de armazenamento
     */
    fun hasStoragePermissions(): Boolean {
        return STORAGE_PERMISSIONS.all { permission ->
            ContextCompat.checkSelfPermission(activity, permission) == PackageManager.PERMISSION_GRANTED
        }
    }
    
    /**
     * Verifica se tem permissão de notificação
     */
    fun hasNotificationPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                activity,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true // Android < 13 não precisa de permissão explícita
        }
    }
    
    /**
     * Solicita permissões de câmera e microfone (essenciais para streaming)
     */
    fun requestCameraAndAudioPermission(callback: (Boolean) -> Unit) {
        this.permissionCallback = callback
        
        if (hasAllStreamingPermissions()) {
            callback(true)
            return
        }
        
        val permissionsToRequest = CAMERA_AUDIO_PERMISSIONS.filter { permission ->
            ContextCompat.checkSelfPermission(activity, permission) != PackageManager.PERMISSION_GRANTED
        }.toTypedArray()
        
        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                activity,
                permissionsToRequest,
                CAMERA_AUDIO_PERMISSION_CODE
            )
        } else {
            callback(true)
        }
    }
    
    /**
     * Solicita permissões usando EasyPermissions com diálogo explicativo
     */
    fun requestCameraAndAudioPermissionWithRationale(
        callback: (Boolean) -> Unit,
        rationale: String = "Permissões de câmera e microfone são necessárias para transmitir ao vivo."
    ) {
        this.permissionCallback = callback
        
        if (hasAllStreamingPermissions()) {
            callback(true)
            return
        }
        
        EasyPermissions.requestPermissions(
            PermissionRequest.Builder(
                activity,
                CAMERA_AUDIO_PERMISSION_CODE,
                *CAMERA_AUDIO_PERMISSIONS
            )
                .setRationale(rationale)
                .setPositiveButtonText("Permitir")
                .setNegativeButtonText("Cancelar")
                .build()
        )
    }
    
    /**
     * Solicita permissões de armazenamento
     */
    fun requestStoragePermissions(callback: (Boolean) -> Unit) {
        this.permissionCallback = callback
        
        if (hasStoragePermissions()) {
            callback(true)
            return
        }
        
        EasyPermissions.requestPermissions(
            PermissionRequest.Builder(
                activity,
                STORAGE_PERMISSION_CODE,
                *STORAGE_PERMISSIONS
            )
                .setRationale("Permissão de armazenamento necessária para salvar e carregar mídias.")
                .setPositiveButtonText("Permitir")
                .setNegativeButtonText("Cancelar")
                .build()
        )
    }
    
    /**
     * Solicita permissão de notificação (Android 13+)
     */
    fun requestNotificationPermission(callback: (Boolean) -> Unit) {
        this.permissionCallback = callback
        
        if (hasNotificationPermission()) {
            callback(true)
            return
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            EasyPermissions.requestPermissions(
                PermissionRequest.Builder(
                    activity,
                    NOTIFICATION_PERMISSION_CODE,
                    *NOTIFICATION_PERMISSION
                )
                    .setRationale("Permissão de notificação necessária para receber alertas durante a live.")
                    .setPositiveButtonText("Permitir")
                    .setNegativeButtonText("Cancelar")
                    .build()
            )
        } else {
            callback(true)
        }
    }
    
    /**
     * Solicita todas as permissões necessárias para o app
     */
    fun requestAllPermissions(callback: (Boolean) -> Unit) {
        val allPermissions = mutableListOf<String>()
        
        if (!hasAllStreamingPermissions()) {
            allPermissions.addAll(CAMERA_AUDIO_PERMISSIONS.filter { permission ->
                ContextCompat.checkSelfPermission(activity, permission) != PackageManager.PERMISSION_GRANTED
            })
        }
        
        if (!hasStoragePermissions()) {
            allPermissions.addAll(STORAGE_PERMISSIONS.filter { permission ->
                ContextCompat.checkSelfPermission(activity, permission) != PackageManager.PERMISSION_GRANTED
            })
        }
        
        if (!hasNotificationPermission() && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            allPermissions.addAll(NOTIFICATION_PERMISSION)
        }
        
        this.permissionCallback = callback
        
        if (allPermissions.isEmpty()) {
            callback(true)
            return
        }
        
        EasyPermissions.requestPermissions(
            PermissionRequest.Builder(
                activity,
                CAMERA_AUDIO_PERMISSION_CODE,
                *allPermissions.toTypedArray()
            )
                .setRationale("O LiveGo precisa de várias permissões para funcionar corretamente: câmera, microfone, armazenamento e notificações.")
                .setPositiveButtonText("Permitir tudo")
                .setNegativeButtonText("Cancelar")
                .build()
        )
    }
    
    /**
     * Deve ser chamado no Activity.onActivityResult
     */
    fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        EasyPermissions.onRequestPermissionsResult(requestCode, permissions, grantResults, this)
    }
    
    // EasyPermissions callbacks
    override fun onPermissionsGranted(requestCode: Int, perms: MutableList<String>) {
        permissionCallback?.invoke(true)
        permissionCallback = null
    }
    
    override fun onPermissionsDenied(requestCode: Int, perms: MutableList<String>) {
        permissionCallback?.invoke(false)
        permissionCallback = null
        
        // Verifica se deve mostrar explicação de novo
        if (EasyPermissions.somePermissionPermanentlyDenied(activity, perms)) {
            // Usuário negou permanentemente - direcionar para configurações
            showSettingsDialog()
        }
    }
    
    /**
     * Mostra diálogo para direcionar usuário para configurações
     */
    private fun showSettingsDialog() {
        // Implementar diálogo que direciona para configurações do app
        // Por enquanto, apenas log
        android.util.Log.w(TAG, "Usuário negou permissões permanentemente. Redirecionar para configurações.")
    }
    
    /**
     * Obtém status detalhado das permissões
     */
    fun getPermissionStatus(): Map<String, Boolean> {
        return mapOf(
            "camera" to hasCameraPermission(),
            "microphone" to hasMicrophonePermission(),
            "storage" to hasStoragePermissions(),
            "notification" to hasNotificationPermission()
        )
    }
    
    /**
     * Verifica se deve mostrar explicação para permissão específica
     */
    fun shouldShowRationale(permission: String): Boolean {
        return ActivityCompat.shouldShowRequestPermissionRationale(activity, permission)
    }
}
