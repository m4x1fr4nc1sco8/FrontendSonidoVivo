// src/services/api.js
const API_URL = 'http://localhost:8080/api/v1';

// Obtener headers con el Token JWT si hay sesión activa
const getAuthHeaders = () => {
  const token = localStorage.getItem('sv_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

// Mapear rol de Spring Security al formato visual de React
export const mapRolVisual = (rolBackend) => {
  if (rolBackend === 'ROLE_ADMINISTRADOR') return 'Administrador';
  if (rolBackend === 'ROLE_VENDEDOR') return 'Vendedor';
  return 'Cliente';
};

// --- AUTENTICACIÓN (JWT) ---
export const loginApi = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');

  localStorage.setItem('sv_token', data.token);
  const userFormatted = {
    id: data.id,
    nombre: data.nombre,
    email: data.email,
    rolBackend: data.rol,
    role: mapRolVisual(data.rol)
  };
  localStorage.setItem('sv_user', JSON.stringify(userFormatted));
  return userFormatted;
};

export const logoutApi = () => {
  localStorage.removeItem('sv_token');
  localStorage.removeItem('sv_user');
};

export const getStoredUser = () => {
  const data = localStorage.getItem('sv_user');
  return data ? JSON.parse(data) : null;
};

// --- PRODUCTOS Y CATEGORÍAS ---
export const fetchProductos = async () => {
  const res = await fetch(`${API_URL}/productos`);
  if (!res.ok) throw new Error('Error al cargar productos');
  const data = await res.json();

  // Adaptamos los campos del Backend al formato exacto que esperan ProductCard y AdminPanel
  return data.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    categoria: p.categoria ? p.categoria.nombre : 'Sin categoría',
    categoriaId: p.categoria ? p.categoria.id : 1,
    precio: p.precio,
    stock: p.stock,
    img: p.imagenUrl
  }));
};

export const fetchCategorias = async () => {
  const res = await fetch(`${API_URL}/categorias`);
  if (!res.ok) return [];
  return await res.json();
};

export const apiCrearProducto = async (producto) => {
  const res = await fetch(`${API_URL}/productos`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      nombre: producto.nombre,
      categoria: { id: Number(producto.categoriaId || 1) },
      precio: Number(producto.precio),
      stock: Number(producto.stock),
      imagenUrl: producto.img || producto.imagenUrl
    })
  });
  if (!res.ok) throw new Error('No autorizado o error al crear producto');
  return await res.json();
};

export const apiSumarStock = async (id, cantidad) => {
  const res = await fetch(`${API_URL}/productos/${id}/stock?cantidad=${cantidad}`, {
    method: 'PATCH',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Error al actualizar stock');
  return await res.json();
};

export const apiEliminarProducto = async (id) => {
  const res = await fetch(`${API_URL}/productos/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Error al eliminar producto');
};

// --- BOLETAS / PEDIDOS ---
export const fetchBoletas = async () => {
  const res = await fetch(`${API_URL}/boletas`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) return [];
  const data = await res.json();

  return data.map((b) => ({
    id: `SV-${b.id}`,
    rawId: b.id,
    cliente: b.usuario ? b.usuario.nombre : 'Cliente',
    fecha: b.fecha ? new Date(b.fecha).toLocaleDateString('es-CL') : '',
    direccion: b.direccion || 'Retiro en tienda',
    estado: b.estado,
    total: b.total,
    items: (b.detalles || []).map((d) => ({
      nombre: d.producto ? d.producto.nombre : 'Producto',
      cantidad: d.cantidad,
      precio: d.precioUnitario
    }))
  }));
};

export const apiCrearBoleta = async ({ usuarioId, direccion, carrito }) => {
  const res = await fetch(`${API_URL}/boletas`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      usuario: { id: usuarioId },
      direccion: direccion || 'Envío estándar',
      detalles: carrito.map((item) => ({
        producto: { id: item.id },
        cantidad: item.cantidad
      }))
    })
  });
  if (!res.ok) throw new Error('Error al procesar la compra en el servidor');
  return await res.json();
};

export const apiCambiarEstadoBoleta = async (idConPrefijo, nuevoEstado) => {
  const rawId = String(idConPrefijo).replace('SV-', '');
  const res = await fetch(`${API_URL}/boletas/${rawId}/estado`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ estado: nuevoEstado })
  });
  if (!res.ok) throw new Error('Error al cambiar estado del pedido');
  return await res.json();
};