import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { VendorPanel } from './views/VendorPanel';
import CartModal from './components/CartModal';
import { AdminPanel } from './components/AdminPanel';
import {
  fetchProductos,
  fetchBoletas,
  apiSumarStock,
  apiCrearProducto,
  apiEliminarProducto,
  apiCambiarEstadoBoleta,
  getStoredUser,
  logoutApi
} from './services/api';
import './index.css';

export function App() {
  // Estados de datos
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [carrito, setCarrito] = useState([]);

  // Estados de UI
  const [categoriaSel, setCategoriaSel] = useState('todos');
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [codigoTracking, setCodigoTracking] = useState('');
  const [trackingResultado, setTrackingResultado] = useState(null);

  // Cargar productos desde Spring Boot al iniciar
  const cargarProductos = async () => {
    try {
      const lista = await fetchProductos();
      setProductos(lista);
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  // Cargar boletas (solo si es Admin o Vendedor)
  const cargarPedidos = async () => {
    if (!currentUser || currentUser.role === 'Cliente') {
      setPedidos([]);
      return;
    }
    try {
      const lista = await fetchBoletas();
      setPedidos(lista);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    cargarPedidos();
  }, [currentUser]);

  // Manejo del Carrito
  const handleAddToCart = (producto) => {
    if (producto.stock <= 0) return;

    setProductos((prevProductos) =>
      prevProductos.map((p) =>
        p.id === producto.id ? { ...p, stock: p.stock - 1 } : p
      )
    );

    setCarrito((prevCarrito) => {
      const existe = prevCarrito.find((item) => item.id === producto.id);
      if (existe) {
        return prevCarrito.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prevCarrito, { ...producto, cantidad: 1 }];
    });
  };

  const handleRemoveFromCart = (productId) => {
    const itemAEliminar = carrito.find((item) => item.id === productId);
    if (!itemAEliminar) return;

    setProductos((prevProductos) =>
      prevProductos.map((p) =>
        p.id === productId ? { ...p, stock: p.stock + itemAEliminar.cantidad } : p
      )
    );

    setCarrito((prevCarrito) => prevCarrito.filter((item) => item.id !== productId));
  };

  const handleDecreaseQuantity = (productId) => {
    const item = carrito.find((i) => i.id === productId);
    if (!item) return;

    if (item.cantidad === 1) {
      handleRemoveFromCart(productId);
      return;
    }

    setProductos((prevProductos) =>
      prevProductos.map((p) =>
        p.id === productId ? { ...p, stock: p.stock + 1 } : p
      )
    );

    setCarrito((prevCarrito) =>
      prevCarrito.map((i) =>
        i.id === productId ? { ...i, cantidad: i.cantidad - 1 } : i
      )
    );
  };

  const handleCheckoutSuccess = async (nuevoPedido) => {
    setPedidos((prev) => [nuevoPedido, ...prev]);
    setCarrito([]);
    await cargarProductos();
    await cargarPedidos();
  };

  // Operaciones de Inventario y Pedidos conectadas a la API
  const handleUpdateStock = async (id, cambio) => {
    try {
      await apiSumarStock(id, cambio);
      await cargarProductos();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddProduct = async (nuevo) => {
    try {
      await apiCrearProducto(nuevo);
      await cargarProductos();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await apiEliminarProducto(id);
      await cargarProductos();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChangeOrderStatus = async (id, nuevoEstado) => {
    try {
      await apiCambiarEstadoBoleta(id, nuevoEstado);
      await cargarPedidos();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCerrarSesion = () => {
    logoutApi();
    setCurrentUser(null);
  };

  // Búsqueda de Tracking
  const handleConsultarTracking = (e) => {
    e.preventDefault();
    const cod = codigoTracking.trim().toUpperCase();
    if (!cod) return;

    const pedidoEncontrado = pedidos.find(
      (p) => String(p.id).toUpperCase() === cod
    );
    setTrackingResultado(pedidoEncontrado || 'no_encontrado');
  };

  // Productos filtrados
  const productosFiltrados = productos.filter((prod) => {
    if (
      !categoriaSel ||
      categoriaSel.trim().toLowerCase() === 'todos' ||
      categoriaSel === ''
    ) {
      return true;
    }

    const catProducto = (prod.categoria || '').trim().toLowerCase();
    const catSeleccionada = categoriaSel.trim().toLowerCase();

    return (
      catProducto.includes(catSeleccionada) ||
      catSeleccionada.includes(catProducto)
    );
  });

  return (
    <div>
      <Navbar
        carritoCount={carrito.reduce((acc, item) => acc + item.cantidad, 0)}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {currentUser && (
        <div className="bg-primary text-white py-2">
          <div className="container d-flex justify-content-between align-items-center">
            <span>
              Sesión iniciada como: <strong>{currentUser.nombre}</strong> ({currentUser.role})
            </span>
            <button className="btn btn-sm btn-outline-light" onClick={handleCerrarSesion}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}

      <header className="bg-primary text-white text-center py-5 hero-section" id="home">
        <div className="container">
          <h1 className="display-4 fw-bold">Sonido Vivo</h1>
          <p className="lead">Instrumentos y Equipos Musicales en Viña del Mar</p>
          <a href="#catalogo" className="btn btn-warning btn-lg fw-bold">Ver Catálogo</a>
        </div>
      </header>

      {currentUser?.role === 'Vendedor' && (
        <VendorPanel
          productos={productos}
          pedidos={pedidos}
          onUpdateStock={handleUpdateStock}
          onChangeOrderStatus={handleChangeOrderStatus}
        />
      )}

      {currentUser?.role === 'Administrador' && (
        <AdminPanel
          productos={productos}
          pedidos={pedidos}
          onUpdateStock={handleUpdateStock}
          onChangeOrderStatus={handleChangeOrderStatus}
          onAddProduct={handleAddProduct}
          onDeleteProduct={handleDeleteProduct}
        />
      )}

      {/* SECCIÓN DE CONSULTA DE TRACKING */}
      <section className="bg-light py-5 border-bottom" id="tracking">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6 text-center">
              <h3 className="fw-bold mb-3">🔍 Consulta el Estado de tu Pedido</h3>
              <p className="text-muted mb-4">
                Ingresa el código de seguimiento que recibiste al finalizar tu compra para ver el estado del envío.
              </p>

              <form onSubmit={handleConsultarTracking} className="d-flex gap-2 mb-4">
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Ej: SV-1"
                  value={codigoTracking}
                  onChange={(e) => setCodigoTracking(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary btn-lg fw-bold px-4">
                  Buscar
                </button>
              </form>

              {trackingResultado === 'no_encontrado' && (
                <div className="alert alert-danger" role="alert">
                  ❌ No se encontró ningún pedido asociado al código <strong>{codigoTracking}</strong>.
                </div>
              )}

              {trackingResultado && trackingResultado !== 'no_encontrado' && (
                <div className="card text-start shadow-sm border-0">
                  <div className="card-header bg-success text-white fw-bold d-flex justify-content-between align-items-center">
                    <span>Pedido: {trackingResultado.id}</span>
                    <span className="badge bg-light text-dark">{trackingResultado.estado}</span>
                  </div>
                  <div className="card-body">
                    <p className="mb-1"><strong>Cliente:</strong> {trackingResultado.cliente}</p>
                    <p className="mb-1"><strong>Fecha:</strong> {trackingResultado.fecha}</p>
                    <p className="mb-1"><strong>Dirección:</strong> {trackingResultado.direccion}</p>
                    <p className="mb-3"><strong>Total:</strong> ${Number(trackingResultado.total).toLocaleString('es-CL')}</p>

                    <h6 className="fw-bold border-bottom pb-1">Productos del Pedido:</h6>
                    <ul className="list-group list-group-flush small">
                      {trackingResultado.items?.map((item, idx) => (
                        <li key={idx} className="list-group-item d-flex justify-content-between px-0">
                          <span>{item.nombre} (x{item.cantidad})</span>
                          <span>${(item.precio * item.cantidad).toLocaleString('es-CL')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CATÁLOGO DE PRODUCTOS */}
      <div className="container my-5" id="catalogo">
        <h2 className="text-center mb-4">Catálogo de Productos</h2>
        <div className="d-flex justify-content-center flex-wrap gap-2 mb-4">
          <button
            className={`btn ${categoriaSel === 'todos' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setCategoriaSel('todos')}
          >
            Todos
          </button>
          <button
            className={`btn ${categoriaSel === 'Guitarras' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setCategoriaSel('Guitarras')}
          >
            Guitarras
          </button>
          <button
            className={`btn ${categoriaSel === 'Bajos' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setCategoriaSel('Bajos')}
          >
            Bajos
          </button>
          <button
            className={`btn ${categoriaSel === 'Baterías' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setCategoriaSel('Baterías')}
          >
            Baterías
          </button>
          <button
            className={`btn ${categoriaSel === 'Teclados' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setCategoriaSel('Teclados')}
          >
            Teclados
          </button>
          <button
            className={`btn ${categoriaSel === 'Amplificadores' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setCategoriaSel('Amplificadores')}
          >
            Amplificadores
          </button>
          <button
            className={`btn ${categoriaSel === 'Micrófonos' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setCategoriaSel('Micrófonos')}
          >
            Micrófonos
          </button>
          <button
            className={`btn ${categoriaSel === 'Pedales' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setCategoriaSel('Pedales')}
          >
            Pedales
          </button>
          <button
            className={`btn ${categoriaSel === 'Estudio' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setCategoriaSel('Estudio')}
          >
            Estudio
          </button>
          <button
            className={`btn ${categoriaSel === 'Accesorios' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setCategoriaSel('Accesorios')}
          >
            Accesorios
          </button>
        </div>

        <div className="row g-4">
          {productosFiltrados.map((prod) => (
            <div className="col-12 col-md-6 col-lg-4" key={prod.id}>
              <ProductCard
                product={prod}
                onAddToCart={handleAddToCart}
              />
            </div>
          ))}
        </div>
      </div>

      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={carrito}
        currentUser={currentUser}
        onRemove={handleRemoveFromCart}
        onRemoveFromCart={handleRemoveFromCart}
        onAddToCart={handleAddToCart}
        onDecreaseQuantity={handleDecreaseQuantity}
        onCheckoutSuccess={handleCheckoutSuccess}
      />
    </div>
  );
}

export default App;