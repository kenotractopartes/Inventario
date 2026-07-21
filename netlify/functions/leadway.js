// ============================================================
// PUENTE ENTRE EL INVENTARIO Y LEADWAY  ·  Tracto Partes Magaña
// ============================================================
// Por qué existe: el token de la API de Leadway NO puede vivir en el HTML del
// inventario, porque ahí lo ve cualquiera que abra el código fuente. Aquí sí
// puede: Netlify lo guarda como variable de entorno y nunca sale al navegador.
//
// Quién puede usarla: solo alguien con sesión iniciada en el Firebase del
// inventario Y cuyo correo esté en la lista de permitidos. El código de este
// archivo es público (vive en el repo), así que el candado NO es que nadie
// sepa cómo llamarla, sino que hay que traer una sesión válida.
//
// FASE 1 (hoy): solo LEER. No modifica ni borra nada en la tienda.
// ============================================================

const LEADWAY_BASE = 'https://services.leadconnectorhq.com';
const LEADWAY_VERSION = '2021-07-28';

// Solo se aceptan llamadas desde la app real. Evita que otra página use la
// sesión del navegador de Raúl para pegarle a esto sin que él se entere.
const ORIGENES_OK = [
  'https://fotonas.tractopartes.com',
  'https://kenotractopartes.github.io',
  'http://localhost:8899'
];

function cors(origen) {
  const permitido = ORIGENES_OK.includes(origen) ? origen : ORIGENES_OK[0];
  return {
    'Access-Control-Allow-Origin': permitido,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  };
}

function respuesta(codigo, cuerpo, origen) {
  return { statusCode: codigo, headers: cors(origen), body: JSON.stringify(cuerpo) };
}

// Verifica contra Google que la sesión del inventario sea de verdad, y que el
// correo esté autorizado. Si esto falla, no se toca la tienda.
async function verificarSesion(idToken) {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) return { ok: false, motivo: 'Falta configurar FIREBASE_API_KEY en Netlify' };
  if (!idToken) return { ok: false, motivo: 'No mandaste sesión' };

  const r = await fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(apiKey),
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) }
  );
  if (!r.ok) return { ok: false, motivo: 'Sesión inválida o vencida — vuelve a entrar al inventario' };

  const data = await r.json();
  const usuario = (data.users || [])[0];
  if (!usuario) return { ok: false, motivo: 'Sesión inválida' };

  const permitidos = String(process.env.EMAILS_PERMITIDOS || '')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const correo = String(usuario.email || '').toLowerCase();
  if (permitidos.length && !permitidos.includes(correo)) {
    return { ok: false, motivo: 'Tu cuenta no tiene permiso para tocar la tienda' };
  }
  return { ok: true, correo };
}

// Llamada a la API de Leadway con los headers que pide su documentación.
async function leadway(ruta, opciones = {}) {
  const token = process.env.LEADWAY_TOKEN;
  if (!token) throw new Error('Falta configurar LEADWAY_TOKEN en Netlify');
  const r = await fetch(LEADWAY_BASE + ruta, {
    ...opciones,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Version': LEADWAY_VERSION,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(opciones.headers || {})
    }
  });
  const texto = await r.text();
  let cuerpo;
  try { cuerpo = texto ? JSON.parse(texto) : {}; } catch (e) { cuerpo = { crudo: texto }; }
  if (!r.ok) {
    const err = new Error('Leadway respondió ' + r.status);
    err.codigo = r.status;
    err.detalle = cuerpo;
    throw err;
  }
  return cuerpo;
}

exports.handler = async (event) => {
  const origen = event.headers.origin || event.headers.Origin || '';

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors(origen), body: '' };
  if (event.httpMethod !== 'POST') return respuesta(405, { error: 'Solo POST' }, origen);

  let peticion;
  try { peticion = JSON.parse(event.body || '{}'); }
  catch (e) { return respuesta(400, { error: 'No se entendió la petición' }, origen); }

  const sesion = await verificarSesion(peticion.idToken);
  if (!sesion.ok) return respuesta(401, { error: sesion.motivo }, origen);

  const locationId = process.env.LEADWAY_LOCATION_ID;
  if (!locationId) return respuesta(500, { error: 'Falta configurar LEADWAY_LOCATION_ID en Netlify' }, origen);

  try {
    switch (peticion.accion) {

      // Prueba de vida: confirma que el token sirve y cuántos productos hay.
      case 'ping': {
        const r = await leadway('/products/?locationId=' + encodeURIComponent(locationId) + '&limit=1');
        return respuesta(200, {
          ok: true,
          correo: sesion.correo,
          totalProductos: (r.total !== undefined ? r.total : (r.products || []).length),
          mensaje: 'Conexión con Leadway funcionando'
        }, origen);
      }

      // Trae los productos de la tienda (paginado, solo lectura).
      case 'listar': {
        const limite = Math.min(Number(peticion.limite) || 100, 100);
        const salto = Number(peticion.salto) || 0;
        const r = await leadway('/products/?locationId=' + encodeURIComponent(locationId) +
          '&limit=' + limite + '&offset=' + salto);
        const productos = (r.products || []).map(p => ({
          id: p._id || p.id,
          nombre: p.name,
          handle: p.slug || p.handle || '',
          enTienda: p.availableInStore,
          fotos: (p.medias || []).length,
          actualizado: p.updatedAt
        }));
        return respuesta(200, { ok: true, total: r.total, productos }, origen);
      }

      // Devuelve el producto tal cual lo manda Leadway. Sirve para ver qué
      // campos trae de verdad antes de escribir la parte que modifica.
      case 'ver': {
        if (!peticion.productoId) return respuesta(400, { error: 'Falta el id del producto' }, origen);
        const r = await leadway('/products/' + encodeURIComponent(peticion.productoId) +
          '?locationId=' + encodeURIComponent(locationId));
        return respuesta(200, { ok: true, producto: r }, origen);
      }

      default:
        return respuesta(400, { error: 'Acción desconocida: ' + peticion.accion }, origen);
    }
  } catch (e) {
    return respuesta(502, {
      error: e.message || 'Falló la llamada a Leadway',
      codigo: e.codigo || null,
      detalle: e.detalle || null
    }, origen);
  }
};
