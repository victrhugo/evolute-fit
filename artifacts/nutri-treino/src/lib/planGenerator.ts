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

function isFatLoss(goal: Goal) {
  return goal === 'Perder gordura';
}
function isMassGain(goal: Goal) {
  return goal === 'Ganhar massa muscular' || goal === 'Ganhar força';
}

export function generatePlan(data: UserData): GeneratedPlan {
  // 1. Calculate BMR (Mifflin-St Jeor)
  const bmrMale   = 10 * data.weight + 6.25 * data.height - 5 * data.age + 5;
  const bmrFemale = 10 * data.weight + 6.25 * data.height - 5 * data.age - 161;

  let bmr = 0;
  if (data.gender === 'Masculino') bmr = bmrMale;
  else if (data.gender === 'Feminino') bmr = bmrFemale;
  else bmr = (bmrMale + bmrFemale) / 2;

  // 2. Calculate TDEE
  let multiplier = 1.375;
  if (['3x', '4x'].includes(data.frequency)) multiplier = 1.55;
  if (['5x', '6x'].includes(data.frequency)) multiplier = 1.725;
  const tdee = Math.round(bmr * multiplier);

  // 3. Adjust calories strictly based on goal — no overlap
  let targetCalories = tdee;
  if (isFatLoss(data.goal)) {
    // Caloric DEFICIT — mandatory for fat loss
    targetCalories = tdee - 500;
    const minCalories = data.gender === 'Feminino' ? 1200 : 1500;
    if (targetCalories < minCalories) targetCalories = minCalories;
  } else if (isMassGain(data.goal)) {
    // Caloric SURPLUS — mandatory for mass/strength gain
    targetCalories = tdee + 350;
  }
  // Maintenance: stays at tdee

  // 4. Calculate Macros (goal-specific protein targets)
  let proteinPerKg = 1.6;
  if (isMassGain(data.goal)) proteinPerKg = 2.0;
  if (isFatLoss(data.goal)) proteinPerKg = 2.2; // Higher protein preserves muscle in deficit

  const protein = Math.round(data.weight * proteinPerKg);
  const fat     = Math.round((targetCalories * 0.25) / 9);
  const carbs   = Math.round((targetCalories - (protein * 4 + fat * 9)) / 4);

  // 5. Generate Goal-Specific Meal Plan
  const isVegan       = data.restrictions?.toLowerCase().includes('vegan');
  const isVegetarian  = data.restrictions?.toLowerCase().includes('vegetar');
  const isLactoseFree = data.restrictions?.toLowerCase().includes('lactose');
  const noMeat        = isVegan || isVegetarian;

  function protein_source(large: boolean): string {
    if (isVegan)       return large ? "Tofu grelhado (180g) ou soja texturizada" : "Tofu ou grão de bico (120g)";
    if (isVegetarian)  return large ? "Omelete (3 ovos) ou queijo cottage" : "2 Ovos cozidos ou ricota";
    return large ? "Peito de frango grelhado (180g) ou patinho moído" : "Peito de frango (120g) ou atum";
  }

  let meals: Meal[];

  if (isFatLoss(data.goal)) {
    // FAT LOSS: baixa densidade calórica, alto volume de alimentos, foco em proteína
    meals = [
      {
        name: "Café da Manhã",
        items: isVegan
          ? ["Vitamina de leite de aveia com 1 scoop proteína vegetal", "1 Fatia de pão integral", "Café sem açúcar"]
          : ["Omelete de 3 claras + 1 ovo inteiro", "1 Fatia de pão integral", isLactoseFree ? "Café preto sem açúcar" : "Café com leite desnatado sem açúcar"],
        calories: Math.round(targetCalories * 0.22),
        protein: Math.round(protein * 0.28),
        carbs: Math.round(carbs * 0.18),
        fat: Math.round(fat * 0.20),
      },
      {
        name: "Lanche da Manhã",
        items: noMeat
          ? ["1 Maçã ou pera média", "30g de castanhas (punhado pequeno)"]
          : ["1 Maçã ou pera média", isLactoseFree ? "30g de amêndoas" : "1 Iogurte natural sem açúcar (0% gordura)"],
        calories: Math.round(targetCalories * 0.08),
        protein: Math.round(protein * 0.08),
        carbs: Math.round(carbs * 0.10),
        fat: Math.round(fat * 0.08),
      },
      {
        name: "Almoço",
        items: [
          "Arroz integral ou parboilizado (3 colheres de sopa)",
          "Feijão (1/2 concha — porção reduzida)",
          protein_source(true),
          "Salada verde à vontade (alface, rúcula, pepino, tomate)",
          "Azeite de oliva extravirgem (1 col. de chá)",
        ],
        calories: Math.round(targetCalories * 0.32),
        protein: Math.round(protein * 0.35),
        carbs: Math.round(carbs * 0.32),
        fat: Math.round(fat * 0.30),
      },
      {
        name: "Lanche da Tarde",
        items: noMeat
          ? ["1 Unidade de fruta (banana pequena ou kiwi)", "1 Punhado de castanhas (20g)"]
          : [isLactoseFree ? "1 Lata de atum com limão" : "1 Iogurte grego natural sem açúcar", "1 Fruta pequena (kiwi ou laranja)"],
        calories: Math.round(targetCalories * 0.10),
        protein: Math.round(protein * 0.12),
        carbs: Math.round(carbs * 0.12),
        fat: Math.round(fat * 0.10),
      },
      {
        name: "Jantar",
        items: [
          "Salada de folhas verdes à vontade",
          protein_source(false),
          "Brócolis, abobrinha ou couve-flor refogados",
          "Azeite de oliva (1 col. de chá) — sem carboidratos densos no jantar",
        ],
        calories: Math.round(targetCalories * 0.28),
        protein: Math.round(protein * 0.17),
        carbs: Math.round(carbs * 0.28),
        fat: Math.round(fat * 0.32),
      },
    ];
  } else if (isMassGain(data.goal)) {
    // MASS/STRENGTH GAIN: alta densidade calórica, superávit, foco em força
    meals = [
      {
        name: "Café da Manhã",
        items: isVegan
          ? ["Vitamina de banana com leite de aveia e 2 scoops proteína vegetal", "Pão integral (2 fatias) com pasta de amendoim", "1 Colher de mel"]
          : ["Ovos mexidos ou estrelados (3-4 ovos inteiros)", "Pão integral (2 fatias) com manteiga ou pasta de amendoim", isLactoseFree ? "Café com leite de aveia" : "Copo de leite integral", "1 Banana"],
        calories: Math.round(targetCalories * 0.27),
        protein: Math.round(protein * 0.28),
        carbs: Math.round(carbs * 0.28),
        fat: Math.round(fat * 0.28),
      },
      {
        name: "Lanche da Manhã",
        items: noMeat
          ? ["1 Banana com aveia (4 col. de sopa)", "Mix de castanhas e amendoim (40g)"]
          : [isLactoseFree ? "1 Banana com aveia e mel" : "Iogurte integral com granola e mel", "1 Banana ou 1 fatia de pão integral"],
        calories: Math.round(targetCalories * 0.13),
        protein: Math.round(protein * 0.12),
        carbs: Math.round(carbs * 0.15),
        fat: Math.round(fat * 0.12),
      },
      {
        name: "Almoço",
        items: [
          "Arroz integral ou parboilizado (5-6 colheres cheias)",
          "Feijão (1 concha cheia)",
          protein_source(true),
          "Vegetais refogados (cenoura, vagem)",
          "Azeite de oliva (1 col. de sopa) — para aumentar densidade calórica",
        ],
        calories: Math.round(targetCalories * 0.30),
        protein: Math.round(protein * 0.35),
        carbs: Math.round(carbs * 0.30),
        fat: Math.round(fat * 0.28),
      },
      {
        name: "Pré-Treino (1h antes)",
        items: noMeat
          ? ["Batata doce cozida (150g) ou banana (2 un.)", "30g de amendoim ou pasta de amendoim"]
          : ["Batata doce cozida (150g) ou 2 bananas", isLactoseFree ? "2 Ovos cozidos" : "1 Copo de leite integral com aveia e mel"],
        calories: Math.round(targetCalories * 0.13),
        protein: Math.round(protein * 0.10),
        carbs: Math.round(carbs * 0.18),
        fat: Math.round(fat * 0.10),
      },
      {
        name: "Jantar / Pós-Treino",
        items: [
          "Macarrão integral ou batata doce (150g cozida)",
          protein_source(true),
          "Vegetais refogados (brócolis, espinafre)",
          isLactoseFree ? "Azeite (1 col. de sopa)" : "Queijo cottage (100g) ou requeijão light",
        ],
        calories: Math.round(targetCalories * 0.17),
        protein: Math.round(protein * 0.15),
        carbs: Math.round(carbs * 0.09),
        fat: Math.round(fat * 0.22),
      },
    ];
  } else {
    // MAINTENANCE / GENERAL HEALTH: equilíbrio
    meals = [
      {
        name: "Café da Manhã",
        items: isVegan
          ? ["Pão integral (2 fatias) com pasta de amendoim", "Vitamina de proteína vegetal com banana"]
          : ["Ovos mexidos (2-3 unidades)", "Pão integral ou tapioca", isLactoseFree ? "Café preto" : "Café com leite"],
        calories: Math.round(targetCalories * 0.25),
        protein: Math.round(protein * 0.25),
        carbs: Math.round(carbs * 0.25),
        fat: Math.round(fat * 0.25),
      },
      {
        name: "Lanche da Manhã",
        items: noMeat
          ? ["Mix de castanhas (30g)", "1 Maçã"]
          : [isLactoseFree ? "Fruta com aveia" : "Iogurte natural", "1 Porção de fruta"],
        calories: Math.round(targetCalories * 0.10),
        protein: Math.round(protein * 0.10),
        carbs: Math.round(carbs * 0.15),
        fat: Math.round(fat * 0.10),
      },
      {
        name: "Almoço",
        items: [
          "Arroz parboilizado (4-5 colheres)",
          "Feijão (1 concha)",
          protein_source(true),
          "Salada de folhas verdes à vontade",
          "Azeite de oliva (1 col. de chá)",
        ],
        calories: Math.round(targetCalories * 0.30),
        protein: Math.round(protein * 0.35),
        carbs: Math.round(carbs * 0.30),
        fat: Math.round(fat * 0.30),
      },
      {
        name: "Lanche da Tarde / Pré-treino",
        items: noMeat
          ? ["Vitamina de leite de aveia com mamão", "Aveia em flocos (3 col.)"]
          : ["Pão integral com queijo branco ou atum", "Suco natural ou café"],
        calories: Math.round(targetCalories * 0.15),
        protein: Math.round(protein * 0.10),
        carbs: Math.round(carbs * 0.20),
        fat: Math.round(fat * 0.10),
      },
      {
        name: "Jantar",
        items: [
          "Carboidrato leve (mandioca, batata doce ou cuscuz — porção moderada)",
          protein_source(false),
          "Vegetais refogados (brócolis, cenoura)",
        ],
        calories: Math.round(targetCalories * 0.20),
        protein: Math.round(protein * 0.20),
        carbs: Math.round(carbs * 0.10),
        fat: Math.round(fat * 0.25),
      },
    ];
  }

  // 6. Generate Goal-Specific Workout Plan
  const prefersHome = data.preferences?.toLowerCase().includes('casa') || data.preferences?.toLowerCase().includes('home');
  const restTime = data.level === 'Iniciante' ? '90s' : '60-90s';
  const restHeavy = data.level === 'Avançado' ? '2-3min' : '90s-2min'; // for strength/mass
  const sets = data.level === 'Iniciante' ? '3' : data.level === 'Intermediário' ? '3-4' : '4-5';

  // Rep ranges are goal-specific
  const reps = isMassGain(data.goal) && data.goal === 'Ganhar força'
    ? '3-6 (carga máxima)'
    : isMassGain(data.goal)
    ? '6-12 (progressão de carga)'
    : isFatLoss(data.goal)
    ? '12-20 (ritmo constante)'
    : '8-15';

  const rest = isMassGain(data.goal) ? restHeavy : restTime;

  // Cardio block for fat loss
  const cardioBlock = prefersHome
    ? [
        { name: "Jumping Jack ou Corda (simulada)", sets: "3", reps: "45s intenso / 15s pausa", rest: "30s" },
        { name: "Agachamento + salto (Jump Squat)", sets: "3", reps: "15 rep", rest: "45s" },
        { name: "Corrida estacionária com joelho alto", sets: "3", reps: "40s", rest: "20s" },
      ]
    : [
        { name: "Esteira ou Bicicleta ergométrica (HIIT)", sets: "1", reps: "20-25 min — 1min intenso / 1min leve", rest: "—" },
        { name: "Elíptico ou Escada rolante", sets: "1", reps: "10 min — ritmo constante moderado", rest: "—" },
      ];

  const exercisesHome = {
    push: [
      { name: "Flexão de braço", sets, reps, rest },
      { name: "Flexão com pés elevados (ombros)", sets, reps, rest },
      { name: "Mergulho no banco (tríceps)", sets, reps, rest },
    ],
    pull: [
      { name: "Remada com toalha na porta", sets, reps, rest },
      { name: "Puxada Superman (extensão dorsal deitado)", sets, reps, rest },
      { name: "Rosca bíceps com galões ou mochila", sets, reps, rest },
    ],
    legs: [
      { name: "Agachamento livre", sets, reps, rest },
      { name: "Afundo/Avanço alternado", sets, reps, rest },
      { name: "Elevação pélvica unilateral", sets, reps, rest },
      { name: "Panturrilha em pé (unilateral)", sets, reps, rest },
    ],
    core: [
      { name: "Prancha abdominal", sets: "3", reps: "30-60s", rest },
      { name: "Abdominal supra controlado", sets, reps, rest },
    ],
    fullbody: [
      { name: "Agachamento livre", sets, reps, rest },
      { name: "Flexão de braço", sets, reps, rest },
      { name: "Remada com toalha", sets, reps, rest },
      { name: "Afundo alternado", sets, reps, rest },
      { name: "Prancha abdominal", sets: "3", reps: "40s", rest },
    ],
  };

  const exercisesGym = {
    push: [
      { name: "Supino Reto (barra ou halteres)", sets, reps, rest },
      { name: "Desenvolvimento com Halteres", sets, reps, rest },
      { name: "Tríceps Pulley ou Testa", sets, reps, rest },
      { name: "Elevação Lateral", sets, reps, rest },
    ],
    pull: [
      { name: "Puxada Frontal ou Barra Fixa", sets, reps, rest },
      { name: "Remada Curvada com barra", sets, reps, rest },
      { name: "Rosca Direta", sets, reps, rest },
      { name: "Crucifixo Inverso", sets, reps, rest },
    ],
    legs: [
      { name: "Agachamento Livre (prioridade)", sets, reps, rest },
      { name: "Leg Press 45°", sets, reps, rest },
      { name: "Cadeira Extensora", sets, reps, rest },
      { name: "Mesa Flexora", sets, reps, rest },
      { name: "Panturrilha no Smith", sets, reps, rest },
    ],
    core: [
      { name: "Prancha abdominal", sets: "3", reps: "40-60s", rest },
      { name: "Abdominal na polia", sets, reps, rest },
    ],
    fullbody: [
      { name: "Agachamento ou Leg Press", sets, reps, rest },
      { name: "Supino ou Flexão com carga", sets, reps, rest },
      { name: "Puxada ou Remada Curvada", sets, reps, rest },
      { name: "Desenvolvimento com Halteres", sets, reps, rest },
      { name: "Prancha abdominal", sets: "3", reps: "Máximo", rest },
    ],
  };

  const ex = prefersHome ? exercisesHome : exercisesGym;

  // For fat loss: append cardio to each training day
  function withCardio(exercises: typeof ex.push, dayLabel?: string): typeof ex.push {
    if (!isFatLoss(data.goal)) return exercises;
    // Only add cardio to resistance days (not already-cardio days)
    return [...exercises, ...cardioBlock];
  }

  let workoutDays: WorkoutDay[] = [];

  switch (data.frequency) {
    case '2x':
      workoutDays = [
        { day: "Dia 1", focus: isFatLoss(data.goal) ? "Full Body + Cardio" : "Full Body A", exercises: withCardio(ex.fullbody) },
        { day: "Dia 2", focus: isFatLoss(data.goal) ? "Full Body + Cardio" : "Full Body B", exercises: withCardio([...ex.legs.slice(0,2), ...ex.push.slice(0,2), ...ex.pull.slice(0,2)]) },
      ];
      break;
    case '3x':
      if (isFatLoss(data.goal)) {
        workoutDays = [
          { day: "Dia 1", focus: "Upper Body + Cardio", exercises: withCardio([...ex.push.slice(0,2), ...ex.pull.slice(0,2), ...(ex.core || [])]) },
          { day: "Dia 2", focus: "Lower Body + Cardio HIIT", exercises: withCardio([...ex.legs, ...(ex.core || [])]) },
          { day: "Dia 3", focus: "Full Body + Cardio Leve", exercises: withCardio(ex.fullbody) },
        ];
      } else {
        workoutDays = [
          { day: "Dia 1", focus: "Push (Peito, Ombro, Tríceps)", exercises: [...ex.push, ...(ex.core || [])] },
          { day: "Dia 2", focus: "Pull (Costas, Bíceps)", exercises: [...ex.pull, ...(ex.core || [])] },
          { day: "Dia 3", focus: "Legs (Pernas completas)", exercises: ex.legs },
        ];
      }
      break;
    case '4x':
      if (isFatLoss(data.goal)) {
        workoutDays = [
          { day: "Dia 1", focus: "Upper Body + Cardio", exercises: withCardio([...ex.push.slice(0,2), ...ex.pull.slice(0,2), ...(ex.core || [])]) },
          { day: "Dia 2", focus: "Lower Body + HIIT", exercises: withCardio([...ex.legs, ...(ex.core || [])]) },
          { day: "Dia 3", focus: "Upper Body B + Cardio", exercises: withCardio([...ex.push.slice(2), ...ex.pull.slice(2), ...(ex.core || [])]) },
          { day: "Dia 4", focus: "Lower Body B + Cardio Leve", exercises: withCardio(ex.legs) },
        ];
      } else {
        workoutDays = [
          { day: "Dia 1", focus: "Superiores A (Push + Pull)", exercises: [...ex.push.slice(0,2), ...ex.pull.slice(0,2), ...(ex.core || [])] },
          { day: "Dia 2", focus: "Inferiores A", exercises: ex.legs },
          { day: "Dia 3", focus: "Superiores B (Push + Pull)", exercises: [...ex.push.slice(2), ...ex.pull.slice(2), ...(ex.core || [])] },
          { day: "Dia 4", focus: "Inferiores B", exercises: ex.legs },
        ];
      }
      break;
    case '5x':
      workoutDays = [
        { day: "Dia 1", focus: isFatLoss(data.goal) ? "Push + Cardio" : "Push", exercises: withCardio(ex.push) },
        { day: "Dia 2", focus: isFatLoss(data.goal) ? "Pull + Cardio" : "Pull", exercises: withCardio(ex.pull) },
        { day: "Dia 3", focus: isFatLoss(data.goal) ? "Legs + HIIT" : "Legs", exercises: withCardio(ex.legs) },
        { day: "Dia 4", focus: isFatLoss(data.goal) ? "Upper Body + Cardio" : "Upper Body", exercises: withCardio([...ex.push.slice(0,2), ...ex.pull.slice(0,2)]) },
        { day: "Dia 5", focus: isFatLoss(data.goal) ? "Lower Body + Cardio Finalizador" : "Lower Body", exercises: withCardio(ex.legs) },
      ];
      break;
    case '6x':
      workoutDays = [
        { day: "Dia 1", focus: isFatLoss(data.goal) ? "Push + Cardio" : "Push A", exercises: withCardio(ex.push) },
        { day: "Dia 2", focus: isFatLoss(data.goal) ? "Pull + Cardio" : "Pull A", exercises: withCardio(ex.pull) },
        { day: "Dia 3", focus: isFatLoss(data.goal) ? "Legs + HIIT" : "Legs A", exercises: withCardio(ex.legs) },
        { day: "Dia 4", focus: isFatLoss(data.goal) ? "Push + Cardio" : "Push B", exercises: withCardio(ex.push) },
        { day: "Dia 5", focus: isFatLoss(data.goal) ? "Pull + Cardio" : "Pull B", exercises: withCardio(ex.pull) },
        { day: "Dia 6", focus: isFatLoss(data.goal) ? "Legs + Cardio Leve" : "Legs B", exercises: withCardio(ex.legs) },
      ];
      break;
  }

  // 7. Strategy — fully goal-specific
  let strategy = "";
  if (isFatLoss(data.goal)) {
    strategy = `OBJETIVO: PERDA DE GORDURA. O plano opera com um déficit calórico de ~500 kcal/dia em relação ao seu TDEE (${tdee} kcal), totalizando ${targetCalories} kcal/dia. A alta ingestão de proteínas (${proteinPerKg}g/kg) preserva a massa muscular durante a dieta. O treino combina resistência e cardio para maximizar o gasto energético. Sem superávit calórico, sem estratégias de bulking.`;
  } else if (isMassGain(data.goal)) {
    strategy = `OBJETIVO: ${data.goal === 'Ganhar força' ? 'GANHO DE FORÇA' : 'GANHO DE MASSA MUSCULAR'}. O plano opera com um superávit calórico de +350 kcal/dia (${targetCalories} kcal vs TDEE de ${tdee} kcal). O treino foca em progressão de carga com exercícios compostos. A proteína elevada (${proteinPerKg}g/kg) e o superávit garantem substrato para hipertrofia real. Sem déficit, sem cardio excessivo.`;
  } else {
    strategy = `OBJETIVO: MANUTENÇÃO E CONDICIONAMENTO. O plano mantém as calorias de manutenção (${tdee} kcal/dia) para equilibrar composição corporal, saúde metabólica e performance. Treino balanceado entre força e condicionamento geral.`;
  }

  // 8. Tips — goal-specific
  const tips = [
    "Beba pelo menos 3 a 4 litros de água por dia. A hidratação é essencial para o metabolismo e recuperação muscular.",
    "Mantenha 7 a 8 horas de sono por noite. É durante o descanso que o corpo evolui — isso vale para gordura e para músculo.",
    isFatLoss(data.goal)
      ? "Não confie apenas na balança: tire fotos e meça a cintura a cada 2 semanas. A gordura sai antes do peso cair."
      : isMassGain(data.goal)
      ? "Anote os pesos e repetições de cada treino. Progressão de carga é o principal motor do ganho de massa."
      : "Mantenha consistência. O equilíbrio de longo prazo supera qualquer período intenso e curto.",
    isFatLoss(data.goal)
      ? "Priorize alimentos com alto volume e baixa caloria: vegetais, proteínas magras, frutas com baixo índice glicêmico."
      : "Não pule refeições. Para ganhar massa, a consistência calórica diária é tão importante quanto o treino.",
    "A consistência supera a perfeição. Fazer o básico 80% do tempo trará muito mais resultado que o extremo por 1 semana.",
  ];

  // 9. Timeline — goal-specific
  const timeline = [
    {
      week: 4,
      expectation: isFatLoss(data.goal)
        ? "Redução de inchaço e retenção líquida. Primeiros centímetros na cintura. Roupas começando a vestir diferente."
        : isMassGain(data.goal)
        ? "Aumento de força notável nos principais exercícios. Mais energia nos treinos e disposição geral."
        : "Melhora no condicionamento físico. Treinos ficando mais fáceis e consistentes.",
    },
    {
      week: 8,
      expectation: isFatLoss(data.goal)
        ? "Perda visível de gordura corporal. Rosto mais definido, cintura reduzida. Condicionamento cardiorrespiratório melhorado."
        : "Mudanças visuais no espelho. Volume muscular começando a aparecer. O hábito já está consolidado.",
    },
    {
      week: 12,
      expectation: isFatLoss(data.goal)
        ? "Perda substancial de gordura. Músculos mais definidos com a gordura reduzida. Base sólida para manutenção."
        : isMassGain(data.goal)
        ? "Aumento visível de massa muscular e densidade. Força consideravelmente maior. Adaptação completa ao volume."
        : "Composição corporal melhorada. Saúde e condicionamento em nível superior ao início.",
    },
  ];

  return {
    userData: data,
    nutrition: { tdee, targetCalories, macros: { protein, carbs, fat }, meals },
    workout: workoutDays,
    strategy,
    tips,
    timeline,
  };
}
