import React, { useState, useEffect } from 'react';
import { User, FeedPhoto } from '../types';
import { BackIcon, BrazilFlagIcon, MaleIcon, FemaleIcon, RankIcon, MoreVerticalIcon, PencilIcon, ChevronRightIcon, CopyIcon, PlayIcon, HeartIcon, DetailsIcon, VIPBadgeIcon, ShieldIcon, LiveIndicatorIcon } from './icons';
import BlockReportModal from './BlockReportModal';
import { useTranslation } from '../i18n';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';
import { avatarFrames, getRemainingDays, getFrameGlowClass } from '../services/database';

interface UserProfileScreenProps {
  user: User;
  isCurrentUser: boolean;
  onBack: () => void;
  onEdit: () => void;
  onOpenTopFans: () => void;
  onOpenFollowing: () => void;
  onOpenFans: () => void;
  onFollow: (user: User) => void;
  onStartChat: (user: User) => void;
  onBlockUser: (user: User) => void;
  onReportUser: (user: User) => void;
  onOpenPhotoViewer: (photos: FeedPhoto[], index: number) => void;
  lastPhotoLikeUpdate: number;
  onPhotoLiked: () => void;
}

const IMAGE_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMyYzJjMmUiLz4KICA8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeD0iMjUiIHk9IjI1IiB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iIzZiNzI4MCI+CiAgICA8cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik0yLjI1IDE1Ljc1bDUuMTU5LTUuMTU5YTIuMjUgMi4yNSAwIDAxMy4xODIgMGw1LjE1OSA1LjE1OW0tMS41LTEuNWwxLjQwOS0xLjQwOWEyLjI1IDIuMjUgMCAwMTMuMTgyIDBsMi45MDkgMi45MDltLTE4IDMuNzVoMTYuNWExLjUgMS41IDAgMDAxLjUtMS41VjZhMS41IDEuNSAwIDAwLTEuNS0xLjVIMy43NUExLjUgMS41IDAgMDAyLjI1IDZ2MTJhMS41IDEuNSAwIDAwMS41IDEuNXptMTAuNS0xMS4yNWguMDA4di4wMDhoLS4wMDhWOC4yNXoiIC8+CiAgPC9zdmc+Cjwvc3ZnPg==';
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  if (e.currentTarget.src !== IMAGE_PLACEHOLDER) {
    e.currentTarget.src = IMAGE_PLACEHOLDER;
  }
};


