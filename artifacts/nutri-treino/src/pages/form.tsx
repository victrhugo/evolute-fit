import { useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  gender: z.enum(['Masculino', 'Feminino', 'Prefiro não informar']),
  weight: z.coerce.number().min(30, "Peso inválido").max(300, "Peso inválido"),
  height: z.coerce.number().min(100, "Altura inválida").max(250, "Altura inválida"),
  goal: z.enum(['Perder gordura', 'Ganhar massa muscular', 'Manter peso e condicionamento', 'Melhorar saúde geral', 'Ganhar força']),
  level: z.enum(['Iniciante', 'Intermediário', 'Avançado']),
  frequency: z.enum(['2x', '3x', '4x', '5x', '6x']),
  duration: z.enum(['30 min', '45 min', '60 min', '75 min', '90 min']),
  restrictions: z.string().optional(),
  preferences: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function FormPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gender: "Masculino",
      goal: "Ganhar massa muscular",
      level: "Iniciante",
      frequency: "3x",
      duration: "60 min",
      restrictions: "",
      preferences: ""
    },
  });

  function onSubmit(values: FormValues) {
    const plan = generatePlan(values as UserData);
    localStorage.setItem("nutri-treino-plan", JSON.stringify(plan));
    setLocation("/plano");
  }

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) fieldsToValidate = ['age', 'gender', 'weight', 'height'];
    if (step === 2) fieldsToValidate = ['goal', 'level'];
    if (step === 3) fieldsToValidate = ['frequency', 'duration'];
    
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-muted/20 py-12 px-4 sm:px-6 flex justify-center">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <Button variant="ghost" className="mb-4" onClick={() => setLocation("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Conte sobre você</h1>
            <span className="text-sm font-semibold text-muted-foreground">Passo {step} de 4</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-in-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-card border border-border shadow-sm rounded-2xl p-6 sm:p-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* STEP 1: Basic Info */}
              <div className={step === 1 ? "block space-y-6" : "hidden"}>
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm">1</span>
                  Dados Básicos
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Idade</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 25" type="number" className="h-12 text-lg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Sexo Biológico</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Masculino">Masculino</SelectItem>
                            <SelectItem value="Feminino">Feminino</SelectItem>
                            <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>Usado para cálculo metabólico.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Peso (kg)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 75.5" type="number" step="0.1" className="h-12 text-lg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Altura (cm)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 175" type="number" className="h-12 text-lg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* STEP 2: Goals & Level */}
              <div className={step === 2 ? "block space-y-6" : "hidden"}>
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm">2</span>
                  Objetivo e Nível
                </h2>
                
                <FormField
                  control={form.control}
                  name="goal"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-base">Qual seu principal objetivo?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid gap-3"
                        >
                          {[
                            'Perder gordura', 
                            'Ganhar massa muscular', 
                            'Manter peso e condicionamento', 
                            'Melhorar saúde geral', 
                            'Ganhar força'
                          ].map((goal) => (
                            <FormItem key={goal} className="flex items-center space-x-3 space-y-0 bg-muted/30 p-4 rounded-xl border border-transparent hover:border-primary/20 transition-colors has-[:checked]:bg-primary/5 has-[:checked]:border-primary">
                              <FormControl>
                                <RadioGroupItem value={goal} />
                              </FormControl>
                              <FormLabel className="font-medium cursor-pointer w-full text-base">{goal}</FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem className="mt-8 space-y-4">
                      <FormLabel className="text-base">Nível de condicionamento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Selecione seu nível..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Iniciante">Iniciante (Pouca ou nenhuma experiência)</SelectItem>
                          <SelectItem value="Intermediário">Intermediário (Treina consistentemente há meses)</SelectItem>
                          <SelectItem value="Avançado">Avançado (Treina a sério há anos)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* STEP 3: Routine */}
              <div className={step === 3 ? "block space-y-6" : "hidden"}>
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm">3</span>
                  Sua Rotina
                </h2>
                
                <div className="space-y-8">
                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Quantos dias na semana você pode treinar?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base mt-2">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="2x">2x por semana</SelectItem>
                            <SelectItem value="3x">3x por semana</SelectItem>
                            <SelectItem value="4x">4x por semana</SelectItem>
                            <SelectItem value="5x">5x por semana</SelectItem>
                            <SelectItem value="6x">6x por semana</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Quanto tempo disponível por treino?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base mt-2">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="30 min">30 minutos</SelectItem>
                            <SelectItem value="45 min">45 minutos</SelectItem>
                            <SelectItem value="60 min">60 minutos</SelectItem>
                            <SelectItem value="75 min">75 minutos</SelectItem>
                            <SelectItem value="90 min">90 minutos</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* STEP 4: Preferences */}
              <div className={step === 4 ? "block space-y-6" : "hidden"}>
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm">4</span>
                  Preferências e Detalhes
                </h2>
                
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="restrictions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Restrições Alimentares (Opcional)</FormLabel>
                        <FormDescription>Ex: Intolerância à lactose, vegano, vegetariano, alergia a amendoim...</FormDescription>
                        <FormControl>
                          <Input placeholder="Nenhuma" className="h-12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferences"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Preferências de Treino (Opcional)</FormLabel>
                        <FormDescription>Ex: "Prefiro exercícios em casa", "Tenho dor no joelho", "Gosto de focar em braços"...</FormDescription>
                        <FormControl>
                          <Textarea placeholder="Suas preferências..." className="min-h-[120px] resize-none text-base" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-border">
                {step > 1 ? (
                  <Button type="button" variant="outline" size="lg" onClick={prevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                  </Button>
                ) : <div></div>}
                
                {step < 4 ? (
                  <Button type="button" size="lg" onClick={nextStep} className="font-bold px-8">
                    Próximo <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" size="lg" className="font-bold px-8 bg-primary hover:bg-primary/90">
                    <CheckCircle2 className="mr-2 h-5 w-5" /> Gerar Plano
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
