import { Link } from "wouter";
import { ArrowRight, Zap, Utensils, Dumbbell, TrendingUp, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 h-16 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" fill="currentColor" />
          </div>
          <span className="font-bold text-lg tracking-tight">Elevate</span>
        </div>
        <Link href="/formulario">
          <button
            data-testid="link-start-nav"
            className="btn-glow text-sm font-semibold bg-primary text-primary-foreground px-5 py-2 rounded-lg"
          >
            Criar meu plano
          </button>
        </Link>
      </header>

      <main className="flex-1 pt-16">

        {/* Hero */}
        <section className="relative min-h-screen flex items-center justify-center px-6 grid-bg overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-4 py-2 rounded-full uppercase tracking-widest">
              <Zap className="w-3 h-3" fill="currentColor" />
              Nutrição + Treino Personalizado
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95]">
              Seu próximo nível<br />
              <span className="text-primary">começa aqui.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
              Plano alimentar e de treino 100% personalizado, baseado em ciência, com comida de verdade e exercícios reais para o seu estilo de vida.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link href="/formulario">
                <button
                  data-testid="button-create-plan-hero"
                  className="btn-glow bg-primary text-primary-foreground font-bold text-base px-8 py-4 rounded-xl flex items-center gap-2 group"
                >
                  Criar meu plano grátis
                  <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">
              Leva menos de 2 minutos &bull; Totalmente gratuito
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="py-28 px-6 lg:px-12 border-t border-border">
          <div className="max-w-5xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <p className="text-primary text-xs font-bold uppercase tracking-widest">Como funciona</p>
              <h2 className="text-3xl md:text-4xl font-bold">Simples. Rápido. Eficaz.</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { num: "01", title: "Preencha seus dados", desc: "Idade, peso, altura, objetivo e preferências. Leva menos de 2 minutos." },
                { num: "02", title: "Receba seu plano", desc: "Algoritmos baseados em Mifflin-St Jeor calculam suas necessidades exatas." },
                { num: "03", title: "Coloque em prática", desc: "Plano alimentar com comida do dia a dia e treino adaptado ao seu nível." },
              ].map((step) => (
                <div key={step.num} className="card-premium rounded-2xl p-8 space-y-4">
                  <span className="text-5xl font-black text-primary/20">{step.num}</span>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-28 px-6 lg:px-12 border-t border-border bg-card/30">
          <div className="max-w-5xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <p className="text-primary text-xs font-bold uppercase tracking-widest">O que você recebe</p>
              <h2 className="text-3xl md:text-4xl font-bold">Tudo para chegar lá</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: <Utensils className="w-6 h-6 text-primary" />,
                  title: "Plano Alimentar Completo",
                  desc: "5 a 6 refeições diárias com arroz, feijão, frango, ovos e outros alimentos acessíveis. Adaptável para vegetarianos, veganos e intolerâncias."
                },
                {
                  icon: <Dumbbell className="w-6 h-6 text-primary" />,
                  title: "Treino Semanal Estruturado",
                  desc: "Divisão por grupos musculares com exercícios compostos e complementares. De 2x a 6x por semana. Academia ou em casa."
                },
                {
                  icon: <TrendingUp className="w-6 h-6 text-primary" />,
                  title: "Evolução Realista",
                  desc: "Timeline semana a semana do que esperar. Sem promessas vazias — só ciência e consistência."
                },
                {
                  icon: <Zap className="w-6 h-6 text-primary" fill="currentColor" />,
                  title: "Estratégia Personalizada",
                  desc: "Cada plano explica o porquê das escolhas: déficit calórico, superávit, divisão de macros e volume de treino."
                },
              ].map((feat, i) => (
                <div key={i} className="card-premium rounded-2xl p-8 flex gap-5">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    {feat.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold">{feat.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-28 px-6 border-t border-border">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-primary/6 rounded-full blur-[80px]" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight relative">
              Pronto para evoluir?
            </h2>
            <p className="text-muted-foreground text-lg relative">
              Milhares de pessoas já têm um plano personalizado. O seu está a 2 minutos de distância.
            </p>
            <Link href="/formulario">
              <button
                data-testid="button-create-plan-cta"
                className="btn-glow bg-primary text-primary-foreground font-bold text-lg px-10 py-5 rounded-xl flex items-center gap-2 mx-auto group"
              >
                Criar meu plano agora
                <ChevronRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center border-t border-border">
        <p className="text-xs text-muted-foreground/50 font-medium uppercase tracking-widest">
          &copy; {new Date().getFullYear()} Elevate &mdash; Seu próximo nível começa aqui.
        </p>
      </footer>
    </div>
  );
}
