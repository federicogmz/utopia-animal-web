import { getActor, unauthorized, type AuthEnv } from '../_lib/auth';

interface Env extends AuthEnv {
  DB: D1Database;
}

interface UsuarioRow {
  username: string;
  nombre: string;
  rol: string;
  etapa_responsable: string | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const actor = await getActor(request, env);
  if (!actor) return unauthorized();

  // Batch de IA (bearer) — identidad de sistema.
  if (actor === 'ia') {
    return Response.json({ ok: true, user: 'ia', nombre: 'Evaluación IA', rol: 'sistema', etapa_responsable: null });
  }

  try {
    const row = await env.DB.prepare(
      'SELECT username, nombre, rol, etapa_responsable FROM usuarios WHERE username = ?'
    ).bind(actor).first<UsuarioRow>();
    if (row) {
      return Response.json({ ok: true, user: row.username, nombre: row.nombre, rol: row.rol, etapa_responsable: row.etapa_responsable });
    }
  } catch { /* tabla ausente → cae al perfil admin por secret */ }

  // Superadmin por secret, no está en la tabla.
  return Response.json({ ok: true, user: actor, nombre: 'Administrador', rol: 'admin', etapa_responsable: null });
};