const formatNumber = (num: any): string => {
    const numericValue = Number(num);
    if (num === null || num === undefined || isNaN(numericValue)) {
        return '0';
    }
    if (numericValue >= 1000000) {
        return (numericValue / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (numericValue >= 1000) {
        return (numericValue / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return String(numericValue);
};

const StatItem: React.FC<{ value: string | number; label: string; onClick?: () => void }> = ({ value, label, onClick }) => (
    <button onClick={onClick} className="text-center focus:outline-none disabled:cursor-default" disabled={!onClick}>
        <p className="text-white">{value}</p>
        <p className="text-sm text-white">{label}</p>
    </button>
);

const ProfileTab: React.FC<{ label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void }> = ({ label, icon, isActive, onClick }) => (
    <button onClick={onClick} className={`py-3 font-medium transition-colors relative flex items-center ${isActive ? 'text-white' : 'text-gray-500'}`}>
        {icon}
        {label}
        {isActive && <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500 rounded-full"></div>}
    </button>
);

const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ user, isCurrentUser, onBack, onEdit, onOpenTopFans, onOpenFollowing, onOpenFans, onFollow, onStartChat, onBlockUser, onReportUser, onOpenPhotoViewer, lastPhotoLikeUpdate, onPhotoLiked }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('Obras');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [likedPhotos, setLikedPhotos] = useState<FeedPhoto[]>([]);
    const [isLoadingLikes, setIsLoadingLikes] = useState(false);
    const [obras, setObras] = useState<FeedPhoto[]>([]);
    const [isLoadingObras, setIsLoadingObras] = useState(false);

    useEffect(() => {
        let isMounted = true;
        if (activeTab === 'Obras') {
            setIsLoadingObras(true);
            api.getUserPhotos(user.id).then(data => {
                if (isMounted) {
                    setObras(data || []);
                    setIsLoadingObras(false);
                }
            }).catch(err => {
                console.error("Failed to load user photos:", err);
                if (isMounted) setIsLoadingObras(false);
            });
        }
        return () => { isMounted = false; };
    }, [activeTab, user.id, lastPhotoLikeUpdate]);

    useEffect(() => {
        let isMounted = true;
        if (activeTab === 'Curtidas') {
            setIsLoadingLikes(true);
            api.getLikedPhotos(user.id).then(data => {
                if (isMounted) {
                    setLikedPhotos(data || []);
                    setIsLoadingLikes(false);
                }
            }).catch(err => {
                console.error(err);
                if (isMounted) setIsLoadingLikes(false);
            });
        }
        return () => { isMounted = false; };
      }, [activeTab, user.id, lastPhotoLikeUpdate]);

    const handleToggleLike = async (photoId: string, tab: 'obras' | 'curtidas') => {
        const list = tab === 'obras' ? obras : likedPhotos;
        const listSetter = tab === 'obras' ? setObras : setLikedPhotos;

        const photoIndex = list.findIndex(p => p.id === photoId);
        if (photoIndex === -1) return;

        const originalPhoto = list[photoIndex];
        const originalList = [...list];

        // Optimistic update
        const updatedPhoto = {
            ...originalPhoto,
            isLiked: !originalPhoto.isLiked,
            likes: originalPhoto.isLiked ? originalPhoto.likes - 1 : originalPhoto.likes + 1,
        };
        const newList = [...list];
        newList[photoIndex] = updatedPhoto;
        listSetter(newList);

        try {
            const response = await api.likePhoto(photoId);
            if (response.success) {
                // Sync with server state
                const finalPhoto = {
                    ...updatedPhoto,
                    isLiked: response.isLiked,
                    likes: response.likes,
                };
                const finalList = [...originalList]; // Use original list to prevent race conditions
                finalList[photoIndex] = finalPhoto;
                
                if (tab === 'curtidas' && !response.isLiked) {
                    listSetter(finalList.filter(p => p.id !== photoId));
                } else {
                    listSetter(finalList);
                }

                onPhotoLiked();
            } else {
                listSetter(originalList);
            }
        } catch (error) {
            console.error("Failed to toggle like:", error);
            listSetter(originalList);
        }
    };

    const getGender = (gender?: 'male' | 'female' | 'not_specified') => {
        switch (gender) {
            case 'male': return t('common.male');
            case 'female': return t('common.female');
            default: return t('common.notSpecified');
        }
    }

    const handleFollowClick = () => {
        onFollow(user);
    };
    
    const handleUnfriend = () => {
        onFollow(user); // This toggles the follow state, effectively unfollowing/unfriending.
        setIsModalOpen(false);
    };
    
    const handleBlock = () => {
        onBlockUser(user);
        setIsModalOpen(false);
    };

    const handleReport = () => {
        onReportUser(user);
        setIsModalOpen(false);
    };
    
    const detailItems = [
        { label: t('editProfile.nickname'), value: user.name, show: !!user.name },
        { label: t('editProfile.gender'), value: getGender(user.gender), show: !!user.gender && user.gender !== 'not_specified' },
        { label: t('editProfile.birthday'), value: user.birthday, show: !!user.birthday },
        { label: t('editProfile.bio'), value: user.bio, show: !!user.bio },
        { label: t('editProfile.residence'), value: user.residence, show: !!user.residence },
        { label: t('editProfile.emotionalStatus'), value: user.emotional_status, show: !!user.emotional_status },
        { label: t('editProfile.tags'), value: user.tags, show: !!user.tags },
        { label: t('editProfile.profession'), value: user.profession, show: !!user.profession },
    ].filter(item => item.show);

    const hasDetails = detailItems.length > 0;

    const activeOwnedFrame = user.ownedFrames?.find(f => f.frameId === user.activeFrameId);
    const remainingDays = getRemainingDays(activeOwnedFrame?.expirationDate);
    const activeFrame = (user.activeFrameId && activeOwnedFrame && remainingDays && remainingDays > 0)
        ? avatarFrames.find(f => f.id === user.activeFrameId)
        : null;
    const ActiveFrameComponent = activeFrame ? activeFrame.component : null;
    const frameGlowClass = getFrameGlowClass(user.activeFrameId);


    return (
        <div className="absolute inset-0 bg-black z-50 flex flex-col text-white">
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-24">
                <header className="relative h-48">
                    <img src={user.coverUrl} onError={handleImageError} alt="Cover" className="w-full h-full object-cover bg-[#2c2c2e]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                        <button onClick={onBack} className="w-8 h-8 bg-black/30 rounded-full flex items-center justify-center">
                            <BackIcon className="w-5 h-5" />
                        </button>
                        <div className="flex items-center space-x-2">
                            {isCurrentUser && (
                               <button onClick={onEdit} className="w-8 h-8 bg-black/30 rounded-full flex items-center justify-center">
                                   <PencilIcon className="w-5 h-5" />
                               </button>
                            )}
                           <button onClick={() => setIsModalOpen(true)} className="w-8 h-8 bg-black/30 rounded-full flex items-center justify-center">
                               <MoreVerticalIcon className="w-5 h-5" />
                           </button>
                        </div>
                    </div>
                     <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                        <div className="relative w-24 h-24">
                            <img src={user.avatarUrl} onError={handleImageError} alt={user.name} className="w-full h-full rounded-full object-cover p-1 bg-[#2c2c2e]" />
                            {ActiveFrameComponent && (
                                <div className={`absolute -top-2 -left-2 w-28 h-28 pointer-events-none ${frameGlowClass}`}>
                                    <ActiveFrameComponent />
                                </div>
                            )}

                            {user.isLive ? (
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/60 rounded-md px-2 py-1 flex items-center space-x-1.5 backdrop-blur-sm z-10">
                                  <LiveIndicatorIcon className="w-4 h-4 text-green-400" />
                                  <span className="text-xs font-bold text-white uppercase tracking-wider">{t('footer.live')}</span>
                                </div>
                            ) : (
                                <>
                                    {user.isOnline && (
                                        <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-black" title="Online"></div>
                                    )}
                                    {user.isAvatarProtected && (
                                        <div className="absolute -top-1 -right-1 bg-gray-900 rounded-full p-1">
                                            <ShieldIcon className="w-6 h-6 text-blue-400" />
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-0.5">
                                        <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center">
                                            {user.country === 'br' && <BrazilFlagIcon />}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main className="px-4 pt-14">
                    <div className="flex flex-col items-center">
                        <h1 className="text-2xl font-bold mt-2 flex items-center space-x-2">
                        <span>{user.name}</span>
                        {user.isVIP && <VIPBadgeIcon className="w-6 h-6" />}
                        </h1>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <span>{t('profile.id')}: {user.identification}</span>
                        <button className="text-gray-500 hover:text-white"><CopyIcon className="h-4 w-4" /></button>
                        </div>

                        <div className="flex items-center space-x-2 my-2">
                            {user.age && (
                                <span className={`text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center space-x-1 ${user.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                                    {user.gender === 'male' ? <MaleIcon className="h-3 w-3" /> : <FemaleIcon className="h-3 w-3" />}
                                    <span>{user.age}</span>
                                </span>
                            )}
                            <span className="bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center space-x-1">
                                <RankIcon className="h-3 w-3" />
                                <span>{user.level}</span>
                            </span>
                        </div>

                        <p className="text-sm text-gray-400">{user.location} | {user.distance}</p>
                    </div>
                    

                    <div className="grid grid-cols-4 gap-2 my-4 text-center">
                        <StatItem value={formatNumber(user.fans)} label={t('profile.fans')} onClick={onOpenFans} />
                        <StatItem value={formatNumber(user.following)} label={t('profile.following')} onClick={onOpenFollowing} />
                        <StatItem value={formatNumber(user.receptores)} label={t('profile.receivers')} />
                        <StatItem value={formatNumber(user.enviados)} label={t('profile.senders')} />
                    </div>

                    <button onClick={onOpenTopFans} className="bg-[#1c1c1e] p-3 rounded-lg flex items-center justify-between w-full text-left hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center">
                             <span className="font-semibold mr-4">{t('profile.topFans')}</span>
                             <div className="flex -space-x-2">
                                {user.topFansAvatars?.slice(0, 3).map((avatar, index) => (
                                    <img key={index} src={avatar} alt={`Fan ${index + 1}`} className="w-8 h-8 rounded-full ring-2 ring-[#1c1c1e]" />
                                ))}
                             </div>
                        </div>
                        <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                    </button>

                    <nav className="flex space-x-8 mt-4 border-b border-gray-800">
                       <ProfileTab label={t('profile.tabs.works')} icon={<PlayIcon className="w-4 h-4 mr-1.5" />} isActive={activeTab === 'Obras'} onClick={() => setActiveTab('Obras')} />
                       <ProfileTab label={t('profile.tabs.likes')} icon={<HeartIcon className="w-4 h-4 mr-1.5" />} isActive={activeTab === 'Curtidas'} onClick={() => setActiveTab('Curtidas')} />
                       <ProfileTab label={t('profile.tabs.details')} icon={<DetailsIcon className="w-4 h-4 mr-1.5" />} isActive={activeTab === 'Detalhes'} onClick={() => setActiveTab('Detalhes')} />
                    </nav>

                    {activeTab === 'Obras' && (
                        isLoadingObras ? (
                            <div className="flex justify-center items-center h-48"><LoadingSpinner /></div>
                        ) : obras.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {obras.map((obra, index) => (
                                    <button 
                                        key={obra.id}
                                        onClick={() => onOpenPhotoViewer(obras, index)}
                                        className="relative group aspect-[3/4] rounded-lg overflow-hidden bg-[#2c2c2e] focus:outline-none focus:ring-2 focus:ring-purple-500 transition-transform hover:scale-105"
                                    >
                                        <img src={obra.photoUrl} onError={handleImageError} alt={`Obra ${index + 1}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleLike(obra.id, 'obras');
                                            }}
                                            className="absolute bottom-2 left-2 flex items-center space-x-1 text-white text-sm font-bold drop-shadow-md bg-black/30 rounded-full px-2 py-1 hover:bg-black/50 transition-colors"
                                        >
                                            <HeartIcon 
                                                className={`w-4 h-4 transition-colors ${obra.isLiked ? 'text-red-500' : 'text-white'}`} 
                                                fill={obra.isLiked ? 'currentColor' : 'none'} 
                                                stroke="currentColor" 
                                                strokeWidth={2}
                                            />
                                            <span>{formatNumber(obra.likes)}</span>
                                        </button>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-48 text-gray-500">
                                <p>{t('profile.noWorks')}</p>
                            </div>
                        )
                    )}
                     {activeTab === 'Curtidas' && (
                        isLoadingLikes ? (
                            <div className="flex justify-center items-center h-48"><LoadingSpinner /></div>
                        ) : likedPhotos.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {likedPhotos.map((photo, index) => (
                                    <button 
                                        key={photo.id}
                                        onClick={() => onOpenPhotoViewer(likedPhotos, index)}
                                        className="relative group aspect-[3/4] rounded-lg overflow-hidden bg-[#2c2c2e] focus:outline-none focus:ring-2 focus:ring-purple-500 transition-transform hover:scale-105"
                                    >
                                        <img src={photo.photoUrl} onError={handleImageError} alt={`Liked photo ${index + 1}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleLike(photo.id, 'curtidas');
                                            }}
                                            className="absolute bottom-2 left-2 flex items-center space-x-1 text-white text-sm font-bold drop-shadow-md bg-black/30 rounded-full px-2 py-1 hover:bg-black/50 transition-colors"
                                        >
                                            <HeartIcon 
                                                className={`w-4 h-4 transition-colors ${photo.isLiked ? 'text-red-500' : 'text-white'}`} 
                                                fill={photo.isLiked ? 'currentColor' : 'none'} 
                                                stroke="currentColor" 
                                                strokeWidth={2}
                                            />
                                            <span>{formatNumber(photo.likes)}</span>
                                        </button>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-48 text-gray-500">
                                <p>{t('profile.noLikes')}</p>
                            </div>
                        )
                    )}
                     {activeTab === 'Detalhes' && (
                        hasDetails ? (
                            <div className="bg-[#1c1c1e] rounded-lg p-4 mt-4 text-sm">
                                <h2 className="text-lg font-bold mb-4 text-white">{t('profile.profileInfo')}</h2>
                                <div className="space-y-4">
                                    {detailItems.map((item) => (
                                        <div key={item.label} className="flex items-start">
                                            <span className="text-gray-400 w-28 flex-shrink-0">{item.label}</span>
                                            <span className="text-white break-words">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-48 text-gray-500">
                                <p>{t('profile.noDetails')}</p>
                            </div>
                        )
                    )}
                </main>
            </div>
            
            {!isCurrentUser && (
                <footer className="absolute bottom-0 left-0 right-0 bg-black p-3 flex-shrink-0 z-10 border-t border-gray-800/50">
                    <div className="flex items-center space-x-3">
                        <button onClick={handleFollowClick} className={`flex-1 font-bold py-3 rounded-full transition-colors ${user.isFollowed ? 'bg-gray-700 text-gray-300' : 'bg-purple-600 text-white'}`}>
                            {user.isFollowed ? t('common.following') : t('common.follow')}
                        </button>
                        <button onClick={() => onStartChat(user)} className="flex-1 bg-purple-600 text-white font-bold py-3 rounded-full transition-colors">
                            {t('common.chat')}
                        </button>
                    </div>
                </footer>
            )}

            <BlockReportModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onBlock={handleBlock}
                onReport={handleReport} 
                onUnfriend={user.isFollowed ? handleUnfriend : undefined} 
            />
        </div>
    );
};

export default UserProfileScreen;