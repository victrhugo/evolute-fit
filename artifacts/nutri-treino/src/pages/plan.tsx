import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import {
  ArrowLeft, Flame, Utensils, Dumbbell, Zap,
  TrendingUp, AlertTriangle, CheckCircle2, ChevronDown, RotateCcw
} from "lucide-react";
import AuthButton from "@/components/AuthButton";
import { PremiumCTA, PremiumCoachButton } from "@/components/PremiumGate";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { GeneratedPlan } from "@/lib/planGenerator";
import Coach from "@/components/Coach";
import { useAuth } from "@/hooks/use-auth";

function MacroBadge({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center bg-muted/40 border border-border rounded-xl p-4 text-center">
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{label}</span>
      <span className={`text-2xl font-black ${color}`}>{value}<span className="text-base font-medium ml-0.5">{unit}</span></span>
    </div>
  );
}

export default function PlanPage() {
  const [, setLocation] = useLocation();
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [showCoach, setShowCoach] = useState(false);
  const { isPremium } = useAuth();

  useEffect(() => {
    const data = localStorage.getItem("nutri-treino-plan");
    if (!data) {
      setLocation("/formulario");
    } else {
      try {
        setPlan(JSON.parse(data));
      } catch {
        setLocation("/formulario");
      }
    }
  }, [setLocation]);

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Zap className="w-8 h-8 text-primary animate-pulse" fill="currentColor" />
          </div>
          <div className="absolute -inset-2 bg-primary/10 rounded-3xl blur-xl animate-pulse" />
        </div>
        <p className="text-muted-foreground text-sm">Carregando seu plano...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {showCoach && isPremium && <Coach plan={plan} onClose={() => setShowCoach(false)} />}
      <PremiumCoachButton onClick={() => setShowCoach(true)} />

      {/* Header */}
      <div className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/formulario">
            <button data-testid="button-redo-plan-top" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              <ArrowLeft className="w-4 h-4" />
              Refazer
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
                <span className="font-extrabold text-[10px] text-primary-foreground leading-none">E</span>
              </div>
              <span className="font-bold text-sm">Evolute</span>
            </div>
            <AuthButton />
          </div>
        </div>
      </div>

      {/* Hero banner */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 py-16 md:py-20">
          <p className="text-primary text-xs font-bold uppercase tracking-widest mb-4">Seu plano personalizado</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Seu Plano de Ação
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Desenhado para <strong className="text-foreground">{plan.userData.goal.toLowerCase()}</strong> — {plan.userData.frequency}/semana, nível <strong className="text-foreground">{plan.userData.level.toLowerCase()}</strong>.
          </p>
          {/* Macros summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10">
            <MacroBadge label="Calorias" value={plan.nutrition.targetCalories} unit="kcal" color="text-orange-400" />
            <MacroBadge label="Proteínas" value={plan.nutrition.macros.protein} unit="g" color="text-blue-400" />
            <MacroBadge label="Carboidratos" value={plan.nutrition.macros.carbs} unit="g" color="text-primary" />
            <MacroBadge label="Gorduras" value={plan.nutrition.macros.fat} unit="g" color="text-yellow-400" />
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 space-y-8">

        {/* Strategy */}
        <section className="card-premium rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-primary" fill="currentColor" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-3">Estratégia Geral</h2>
              <p className="text-muted-foreground leading-relaxed">{plan.strategy}</p>
            </div>
          </div>
        </section>

        {/* Nutrition */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <Utensils className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-black tracking-tight">Plano Alimentar Diário</h2>
          </div>

          <div className="space-y-3">
            {plan.nutrition.meals.map((meal, i) => (
              <div key={i} data-testid={`card-meal-${i}`} className="card-premium rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="font-bold text-base">{meal.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-lg">{meal.calories} kcal</span>
                    <span className="text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-lg">{meal.protein}g Prot</span>
                    <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-lg">{meal.carbs}g Carb</span>
                    <span className="text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2.5 py-1 rounded-lg">{meal.fat}g Gord</span>
                  </div>
                </div>
                <ul className="px-6 py-5 space-y-2.5">
                  {meal.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground/85">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Workout */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-black tracking-tight">Treino Semanal</h2>
          </div>

          {/* Day 1 — free for everyone */}
          {plan.workout.slice(0, 1).map((day, i) => (
            <div key={i} className="card-premium rounded-2xl p-2">
              <Accordion type="multiple" className="w-full space-y-1">
                <AccordionItem value={`day-${i}`} className="border-none rounded-xl overflow-hidden">
                  <AccordionTrigger
                    data-testid={`accordion-day-${i}`}
                    className="hover:no-underline px-5 py-5 hover:bg-muted/30 rounded-xl transition-colors duration-200 [&[data-state=open]]:bg-muted/20"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-primary font-black text-xs">{i + 1}</span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{day.day}</div>
                        <div className="text-base font-bold">{day.focus}</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5 pt-1">
                    <div className="space-y-2.5">
                      {day.exercises.map((ex, j) => (
                        <div key={j} data-testid={`exercise-${i}-${j}`} className="flex flex-col sm:flex-row sm:items-center justify-between bg-muted/30 border border-border rounded-xl px-4 py-3 gap-3">
                          <span className="font-semibold text-sm">{ex.name}</span>
                          <div className="flex gap-2 flex-wrap">
                            <span className="text-xs bg-background border border-border rounded-lg px-3 py-1.5 font-medium"><span className="text-muted-foreground mr-1">Séries</span>{ex.sets}</span>
                            <span className="text-xs bg-background border border-border rounded-lg px-3 py-1.5 font-medium"><span className="text-muted-foreground mr-1">Reps</span>{ex.reps}</span>
                            <span className="text-xs bg-background border border-border rounded-lg px-3 py-1.5 font-medium"><span className="text-muted-foreground mr-1">Descanso</span>{ex.rest}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          ))}

          {/* Remaining days — premium only */}
          {plan.workout.length > 1 && (
            isPremium ? (
              <div className="card-premium rounded-2xl p-2">
                <Accordion type="multiple" className="w-full space-y-1">
                  {plan.workout.slice(1).map((day, idx) => {
                    const i = idx + 1;
                    return (
                      <AccordionItem key={i} value={`day-${i}`} className="border-none rounded-xl overflow-hidden">
                        <AccordionTrigger
                          data-testid={`accordion-day-${i}`}
                          className="hover:no-underline px-5 py-5 hover:bg-muted/30 rounded-xl transition-colors duration-200 [&[data-state=open]]:bg-muted/20"
                        >
                          <div className="flex items-center gap-4 text-left">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                              <span className="text-primary font-black text-xs">{i + 1}</span>
                            </div>
                            <div>
                              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{day.day}</div>
                              <div className="text-base font-bold">{day.focus}</div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-5 pt-1">
                          <div className="space-y-2.5">
                            {day.exercises.map((ex, j) => (
                              <div key={j} data-testid={`exercise-${i}-${j}`} className="flex flex-col sm:flex-row sm:items-center justify-between bg-muted/30 border border-border rounded-xl px-4 py-3 gap-3">
                                <span className="font-semibold text-sm">{ex.name}</span>
                                <div className="flex gap-2 flex-wrap">
                                  <span className="text-xs bg-background border border-border rounded-lg px-3 py-1.5 font-medium"><span className="text-muted-foreground mr-1">Séries</span>{ex.sets}</span>
                                  <span className="text-xs bg-background border border-border rounded-lg px-3 py-1.5 font-medium"><span className="text-muted-foreground mr-1">Reps</span>{ex.reps}</span>
                                  <span className="text-xs bg-background border border-border rounded-lg px-3 py-1.5 font-medium"><span className="text-muted-foreground mr-1">Descanso</span>{ex.rest}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            ) : (
              <div className="relative">
                <div className="opacity-25 blur-[2px] pointer-events-none select-none card-premium rounded-2xl p-2">
                  <Accordion type="multiple" className="w-full space-y-1">
                    {plan.workout.slice(1).map((day, idx) => {
                      const i = idx + 1;
                      return (
                        <AccordionItem key={i} value={`day-${i}`} className="border-none rounded-xl overflow-hidden">
                          <AccordionTrigger className="hover:no-underline px-5 py-5 rounded-xl">
                            <div className="flex items-center gap-4 text-left">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                <span className="text-primary font-black text-xs">{i + 1}</span>
                              </div>
                              <div>
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{day.day}</div>
                                <div className="text-base font-bold">{day.focus}</div>
                              </div>
                            </div>
                          </AccordionTrigger>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </div>
                <div className="absolute inset-0 flex items-center justify-center z-10 py-8">
                  <PremiumCTA label="todos os dias de treino" />
                </div>
              </div>
            )
          )}
        </section>

        {/* Tips + Timeline */}
        <div className="grid md:grid-cols-2 gap-6">
          <section className="card-premium rounded-2xl p-8 space-y-5">
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 text-orange-400" />
              <h3 className="text-xl font-black tracking-tight">Dicas Práticas</h3>
            </div>
            <ul className="space-y-4">
              {plan.tips.map((tip, i) => (
                <li key={i} data-testid={`tip-${i}`} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span className="text-sm text-muted-foreground leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card-premium rounded-2xl p-8 space-y-5">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-black tracking-tight">Evolução Esperada</h3>
            </div>
            <div className="space-y-5 relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              {plan.timeline.map((item, i) => (
                <div key={i} data-testid={`timeline-${i}`} className="flex gap-5 relative">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-black text-xs flex items-center justify-center shrink-0 z-10 border-2 border-background">
                    S{item.week}
                  </div>
                  <div className="bg-muted/30 border border-border rounded-xl p-4 flex-1">
                    <div className="text-primary font-bold text-xs mb-1 uppercase tracking-wider">Semana {item.week}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.expectation}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-5 text-sm text-muted-foreground">
          <AlertTriangle className="w-5 h-5 text-yellow-500/70 shrink-0 mt-0.5" />
          <p>
            Este plano é gerado automaticamente com base em fórmulas matemáticas padrão (Mifflin-St Jeor) e princípios gerais de nutrição esportiva.{" "}
            <strong className="text-foreground/80">Não substitui a orientação de nutricionistas e educadores físicos profissionais.</strong> Consulte um médico antes de iniciar qualquer programa.
          </p>
        </div>

        {/* Redo button */}
        <div className="flex justify-center pt-4 pb-12">
          <button
            data-testid="button-redo-plan-bottom"
            onClick={() => setLocation("/formulario")}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 px-6 py-3 rounded-xl transition-all duration-200"
          >
            <RotateCcw className="w-4 h-4" />
            Refazer meu plano
          </button>
        </div>
      </main>
    </div>
  );
}
