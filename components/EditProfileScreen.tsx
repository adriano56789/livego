import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ChevronLeftIcon, TrashIcon, PlusIcon, ChevronRightIcon, CheckIcon, CloseIcon } from './icons';
import { User, Obra, ToastType } from '../types';

interface EditProfileScreenProps {
    user: User;
    onClose: () => void;
    onSave: (updatedData: Partial<User>) => void;
    addToast?: (type: ToastType, message: string) => void;
}

// --- Generic Modal Wrapper ---
const ModalWrapper = ({ children, onClose }: { children?: React.ReactNode, onClose: () => void }) => (
    <div className="fixed inset-0 z-[160] flex items-end justify-center sm:items-center bg-transparent" onClick={onClose}>
        <div 
            className="w-full sm:max-w-md bg-[#1C1C1E] rounded-t-2xl sm:rounded-xl shadow-2xl animate-in slide-in-from-bottom duration-300 border border-white/5"
            onClick={e => e.stopPropagation()}
        >
            {children}
        </div>
    </div>
);

// --- Sub-Modals ---
const EditInputModal = ({ title, value, onSave, onClose, multiline = false }: any) => {
    const [tempValue, setTempValue] = useState(value);
    return (
        <ModalWrapper onClose={onClose}>
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={onClose} className="text-gray-400 text-sm">Cancelar</button>
                    <h3 className="text-white font-bold text-base">{title}</h3>
                    <button onClick={() => onSave(tempValue)} className="text-[#a855f7] font-bold text-sm">Salvar</button>
                </div>
                {multiline ? (
                    <textarea 
                        className="w-full bg-[#2C2C2E] text-white p-3 rounded-xl outline-none min-h-[100px] resize-none border border-white/10 focus:border-[#a855f7]"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        autoFocus
                    />
                ) : (
                    <input 
                        type="text" 
                        className="w-full bg-[#2C2C2E] text-white p-3 rounded-xl outline-none border border-white/10 focus:border-[#a855f7]"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        autoFocus
                    />
                )}
            </div>
        </ModalWrapper>
    );
};

