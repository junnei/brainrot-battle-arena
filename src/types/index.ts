export interface User {
  id: string;
  username: string;
  email: string;
  user_id?: string;
}

export interface Brainrot {
  id: string;
  userId: string;
  name: string;
  description: string;
  imageUrl?: string;
  createdAt: Date;
  elo: number;
  stats: {
    wins: number;
    losses: number;
    totalBattles: number;
  };
}

export interface Battle {
  id: string;
  playerBrainrotId: string;
  opponentBrainrotId: string;
  winnerId: string | null;
  createdAt: Date;
  playerBrainrot?: Brainrot;
  opponentBrainrot?: Brainrot;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  signup: () => Promise<void>;
  logout: () => Promise<boolean>;
  updateUser: (updatedInfo: Partial<User>) => Promise<void>;
}

export interface BrainrotContextType {
  brainrots: Brainrot[];
  userBrainrots: Brainrot[];
  selectedBrainrot: Brainrot | null;
  opponentBrainrot: Brainrot | null;
  battleResult: Brainrot | null;
  battles: Battle[];
  isLoading: boolean;
  error: string | null;
  createBrainrot: (brainrot: Omit<Brainrot, 'id' | 'userId' | 'createdAt' | 'stats'>) => Promise<void>;
  selectBrainrot: (brainrotId: string) => void;
  findOpponent: () => void;
  startBattle: () => void;
  resetBattle: () => void;
  getUserBattles: (userId: string) => Battle[];
  getBrainrotBattles: (brainrotId: string) => Battle[];
  setBrainrots: (brainrots: Brainrot[]) => void;
  setSelectedBrainrot: (brainrot: Brainrot | null) => void;
  setOpponentBrainrot: (brainrot: Brainrot | null) => void;
  deleteBrainrot: (brainrotId: string) => Promise<void>;
  updateBrainrot: (brainrotId: string, updatedData: Partial<Omit<Brainrot, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
  setBattles: (battles: Battle[]) => void;
  uploadBrainrotImage: (file: File) => Promise<string>;
}