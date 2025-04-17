1. Entendimiento del Proyecto

La idea consiste en crear una plataforma web para rifas virtuales organizada por una entidad que trabaja con múltiples vendedores. Cada evento de rifa tendrá una cantidad determinada de números que se repartirán entre varios vendedores. Los participantes podrán apartar números y luego pagar mediante transferencia bancaria o efectivo. Los pagos se deben validar subiendo una imagen del comprobante. El sistema debe gestionar reservas en tiempo real y evitar conflictos por números ya reservados o vendidos.

Problema principal que resuelve:
Evita el caos y las duplicaciones en la venta de números de rifas entre varios vendedores. Ofrece validación automática de reservas y pagos.

Propuesta de valor:
Una plataforma confiable, automática y accesible para gestionar rifas virtuales con validación, control antifraude y experiencia intuitiva para organizadores, vendedores y compradores.

2. Arquitectura Propuesta

[Frontend - Next.js + TypeScript]  <-------> [Supabase - Base de datos y Autenticación]
       |                                             ^
       v                                             |
[Interfaz de Usuario] -----------------------> [Backend Serverless (Supabase Functions)]
                                                
  - Componentes React modularizados
  - Hooks personalizados para lógica de negocio

3. Estructura de Datos (SQL simplificado)

CREATE TABLE raffles (
  id UUID PRIMARY KEY,
  title TEXT,
  description TEXT,
  date_lottery DATE,
  price NUMERIC,
  currency TEXT,
  lottery TEXT
);

CREATE TABLE sellers (
  id UUID PRIMARY KEY,
  name TEXT,
  phone TEXT,
  avatar TEXT,
  cedula TEXT
);

CREATE TABLE raffle_sellers (
  id UUID PRIMARY KEY,
  raffle_id UUID REFERENCES raffles(id),
  seller_id UUID REFERENCES sellers(id),
  cant_max INT,
  allow_voucher_print BOOLEAN
);

CREATE TABLE participants (
  id UUID PRIMARY KEY,
  name TEXT,
  phone TEXT,
  email TEXT,
  raffle_id UUID,
  seller_id UUID
);

CREATE TABLE raffle_numbers (
  id UUID PRIMARY KEY,
  raffle_id UUID,
  number TEXT,
  status TEXT CHECK (status IN ('available', 'reserved', 'sold')),
  seller_id UUID,
  participant_id UUID,
  payment_proof TEXT,
  reservation_expires_at TIMESTAMP
);

4. Flujo de Usuario

Participante accede a la URL personalizada del vendedor (con su nombre)

Ve los números disponibles en una cuadrícula interactiva

Selecciona los números y los aparta ingresando su nombre y teléfono

Sube una foto del pago o transferencia

Sistema valida y cambia el estado del número a "sold"

Participante recibe comprobante digital

Organizador puede ver reportes y verificar vendedores

5. Interfaz de Usuario (Wireframes simples)

Pantalla Principal de la Rifa:

Header con logo y datos de la rifa

Carrusel de premios (si hay)

Grid de 100 números con estado visual

Botones: Apartar, Pagar, Ver Comprobante

Modal de Validación de Teléfono:

Campo para ingresar número

Botón Validar con spinner de carga

Pantalla de Voucher Digital:

Resumen de la compra

Datos del participante

Números adquiridos

Imprimir o compartir

6. Tecnologías Recomendadas

Frontend: Next.js + TypeScript (mejor DX y SSR)

Backend: Supabase (Base de datos + funciones + storage)

Autenticación: Supabase Auth (anónimo para participantes, con tokens para vendedores)

Almacenamiento de Imágenes: Supabase Storage

UI: Tailwind CSS + shadcn/ui

Despliegue: Vercel (integración directa con GitHub)

7. Potenciales Problemas y Soluciones

Conflictos de reservas simultáneas

✅ Solución: Validación en tiempo real al momento de confirmar el pago.

Carga lenta de números

✅ Solución: usar cache local + paginación + skeleton loaders

Subida de imágenes fallida

✅ Solución: Retry automático y validación previa (formato/size)

Usuarios falsos o spam

✅ Solución: Protección vía token de vendedor único + throttling

Problemas al compartir link del vendedor

✅ Solución: URLs amigables tipo /vendedor/juan-garcia

8. Plan de Implementación (Fases)

Fase 1: Diseño y estructura de base de datos en Supabase (1 día)

Fase 2: Implementación del grid y lógica de reserva (2-3 días)

Fase 3: Validación y carga de pagos (2 días)

Fase 4: Vistas de comprobantes y digital voucher (1 día)

Fase 5: URL personalizadas por vendedor y validación final (1 día)

Fase 6: Testeo + publicación en Lovable + GitHub (1 día)

9. Ejemplo de Código Clave

// validateSelectedNumber.ts
export const validateSelectedNumber = async (number: string, phone: string, raffleNumbers: any[], raffleSellerId: string) => {
  const raffleNumber = raffleNumbers.find(n => n.number === number && n.seller_id === raffleSellerId);

  if (!raffleNumber || raffleNumber.status !== 'reserved') {
    throw new Error('Número no reservado');
  }

  const { data: participant, error } = await supabase
    .from('participants')
    .select('phone')
    .eq('id', raffleNumber.participant_id)
    .single();

  if (participant?.phone !== phone) {
    throw new Error('Teléfono no coincide');
  }

  return true;
};
