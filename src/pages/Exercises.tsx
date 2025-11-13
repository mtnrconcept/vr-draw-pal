import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";

const exercises = [
  {
    id: 1,
    title: "Formes géométriques de base",
    level: "Débutant",
    duration: "15 min",
    description: "Maîtrisez les cercles, carrés et triangles",
    image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&h=300&fit=crop",
  },
  {
    id: 2,
    title: "Lignes et perspectives",
    level: "Débutant",
    duration: "20 min",
    description: "Apprenez les bases de la perspective",
    image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop",
  },
  {
    id: 3,
    title: "Ombres et lumières",
    level: "Intermédiaire",
    duration: "30 min",
    description: "Créez du volume avec les ombres",
    image: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&h=300&fit=crop",
  },
  {
    id: 4,
    title: "Proportions du visage",
    level: "Intermédiaire",
    duration: "45 min",
    description: "Dessinez des portraits réalistes",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop",
  },
  {
    id: 5,
    title: "Anatomie humaine",
    level: "Avancé",
    duration: "60 min",
    description: "Maîtrisez le corps humain",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=300&fit=crop",
  },
  {
    id: 6,
    title: "Textures réalistes",
    level: "Avancé",
    duration: "50 min",
    description: "Rendez vos dessins vivants",
    image: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400&h=300&fit=crop",
  },
];

const Exercises = () => {
  const navigate = useNavigate();

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Débutant":
        return "bg-accent text-accent-foreground";
      case "Intermédiaire":
        return "bg-secondary text-secondary-foreground";
      case "Avancé":
        return "bg-primary text-primary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Bibliothèque d'exercices
          </h1>
          <p className="text-muted-foreground text-lg">
            Progressez à votre rythme avec des exercices adaptés à votre niveau
          </p>
        </div>

        {/* Exercises Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map((exercise) => (
            <Card 
              key={exercise.id}
              className="overflow-hidden hover:shadow-[var(--shadow-soft)] transition-all border-border"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={exercise.image}
                  alt={exercise.title}
                  className="w-full h-full object-cover"
                />
                <Badge className={`absolute top-3 right-3 ${getLevelColor(exercise.level)}`}>
                  {exercise.level}
                </Badge>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-card-foreground mb-2">
                  {exercise.title}
                </h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  {exercise.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    ⏱️ {exercise.duration}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => navigate('/project', { state: { exerciseId: exercise.id } })}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Démarrer
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Exercises;
