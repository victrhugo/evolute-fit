import { useState } from "react";
import { useLocation, Link } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, ArrowRight, Zap, CheckCircle2, Loader2 } from "lucide-react";
import AuthButton from "@/components/AuthButton";
import { useAuth } from "@/hooks/use-auth";
import { usePlan } from "@/contexts/plan-context";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generatePlan, UserData } from "@/lib/planGenerator";

const formSchema = z.object({
  age: z.coerce.number().min(10, "Idade deve ser no mínimo 10").max(80, "Idade máxima é 80"),
  gender: z.enum(["Masculino", "Feminino", "Prefiro não informar"]),
  weight: z.coerce.number().min(30, "Peso inválido").max(300, "Peso inválido"),
  height: z.coerce.number().min(100, "Altura inválida").max(250, "Altura inválida"),
  goal: z.enum(["Perder gordura", "Ganhar massa muscular", "Manter peso e condicionamento", "Melhorar saúde geral", "Ganhar força"]),
  level: z.enum(["Iniciante", "Intermediário", "Avançado"]),
  frequency: z.enum(["2x", "3x", "4x", "5x", "6x"]),
  duration: z.enum(["30 min", "45 min", "60 min", "75 min", "90 min"]),
  restrictions: z.string().optional(),
  preferences: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const STEPS = ["Dados Básicos", "Objetivo", "Rotina", "Preferências"];

const goals = [
  "Perder gordura",
  "Ganhar massa muscular",
  "Manter peso e condicionamento",
  "Melhorar saúde geral",
  "Ganhar força",
];

export default function FormPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const { user } = useAuth();
  const { setPlanAndSave } = usePlan();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gender: "Masculino",
      goal: "Ganhar massa muscular",
      level: "Iniciante",
      frequency: "3x",
      duration: "60 min",
      restrictions: "",
      preferences: "",
    },
  });

  function onSubmit(values: FormValues) {
    setGenerating(true);
    setTimeout(() => {
      try {
        const plan = generatePlan(values as UserData);
        console.log("[Form] generated plan, user.id:", user?.id ?? null);
        setPlanAndSave(plan, user?.id ?? null);
        setLocation("/plano");
      } catch (e) {
        console.error("[Form] plan generation error:", e);
        setGenerating(false);
      }
    }, 1200);
  }

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    if (step === 1) fieldsToValidate = ["age", "gender", "weight", "height"];
    if (step === 2) fieldsToValidate = ["goal", "level"];
    if (step === 3) fieldsToValidate = ["frequency", "duration"];
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (generating) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Zap className="w-10 h-10 text-primary animate-pulse" fill="currentColor" />
          </div>
          <div className="absolute -inset-2 bg-primary/10 rounded-3xl blur-xl animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-xl font-bold">Gerando seu plano...</p>
          <p className="text-sm text-muted-foreground">Calculando calorias, macros e treino ideal para você.</p>
        </div>
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 flex flex-col items-center">

      {/* Top bar */}
      <div className="w-full max-w-2xl mb-10">
        <Link href="/">
          <button data-testid="button-back-home" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm font-medium mb-8">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </Link>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="font-extrabold text-xs text-primary-foreground leading-none">E</span>
            </div>
            <span className="font-bold text-base">Evolute</span>
          </div>
          <AuthButton />
        </div>

        <div className="flex items-center justify-between mt-6 mb-4">
          <h1 className="text-2xl font-black tracking-tight">Conte sobre você</h1>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{step} / {STEPS.length}</span>
        </div>

        {/* Step indicators */}
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-all duration-300"
              style={{ background: i < step ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">{STEPS[step - 1]}</p>
      </div>

      {/* Form card */}
      <div className="w-full max-w-2xl bg-card border border-card-border rounded-2xl p-6 sm:p-10 shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            {/* STEP 1 */}
            <div className={step === 1 ? "block space-y-6" : "hidden"}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-foreground/80">Idade</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-age"
                          placeholder="Ex: 25"
                          type="number"
                          className="h-12 bg-muted/50 border-border text-base focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-foreground/80">Sexo Biológico</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-gender" className="h-12 bg-muted/50 border-border text-base focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-card-border">
                          <SelectItem value="Masculino">Masculino</SelectItem>
                          <SelectItem value="Feminino">Feminino</SelectItem>
                          <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs text-muted-foreground">Usado para cálculo metabólico.</FormDescription>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-foreground/80">Peso (kg)</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-weight"
                          placeholder="Ex: 75.5"
                          type="number"
                          step="0.1"
                          className="h-12 bg-muted/50 border-border text-base focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-foreground/80">Altura (cm)</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-height"
                          placeholder="Ex: 175"
                          type="number"
                          className="h-12 bg-muted/50 border-border text-base focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* STEP 2 */}
            <div className={step === 2 ? "block space-y-6" : "hidden"}>
              <FormField
                control={form.control}
                name="goal"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-sm font-semibold text-foreground/80">Qual seu principal objetivo?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid gap-3"
                      >
                        {goals.map((goal) => (
                          <FormItem
                            key={goal}
                            className="flex items-center space-x-3 space-y-0 bg-muted/30 p-4 rounded-xl border border-border hover:border-primary/30 transition-all duration-200 has-[:checked]:bg-primary/8 has-[:checked]:border-primary/50 cursor-pointer"
                          >
                            <FormControl>
                              <RadioGroupItem value={goal} data-testid={`radio-goal-${goal}`} />
                            </FormControl>
                            <FormLabel className="font-medium cursor-pointer w-full text-sm">{goal}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-foreground/80">Nível de condicionamento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-level" className="h-12 bg-muted/50 border-border text-base focus:border-primary transition-all">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-card-border">
                        <SelectItem value="Iniciante">Iniciante — Pouca ou nenhuma experiência</SelectItem>
                        <SelectItem value="Intermediário">Intermediário — Treina consistentemente há meses</SelectItem>
                        <SelectItem value="Avançado">Avançado — Treina a sério há anos</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* STEP 3 */}
            <div className={step === 3 ? "block space-y-8" : "hidden"}>
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-foreground/80">Quantos dias por semana você pode treinar?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-frequency" className="h-12 bg-muted/50 border-border text-base focus:border-primary transition-all mt-2">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-card-border">
                        <SelectItem value="2x">2x por semana</SelectItem>
                        <SelectItem value="3x">3x por semana</SelectItem>
                        <SelectItem value="4x">4x por semana</SelectItem>
                        <SelectItem value="5x">5x por semana</SelectItem>
                        <SelectItem value="6x">6x por semana</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-foreground/80">Quanto tempo disponível por treino?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-duration" className="h-12 bg-muted/50 border-border text-base focus:border-primary transition-all mt-2">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-card-border">
                        <SelectItem value="30 min">30 minutos</SelectItem>
                        <SelectItem value="45 min">45 minutos</SelectItem>
                        <SelectItem value="60 min">60 minutos</SelectItem>
                        <SelectItem value="75 min">75 minutos</SelectItem>
                        <SelectItem value="90 min">90 minutos</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* STEP 4 */}
            <div className={step === 4 ? "block space-y-6" : "hidden"}>
              <FormField
                control={form.control}
                name="restrictions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-foreground/80">Restrições Alimentares <span className="text-muted-foreground font-normal">(Opcional)</span></FormLabel>
                    <FormDescription className="text-xs text-muted-foreground">Ex: Intolerância à lactose, vegano, vegetariano...</FormDescription>
                    <FormControl>
                      <Input
                        data-testid="input-restrictions"
                        placeholder="Nenhuma"
                        className="h-12 bg-muted/50 border-border focus:border-primary transition-all"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="preferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-foreground/80">Preferências de Treino <span className="text-muted-foreground font-normal">(Opcional)</span></FormLabel>
                    <FormDescription className="text-xs text-muted-foreground">Ex: "Prefiro treinar em casa", "Tenho dor no joelho"...</FormDescription>
                    <FormControl>
                      <Textarea
                        data-testid="input-preferences"
                        placeholder="Suas preferências..."
                        className="min-h-[120px] resize-none bg-muted/50 border-border focus:border-primary transition-all"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-border">
              {step > 1 ? (
                <button
                  type="button"
                  data-testid="button-prev-step"
                  onClick={prevStep}
                  className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-muted/30"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Anterior
                </button>
              ) : <div />}

              {step < 4 ? (
                <button
                  type="button"
                  data-testid="button-next-step"
                  onClick={nextStep}
                  className="btn-glow bg-primary text-primary-foreground font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 group"
                >
                  Próximo
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  data-testid="button-submit-plan"
                  className="btn-glow bg-primary text-primary-foreground font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Gerar meu plano
                </button>
              )}
            </div>
          </form>
        </Form>
      </div>

      <p className="text-xs text-muted-foreground/40 mt-8 text-center max-w-sm leading-relaxed">
        Este plano não substitui orientação de nutricionistas e educadores físicos profissionais.
      </p>
    </div>
  );
}
