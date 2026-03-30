import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="font-bold text-xl tracking-tight">RiesGeoPereira</div>
        <nav className="flex items-center gap-6">
          <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">Características</Link>
          <Link href="#about" className="text-sm font-medium hover:text-primary transition-colors">El Proyecto</Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Ingresar</Link>
            <Link href="/login" className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors">Empezar</Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 space-y-8 bg-gradient-to-b from-background to-muted/50">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter max-w-4xl leading-tight">
          Gestión de Riesgos con <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Inteligencia Geoespacial</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Plataforma SaaS para la recolección, auditoría ISO 19157 y análisis predictivo de datos de emergencias e infraestructura utilizando mapas interactivos e IA.
        </p>
        <div className="flex items-center gap-4 pt-4">
          <Link href="/dashboard" className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
            Ir al Tablero de Mando
          </Link>
          <Link href="/login" className="px-8 py-3 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-all">
            Identificarse
          </Link>
        </div>

        {/* Hero Section placeholder removed by user request */}
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t text-center text-muted-foreground text-sm flex flex-col items-center justify-center space-y-2">
        <p>© 2026 RiesGeoPereira. Todos los derechos reservados.</p>
        <p>Desarrollado para la Gobernanza de Datos Espaciales.</p>
      </footer>
    </div>
  );
}
