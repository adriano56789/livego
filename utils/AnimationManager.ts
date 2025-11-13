type AnimationItem = {
  id: number;
  priority: number;
  startTime: number;
  duration: number;
};

class AnimationManager {
  private static instance: AnimationManager;
  private activeAnimations: AnimationItem[] = [];
  private maxConcurrentAnimations = 3;
  private animationQueue: AnimationItem[] = [];
  private nextId = 0;

  private constructor() {}

  public static getInstance(): AnimationManager {
    if (!AnimationManager.instance) {
      AnimationManager.instance = new AnimationManager();
    }
    return AnimationManager.instance;
  }

  public requestAnimation(priority: number, duration: number): { id: number; canStart: boolean } {
    const id = this.nextId++;
    const animationItem: AnimationItem = {
      id,
      priority,
      startTime: 0,
      duration,
    };

    // Se já temos muitas animações ativas, coloca na fila
    if (this.activeAnimations.length >= this.maxConcurrentAnimations) {
      this.animationQueue.push(animationItem);
      return { id, canStart: false };
    }

    // Caso contrário, inicia a animação imediatamente
    this.startAnimation(animationItem);
    return { id, canStart: true };
  }

  public endAnimation(id: number): void {
    // Remove a animação ativa
    this.activeAnimations = this.activeAnimations.filter(anim => anim.id !== id);
    
    // Ordena a fila por prioridade (maior primeiro)
    this.animationQueue.sort((a, b) => b.priority - a.priority);
    
    // Inicia a próxima animação da fila, se houver
    if (this.animationQueue.length > 0 && this.activeAnimations.length < this.maxConcurrentAnimations) {
      const nextAnimation = this.animationQueue.shift();
      if (nextAnimation) {
        this.startAnimation(nextAnimation);
        // Notifica que a animação pode começar
        this.notifyAnimationStart(nextAnimation.id);
      }
    }
  }

  private startAnimation(animation: AnimationItem): void {
    animation.startTime = Date.now();
    this.activeAnimations.push(animation);
    
    // Configura um timeout para limpar a animação após sua duração
    setTimeout(() => {
      this.endAnimation(animation.id);
    }, animation.duration);
  }

  // Método para notificar que uma animação pode começar
  // Isso seria usado para notificar os componentes que estão esperando
  private notifyAnimationStart(id: number): void {
    // Aqui você implementaria a lógica para notificar o componente
    // que a animação com o ID especificado pode começar
    // Por exemplo, usando um EventEmitter ou um contexto React
  }

  public getActiveAnimationCount(): number {
    return this.activeAnimations.length;
  }

  public getQueueLength(): number {
    return this.animationQueue.length;
  }
}

export const animationManager = AnimationManager.getInstance();
