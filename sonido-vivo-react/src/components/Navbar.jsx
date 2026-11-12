import React, { useState } from 'react';
import { loginApi, logoutApi } from '../services/api';

const Navbar = ({ currentUser, setCurrentUser, carritoCount = 0, onOpenCart }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorLogin('');
    setCargando(true);
    try {
      const user = await loginApi(email, password);
      setCurrentUser(user);
      setShowLoginModal(false);
      setEmail('');
      setPassword('');
    } catch (err) {
      setErrorLogin(err.message || 'Credenciales incorrectas');
    } finally {
      setCargando(false);
    }
  };

  const handleLogout = () => {
    logoutApi();
    setCurrentUser(null);
  };

  const rellenarPrueba = (correoPrueba, passPrueba) => {
    setEmail(correoPrueba);
    setPassword(passPrueba);
    setErrorLogin('');
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm">
        <div className="container">
          <a className="navbar-brand fw-bold text-warning" href="#home">
            🎵 Sonido Vivo
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a className="nav-link active" href="#catalogo">Catálogo</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#tracking">Tracking</a>
              </li>
            </ul>

            <div className="d-flex align-items-center gap-3">
              <button
                className="btn btn-outline-warning position-relative"
                onClick={onOpenCart}
              >
                🛒 Carrito
                {carritoCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {carritoCount}
                  </span>
                )}
              </button>

              {!currentUser ? (
                <button
                  className="btn btn-warning fw-bold btn-sm px-3"
                  onClick={() => setShowLoginModal(true)}
                >
                  🔐 Iniciar Sesión
                </button>
              ) : (
                <div className="d-flex align-items-center gap-2 text-white">
                  <span className="badge bg-info text-dark">{currentUser.role}</span>
                  <small className="d-none d-md-inline">{currentUser.nombre}</small>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={handleLogout}
                  >
                    Salir
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* MODAL DE INICIO DE SESIÓN JWT */}
      {showLoginModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-dark text-warning">
                <h5 className="modal-title fw-bold">🔐 Iniciar Sesión - Sonido Vivo</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowLoginModal(false)}
                ></button>
              </div>
              <form onSubmit={handleLoginSubmit}>
                <div className="modal-body p-4">
                  {errorLogin && (
                    <div className="alert alert-danger py-2">{errorLogin}</div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Correo Electrónico</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="ejemplo@sonidovivo.cl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Contraseña</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="border-top pt-3 mt-3">
                    <small className="text-muted d-block mb-2">
                      Accesos rápidos de prueba (Roles JWT):
                    </small>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => rellenarPrueba('admin@sonidovivo.cl', 'admin123')}
                      >
                        Admin
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success"
                        onClick={() => rellenarPrueba('vendedor@sonidovivo.cl', 'vendedor123')}
                      >
                        Vendedor
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => rellenarPrueba('cliente@sonidovivo.cl', 'cliente123')}
                      >
                        Cliente
                      </button>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowLoginModal(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-warning fw-bold px-4"
                    disabled={cargando}
                  >
                    {cargando ? 'Ingresando...' : 'Entrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;