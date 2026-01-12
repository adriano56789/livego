import * as React from 'react';

// Define translation type
type Translations = {
  [key: string]: string | Translations;
};

interface TranslationContextType {
  t: (key: string, params?: Record<string, any>) => string;
  language: string;
  setLanguage: (lang: string) => void;
}

const defaultTranslations: Record<string, Translations> = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      success: 'Success',
      send: 'Enviar',
      invite: 'Convidar',
      invited: 'Convidado',
      post: 'Postar',
      sending: 'Enviando...',
      redo: 'Refazer',
      share: 'Partilhar'
    },
    cohost: {
        title: 'Convidar Co-Host',
        searchPlaceholder: 'Pesquisar...',
        friendsOnly: 'Permitir apenas convites de amigos',
        friendsListTitle: 'Amigos ({count})',
        noFriends: 'Nenhum amigo encontrado.'
    },
    gifts: {
      title: 'Presentes',
      recharge: 'Recarregar',
      done: 'Concluído',
      reorder: 'Reordenar',
      dragToReorder: 'Arraste para reordenar',
      canSend: 'Pode enviar {count}',
      selectGift: 'Selecione um presente'
    },
    main: { 
      popular: "Popular", 
      followed: "Seguido", 
      nearby: "Perto", 
      pk: "PK", 
      new: "Novo", 
      music: "Música", 
      dance: "Dança", 
      party: "Festa", 
      private: "Privada" 
    },
    streamRoom: {
        sayHi: 'Bate papo',
        followed: 'começou a seguir',
        sentGiftMessage: 'enviou {giftName} para {receiverName}',
        sentMultipleGiftsMessage: 'enviou {quantity}x {giftName} para {receiverName}'
    },
    privacy: {
        title: 'Privacidade',
        showLocation: 'Mostrar Localização',
        showLocationSub: 'Permitir ver sua cidade no perfil',
        showActivityStatus: 'Status de Atividade',
        showActivityStatusSub: 'Mostrar quando você esteve ativo pela última vez',
        hideLikes: 'Esconder Minhas Curtidas',
        hideLikesSub: 'Outros não verão o que você curtiu',
        whoCanMessageMe: 'Quem pode me enviar mensagens',
        all: 'Todos',
        followersOnly: 'Apenas Seguidores',
        none: 'Ninguém'
    },
    comments: {
        title: '{count} Comentários',
        none: 'Nenhum comentário ainda.',
        addPlaceholder: 'Adicionar comentário...'
    },
    videoScreen: {
        title: 'Vídeos',
        addMusic: 'Adicionar música',
        photo: 'Foto',
        video: 'Vídeo',
        loadError: 'Falha ao carregar vídeos.',
        posting: 'Enviando post...',
        postSuccess: 'Postado com sucesso!',
        postError: 'Falha ao postar.',
        newPostToast: '{userName} postou um novo vídeo!',
        cameraError: 'Câmera não acessível.'
    },
    live: 'AO VIVO',
    editProfile: 'Editar',
    following: 'Seguindo',
    followers: 'Fãs',
    visitors: 'Visitantes',
    goLive: 'Iniciar Live',
    wallet: 'Carteira',
    noBio: 'Sem biografia.'
  }
};

const TranslationContext = React.createContext<TranslationContextType | undefined>(undefined);

export const useTranslation = () => {
  const context = React.useContext(TranslationContext);
  if (!context) {
    // Return a default implementation if used outside of provider
    return {
      t: (key: string) => key,
      language: 'en',
      setLanguage: () => {},
    };
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
  initialLanguage?: string;
  translations?: Record<string, Translations>;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  initialLanguage = 'en',
  translations = defaultTranslations
}) => {
  const [language, setLanguage] = React.useState(initialLanguage);

  const t = React.useCallback(
    (key: string, params?: Record<string, any>): string => {
      const keys = key.split('.');
      let result: any = translations[language] || translations.en || {};
      
      for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
          result = result[k];
        } else {
          return key; 
        }
      }
      
      let text = typeof result === 'string' ? result : key;
      
      if (params) {
        Object.keys(params).forEach(paramKey => {
          text = text.replace(`{${paramKey}}`, params[paramKey]);
        });
      }
      
      return text;
    },
    [language, translations]
  );

  const value = React.useMemo(
    () => ({
      t,
      language,
      setLanguage: (lang: string) => setLanguage(lang),
    }),
    [t, language]
  );

  return React.createElement(
    TranslationContext.Provider,
    { value },
    children
  );
};

export default {
  useTranslation,
  LanguageProvider,
};