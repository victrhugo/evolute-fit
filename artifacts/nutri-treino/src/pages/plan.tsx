import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { 
  ArrowLeft, Flame, Utensils, Dumbbell, Info, 
  ChevronRight, Calendar, AlertTriangle, ChevronDown, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GeneratedPlan } from "@/lib/planGenerator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function PlanPage() {
  const [location, setLocation] = useLocation();
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);

  useEffect(() => {
    const data = localStorage.getItem("nutri-treino-plan");
    if (!data) {
      setLocation("/formulario");
    } else {
      try {
        setPlan(JSON.parse(data));
      } catch (e) {
        setLocation("/formulario");
      }
    }
  }, [setLocation]);

  if (!plan) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse flex flex-col items-center">
        <Dumbbell className="w-12 h-12 text-primary animate-bounce mb-4" />
        <p className="text-xl font-medium text-muted-foreground">Gerando seu plano...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground pt-12 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="container max-w-5xl mx-auto relative z-10">
          <Link href="/formulario" className="inline-flex items-center text-primary-foreground/80 hover:text-white transition-colors mb-8 text-sm font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Refazer Plano
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">O Seu Plano de Ação</h1>
          <p className="text-primary-foreground/90 text-lg md:text-xl max-w-2xl">
            Desenhado para {plan.userData.goal.toLowerCase()}, com {plan.userData.frequency} de treino para nível {plan.userData.level.toLowerCase()}.
          </p>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 sm:px-6 -mt-12 space-y-8">
        
        {/* Strategy Card */}
        <section className="bg-card rounded-2xl p-6 md:p-8 shadow-xl shadow-black/5 border border-border">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <Info className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Estratégia Geral</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">{plan.strategy}</p>
            </div>
          </div>
        </section>

        {/* Nutrition Overview */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Utensils className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold">Plano Alimentar Diário</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-center items-center text-center">
              <Flame className="w-8 h-8 text-orange-500 mb-2" />
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Calorias Alvo</span>
              <span className="text-3xl font-extrabold">{plan.nutrition.targetCalories} <span className="text-lg text-muted-foreground font-medium">kcal</span></span>
            </div>
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-center items-center text-center">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Proteínas</span>
              <span className="text-3xl font-extrabold text-blue-600">{plan.nutrition.macros.protein}g</span>
              <span className="text-xs text-muted-foreground mt-1">4 kcal/g</span>
            </div>
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-center items-center text-center">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Carboidratos</span>
              <span className="text-3xl font-extrabold text-green-600">{plan.nutrition.macros.carbs}g</span>
              <span className="text-xs text-muted-foreground mt-1">4 kcal/g</span>
            </div>
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-center items-center text-center">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Gorduras</span>
              <span className="text-3xl font-extrabold text-yellow-500">{plan.nutrition.macros.fat}g</span>
              <span className="text-xs text-muted-foreground mt-1">9 kcal/g</span>
            </div>
          </div>

          <div className="space-y-4">
            {plan.nutrition.meals.map((meal, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-muted/30 px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-xl font-bold">{meal.name}</h3>
                  <div className="flex flex-wrap gap-2 text-sm font-medium">
                    <span className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 px-2 py-1 rounded-md">{meal.calories} kcal</span>
                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-md">{meal.protein}g P</span>
                    <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded-md">{meal.carbs}g C</span>
                    <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 px-2 py-1 rounded-md">{meal.fat}g G</span>
                  </div>
                </div>
                <div className="p-6">
                  <ul className="space-y-3">
                    {meal.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-lg">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Workout Plan */}
        <section className="space-y-6 pt-8">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold">Treino Semanal</h2>
          </div>
          
          <div className="bg-card border border-border rounded-2xl p-2 shadow-sm">
            <Accordion type="multiple" className="w-full space-y-2">
              {plan.workout.map((day, i) => (
                <AccordionItem key={i} value={`day-${i}`} className="border-none bg-muted/20 rounded-xl px-2">
                  <AccordionTrigger className="hover:no-underline px-4 py-5">
                    <div className="flex items-center text-left gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{day.day}</div>
                        <div className="text-xl font-bold">{day.focus}</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-6 pt-2">
                    <div className="space-y-3">
                      {day.exercises.map((ex, j) => (
                        <div key={j} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background rounded-xl border border-border gap-4">
                          <span className="font-semibold text-lg">{ex.name}</span>
                          <div className="flex flex-wrap gap-3 text-sm">
                            <div className="bg-muted px-3 py-1.5 rounded-md font-medium"><span className="text-muted-foreground mr-1">Séries:</span>{ex.sets}</div>
                            <div className="bg-muted px-3 py-1.5 rounded-md font-medium"><span className="text-muted-foreground mr-1">Reps:</span>{ex.reps}</div>
                            <div className="bg-muted px-3 py-1.5 rounded-md font-medium"><span className="text-muted-foreground mr-1">Descanso:</span>{ex.rest}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-8 pt-8">
          {/* Tips */}
          <section className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Flame className="w-6 h-6 text-accent" />
              Dicas Práticas
            </h3>
            <ul className="space-y-4">
              {plan.tips.map((tip, i) => (
                <li key={i} className="flex gap-3 text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Timeline */}
          <section className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              Evolução Esperada
            </h3>
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {plan.timeline.map((item, i) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 font-bold text-sm z-10">
                    S{item.week}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-muted/30 border border-border">
                    <h4 className="font-bold text-primary mb-1">Semana {item.week}</h4>
                    <p className="text-sm text-muted-foreground">{item.expectation}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Disclaimer */}
        <div className="bg-muted/50 rounded-xl p-4 flex items-start gap-3 mt-12 text-sm text-muted-foreground">
          <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
          <p>
            Este plano é gerado automaticamente com base em fórmulas matemáticas padrão (Mifflin-St Jeor) e princípios gerais de nutrição esportiva. Ele <strong>não substitui a orientação de nutricionistas e educadores físicos profissionais</strong>. Consulte um médico antes de iniciar qualquer programa de exercícios ou dieta.
          </p>
        </div>

        <div className="flex justify-center pt-8 pb-12">
          <Button variant="outline" size="lg" onClick={() => setLocation("/formulario")} className="h-14 px-8 text-lg font-bold">
            Refazer meu plano
          </Button>
        </div>
      </main>
    </div>
  );
}
