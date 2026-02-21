
import { db, saveDb, CURRENT_USER_ID } from '../services/database';
import { User, Obra } from '../types';
import { webSocketServerInstance } from '../services/websocket';

const calculateAgeFromDate = (dateString: string): number | null => {
    if (!dateString) return null;
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
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

export const ProfileController = {
    // --- Gerenciamento de Imagens/Galeria ---
    async getImages(req: any, res: any) {
        const user = db.users.get(CURRENT_USER_ID);
        if (!user) return res.status(404).json({ error: "User not found" });
        return res.status(200).json(user.obras || []);
    },

    async deleteImage(req: any, res: any) {
        const { imageId } = req.params;
        const user = db.users.get(CURRENT_USER_ID);
        if (!user || !user.obras) return res.status(404).json({ error: "Image not found" });

        user.obras = user.obras.filter(obra => obra.id !== imageId);
        
        // Se a foto deletada for o avatar, define a primeira da lista (se houver) como novo avatar
        if (user.avatarUrl && user.obras.length > 0 && !user.obras.find(o => o.url === user.avatarUrl)) {
             user.avatarUrl = user.obras[0].url;
        }

        // Remove do feed global também
        db.photoFeed = db.photoFeed.filter(p => p.id !== imageId);

        saveDb();
        webSocketServerInstance.broadcastUserUpdate(user);
        return res.status(200).json({ success: true });
    },

    async reorderImages(req: any, res: any) {
        const { orderedIds } = req.body;
        const user = db.users.get(CURRENT_USER_ID);
        if (!user || !user.obras) return res.status(404).json({ error: "User or images not found" });

        const newOrder: Obra[] = [];
        orderedIds.forEach((id: string) => {
            const found = user.obras?.find(o => o.id === id);
            if (found) newOrder.push(found);
        });
        
        // Adiciona imagens que possam ter ficado de fora por segurança
        user.obras.forEach(o => {
            if (!newOrder.find(n => n.id === o.id)) newOrder.push(o);
        });

        user.obras = newOrder;
        // Atualiza o avatar para ser a primeira foto
        if (newOrder.length > 0) user.avatarUrl = newOrder[0].url;

        saveDb();
        webSocketServerInstance.broadcastUserUpdate(user);
        return res.status(200).json({ success: true, images: user.obras });
    },

    // --- Atualização de Campos Escalares (Apelido, Bio, etc) ---
    async updateField(req: any, res: any) {
        const { field } = req.params; // ex: 'apelido', 'genero'
        const { value } = req.body;
        const user = db.users.get(CURRENT_USER_ID);
        
        if (!user) return res.status(404).json({ error: "User not found" });

        let userProp: keyof User | null = null;

        // Mapeia o parâmetro da URL para a propriedade do objeto User
        switch(field) {
            case 'apelido': userProp = 'name'; break;
            case 'genero': userProp = 'gender'; break;
            case 'aniversario': userProp = 'birthday'; break;
            case 'apresentacao': userProp = 'bio'; break;
            case 'residencia': userProp = 'residence'; break;
            case 'estado-emocional': userProp = 'emotional_status'; break;
            case 'tags': userProp = 'tags'; break;
            case 'profissao': userProp = 'profession'; break;
        }

        if (userProp) {
            (user as any)[userProp] = value;
            
            // Lógica especial para aniversário: recalcular idade
            if (userProp === 'birthday') {
                const newAge = calculateAgeFromDate(value);
                if (newAge !== null) user.age = newAge;
            }

            saveDb();
            webSocketServerInstance.broadcastUserUpdate(user);
            return res.status(200).json({ success: true });
        }

        return res.status(400).json({ error: "Invalid field" });
    }
};
