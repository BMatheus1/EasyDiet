import { create } from "zustand";

type Meal = "lunch" | "dinner";

type BuilderState = {
  weeks: number;
  daysPerWeek: number;
  mealTypes: Meal[];
  grams: Record<Meal, { protein: number; carb: number; vegetable: number }>;
  proteins: string[];
  carbs: string[];
  vegetables: string[];
  restrictions: string[];
  address: {
    zip_code: string;
    street: string;
    number: string;
    district: string;
    city: string;
    complement: string;
    reference: string;
  };
  set: <K extends keyof BuilderState>(key: K, value: BuilderState[K]) => void;
  toggleIn: (key: "proteins" | "carbs" | "vegetables" | "restrictions", value: string) => void;
};

export const useBuilderStore = create<BuilderState>((set) => ({
  weeks: 1,
  daysPerWeek: 5,
  mealTypes: ["lunch", "dinner"],
  grams: {
    lunch: { protein: 150, carb: 100, vegetable: 100 },
    dinner: { protein: 120, carb: 80, vegetable: 120 }
  },
  proteins: ["peito-frango"],
  carbs: ["arroz-integral"],
  vegetables: ["brocolis"],
  restrictions: [],
  address: {
    zip_code: "",
    street: "",
    number: "",
    district: "Cooperativa",
    city: "Sao Bernardo do Campo",
    complement: "",
    reference: ""
  },
  set: (key, value) => set({ [key]: value } as Partial<BuilderState>),
  toggleIn: (key, value) =>
    set((state) => {
      const list = state[key] as string[];
      return { [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] } as Partial<BuilderState>;
    })
}));
