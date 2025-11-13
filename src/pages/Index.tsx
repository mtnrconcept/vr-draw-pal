import { Button } from "@/components/ui/button";
import { Camera, Palette, BookOpen, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-16 pb-12 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-block">
            <div className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              <Palette className="w-16 h-16 mx-auto mb-4" strokeWidth={1.5} />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground tracking-tight">
            Apprenez à dessiner avec la{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Réalité Augmentée
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Projetez vos images sur papier, ajustez l'opacité et laissez notre assistant IA vous guider vers le perfectionnement.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/exercises')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[var(--shadow-soft)] text-lg px-8 py-6"
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Explorer les exercices
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/project')}
              className="border-2 text-lg px-8 py-6"
            >
              <Camera className="mr-2 h-5 w-5" />
              Mode projection AR
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card rounded-2xl p-8 shadow-[var(--shadow-card)] border border-border hover:shadow-[var(--shadow-soft)] transition-all">
            <div className="bg-primary/10 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <Camera className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-card-foreground">Projection AR</h3>
            <p className="text-muted-foreground leading-relaxed">
              Utilisez votre caméra pour projeter n'importe quelle image sur votre feuille avec contrôle précis de l'opacité.
            </p>
          </div>

          <div className="bg-card rounded-2xl p-8 shadow-[var(--shadow-card)] border border-border hover:shadow-[var(--shadow-soft)] transition-all">
            <div className="bg-secondary/10 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-card-foreground">Assistant IA</h3>
            <p className="text-muted-foreground leading-relaxed">
              Recevez des conseils personnalisés, des critiques constructives et des astuces adaptées à votre niveau.
            </p>
          </div>

          <div className="bg-card rounded-2xl p-8 shadow-[var(--shadow-card)] border border-border hover:shadow-[var(--shadow-soft)] transition-all">
            <div className="bg-accent/10 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <BookOpen className="w-7 h-7 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-card-foreground">Exercices guidés</h3>
            <p className="text-muted-foreground leading-relaxed">
              Des dizaines d'exercices progressifs du débutant à l'expert pour développer vos compétences.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-primary to-secondary rounded-3xl p-12 text-center shadow-[var(--shadow-soft)]">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Rejoignez des milliers d'artistes qui progressent chaque jour
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/exercises')}
            className="bg-white text-primary hover:bg-white/90 shadow-lg text-lg px-8 py-6"
          >
            Commencer maintenant
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
