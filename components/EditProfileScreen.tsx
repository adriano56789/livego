import React, { useState, useRef } from 'react';
import { User, Obra } from '../types';
import { BackIcon, PlusIcon, ChevronRightIcon, TrashIcon, PlayIcon } from './icons';
import { EditTextModal, EditTextAreaModal, EditGenderModal, EditBirthdayModal } from './modals/edit-profile';
import { useTranslation } from '../i18n';

interface EditProfileScreenProps {
  user: User;
  onBack: () => void;
  onSave: (updatedUser: Partial<User>) => void;
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


const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ user, onBack, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<User>(user);
  const [editingField, setEditingField] = useState<EditableField>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const dragPhoto = useRef<number>(0);
  const dragOverPhoto = useRef<number>(0);

  const handleSave = () => {
    const finalData = { ...formData };

    if (finalData.obras && finalData.obras.length > 0) {
        finalData.avatarUrl = finalData.obras[0].type === 'image' ? finalData.obras[0].url : finalData.obras[0].thumbnailUrl || user.avatarUrl;
    } else {
        finalData.avatarUrl = user.avatarUrl; // Fallback to original if all photos deleted
    }
    onSave(finalData);
  };
  
  const handleFormChange = (field: keyof User, value: any) => {
    setFormData(prev => ({...prev, [field]: value}));
    setEditingField(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const currentObras = formData.obras || [];
      if (currentObras.length < 8) {
        const file = e.target.files[0];
        const isVideo = file.type.startsWith('video/');
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (dataUrl) {
                let newObra: Obra;
                if (isVideo) {
                     newObra = { 
                        id: `obra-local-${Date.now()}`, 
                        url: dataUrl, 
                        type: 'video', 
                        thumbnailUrl: 'https://placehold.co/600x800/2c2c2e/6b7280?text=Video' 
                    };
                } else {
                    newObra = { id: `obra-local-${Date.now()}`, url: dataUrl, type: 'image' };
                }
                const newObras = [newObra, ...currentObras];
                setFormData(prev => ({ ...prev, obras: newObras }));
            }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDeletePhoto = (indexToDelete: number) => {
    setFormData(prev => {
      const newObras = prev.obras?.filter((_, index) => index !== indexToDelete) || [];
      return {
        ...prev,
        obras: newObras,
      };
    });
  };

  const handleSort = () => {
    const obras = [...(formData.obras || [])];
    if (dragPhoto.current === dragOverPhoto.current) return;
    
    // Perform the swap
    const draggedObra = obras.splice(dragPhoto.current, 1)[0];
    obras.splice(dragOverPhoto.current, 0, draggedObra);

    // Reset refs
    dragPhoto.current = 0;
    dragOverPhoto.current = 0;

    setFormData(prev => ({ ...prev, obras }));
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
        <button onClick={handleSave} className="font-bold text-lg text-purple-400">{t('common.save')}</button>
      </header>

      <main className="flex-grow overflow-y-auto px-4 no-scrollbar">
        <div className="my-4 bg-blue-500/20 text-blue-300 text-sm p-3 rounded-lg flex items-start space-x-2">
            <span>{t('editProfile.uploadNotice')}</span>
        </div>

        <div className="py-4">
          <div className="grid grid-cols-4 gap-3">
            {(formData.obras || []).map((obra, index) => (
              <div
                key={obra.id}
                className="relative aspect-square rounded-lg group"
                draggable
                onDragStart={() => (dragPhoto.current = index)}
                onDragEnter={() => (dragOverPhoto.current = index)}
                onDragEnd={handleSort}
                onDragOver={e => e.preventDefault()}
              >
                <img src={obra.type === 'video' ? obra.thumbnailUrl || obra.url : obra.url} onError={handleImageError} alt={`Profile media ${index + 1}`} className="w-full h-full object-cover rounded-lg bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" />
                {obra.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <PlayIcon className="w-6 h-6 text-white/80" />
                    </div>
                )}
                {index === 0 && (
                  <div className="absolute bottom-1 left-1 bg-black/50 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold">{t('editProfile.portrait')}</div>
                )}
                <button
                  onClick={() => handleDeletePhoto(index)}
                  className="absolute -top-1.5 -right-1.5 bg-gray-200 text-black rounded-full p-0.5 opacity-100 transition-opacity"
                  aria-label={`Delete photo ${index + 1}`}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}

            {(formData.obras?.length || 0) < 8 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg bg-[#2c2c2e] border border-dashed border-gray-600 flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <PlusIcon className="w-8 h-8 text-gray-500" />
              </button>
            )}
          </div>
          <input type="file" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*,video/mp4,video/quicktime" />
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

      {/* Modals */}
      <EditTextModal 
        isOpen={editingField === 'name'}
        onClose={() => setEditingField(null)}
        onSave={(value) => handleFormChange('name', value)}
        title={t('editProfile.nickname')}
        initialValue={formData.name || ''}
      />
      <EditGenderModal 
        isOpen={editingField === 'gender'}
        onClose={() => setEditingField(null)}
        onSave={(value) => handleFormChange('gender', value)}
        initialValue={formData.gender || 'not_specified'}
      />
      <EditBirthdayModal
        isOpen={editingField === 'birthday'}
        onClose={() => setEditingField(null)}
        onSave={(value) => handleFormChange('birthday', value)}
        initialValue={formData.birthday || ''}
      />
      <EditTextAreaModal
        isOpen={editingField === 'bio'}
        onClose={() => setEditingField(null)}
        onSave={(value) => handleFormChange('bio', value)}
        title={t('editProfile.bio')}
        initialValue={formData.bio || ''}
      />
      <EditTextModal
        isOpen={editingField === 'residence'}
        onClose={() => setEditingField(null)}
        onSave={(value) => handleFormChange('residence', value)}
        title={t('editProfile.residence')}
        initialValue={formData.residence || ''}
      />
       <EditTextModal
        isOpen={editingField === 'emotional_status'}
        onClose={() => setEditingField(null)}
        onSave={(value) => handleFormChange('emotional_status', value)}
        title={t('editProfile.emotionalStatus')}
        initialValue={formData.emotional_status || ''}
      />
      <EditTextModal
        isOpen={editingField === 'tags'}
        onClose={() => setEditingField(null)}
        onSave={(value) => handleFormChange('tags', value)}
        title={t('editProfile.tags')}
        initialValue={formData.tags || ''}
      />
       <EditTextModal
        isOpen={editingField === 'profession'}
        onClose={() => setEditingField(null)}
        onSave={(value) => handleFormChange('profession', value)}
        title={t('editProfile.profession')}
        initialValue={formData.profession || ''}
      />

    </div>
  );
};

export default EditProfileScreen;