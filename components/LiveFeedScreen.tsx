


import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { User, Stream, Category, PkBattle, AppView, LiveCategory } from '../types';
import { 
    getPopularStreams,
    getFollowingStreams,
    getPkBattles,
    getNewStreams,
    getStreamsForCategory,
    getPrivateStreams,
    getLiveCategories
} from '../services/liveStreamService';
import StreamerCard from './StreamerCard';
import PkBattleCard from './PkBattleCard';
import HeaderTrophyIcon from './icons/HeaderTrophyIcon';
import SearchIcon from './icons/SearchIcon';
import UserProfileModal from './UserProfileModal';
import RefreshIcon from './icons/RefreshIcon';

interface LiveFeedScreenProps {
  user: User;
  onViewStream: (stream: Stream | PkBattle) => void;
  onGoLiveClick: () => void;
  activeCategory: Category;
  onSelectCategory: (category: Category) => void;
  onUpdateUser: (user: User) => void;
  onNavigateToChat: (userId: number) => void;
  onViewProtectors: (userId: number) => void;
  onNavigate: (view: AppView) => void;
}

const NavItem: React.FC<{ children: React.ReactNode; isActive?: boolean, onClick: () => void }> = ({ children, isActive, onClick }) => (
    <button
        onClick={onClick}
        className="relative px-3 py-2 shrink-0"
    >
        <span className={`font-semibold transition-colors ${isActive ? 'text-white' : 'text-gray-400'}`}>
            {children}
        </span>
        {isActive && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-white rounded-full mt-1"></div>
        )}
    </button>
);

export const LiveFeedScreen: React.FC<LiveFeedScreenProps> = ({
    user,
    onViewStream,
    activeCategory,
    onSelectCategory,
    onUpdateUser,
    onNavigateToChat,
    onViewProtectors,
    onNavigate,
}) => {
    const [streams, setStreams] = useState<(Stream | PkBattle)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewingUser, setViewingUser] = useState<User | null>(null);
    const [categories, setCategories] = useState<LiveCategory[]>([]);

    // Pull-to-refresh state
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const pullStartY = useRef(0);
    const mainRef = useRef<HTMLElement>(null);
    const PULL_THRESHOLD = 70;

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const fetchedCategories = await getLiveCategories();
                setCategories(fetchedCategories);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        };
        fetchCategories();
    }, []);

    const fetchStreams = useCallback(async (isRefresh: boolean = false) => {
        if (!isRefresh) {
            setIsLoading(true);
        }
        try {
            let fetchedStreams: (Stream | PkBattle)[] = [];
            switch (activeCategory) {
                case 'Popular':
                    fetchedStreams = await getPopularStreams();
                    break;
                case 'Seguindo':
                    fetchedStreams = await getFollowingStreams(user.id);
                    break;
                case 'Novo':
                    fetchedStreams = await getNewStreams();
                    break;
                case 'PK':
                    fetchedStreams = await getPkBattles();
                    break;
                case 'Privada':
                    fetchedStreams = await getPrivateStreams(user.id);
                    break;
                case 'Música':
                case 'Dança':
                    fetchedStreams = await getStreamsForCategory(activeCategory);
                    break;
                default:
                    fetchedStreams = await getPopularStreams();
            }
            setStreams(fetchedStreams);
        } catch (error) {
            console.error('Failed to fetch streams:', error);
        } finally {
            if (isRefresh) {
                setTimeout(() => {
                    setIsRefreshing(false);
                    setPullDistance(0);
                }, 500);
            } else {
                setIsLoading(false);
            }
        }
    }, [activeCategory, user.id]);

    useEffect(() => {
        fetchStreams(false);
    }, [fetchStreams]);
    
    // Pull-to-refresh handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        if (mainRef.current && mainRef.current.scrollTop === 0 && !isRefreshing) {
            pullStartY.current = e.touches[0].clientY;
        } else {
            pullStartY.current = 0;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (pullStartY.current > 0) {
            const currentY = e.touches[0].clientY;
            const distance = currentY - pullStartY.current;
            if (distance > 0) {
                // Prevent browser's default pull-to-refresh and overscroll glow
                e.preventDefault(); 
                setPullDistance(distance);
            }
        }
    };

    const handleTouchEnd = () => {
        if (pullDistance > PULL_THRESHOLD) {
            setIsRefreshing(true);
            fetchStreams(true);
        } else {
            setPullDistance(0);
        }
        pullStartY.current = 0;
    };

    return (
        <div className="h-full w-full flex flex-col bg-black text-white font-sans">
            <header className="px-4 pt-4 pb-2 flex items-center justify-between shrink-0 gap-4">
                <div className="flex-grow overflow-x-auto whitespace-nowrap scrollbar-hide">
                    <div className="flex items-center gap-x-1 sm:gap-x-4">
                        {categories.map(cat => (
                            <NavItem key={cat.id} isActive={cat.name === activeCategory} onClick={() => onSelectCategory(cat.name)}>
                                {cat.name}
                            </NavItem>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                    <button onClick={() => onNavigate('ranking')}>
                        <HeaderTrophyIcon className="w-8 h-8"/>
                    </button>
                    <button onClick={() => onNavigate('search')}>
                        <SearchIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>
            <main
                ref={mainRef}
                className="flex-grow p-2 overflow-y-auto relative scrollbar-hide"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    className="absolute top-[-40px] left-1/2 -translate-x-1/2 transition-transform duration-200"
                    style={{ transform: `translate(-50%, ${isRefreshing ? PULL_THRESHOLD : Math.min(pullDistance, PULL_THRESHOLD)}px)` }}
                >
                    <div className="p-2 bg-gray-800 rounded-full shadow-lg">
                        <RefreshIcon className={`w-6 h-6 text-white transition-transform ${isRefreshing ? 'animate-spin' : ''}`} style={{transform: `rotate(${isRefreshing ? 0 : pullDistance * 2}deg)`}}/>
                    </div>
                </div>
                {isLoading && !isRefreshing ? (
                     <div className="flex justify-center items-center h-full">
                        <div className="w-8 h-8 border-4 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : streams.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {streams.map(stream =>
                            'streamer1' in stream ? (
                                <PkBattleCard key={`pk-${stream.id}`} battle={stream} onViewStream={onViewStream} />
                            ) : (
                                <StreamerCard key={`stream-${stream.id}`} stream={stream} onViewStream={onViewStream} />
                            )
                        )}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 pt-20">
                        <p>Nenhuma transmissão ao vivo encontrada.</p>
                        <p className="text-sm mt-2">Arraste para baixo para atualizar.</p>
                    </div>
                )}
            </main>

            {viewingUser && (
                <UserProfileModal
                    userId={viewingUser.id}
                    currentUser={user}
                    onUpdateUser={onUpdateUser}
                    onClose={() => setViewingUser(null)}
                    onNavigateToChat={onNavigateToChat}
                    onViewProtectors={onViewProtectors}
                    onViewStream={onViewStream}
                />
            )}
        </div>
    );
};

export default LiveFeedScreen;