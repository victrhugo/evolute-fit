export type Goal = 'Perder gordura' | 'Ganhar massa muscular' | 'Manter peso e condicionamento' | 'Melhorar saúde geral' | 'Ganhar força';
export type Gender = 'Masculino' | 'Feminino' | 'Prefiro não informar';
export type Level = 'Iniciante' | 'Intermediário' | 'Avançado';
export type Frequency = '2x' | '3x' | '4x' | '5x' | '6x';
export type Duration = '30 min' | '45 min' | '60 min' | '75 min' | '90 min';

export interface UserData {
  age: number;
  gender: Gender;
  weight: number;
  height: number;
  goal: Goal;
  level: Level;
  frequency: Frequency;
  duration: Duration;
  restrictions?: string;
  preferences?: string;
}

export interface Meal {
  name: string;
  items: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WorkoutDay {
  day: string;
  focus: string;
  exercises: { name: string; sets: string; reps: string; rest: string }[];
}

export interface GeneratedPlan {
  userData: UserData;
  nutrition: {
    tdee: number;
    targetCalories: number;
    macros: { protein: number; carbs: number; fat: number };
    meals: Meal[];
  };
  workout: WorkoutDay[];
  strategy: string;
  tips: string[];
  timeline: { week: number; expectation: string }[];
}

export function generatePlan(data: UserData): GeneratedPlan {
  // 1. Calculate BMR
  let bmr = 0;
  const bmrMale = 10 * data.weight + 6.25 * data.height - 5 * data.age + 5;
  const bmrFemale = 10 * data.weight + 6.25 * data.height - 5 * data.age - 161;

  if (data.gender === 'Masculino') {
    bmr = bmrMale;
  } else if (data.gender === 'Feminino') {
    bmr = bmrFemale;
  } else {
    bmr = (bmrMale + bmrFemale) / 2;
  }

  // 2. Calculate TDEE
  let multiplier = 1.375;
  if (['3x', '4x'].includes(data.frequency)) multiplier = 1.55;
  if (['5x', '6x'].includes(data.frequency)) multiplier = 1.725;
  
  const tdee = Math.round(bmr * multiplier);

  // 3. Adjust calories for goal
  let targetCalories = tdee;
  if (data.goal === 'Perder gordura') {
    targetCalories = tdee - 400;
    const minCalories = data.gender === 'Feminino' ? 1200 : 1500;
    if (targetCalories < minCalories) targetCalories = minCalories;
  } else if (data.goal === 'Ganhar massa muscular' || data.goal === 'Ganhar força') {
    targetCalories = tdee + 300;
  }

  // 4. Calculate Macros
  let proteinPerKg = 1.6;
  if (data.goal === 'Ganhar massa muscular' || data.goal === 'Ganhar força') proteinPerKg = 1.8;
  if (data.goal === 'Perder gordura') proteinPerKg = 2.0;

  const protein = Math.round(data.weight * proteinPerKg);
  const fat = Math.round((targetCalories * 0.25) / 9); // 25% from fat, 9 kcal/g
  const carbs = Math.round((targetCalories - (protein * 4 + fat * 9)) / 4);

  // 5. Generate Meal Plan
  const isVegetarian = data.restrictions?.toLowerCase().includes('vegetarian');
  const isVegan = data.restrictions?.toLowerCase().includes('vegan');
  const isLactoseFree = data.restrictions?.toLowerCase().includes('lactose');

  const meals: Meal[] = [
    {
      name: "Café da Manhã",
      items: isVegan 
        ? ["Pão integral (2 fatias)", "Pasta de amendoim (1 colher de sopa)", "Vitamina de proteína vegetal com banana"]
        : ["Ovos mexidos (2-3 unidades)", "Pão francês ou tapioca (1 unidade)", isLactoseFree ? "Café preto" : "Café com leite"],
      calories: Math.round(targetCalories * 0.25),
      protein: Math.round(protein * 0.25),
      carbs: Math.round(carbs * 0.25),
      fat: Math.round(fat * 0.25)
    },
    {
      name: "Lanche da Manhã",
      items: isVegan
        ? ["Mix de castanhas e nozes (30g)", "1 Maçã"]
        : [isLactoseFree ? "Fruta com aveia" : "Iogurte natural", "1 Porção de fruta (banana ou maçã)"],
      calories: Math.round(targetCalories * 0.10),
      protein: Math.round(protein * 0.10),
      carbs: Math.round(carbs * 0.15),
      fat: Math.round(fat * 0.10)
    },
    {
      name: "Almoço",
      items: [
        "Arroz (preferência integral ou parboilizado, 4-5 colheres)",
        "Feijão (1 concha)",
        isVegan ? "Tofu ou proteína de soja temperada" : "Peito de frango grelhado ou patinho moído (120-150g)",
        "Salada de folhas verdes à vontade",
        "Azeite de oliva (1 colher de chá)"
      ],
      calories: Math.round(targetCalories * 0.30),
      protein: Math.round(protein * 0.35),
      carbs: Math.round(carbs * 0.30),
      fat: Math.round(fat * 0.30)
    },
    {
      name: "Lanche da Tarde / Pré-treino",
      items: isVegan
        ? ["Vitamina de leite de aveia com mamão", "Aveia em flocos"]
        : ["Pão de forma com queijo branco (se sem lactose, usar patê de atum)", "Suco de uva integral ou café"],
      calories: Math.round(targetCalories * 0.15),
      protein: Math.round(protein * 0.10),
      carbs: Math.round(carbs * 0.20),
      fat: Math.round(fat * 0.10)
    },
    {
      name: "Jantar",
      items: [
        "Carboidrato leve (mandioca, batata doce ou cuscuz)",
        isVegan ? "Lentilha ou grão de bico" : "Ovos cozidos ou filé de tilápia/frango (100-120g)",
        "Vegetais refogados (brócolis, cenoura)"
      ],
      calories: Math.round(targetCalories * 0.20),
      protein: Math.round(protein * 0.20),
      carbs: Math.round(carbs * 0.10),
      fat: Math.round(fat * 0.25)
    }
  ];

  // 6. Generate Workout Plan
  const prefersHome = data.preferences?.toLowerCase().includes('casa') || data.preferences?.toLowerCase().includes('home');
  const restTime = data.level === 'Iniciante' ? '90s' : '60-90s';
  const sets = data.level === 'Iniciante' ? '3' : data.level === 'Intermediário' ? '3-4' : '4-5';
  const reps = data.level === 'Iniciante' ? '8-12' : data.level === 'Intermediário' ? '8-15' : '6-15 (variado)';

  const exercisesHome = {
    push: [
      { name: "Flexão de braço (com ou sem joelhos)", sets, reps, rest: restTime },
      { name: "Mergulho no banco/cadeira", sets, reps, rest: restTime },
      { name: "Desenvolvimento com mochila/pesos improvisados", sets, reps, rest: restTime }
    ],
    pull: [
      { name: "Remada com toalha na porta ou mochila", sets, reps, rest: restTime },
      { name: "Puxada Superman (deitado no chão)", sets, reps, rest: restTime },
      { name: "Rosca bíceps com galões/pesos", sets, reps, rest: restTime }
    ],
    legs: [
      { name: "Agachamento livre", sets, reps, rest: restTime },
      { name: "Afundo/Avanço alternado", sets, reps, rest: restTime },
      { name: "Elevação pélvica", sets, reps, rest: restTime },
      { name: "Panturrilha em pé", sets, reps, rest: restTime }
    ],
    core: [
      { name: "Prancha abdominal", sets: "3", reps: "30-60s", rest: restTime },
      { name: "Abdominal supra", sets, reps, rest: restTime }
    ]
  };

  const exercisesGym = {
    push: [
      { name: "Supino Reto (Barra ou Halteres)", sets, reps, rest: restTime },
      { name: "Desenvolvimento com Halteres", sets, reps, rest: restTime },
      { name: "Tríceps Pulley ou Testa", sets, reps, rest: restTime },
      { name: "Elevação Lateral", sets, reps, rest: restTime }
    ],
    pull: [
      { name: "Puxada Frontal ou Barra Fixa", sets, reps, rest: restTime },
      { name: "Remada Curvada", sets, reps, rest: restTime },
      { name: "Rosca Direta", sets, reps, rest: restTime },
      { name: "Crucifixo Inverso", sets, reps, rest: restTime }
    ],
    legs: [
      { name: "Agachamento Livre ou Hack", sets, reps, rest: restTime },
      { name: "Leg Press", sets, reps, rest: restTime },
      { name: "Cadeira Extensora", sets, reps, rest: restTime },
      { name: "Mesa Flexora", sets, reps, rest: restTime },
      { name: "Panturrilha no Smith ou Gêmeos", sets, reps, rest: restTime }
    ],
    fullbody: [
      { name: "Agachamento ou Leg Press", sets, reps, rest: restTime },
      { name: "Supino ou Flexão", sets, reps, rest: restTime },
      { name: "Puxada ou Remada", sets, reps, rest: restTime },
      { name: "Desenvolvimento", sets, reps, rest: restTime },
      { name: "Prancha abdominal", sets: "3", reps: "Máximo", rest: restTime }
    ]
  };

  const ex = prefersHome ? exercisesHome : exercisesGym;
  let workoutDays: WorkoutDay[] = [];

  switch (data.frequency) {
    case '2x':
      workoutDays = [
        { day: "Dia 1", focus: "Full Body A", exercises: ex.fullbody || [...ex.legs.slice(0,2), ...ex.push.slice(0,2), ...ex.pull.slice(0,2)] },
        { day: "Dia 2", focus: "Full Body B", exercises: ex.fullbody || [...ex.legs.slice(0,2), ...ex.push.slice(0,2), ...ex.pull.slice(0,2)] }
      ];
      break;
    case '3x':
      workoutDays = [
        { day: "Dia 1", focus: "Push (Peito, Ombro, Tríceps)", exercises: [...ex.push, ...(ex.core || [])] },
        { day: "Dia 2", focus: "Pull (Costas, Bíceps)", exercises: [...ex.pull, ...(ex.core || [])] },
        { day: "Dia 3", focus: "Legs (Pernas completas)", exercises: ex.legs }
      ];
      break;
    case '4x':
      workoutDays = [
        { day: "Dia 1", focus: "Superiores A", exercises: [...ex.push.slice(0,2), ...ex.pull.slice(0,2), ...(ex.core || [])] },
        { day: "Dia 2", focus: "Inferiores A", exercises: ex.legs },
        { day: "Dia 3", focus: "Superiores B", exercises: [...ex.push.slice(2), ...ex.pull.slice(2), ...(ex.core || [])] },
        { day: "Dia 4", focus: "Inferiores B", exercises: ex.legs }
      ];
      break;
    case '5x':
      workoutDays = [
        { day: "Dia 1", focus: "Push", exercises: ex.push },
        { day: "Dia 2", focus: "Pull", exercises: ex.pull },
        { day: "Dia 3", focus: "Legs", exercises: ex.legs },
        { day: "Dia 4", focus: "Upper Body", exercises: [...ex.push.slice(0,2), ...ex.pull.slice(0,2)] },
        { day: "Dia 5", focus: "Lower Body", exercises: ex.legs }
      ];
      break;
    case '6x':
      workoutDays = [
        { day: "Dia 1", focus: "Push", exercises: ex.push },
        { day: "Dia 2", focus: "Pull", exercises: ex.pull },
        { day: "Dia 3", focus: "Legs", exercises: ex.legs },
        { day: "Dia 4", focus: "Push", exercises: ex.push },
        { day: "Dia 5", focus: "Pull", exercises: ex.pull },
        { day: "Dia 6", focus: "Legs", exercises: ex.legs }
      ];
      break;
  }

  // 7. Generate Strategy and Tips
  let strategy = "";
  if (data.goal === 'Perder gordura') {
    strategy = `O foco central do seu plano é criar um déficit calórico sustentável (-400 kcal) para promover a queima de gordura preservando a massa magra, utilizando uma alta ingestão de proteínas (${proteinPerKg}g/kg).`;
  } else if (data.goal === 'Ganhar massa muscular' || data.goal === 'Ganhar força') {
    strategy = `Desenhamos este plano com um superávit calórico controlado (+300 kcal) e um volume de treino otimizado para a hipertrofia. O foco é progressão de carga mantendo os nutrientes altos.`;
  } else {
    strategy = `Seu plano visa a manutenção e otimização da composição corporal, mantendo calorias de manutenção para permitir melhora na saúde geral, flexibilidade metabólica e constância.`;
  }

  const tips = [
    "Beba pelo menos 3 a 4 litros de água por dia. A hidratação é essencial para o metabolismo e recuperação muscular.",
    "Tente manter uma rotina de sono de 7 a 8 horas por noite. É durante o descanso que o corpo evolui.",
    data.goal === 'Perder gordura' ? "Não tenha pressa com a balança. Focar nas medidas e no espelho é mais importante que o peso total." : "Mantenha um diário de treino anotando os pesos e repetições para garantir progressão.",
    "Priorize alimentos de verdade (arroz, feijão, carnes, ovos, frutas) na maior parte do tempo. Deixe o 'lixo' para momentos pontuais.",
    "A consistência supera a perfeição. Fazer o básico 80% do tempo trará muito mais resultado que o extremo por 1 semana."
  ];

  const timeline = [
    { week: 4, expectation: data.goal === 'Perder gordura' ? "Redução inicial de inchaço/retenção líquida e primeiros centímetros perdidos na cintura." : "Aumento de força notável e mais disposição." },
    { week: 8, expectation: "Mudanças visíveis no espelho. Roupas vestindo melhor. O hábito já começa a ficar natural." },
    { week: 12, expectation: data.goal === 'Perder gordura' ? "Perda substancial de gordura consolidada. Melhora forte no condicionamento cardiorrespiratório." : "Aumento visível de volume muscular e densidade. Adaptação completa ao volume de treino." }
  ];

  return {
    userData: data,
    nutrition: {
      tdee,
      targetCalories,
      macros: { protein, carbs, fat },
      meals
    },
    workout: workoutDays,
    strategy,
    tips,
    timeline
  };
}
