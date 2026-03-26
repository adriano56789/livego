package com.livego.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class LiveNotificationService : Service() {
    
    companion object {
        const val CHANNEL_ID = "livego_live_channel"
        const val CHANNEL_NAME = "LiveGo - Lives"
        const val NOTIFICATION_ID = 1001
        
        fun startNotificationService(context: Context, streamerName: String, streamTitle: String) {
            val intent = Intent(context, LiveNotificationService::class.java).apply {
                putExtra("streamer_name", streamerName)
                putExtra("stream_title", streamTitle)
            }
            context.startService(intent)
        }
        
        fun stopNotificationService(context: Context) {
            val intent = Intent(context, LiveNotificationService::class.java)
            context.stopService(intent)
        }
    }
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val streamerName = intent?.getStringExtra("streamer_name") ?: "Streamer"
        val streamTitle = intent?.getStringExtra("stream_title") ?: "Ao Vivo"
        
        val notification = createNotification(streamerName, streamTitle)
        startForeground(NOTIFICATION_ID, notification)
        
        return START_NOT_STICKY
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notificações de lives ao vivo"
                enableLights(true)
                enableVibration(true)
            }
            
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    private fun createNotification(streamerName: String, streamTitle: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("🔴 $streamerName está ao vivo!")
            .setContentText(streamTitle)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(false)
            .setOngoing(true)
            .build()
    }
    
    override fun onDestroy() {
        super.onDestroy()
    }
}
