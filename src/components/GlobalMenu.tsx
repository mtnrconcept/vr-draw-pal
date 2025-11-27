import React, { useState } from "react";
import { Menu, X, Home, Camera, BookOpen, Palette } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export const GlobalMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { icon: Home, label: "Accueil", path: "/" },
        { icon: Camera, label: "Mode AR", path: "/project" },
        { icon: BookOpen, label: "Exercices", path: "/exercises" },
        { icon: Palette, label: "DrawMaster VR", path: "/drawmaster" },
    ];

    const handleNavigate = (path: string) => {
        navigate(path);
        setIsOpen(false);
    };

    return (
        <>
            {/* Bouton menu - fixe en haut à droite */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed right-6 top-6 z-[110] flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white transition-all hover:bg-white/20 hover:scale-110"
                aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Menu déroulant */}
            <div
                className={`fixed right-6 top-20 z-[105] w-64 rounded-2xl border border-white/20 bg-black/90 backdrop-blur-xl shadow-2xl transition-all duration-300 ease-out ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
                    }`}
            >
                <div className="p-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <button
                                key={item.path}
                                onClick={() => handleNavigate(item.path)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? "bg-primary/20 text-primary"
                                        : "text-white/80 hover:bg-white/10 hover:text-white"
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Overlay pour fermer le menu en cliquant à l'extérieur */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 z-[104] bg-black/20 backdrop-blur-sm"
                />
            )}
        </>
    );
};
