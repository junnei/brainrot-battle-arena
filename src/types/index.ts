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
  riskLevel: number;
  stats: {
    wins: number;
    losses: number;
    totalBattles: number;
  };
}

export interface Battle {
  id: string;                       // 배틀의 고유 식별자 (10자리 16진수 ID)
  playerBrainrotId: string;         // 플레이어 브레인롯 ID (외래 키)
  opponentBrainrotId: string;       // 상대방 브레인롯 ID (외래 키) 
  winnerId: string | null;          // 승자 브레인롯 ID (외래 키, 무승부인 경우 null)
  createdAt: Date;                  // 배틀 생성 시간
  playerBrainrot?: Brainrot;        // 플레이어 브레인롯 객체 (클라이언트 참조)
  opponentBrainrot?: Brainrot;      // 상대방 브레인롯 객체 (클라이언트 참조)
  battleResult?: 'WIN' | 'LOSS' | 'DRAW'; // 배틀 결과 ('WIN', 'LOSS', 'DRAW')
  battleNarrative?: string;         // 배틀 과정 설명 텍스트
  isPlayerWon?: boolean;            // 플레이어가 이겼는지 여부 (계산된 필드)
  isDraw?: boolean;                 // 무승부인지 여부 (계산된 필드)
  playerStartElo?: number;          // 전투 시작 전 플레이어의 ELO 점수
  playerEndElo?: number;            // 전투 후 플레이어의 ELO 점수
  opponentStartElo?: number;        // 전투 시작 전 상대방의 ELO 점수
  opponentEndElo?: number;          // 전투 후 상대방의 ELO 점수
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
  currentBattle: Battle | null;
  battles: Battle[];
  isLoading: boolean;
  error: string | null;
  createBrainrot: (brainrot: Omit<Brainrot, 'id' | 'userId' | 'createdAt' | 'stats'>) => Promise<void>;
  selectBrainrot: (brainrotId: string) => void;
  findOpponent: () => void;
  startBattle: () => Promise<void>;
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