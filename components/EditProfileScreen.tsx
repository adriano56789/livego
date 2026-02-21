
import React, { useState, useRef, useEffect } from 'react';
import { User, Obra } from '../types';
import { BackIcon, PlusIcon, ChevronRightIcon, TrashIcon, PlayIcon } from './icons';
import { EditTextModal, EditTextAreaModal, EditGenderModal, EditBirthdayModal } from './modals/edit-profile';
import { useTranslation } from '../i18n';
import { api } from '../services/api'; // Import api service

interface EditProfileScreenProps {
  user: User;
  onBack: () => void;
  onSave: (updatedUser: Partial<User>) => void; // Kept for legacy compatibility/local update if needed, but primary logic is now internal
}

type EditableField = keyof User | null;

const IMAGE_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMyYzJjMmUiLz4KICA8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeD0iMjUiIHk9IjI1IiB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iIzZiNzI4MCI+CiAgICA8cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik0yLjI1IDE1Ljc1bDUuMTU5LTUuMTU5YTIuMjUgMi4yNSAwIDAxMy4xODIgMGw1LjE1OSA1LjE1OW0tMS41LTEuNWwxLjQwOS0xLjQwOWEyLjI1IDIuMjUgMCAwMTMuMTgyIDBsMi45MDkgMi45MDltLTE4IDMuNzVoMTYuNWExLjUgMS41IDAgMDAxLjUtMS41VjZhMS41IDEuNSAwIDAwLTEuNS0xLjVIMy43NUExLjUgMS41IDAgMDAyLjI1IDZ2MTJhMS41IDEuNSAwIDAwMS41IDEuNXptMTAuNS0xMS4yNWguMDA4di4wMDhoLS4wMDhWOC4yNXoiIC8+CiAgPC9zdmc+Cjwvc3ZnPg==';
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  if (e.currentTarget.src !== IMAGE_PLACEHOLDER) {
    e.currentTarget.src = IMAGE_PLACEHOLDER;
  }
};


const EditableRow: React.FC<{label: string; value: string | undefined; onClick: () => void; placeholder: string}> = ({label, value, onClick, placeholder}) => (
    <button onClick={onClick} className="flex items-center justify-between w-full py-4 border-b border-gray-800">
      <span className="text-white text-base flex-shrink-0 pr-4">{label}</span>
      <div className="flex items-center space-x-2 flex-grow min-w-0">
        <span className="text-gray-400 text-right w-full truncate">{value || placeholder}</span>
        <ChevronRightIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />
      </div>
    </button>
);

