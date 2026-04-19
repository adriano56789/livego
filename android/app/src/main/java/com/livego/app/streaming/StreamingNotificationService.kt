package com.livego.app.streaming

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.livego.app.MainActivity
import com.livego.app.R

/**
 * Serviço de notificação para streaming em foreground
 * Mantém o app ativo durante transmissões longas
 */
class StreamingNotificationService : Service() {
    
    companion object {
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "streaming_channel"
        private const val CHANNEL_NAME = "Streaming LiveGo"
        
        fun startStreamingNotification(context: Context, streamTitle: String) {
            val intent = Intent(context, StreamingNotificationService::class.java).apply {
                putExtra("STREAM_TITLE", streamTitle)
            }
            context.startService(intent)
        }
        
        fun stopStreamingNotification(context: Context) {
            val intent = Intent(context, StreamingNotificationService::class.java)
            context.stopService(intent)
        }
    }
    
    private lateinit var notificationManager: NotificationManager
    
    override fun onCreate() {
        super.onCreate()
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createNotificationChannel()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val streamTitle = intent?.getStringExtra("STREAM_TITLE") ?: "Live ao Vivo"
        
        val notification = createStreamingNotification(streamTitle)
        startForeground(NOTIFICATION_ID, notification)
        
        return START_STICKY
    }
    
    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Notificações durante transmissões ao vivo"
                setShowBadge(false)
                enableVibration(false)
                setSound(null, null)
            }
            
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    private fun createStreamingNotification(streamTitle: String): Notification {
        // Intent para abrir o app quando clicar na notificação
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Transmitindo ao vivo")
            .setContentText(streamTitle)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setSilent(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .addAction(
                R.drawable.ic_stop,
                "Parar",
                createStopIntent()
            )
            .build()
    }
    
    private fun createStopIntent(): PendingIntent {
        val stopIntent = Intent("com.livego.app.STOP_STREAMING")
        return PendingIntent.getBroadcast(
            this,
            0,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
    
    override fun onDestroy() {
        super.onDestroy()
        notificationManager.cancel(NOTIFICATION_ID)
    }
}
