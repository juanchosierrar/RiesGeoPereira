"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/insforge/auth';
import { Shield, AlertTriangle, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);

            // Set cookie for middleware to read
            document.cookie = `insforge_token=${result.access_token}; path=/; max-age=${result.expires_in}; samesite=lax`;

            router.push('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                        <Shield className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-outfit font-bold text-primary tracking-tight">
                        RiesGeoPereira
                    </h1>
                    <p className="text-muted-foreground mt-2 font-inter text-sm">
                        Sistema de Gestión del Riesgo de Desastres
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Email */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-inter font-medium text-foreground">
                                Correo electrónico
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nombre@entidad.gov.co"
                                required
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-inter text-sm"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-inter font-medium text-foreground">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-inter text-sm"
                            />
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm font-inter">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary text-primary-foreground font-inter font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Ingresar al Sistema'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="mt-6 pt-4 border-t border-border flex items-center gap-3">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground font-inter">o</span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Demo Mode */}
                    <button
                        type="button"
                        onClick={() => {
                            const demoUser = { id: 'demo-001', fk_org: 'org-pereira', nombre: 'Usuario Demo', email: 'demo@grd.gov.co', rol: 'Admin', estado: 'activo' };
                            document.cookie = 'insforge_token=demo_access_token; path=/; max-age=86400; samesite=lax';
                            localStorage.setItem('insforge_token', 'demo_access_token');
                            localStorage.setItem('insforge_user', JSON.stringify(demoUser));
                            router.push('/dashboard');
                        }}
                        className="w-full mt-3 py-2.5 bg-accent border border-border text-foreground font-inter text-sm font-medium rounded-xl hover:bg-accent/80 transition-all flex items-center justify-center gap-2"
                    >
                        🔓 Ingresar en Modo Demo
                    </button>

                    <p className="text-center text-[10px] text-muted-foreground font-inter mt-3">
                        El modo demo permite explorar la plataforma sin backend configurado.
                    </p>
                </div>

                {/* Severity Legend */}
                <div className="mt-6 flex items-center justify-center gap-4 text-xs font-inter text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-destructive" />Crítico
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-warning" />Alto
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-severity-medium" />Medio
                    </span>
                </div>
            </div>
        </div>
    );
}
