export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface DayData {
  tasks: Task[];
  score: number | null; // null implies day is not yet concluded or no data
  locked: boolean;
}

export interface ScoreHistory {
  date: string; // YYYY-MM-DD
  score: number;
}
