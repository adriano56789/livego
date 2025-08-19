import { apiClient } from './apiClient';
import type { SelectableOption } from '../types';

export const getGenders = (): Promise<SelectableOption[]> => {
    return apiClient('/api/genders');
};

export const getCountries = (): Promise<SelectableOption[]> => {
    return apiClient('/api/countries');
};

export const getEmotionalStates = (): Promise<SelectableOption[]> => {
    return apiClient('/api/emotional_states');
};

export const getProfessions = (): Promise<SelectableOption[]> => {
    return apiClient('/api/professions');
};

export const getLanguages = (): Promise<SelectableOption[]> => {
    return apiClient('/api/languages');
};
