// src/types.ts
export interface PuebloMagico {
  [x: string]: never[];
  id?: string;
  nombre: string;
  descripcion?: string;
  codigoPostal?: string;
  fechaFundacion?: string;
  patrono?: string;
  santoPatron?: string;
  fechaFeria?: string;
  imagen?: string;
}
