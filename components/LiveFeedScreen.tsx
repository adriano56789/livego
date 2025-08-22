
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { User, Stream, Category, PkBattle, AppView, Region } from '../types';
import { 
    getPopularStreams,
    getFollowingStreams,
    getPkBattles,
    getNewStreams,
    getStreamsForCategory,
    getPrivateStreams,
    getNearbyStreams,
    requestLocationPermission,
    saveUserLocationPreference,
} from '../services/liveStreamService';
import StreamerCard from './StreamerCard';
import PkBattleCard from './PkBattleCard';
import HeaderTrophyIcon from './icons/HeaderTrophyIcon';
import SearchIcon from './icons/SearchIcon';
import UserProfileModal from './UserProfileModal';
import RefreshIcon from './icons/RefreshIcon';
import RegionSelectionModal from './RegionSelectionModal';
import ChevronUpIcon from './icons/ChevronUpIcon';
import Flag from './Flag';
import LocationPermissionModal from './LocationPermissionModal';
import LocationPermissionBanner from './LocationPermissionBanner';

type LocationPermission = 'prompt' | 'granted' | 'denied';

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
  locationPermission: LocationPermission;
  setLocationPermission: (permission: LocationPermission) => void;
}

const NavItem: React.FC<{ children: React.ReactNode; isActive?: boolean, onClick: () => void }> = ({ children, isActive, onClick }) => (
    <button
        onClick={onClick}
        className="relative px-3 py-2 shrink-0"
    >
        <span className={`font-semibold transition-colors text-lg ${isActive ? 'text-white' : 'text-gray-400'}`}>
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
    locationPermission,
    setLocationPermission,
}) => {
    const [streams, setStreams] = useState<(Stream | PkBattle)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewingUser, setViewingUser] = useState<User | null>(null);
    const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState<Region>({ name: 'Global', code: 'global' });
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

    // Pull-to-refresh state
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const pullStartY = useRef(0);
    const mainRef = useRef<HTMLElement>(null);
    const PULL_THRESHOLD = 70;

    const categories: Category[] = ['Popular', 'Seguindo', 'Perto', 'PK', 'Novo', 'Música', 'Dança'];

    const fetchStreams = useCallback(async (isRefresh: boolean = false) => {
        if (!isRefresh) {
            setIsLoading(true);
        }
        try {
            let fetchedStreams: (Stream | PkBattle)[] = [];
            switch (activeCategory) {
                case 'Perto':
                    if (locationPermission === 'granted') {
                        fetchedStreams = await getNearbyStreams(user.id, 'exact');
                    } else {
                        // Show popular streams as a fallback if permission is not granted
                        fetchedStreams = await getPopularStreams(selectedRegion.code);
                    }
                    break;
                case 'Atualizado':
                    fetchedStreams = await getNewStreams(selectedRegion.code);
                    break;
                case 'Popular':
                    fetchedStreams = await getPopularStreams(selectedRegion.code);
                    break;
                case 'Seguindo':
                    fetchedStreams = await getFollowingStreams(user.id, selectedRegion.code);
                    break;
                case 'Novo':
                    fetchedStreams = await getNewStreams(selectedRegion.code);
                    break;
                case 'PK':
                    fetchedStreams = await getPkBattles(selectedRegion.code);
                    break;
                case 'Privada':
                    fetchedStreams = await getPrivateStreams(user.id, selectedRegion.code);
                    break;
                case 'Música':
                case 'Dança':
                    fetchedStreams = await getStreamsForCategory(activeCategory, selectedRegion.code);
                    break;
                default:
                    fetchedStreams = await getPopularStreams(selectedRegion.code);
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
    }, [activeCategory, user.id, selectedRegion.code, locationPermission]);

    useEffect(() => {
        if (activeCategory === 'Perto' && locationPermission === 'prompt') {
            setIsLocationModalOpen(true);
        }
        fetchStreams(false);
    }, [fetchStreams, activeCategory, locationPermission]);
    
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
    
    const handleRegionSelect = (region: Region) => {
        setSelectedRegion(region);
        setIsRegionModalOpen(false);
    };

    const handleAllowLocation = async (accuracy: 'exact' | 'approximate') => {
        setIsLocationModalOpen(false);
        await requestLocationPermission(accuracy);
        await saveUserLocationPreference(user.id, accuracy);
        setLocationPermission('granted');
    };

    const handleDenyLocation = () => {
        setIsLocationModalOpen(false);
        setLocationPermission('denied');
    };
    
    const isNearbyTab = activeCategory === 'Perto';

    return (
        <div className="h-full w-full flex flex-col bg-black text-white font-sans">
            <header className="px-4 pt-4 pb-2 flex items-center justify-between shrink-0 gap-4">
                <div className="flex-1 min-w-0">
                    <div className="overflow-x-auto scrollbar-hide -ml-2">
                        <div className="flex items-center gap-x-1 whitespace-nowrap pl-2">
                            {categories.map(cat => (
                                <NavItem 
                                    key={cat} 
                                    isActive={activeCategory === cat} 
                                    onClick={() => onSelectCategory(cat)}
                                >
                                    {cat}
                                </NavItem>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-4 shrink-0">
                     <button onClick={() => setIsRegionModalOpen(true)} className="flex items-center gap-1.5 p-2 -m-2 rounded-lg hover:bg-white/10 transition-colors">
                        <Flag code={selectedRegion.code} className="w-6 h-auto rounded-sm flex-shrink-0" />
                        <ChevronUpIcon className="w-4 h-4" />
                    </button>
                     <button onClick={() => onNavigate('search')} className="p-2 -m-2 rounded-lg hover:bg-white/10 transition-colors">
                        <SearchIcon className="w-6 h-6" />
                    </button>
                    <button onClick={() => onNavigate('ranking')} className="p-2 -m-2 rounded-lg hover:bg-white/10 transition-colors">
                        <HeaderTrophyIcon className="w-8 h-8"/>
                    </button>
                </div>
            </header>
            <main
                ref={mainRef}
                className="flex-grow p-2 overflow-y-auto relative scrollbar-hide flex flex-col"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {isNearbyTab && locationPermission !== 'granted' && (
                    <LocationPermissionBanner onClick={() => setIsLocationModalOpen(true)} />
                )}
                <div
                    className="absolute top-[-40px] left-1/2 -translate-x-1/2 transition-transform duration-200"
                    style={{ transform: `translate(-50%, ${isRefreshing ? PULL_THRESHOLD : Math.min(pullDistance, PULL_THRESHOLD)}px)` }}
                >
                    <div className="p-2 bg-gray-800 rounded-full shadow-lg">
                        <RefreshIcon className={`w-6 h-6 text-white transition-transform ${isRefreshing ? 'animate-spin' : ''}`} style={{transform: `rotate(${isRefreshing ? 0 : pullDistance * 2}deg)`}}/>
                    </div>
                </div>
                {isLoading && !isRefreshing ? (
                     <div className="flex justify-center items-center flex-grow">
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
                    <div className="text-center text-gray-500 pt-20 flex-grow flex flex-col justify-center items-center">
                        <p>Nenhuma transmissão ao vivo encontrada.</p>
                        <p className="text-sm mt-2">Arraste para baixo para atualizar.</p>
                    </div>
                )}
            </main>

            <RegionSelectionModal 
                isOpen={isRegionModalOpen}
                onClose={() => setIsRegionModalOpen(false)}
                onSelect={handleRegionSelect}
            />

            <LocationPermissionModal
                isOpen={isLocationModalOpen}
                onAllow={handleAllowLocation}
                onDeny={handleDenyLocation}
            />

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
