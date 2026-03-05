// ==========================================
//              GLOBAL TYPES
// ==========================================

export type UserState = 'lethargic' | 'stressed' | 'ready' | 'skip' | null;

export interface ChecklistItem {
    id: string;
    text: string;
    selected: boolean;
}

export interface Stats {
    totalMinutes: number;
    sessions: number;
}
