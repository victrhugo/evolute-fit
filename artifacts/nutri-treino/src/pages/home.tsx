import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Activity, Apple, Dumbbell, Target } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="px-6 lg:px-12 h-20 flex items-center justify-between border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">NutriTreino</span>
        </div>
        <Link href="/formulario">
          <Button variant="outline" className="font-semibold">Começar Agora</Button>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="w-full py-16 md:py-32 lg:py-48 px-6 lg:px-12 bg-muted/30">
          <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-8">
              <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                Seu treinador e nutricionista de bolso
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                Um plano de treino e dieta feito <span className="text-primary">só para você.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-[600px] leading-relaxed">
                Esqueça planos genéricos. O NutriTreino gera uma rotina alimentar com comida de verdade e treinos baseados no seu nível, objetivo e tempo disponível.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/formulario">
                  <Button size="lg" className="w-full sm:w-auto h-14 text-lg px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold">
                    Montar meu plano grátis
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground font-medium">Leva menos de 2 minutos • 100% Personalizado</p>
            </div>
            
            <div className="flex-1 relative w-full max-w-[500px] lg:max-w-none aspect-square md:aspect-auto md:h-[600px]">
              {/* Decorative elements representing the vibe */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-[2.5rem] transform rotate-3"></div>
              <div className="absolute inset-0 bg-card border border-border rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col">
                <div className="h-12 border-b border-border flex items-center px-4 gap-2 bg-muted/50">
                  <div className="w-3 h-3 rounded-full bg-destructive/60"></div>
                  <div className="w-3 h-3 rounded-full bg-accent/60"></div>
                  <div className="w-3 h-3 rounded-full bg-primary/60"></div>
                </div>
                <div className="p-8 flex-1 flex flex-col gap-6">
                  <div className="h-4 w-1/3 bg-muted rounded-full"></div>
                  <div className="h-10 w-3/4 bg-primary/10 rounded-lg"></div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="h-24 bg-muted/50 rounded-xl"></div>
                    <div className="h-24 bg-muted/50 rounded-xl"></div>
                  </div>
                  <div className="flex-1 rounded-xl bg-gradient-to-t from-primary/5 to-transparent border border-border mt-4"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-24 px-6 lg:px-12 bg-background">
          <div className="container max-w-6xl mx-auto space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Tudo que você precisa para chegar no shape</h2>
              <p className="text-lg text-muted-foreground">Com base na ciência, utilizando alimentos práticos da cultura brasileira e treinos eficientes.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Target className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Focado no seu Objetivo</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ganhar massa, perder gordura ou manutenção? Calculamos seu gasto calórico (TDEE) e ajustamos os macros com precisão.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                  <Apple className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3">Dieta com Comida de Verdade</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Nada de invencionices. Arroz, feijão, frango, ovos e frutas. Adaptável para vegetarianos, veganos ou restrições à lactose.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Dumbbell className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Treino na Medida</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Treina 2x ou 6x na semana? Na academia ou em casa? Montamos a divisão muscular perfeita para sua realidade.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-muted-foreground border-t border-border mt-auto bg-muted/20">
        <p className="text-sm font-medium">© {new Date().getFullYear()} NutriTreino. Feito para evoluir.</p>
      </footer>
    </div>
  );
}
