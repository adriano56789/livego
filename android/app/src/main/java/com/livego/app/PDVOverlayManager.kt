package com.livego.app

import android.content.Context
import android.view.View
import android.widget.Button
import android.widget.TextView
import androidx.cardview.widget.CardView
import androidx.constraintlayout.widget.ConstraintLayout

/**
 * Gerenciador do PDV (Ponto de Venda) Overlay no player de vídeo
 * Estilo TikTok/Kwai - Não intrusivo e fluido
 */
class PDVOverlayManager(private val context: Context) {
    
    private var pdvOverlay: ConstraintLayout? = null
    private var donationButton: CardView? = null
    private var donationCounter: CardView? = null
    private var donationCount: TextView? = null
    private var liveIndicator: CardView? = null
    
    private var currentDonationCount: Int = 0
    private var isLive: Boolean = false
    private var onDonationClick: (() -> Unit)? = null
    
    /**
     * Inicializa o overlay PDV
     */
    fun initialize(
        overlay: ConstraintLayout,
        button: CardView,
        counter: CardView,
        countText: TextView,
        indicator: CardView
    ) {
        pdvOverlay = overlay
        donationButton = button
        donationCounter = counter
        donationCount = countText
        liveIndicator = indicator
        
        setupClickListeners()
        updateUI()
    }
    
    /**
     * Configura listeners de clique
     */
    private fun setupClickListeners() {
        donationButton?.setOnClickListener {
            android.util.Log.d("PDVOverlay", "Botão de doação clicado")
            onDonationClick?.invoke()
            showDonationAnimation()
        }
    }
    
    /**
     * Mostra o overlay PDV
     */
    fun showOverlay() {
        pdvOverlay?.visibility = View.VISIBLE
        android.util.Log.d("PDVOverlay", "Overlay PDV visível")
    }
    
    /**
     * Esconde o overlay PDV
     */
    fun hideOverlay() {
        pdvOverlay?.visibility = View.GONE
        android.util.Log.d("PDVOverlay", "Overlay PDV escondido")
    }
    
    /**
     * Define se a live está ativa
     */
    fun setLiveStatus(live: Boolean) {
        isLive = live
        updateLiveIndicator()
    }
    
    /**
     * Atualiza o contador de doações
     */
    fun updateDonationCount(count: Int) {
        currentDonationCount = count
        donationCount?.text = count.toString()
        
        // Animação quando recebe doação
        if (count > 0) {
            showDonationAnimation()
        }
        
        android.util.Log.d("PDVOverlay", "Contador de doações atualizado: $count")
    }
    
    /**
     * Incrementa o contador de doações
     */
    fun addDonation() {
        updateDonationCount(currentDonationCount + 1)
    }
    
    /**
     * Define callback para clique em doação
     */
    fun setOnDonationClickListener(listener: () -> Unit) {
        onDonationClick = listener
    }
    
    /**
     * Atualiza a UI
     */
    private fun updateUI() {
        donationCount?.text = currentDonationCount.toString()
        updateLiveIndicator()
    }
    
    /**
     * Atualiza indicador de live
     */
    private fun updateLiveIndicator() {
        liveIndicator?.visibility = if (isLive) View.VISIBLE else View.GONE
    }
    
    /**
     * Mostra animação de doação recebida
     */
    private fun showDonationAnimation() {
        donationCounter?.let { counter ->
            // Efeito de pulso
            counter.animate()
                .scaleX(1.2f)
                .scaleY(1.2f)
                .setDuration(200)
                .withEndAction {
                    counter.animate()
                        .scaleX(1.0f)
                        .scaleY(1.0f)
                        .setDuration(200)
                        .start()
                }
                .start()
        }
        
        android.util.Log.d("PDVOverlay", "Animação de doação exibida")
    }
    
    /**
     * Mostra animação de sucesso na doação
     */
    fun showDonationSuccessAnimation() {
        donationButton?.let { button ->
            button.animate()
                .alpha(0.5f)
                .setDuration(300)
                .withEndAction {
                    button.animate()
                        .alpha(1.0f)
                        .setDuration(300)
                        .start()
                }
                .start()
        }
        
        android.util.Log.d("PDVOverlay", "Animação de sucesso exibida")
    }
    
    /**
     * Libera recursos
     */
    fun release() {
        donationButton?.setOnClickListener(null)
        pdvOverlay = null
        donationButton = null
        donationCounter = null
        donationCount = null
        liveIndicator = null
        onDonationClick = null
        
        android.util.Log.d("PDVOverlay", "Recursos liberados")
    }
    
    companion object {
        /**
         * Cria instância do PDVOverlayManager
         */
        fun create(context: Context): PDVOverlayManager {
            return PDVOverlayManager(context)
        }
    }
}