const EditGenderModal = ({ value, onSave, onClose }: any) => {
    return (
        <ModalWrapper onClose={onClose}>
            <div className="p-4">
                <h3 className="text-white font-bold text-center mb-6">Gênero</h3>
                <div className="space-y-2">
                    <button onClick={() => onSave('male')} className="w-full p-4 bg-[#2C2C2E] rounded-xl flex items-center justify-between hover:bg-[#3a3a3c]">
                        <span className="text-white font-medium">Masculino</span>
                        {value === 'male' && <CheckIcon className="w-5 h-5 text-[#a855f7]" />}
                    </button>
                    <button onClick={() => onSave('female')} className="w-full p-4 bg-[#2C2C2E] rounded-xl flex items-center justify-between hover:bg-[#3a3a3c]">
                        <span className="text-white font-medium">Feminino</span>
                        {value === 'female' && <CheckIcon className="w-5 h-5 text-[#a855f7]" />}
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
};

const EditDateModal = ({ value, onSave, onClose }: any) => {
    const [date, setDate] = useState(value);
    return (
        <ModalWrapper onClose={onClose}>
            <div className="p-4">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={onClose} className="text-gray-400 text-sm">Cancelar</button>
                    <h3 className="text-white font-bold">Aniversário</h3>
                    <button onClick={() => onSave(date)} className="text-[#a855f7] font-bold text-sm">Confirmar</button>
                </div>
                <input 
                    type="date" 
                    value={date ? date.split('/').reverse().join('-') : ''} 
                    onChange={(e) => {
                        if (!e.target.value) {
                           setDate('');
                           return;
                        }
                        const d = new Date(e.target.value);
                        if (!isNaN(d.getTime())) {
                            const formatted = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
                            setDate(formatted);
                        }
                    }}
                    className="w-full bg-[#2C2C2E] text-white p-4 rounded-xl outline-none scheme-dark"
                />
            </div>
        </ModalWrapper>
    );
};

const EditSelectionModal = ({ title, options, value, onSave, onClose }: any) => {
    return (
        <ModalWrapper onClose={onClose}>
            <div className="p-4 max-h-[50vh] overflow-y-auto scrollbar-hide">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold text-base">{title}</h3>
                    <button onClick={onClose}><CloseIcon className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="space-y-1">
                    {options.map((opt: string) => (
                        <button 
                            key={opt} 
                            onClick={() => onSave(opt)}
                            className="w-full p-3 rounded-lg flex items-center justify-between hover:bg-[#2C2C2E] transition-colors"
                        >
                            <span className={`text-sm ${value === opt ? 'text-[#a855f7] font-bold' : 'text-gray-300'}`}>{opt}</span>
                            {value === opt && <CheckIcon className="w-4 h-4 text-[#a855f7]" />}
                        </button>
                    ))}
                </div>
            </div>
        </ModalWrapper>
    );
};

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ user, onClose, onSave, addToast }) => {
    const [formData, setFormData] = useState({
        name: user.name,
        gender: user.gender,
        birthday: user.birthday || 'Não definido',
        bio: user.bio || 'Olá! Bem-vindo ao meu perfil.',
        location: user.location || 'Não especificado',
        emotionalState: user.emotionalState || 'Não especificado',
        tags: user.tags || 'Não especificado',
        profession: user.profession || 'Não especificado'
    });
    
    const [galleryPhotos, setGalleryPhotos] = useState<Obra[]>([]);
    
    useEffect(() => {
        setFormData({
            name: user.name,
            gender: user.gender,
            birthday: user.birthday || 'Não definido',
            bio: user.bio || 'Olá! Bem-vindo ao meu perfil.',
            location: user.location || 'Não especificado',
            emotionalState: user.emotionalState || 'Não especificado',
            tags: user.tags || 'Não especificado',
            profession: user.profession || 'Não especificado'
        });
        setGalleryPhotos(user.obras?.filter(o => o.type === 'image') || []);
    }, [user]);
    
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const mainPhotoInputRef = useRef<HTMLInputElement>(null);
    const galleryPhotoInputRef = useRef<HTMLInputElement>(null);
    const dragItemIndex = useRef<number | null>(null);
    const dragOverItemIndex = useRef<number | null>(null);

    const totalPhotoCount = 1 + galleryPhotos.length;

    const menuItems = [
        { id: 'name', label: 'Apelido', value: formData.name },
        { id: 'gender', label: 'Gênero', value: formData.gender === 'male' ? 'Masculino' : formData.gender === 'female' ? 'Feminino' : 'Não especificado' },
        { id: 'birthday', label: 'Aniversário', value: formData.birthday },
        { id: 'bio', label: 'Apresentar-se', value: formData.bio },
        { id: 'location', label: 'Residência atual', value: formData.location },
        { id: 'emotionalState', label: 'Estado emocional', value: formData.emotionalState },
        { id: 'tags', label: 'Tags', value: formData.tags },
        { id: 'profession', label: 'Profissão', value: formData.profession },
    ];
    
    const handleUpdate = async (field: string, val: any) => {
        setFormData(prev => ({ ...prev, [field]: val }));
        setActiveModal(null);
        await onSave({ [field]: val });
    };

    const handleDeletePhoto = (photoId: string) => {
        const newGalleryPhotos = galleryPhotos.filter(o => o.id !== photoId);
        setGalleryPhotos(newGalleryPhotos);
        onSave({ obras: newGalleryPhotos });
        addToast?.(ToastType.Success, "Foto removida!");
    };
    
    const handleAddPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const newObra: Obra = { id: `obra-${Date.now()}`, url: e.target?.result as string, type: 'image' };
            const newGalleryPhotos = [...galleryPhotos, newObra];
            setGalleryPhotos(newGalleryPhotos);
            onSave({ obras: newGalleryPhotos });
            addToast?.(ToastType.Success, "Foto adicionada!");
        };
        reader.readAsDataURL(file);
    };

    const handleAvatarUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            onSave({ avatarUrl: e.target?.result as string });
            addToast?.(ToastType.Success, "Avatar atualizado!");
        };
        reader.readAsDataURL(file);
    };
    
    const handleDragSort = () => {
        if (dragItemIndex.current === null || dragOverItemIndex.current === null) return;
        
        const _galleryPhotos = [...galleryPhotos];
        const draggedItem = _galleryPhotos.splice(dragItemIndex.current, 1)[0];
        _galleryPhotos.splice(dragOverItemIndex.current, 0, draggedItem);
        
        dragItemIndex.current = null;
        dragOverItemIndex.current = null;
        
        setGalleryPhotos(_galleryPhotos);
        onSave({ obras: _galleryPhotos });
    };

    return (
        <div className="fixed inset-0 z-[140] bg-[#121212] flex flex-col font-sans animate-in slide-in-from-right duration-300 overflow-y-auto scrollbar-hide outline-none overflow-x-hidden w-full max-w-[100vw]" tabIndex={0}>
            <input type="file" ref={mainPhotoInputRef} onChange={handleAvatarUpdate} className="hidden" accept="image/*" />
            <input type="file" ref={galleryPhotoInputRef} onChange={handleAddPhoto} className="hidden" accept="image/*" />

            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#121212] sticky top-0 z-10 w-full">
                <button onClick={onClose}><ChevronLeftIcon className="w-6 h-6 text-white" /></button>
                <h2 className="text-white font-bold text-lg">Editar o perfil</h2>
                <button onClick={onClose} className="text-[#a855f7] font-bold text-sm">Concluído</button>
            </div>
            <div className="flex-1 pb-10 w-full">
                <div className="bg-[#1C1C1E] mx-4 mt-4 p-3 rounded-lg border border-blue-500/30 bg-blue-500/10">
                    <p className="text-blue-200 text-xs leading-relaxed">Faça upload de fotos reais e nítidas, deixe o destino começar no avatar da beleza.</p>
                </div>
                <div className="px-4 mt-4 mb-6 w-full">
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 w-full">
                        {/* Main Avatar (Not Draggable) */}
                        <div 
                            className="relative w-24 h-24 flex-shrink-0 group cursor-pointer"
                            onClick={() => mainPhotoInputRef.current?.click()}
                        >
                            <img src={user.avatarUrl} className="w-full h-full object-cover rounded-xl" />
                            <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white font-bold">Retrato</div>
                        </div>

                        {/* Draggable Gallery Photos */}
                        {galleryPhotos.map((photo, index) => (
                            <div 
                                key={photo.id} 
                                className="relative w-24 h-24 flex-shrink-0 group cursor-grab active:cursor-grabbing"
                                draggable
                                onDragStart={() => (dragItemIndex.current = index)}
                                onDragEnter={() => (dragOverItemIndex.current = index)}
                                onDragEnd={handleDragSort}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <img src={photo.url} className="w-full h-full object-cover rounded-xl" />
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }} 
                                    className="absolute top-1 right-1 bg-black/60 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <TrashIcon className="w-3 h-3 text-white" />
                                </button>
                            </div>
                        ))}

                        {totalPhotoCount < 9 && (
                            <div onClick={() => galleryPhotoInputRef.current?.click()} className="w-24 h-24 bg-[#1C1C1E] rounded-xl flex items-center justify-center border border-white/10 flex-shrink-0 cursor-pointer hover:bg-[#2C2C2E] transition-colors">
                                <PlusIcon className="w-8 h-8 text-gray-500" />
                            </div>
                        )}
                    </div>
                    <p className="text-gray-500 text-[10px] mt-1">{totalPhotoCount}/9 Clique para ver e apagar imagens, segure para ordenar</p>
                </div>
                <div className="flex flex-col w-full">
                    {menuItems.map((item) => (
                        <div key={item.id} onClick={() => setActiveModal(item.id)} className="flex items-center justify-between py-4 px-4 border-b border-white/5 active:bg-white/5 transition-colors cursor-pointer w-full">
                            <span className="text-white font-bold text-sm">{item.label}</span>
                            <div className="flex items-center gap-2"><span className="text-gray-400 text-sm text-right truncate max-w-[150px]">{item.value}</span><ChevronRightIcon className="w-4 h-4 text-gray-600" /></div>
                        </div>
                    ))}
                </div>
            </div>
            {activeModal === 'name' && <EditInputModal title="Apelido" value={formData.name} onSave={(val: string) => handleUpdate('name', val)} onClose={() => setActiveModal(null)} />}
            {activeModal === 'gender' && <EditGenderModal value={formData.gender} onSave={(val: string) => handleUpdate('gender', val)} onClose={() => setActiveModal(null)} />}
            {activeModal === 'birthday' && <EditDateModal value={formData.birthday} onSave={(val: string) => handleUpdate('birthday', val)} onClose={() => setActiveModal(null)} />}
            {activeModal === 'bio' && <EditInputModal title="Apresentar-se" value={formData.bio} onSave={(val: string) => handleUpdate('bio', val)} onClose={() => setActiveModal(null)} multiline />}
            {activeModal === 'location' && <EditInputModal title="Residência atual" value={formData.location} onSave={(val: string) => handleUpdate('location', val)} onClose={() => setActiveModal(null)} />}
            {activeModal === 'emotionalState' && <EditSelectionModal title="Estado Emocional" options={['Solteiro(a)', 'Namorando', 'Casado(a)', 'Enrolado(a)', 'Não especificado']} value={formData.emotionalState} onSave={(val: string) => handleUpdate('emotionalState', val)} onClose={() => setActiveModal(null)} />}
            {activeModal === 'tags' && <EditInputModal title="Tags" value={formData.tags} onSave={(val: string) => handleUpdate('tags', val)} onClose={() => setActiveModal(null)} />}
            {activeModal === 'profession' && <EditInputModal title="Profissão" value={formData.profession} onSave={(val: string) => handleUpdate('profession', val)} onClose={() => setActiveModal(null)} />}
        </div>
    );
};

export default EditProfileScreen;