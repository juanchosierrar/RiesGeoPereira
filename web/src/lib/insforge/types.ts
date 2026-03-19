// Multi-tenant GRD Data Model — Insforge PostgreSQL

export type Gravedad = 'Baja' | 'Media' | 'Alta' | 'Critica';
export type EstadoFlujo = 'Reportado' | 'En Verificación' | 'Atendido' | 'Cerrado';
export type RolUsuario = 'Admin' | 'Operativo' | 'Consultor';
export type TipoEvento = 'Inundación' | 'Incendio' | 'Deslizamiento' | 'Sismo' | 'Vendaval' | 'Otro';

export interface Organizacion {
    id: string;
    nombre: string;
    nit: string;
    suscripcion_plan: string;
    logo_url?: string;
}

export interface Usuario {
    id: string;
    fk_org: string;
    nombre: string;
    email: string;
    rol: RolUsuario;
    estado: string;
}

export interface EventoRiesgo {
    id: string;
    fk_org: string;
    fk_usuario_reporta: string;
    tipo_evento: TipoEvento;
    fecha_hora: string;
    descripcion: string;
    gravedad: Gravedad;
    coordenadas_lat: number;
    coordenadas_lng: number;
    estado_flujo: EstadoFlujo;
}

export interface RecursoAfectado {
    id: string;
    fk_evento: string;
    tipo_recurso: string;
    cantidad: number;
    valor_estimado?: number;
}

export interface EvidenciaMedia {
    id: string;
    fk_evento: string;
    url_archivo: string;
    timestamp: string;
}

// Auth response types
export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: Usuario;
}

export interface AuthSession {
    user: Usuario | null;
    token: string | null;
    isAuthenticated: boolean;
}
