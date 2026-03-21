// Serviço para aplicar efeitos de beleza em tempo real no vídeo

export interface BeautyFilter {
  name: string;
  cssFilter: string;
}

export interface BeautyEffect {
  name: string;
  cssProperty: string;
  getValue: (intensity: number) => string;
}

// Filtros predefinidos (Recomendar)
export const BEAUTY_FILTERS: Record<string, BeautyFilter> = {
  'Musa': {
    name: 'Musa',
    cssFilter: 'contrast(1.1) brightness(1.05) saturate(1.2) hue-rotate(5deg)'
  },
  'Bonito': {
    name: 'Bonito', 
    cssFilter: 'contrast(1.15) brightness(1.08) saturate(1.3) blur(0.5px)'
  },
  'Vitalidade': {
    name: 'Vitalidade',
    cssFilter: 'contrast(1.12) brightness(1.1) saturate(1.25) hue-rotate(10deg)'
  }
};

// Efeitos ajustáveis (Beleza)
export const BEAUTY_EFFECTS: Record<string, BeautyEffect> = {
  'Branquear': {
    name: 'Branquear',
    cssProperty: 'brightness',
    getValue: (intensity: number) => `${1 + (intensity / 100)}` // 1.0 a 2.0
  },
  'Alisar a pele': {
    name: 'Alisar a pele',
    cssProperty: 'blur',
    getValue: (intensity: number) => `${Math.min(intensity / 50, 2)}px` // 0 a 2px
  },
  'Ruborizar': {
    name: 'Ruborizar',
    cssProperty: 'saturate',
    getValue: (intensity: number) => `${1 + (intensity / 100)}` // 1.0 a 2.0
  },
  'Contraste': {
    name: 'Contraste',
    cssProperty: 'contrast',
    getValue: (intensity: number) => `${1 + (intensity / 200)}` // 1.0 a 1.5
  }
};

class BeautyService {
  private videoElement: HTMLVideoElement | null = null;
  private currentFilter: string = '';
  private currentEffects: Record<string, number> = {};

  // Inicializar o serviço com o elemento de vídeo
  init(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    console.log('✅ [BEAUTY_SERVICE] Serviço inicializado');
  }

  // Aplicar filtro predefinido
  applyFilter(filterName: string) {
    if (!this.videoElement) {
      console.error('❌ [BEAUTY_SERVICE] Elemento de vídeo não encontrado');
      return false;
    }

    const filter = BEAUTY_FILTERS[filterName];
    if (!filter) {
      console.error(`❌ [BEAUTY_SERVICE] Filtro "${filterName}" não encontrado`);
      return false;
    }

    // Limpar filtros anteriores e aplicar novo
    this.currentFilter = filter.cssFilter;
    this.updateVideoFilter();
    
    console.log(`✅ [BEAUTY_SERVICE] Filtro "${filterName}" aplicado: ${filter.cssFilter}`);
    return true;
  }

  // Aplicar efeito com intensidade
  applyEffect(effectName: string, intensity: number) {
    if (!this.videoElement) {
      console.error('❌ [BEAUTY_SERVICE] Elemento de vídeo não encontrado');
      return false;
    }

    const effect = BEAUTY_EFFECTS[effectName];
    if (!effect) {
      console.error(`❌ [BEAUTY_SERVICE] Efeito "${effectName}" não encontrado`);
      return false;
    }

    // Atualizar intensidade do efeito
    this.currentEffects[effectName] = intensity;
    this.updateVideoFilter();
    
    console.log(`✅ [BEAUTY_SERVICE] Efeito "${effectName}" aplicado com intensidade ${intensity}: ${effect.getValue(intensity)}`);
    return true;
  }

  // Atualizar todos os filtros CSS no vídeo
  private updateVideoFilter() {
    if (!this.videoElement) return;

    // Construir string de filtros completa
    let filterString = this.currentFilter;

    // Adicionar efeitos ativos
    Object.entries(this.currentEffects).forEach(([effectName, intensity]) => {
      const effect = BEAUTY_EFFECTS[effectName];
      if (effect && intensity > 0) {
        const cssValue = effect.getValue(intensity);
        
        if (filterString) {
          filterString += ` ${effect.cssProperty}(${cssValue})`;
        } else {
          filterString = `${effect.cssProperty}(${cssValue})`;
        }
      }
    });

    // Aplicar ao vídeo
    this.videoElement.style.filter = filterString || 'none';
    
    console.log(`🎨 [BEAUTY_SERVICE] CSS Filter aplicado: ${filterString || 'none'}`);
  }

  // Remover todos os efeitos
  resetEffects() {
    if (!this.videoElement) return;

    this.currentFilter = '';
    this.currentEffects = {};
    this.videoElement.style.filter = 'none';
    
    console.log('🔄 [BEAUTY_SERVICE] Todos os efeitos removidos');
  }

  // Obter efeitos atuais
  getCurrentEffects() {
    return {
      filter: this.currentFilter,
      effects: { ...this.currentEffects }
    };
  }

  // Limpar serviço
  destroy() {
    this.resetEffects();
    this.videoElement = null;
    console.log('🗑️ [BEAUTY_SERVICE] Serviço destruído');
  }
}

// Instância global do serviço
export const beautyService = new BeautyService();

// Hook para usar o serviço no React
export const useBeautyService = () => {
  return beautyService;
};