// Helper function to calculate age
const calculateAge = (dateString: string): number => {
    const parts = dateString.split('/');
    if (parts.length !== 3) return 0;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; 
    const year = parseInt(parts[2], 10);
    
    const birthDate = new Date(year, month, day);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ user, onBack, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<User>(user);
  const [editingField, setEditingField] = useState<EditableField>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const dragPhoto = useRef<number>(0);
  const dragOverPhoto = useRef<number>(0);

  // Initial Fetch to ensure data is fresh (using the new GET routes implicitly via current user or explicitly)
  useEffect(() => {
      const fetchImages = async () => {
          try {
              const images = await api.profile.getImages();
              if (images) setFormData(prev => ({ ...prev, obras: images }));
          } catch(e) {
              console.error("Failed to fetch images", e);
          }
      };
      fetchImages();
  }, []);

  const handleGlobalSave = () => {
     onSave(formData);
     onBack();
  };
  
  // Specific Handlers for Modals (Immediate Save)

  const handleNicknameSave = async (value: string) => {
      try {
          await api.profile.updateNickname(value);
          setFormData(prev => ({ ...prev, name: value }));
          setEditingField(null);
      } catch (error) {
          console.error("Failed to update nickname", error);
      }
  };

  const handleGenderSave = async (value: User['gender']) => {
      try {
          // Cast value as any because generic type safety might fight with specific string literal in User type
          await api.profile.updateGender(value as any);
          setFormData(prev => ({ ...prev, gender: value }));
          setEditingField(null);
      } catch (error) {
          console.error("Failed to update gender", error);
      }
  };

  const handleBirthdaySave = async (value: string) => {
      try {
          await api.profile.updateBirthday(value);
          const newAge = calculateAge(value);
          setFormData(prev => ({ ...prev, birthday: value, age: newAge }));
          setEditingField(null);
      } catch (error) {
           console.error("Failed to update birthday", error);
      }
  };

  const handleBioSave = async (value: string) => {
      try {
          await api.profile.updateBio(value);
          setFormData(prev => ({ ...prev, bio: value }));
          setEditingField(null);
      } catch (error) {
          console.error("Failed to update bio", error);
      }
  };

  const handleResidenceSave = async (value: string) => {
      try {
          await api.profile.updateResidence(value);
          setFormData(prev => ({ ...prev, residence: value }));
          setEditingField(null);
      } catch (error) {
          console.error("Failed to update residence", error);
      }
  };

  const handleEmotionalStatusSave = async (value: string) => {
       try {
          await api.profile.updateEmotionalStatus(value);
          setFormData(prev => ({ ...prev, emotional_status: value }));
          setEditingField(null);
      } catch (error) {
          console.error("Failed to update emotional status", error);
      }
  };

  const handleTagsSave = async (value: string) => {
       try {
          await api.profile.updateTags(value);
          setFormData(prev => ({ ...prev, tags: value }));
          setEditingField(null);
      } catch (error) {
          console.error("Failed to update tags", error);
      }
  };

  const handleProfessionSave = async (value: string) => {
       try {
          await api.profile.updateProfession(value);
          setFormData(prev => ({ ...prev, profession: value }));
          setEditingField(null);
      } catch (error) {
          console.error("Failed to update profession", error);
      }
  };


  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const currentObras = formData.obras || [];
      if (currentObras.length < 8) {
        const file = e.target.files[0];
        const isVideo = file.type.startsWith('video/');

        if (isVideo) {
            // Check video duration
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = async () => {
                window.URL.revokeObjectURL(video.src);
                if (video.duration > 30) {
                    alert("Vídeos não podem ter mais de 30 segundos.");
                    return;
                }
                await processUpload(file, currentObras);
            };
            video.src = URL.createObjectURL(file);
        } else {
            processUpload(file, currentObras);
        }
      }
    }
  };

  const processUpload = (file: File, currentObras: Obra[]) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
          const dataUrl = event.target?.result as string;
          if (dataUrl) {
              try {
                  // Upload logic simulation
                  const uploadResp = await api.uploadChatPhoto(user.id, dataUrl); // Reusing this for simplicity
                  const newObra: Obra = { id: `obra-${Date.now()}`, url: uploadResp.url };
                  
                  // We need to 'save' this new image list.
                  const newObras = [newObra, ...currentObras];
                  await api.updateProfile(user.id, { obras: newObras }); // Fallback to generic for Add
                  setFormData(prev => ({ ...prev, obras: newObras }));
              } catch(e) {
                  console.error("Upload failed", e);
              }
          }
      };
      reader.readAsDataURL(file);
  }

  const handleDeletePhoto = async (indexToDelete: number) => {
      const obraToDelete = formData.obras?.[indexToDelete];
      if (!obraToDelete) return;

      try {
          await api.profile.deleteImage(obraToDelete.id);
          setFormData(prev => {
            const newObras = prev.obras?.filter((_, index) => index !== indexToDelete) || [];
            return { ...prev, obras: newObras };
          });
      } catch (error) {
          console.error("Failed to delete image", error);
      }
  };

  const handleSort = async () => {
    const obras = [...(formData.obras || [])];
    if (dragPhoto.current === dragOverPhoto.current) return;
    
    // Perform the swap
    const draggedObra = obras.splice(dragPhoto.current, 1)[0];
    obras.splice(dragOverPhoto.current, 0, draggedObra);

    // Reset refs
    dragPhoto.current = 0;
    dragOverPhoto.current = 0;

    // Optimistic Update
    setFormData(prev => ({ ...prev, obras }));

    // API Call
    try {
        const orderedIds = obras.map(o => o.id);
        await api.profile.reorderImages(orderedIds);
    } catch (error) {
        console.error("Failed to reorder images", error);
    }
  };


  const getGenderLabel = (gender?: 'male' | 'female' | 'not_specified') => {
    if (gender === 'male') return t('common.male');
    if (gender === 'female') return t('common.female');
    return t('common.notSpecified');
  };

  return (
    <div className="absolute inset-0 bg-[#111] z-50 flex flex-col text-white">
      <header className="flex items-center justify-between p-4 flex-shrink-0 border-b border-gray-800">
        <button onClick={onBack}><BackIcon className="w-6 h-6" /></button>
        <h1 className="text-xl font-bold">{t('editProfile.title')}</h1>
        <button onClick={handleGlobalSave} className="font-bold text-lg text-purple-400">Concluir</button>
      </header>

      <main className="flex-grow overflow-y-auto px-4 no-scrollbar">
        <div className="my-4 bg-blue-500/20 text-blue-300 text-sm p-3 rounded-lg flex items-start space-x-2">
            <span>{t('editProfile.uploadNotice')}</span>
        </div>

        <div className="py-4">
          <div className="grid grid-cols-4 gap-3">
            {(formData.obras || []).map((obra, index) => {
              // Robust check for video type
              const isVideo = obra.url.toLowerCase().includes('data:video') || 
                             obra.url.toLowerCase().endsWith('.mp4') || 
                             obra.url.toLowerCase().endsWith('.webm');
                             
              return (
                <div
                  key={obra.id}
                  className="relative aspect-square rounded-lg group overflow-hidden bg-[#2c2c2e]"
                  draggable
                  onDragStart={() => (dragPhoto.current = index)}
                  onDragEnter={() => (dragOverPhoto.current = index)}
                  onDragEnd={handleSort}
                  onDragOver={e => e.preventDefault()}
                >
                  {isVideo ? (
                      <div className="relative w-full h-full">
                        <video 
                            src={obra.url} 
                            className="w-full h-full object-cover" 
                            muted 
                            playsInline
                            loop
                            // Add autoplay on hover for desktop, or just poster for mobile feel
                            onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                            onMouseOut={(e) => (e.target as HTMLVideoElement).pause()}
                        />
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                            <PlayIcon className="w-6 h-6 text-white/80" />
                        </div>
                      </div>
                  ) : (
                      <img src={obra.url} onError={handleImageError} alt={`Profile photo ${index + 1}`} className="w-full h-full object-cover" />
                  )}
                  {index === 0 && (
                    <div className="absolute bottom-1 left-1 bg-black/50 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold">{t('editProfile.portrait')}</div>
                  )}
                  <button
                    onClick={() => handleDeletePhoto(index)}
                    className="absolute -top-1.5 -right-1.5 bg-gray-200 text-black rounded-full p-0.5 opacity-100 z-10"
                    aria-label={`Delete photo ${index + 1}`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {(formData.obras?.length || 0) < 8 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg bg-[#2c2c2e] border border-dashed border-gray-600 flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <PlusIcon className="w-8 h-8 text-gray-500" />
              </button>
            )}
          </div>
          <input type="file" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*,video/*" />
          <p className="text-xs text-gray-500 mt-2">{t('editProfile.uploadHelper', { count: formData.obras?.length || 0 })}</p>
        </div>

        <div>
            <EditableRow label={t('editProfile.nickname')} value={formData.name} onClick={() => setEditingField('name')} placeholder={t('editProfile.notSpecified')} />
            <EditableRow label={t('editProfile.gender')} value={getGenderLabel(formData.gender)} onClick={() => setEditingField('gender')} placeholder={t('editProfile.notSpecified')} />
            <EditableRow label={t('editProfile.birthday')} value={formData.birthday} onClick={() => setEditingField('birthday')} placeholder={t('editProfile.notSpecified')} />
            <EditableRow label={t('editProfile.bio')} value={formData.bio} onClick={() => setEditingField('bio')} placeholder={t('editProfile.notSpecified')} />
            <EditableRow label={t('editProfile.residence')} value={formData.residence} onClick={() => setEditingField('residence')} placeholder={t('editProfile.notSpecified')} />
            <EditableRow label={t('editProfile.emotionalStatus')} value={formData.emotional_status} onClick={() => setEditingField('emotional_status')} placeholder={t('editProfile.notSpecified')} />
            <EditableRow label={t('editProfile.tags')} value={formData.tags} onClick={() => setEditingField('tags')} placeholder={t('editProfile.notSpecified')} />
            <EditableRow label={t('editProfile.profession')} value={formData.profession} onClick={() => setEditingField('profession')} placeholder={t('editProfile.notSpecified')} />
        </div>
      </main>

      {/* Modals - Updated to call specific save handlers */}
      <EditTextModal 
        isOpen={editingField === 'name'}
        onClose={() => setEditingField(null)}
        onSave={handleNicknameSave}
        title={t('editProfile.nickname')}
        initialValue={formData.name || ''}
      />
      <EditGenderModal 
        isOpen={editingField === 'gender'}
        onClose={() => setEditingField(null)}
        onSave={handleGenderSave}
        initialValue={formData.gender || 'not_specified'}
      />
      <EditBirthdayModal
        isOpen={editingField === 'birthday'}
        onClose={() => setEditingField(null)}
        onSave={handleBirthdaySave}
        initialValue={formData.birthday || ''}
      />
      <EditTextAreaModal
        isOpen={editingField === 'bio'}
        onClose={() => setEditingField(null)}
        onSave={handleBioSave}
        title={t('editProfile.bio')}
        initialValue={formData.bio || ''}
      />
      <EditTextModal
        isOpen={editingField === 'residence'}
        onClose={() => setEditingField(null)}
        onSave={handleResidenceSave}
        title={t('editProfile.residence')}
        initialValue={formData.residence || ''}
      />
       <EditTextModal
        isOpen={editingField === 'emotional_status'}
        onClose={() => setEditingField(null)}
        onSave={handleEmotionalStatusSave}
        title={t('editProfile.emotionalStatus')}
        initialValue={formData.emotional_status || ''}
      />
      <EditTextModal
        isOpen={editingField === 'tags'}
        onClose={() => setEditingField(null)}
        onSave={handleTagsSave}
        title={t('editProfile.tags')}
        initialValue={formData.tags || ''}
      />
       <EditTextModal
        isOpen={editingField === 'profession'}
        onClose={() => setEditingField(null)}
        onSave={handleProfessionSave}
        title={t('editProfile.profession')}
        initialValue={formData.profession || ''}
      />

    </div>
  );
};

export default EditProfileScreen;
