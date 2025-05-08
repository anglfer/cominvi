let usuarios = [];
let productos = [];
let ordenes = [];

export function inicializarModulo() {
    cargarOrdenes();
    setDetalleVisible(false);
}

async function cargarOrdenes() {
    try {
        const url = `https://calidad.cominvi.com.mx:8880/api/principal/orden`;
        const resp = await fetch(url);

        if (!resp.ok) {
            ordenes = [];
        } else {
            const datos = await resp.json();
            ordenes = Array.isArray(datos) ? datos : datos ? [datos] : [];
        }

        actualizarTablaOrdenes();
        calcularTotales();
    } catch (error) {
        console.error('Error al cargar órdenes:', error);
        mostrarMensaje('Error al cargar órdenes', 'error');
        ordenes = [];
        actualizarTablaOrdenes();
        calcularTotales();
    }
}

async function cargarUsuarios() {
    try {
        const url = `https://calidad.cominvi.com.mx:8880/api/principal/usuario`;
        const resp = await fetch(url);

        if (!resp.ok) {
            throw new Error('Error al obtener usuarios');
        }

        const datos = await resp.json();
        usuarios = Array.isArray(datos) ? datos : datos ? [datos] : [];

        const cmbUsuario = document.getElementById('cmbUsuario');
        if (!cmbUsuario) {
            console.error("Elemento cmbUsuario no encontrado");
            return false;
        }

        let contenido = '<option value="">Seleccione un usuario</option>';
        for (const usuario of usuarios) {
            const estadoActivo = usuario.status === 1 || usuario.estatus === 1;
            if (estadoActivo) {
                contenido += `<option value="${usuario.idusuario}">${usuario.nombre} ${usuario.paterno}</option>`;
            }
        }

        cmbUsuario.innerHTML = contenido;
        console.log("Usuarios cargados correctamente:", usuarios.length);
        return true;
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        mostrarMensaje('Error al cargar usuarios', 'error');
        return false;
    }
}

async function cargarProductos() {
    try {
        const url = `https://calidad.cominvi.com.mx:8880/api/principal/producto`;
        const resp = await fetch(url);

        if (!resp.ok) {
            throw new Error('Error al obtener productos');
        }

        const datos = await resp.json();
        productos = Array.isArray(datos) ? datos : datos ? [datos] : [];

        const cmbProducto = document.getElementById('cmbProducto');
        if (!cmbProducto) {
            console.error("Elemento cmbProducto no encontrado");
            return false;
        }

        let contenido = '<option value="">Seleccione un producto</option>';
        for (const producto of productos) {
            const estadoActivo = producto.status === 1 || producto.estatus === 1;
            if (estadoActivo) {
                contenido += `<option value="${producto.idproducto}">${producto.nombre} - ${producto.categoria}</option>`;
            }
        }

        cmbProducto.innerHTML = contenido;
        console.log("Productos cargados correctamente:", productos.length);

        cmbProducto.addEventListener('change', function() {
            if (this.value) {
                const precio = (Math.random() * 4900 + 100).toFixed(2);
                document.getElementById('txtPrecioUnitario').value = precio;
            } else {
                document.getElementById('txtPrecioUnitario').value = '';
            }
        });
        return true;
    } catch (error) {
        console.error('Error al cargar productos:', error);
        mostrarMensaje('Error al cargar productos', 'error');
        return false;
    }
}

function actualizarTablaOrdenes() {
    let contenido = '';

    for (const orden of ordenes) {
        const precioUnitario = orden.preciounitario || 0;
        const importeTotal = orden.cantidad * precioUnitario;

        contenido += `
            <tr>
                <td>${orden.idorden}</td>
                <td>${orden.usuario?.nombre || ''} ${orden.usuario?.paterno || ''}</td>
                <td>${orden.producto?.nombre || ''}</td>
                <td>${orden.producto?.categoria || ''}</td>
                <td>${orden.cantidad}</td>
                <td>$${precioUnitario.toFixed(2)}</td>
                <td>$${importeTotal.toFixed(2)}</td>
                <td>${orden.fecha}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="cm.eliminarOrden(${orden.idorden})">
                        <i class="fas fa-trash-alt"></i> Eliminar
                    </button>
                </td>
            </tr>
        `;
    }

    document.getElementById('tbodyOrdenes').innerHTML = contenido ||
        '<tr><td colspan="9" class="text-center">No hay órdenes registradas</td></tr>';
}

function calcularTotales() {
    const granTotal = ordenes.reduce((total, orden) => {
        const precioUnitario = orden.preciounitario || 0;
        return total + (orden.cantidad * precioUnitario);
    }, 0);

    const totalSmartphone = ordenes
        .filter(orden => orden.producto?.categoria?.toLowerCase() === 'smartphone')
        .reduce((total, orden) => {
            const precioUnitario = orden.preciounitario || 0;
            return total + (orden.cantidad * precioUnitario);
        }, 0);

    document.getElementById('txtGranTotal').textContent = `$${granTotal.toFixed(2)}`;
    document.getElementById('txtTotalSmartphone').textContent = `$${totalSmartphone.toFixed(2)}`;
}

function validarFormularioOrden() {
    let valido = true;
    const campos = [
        { id: 'cmbUsuario', mensaje: 'Debe seleccionar un usuario' },
        { id: 'cmbProducto', mensaje: 'Debe seleccionar un producto' },
        { id: 'txtCantidad', mensaje: 'La cantidad debe ser mayor a 0', validacion: valor => parseInt(valor) > 0 },
        { id: 'txtPrecioUnitario', mensaje: 'El precio debe ser mayor a 0', validacion: valor => parseFloat(valor) > 0 }
    ];

    campos.forEach(campo => {
        const elemento = document.getElementById(campo.id);
        const valor = elemento.value.trim();

        if (!valor || (campo.validacion && !campo.validacion(valor))) {
            elemento.classList.add('is-invalid');
            valido = false;
            mostrarMensaje(campo.mensaje, 'warning');
        } else {
            elemento.classList.remove('is-invalid');
            elemento.classList.add('is-valid');
        }
    });

    return valido;
}

export async function guardarOrden() {
    if (!validarFormularioOrden()) {
        return;
    }

    const usuarioId = parseInt(document.getElementById('cmbUsuario').value);
    const productoId = parseInt(document.getElementById('cmbProducto').value);
    const cantidad = parseInt(document.getElementById('txtCantidad').value);
    const precioUnitario = parseFloat(document.getElementById('txtPrecioUnitario').value);

    const usuario = usuarios.find(u => u.idusuario === usuarioId);
    const producto = productos.find(p => p.idproducto === productoId);

    if (!usuario || !producto) {
        mostrarMensaje('Error: No se encontró el usuario o producto seleccionado', 'error');
        return;
    }

    const nuevaOrden = {
        idorden: 0,
        usuario: usuario,
        producto: producto,
        cantidad: cantidad,
        preciounitario: precioUnitario,
        fecha: new Date().toISOString().split('T')[0]
    };

    try {
        const url = `https://calidad.cominvi.com.mx:8880/api/principal/orden`;
        const opciones = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(nuevaOrden)
        };

        const resp = await fetch(url, opciones);

        if (resp.ok) {
            mostrarMensaje('Orden guardada con éxito', 'success');
            await cargarOrdenes();
            limpiarFormulario();
            setDetalleVisible(false);
        } else {
            mostrarMensaje('Error al guardar la orden', 'error');
        }
    } catch (error) {
        console.error('Error al guardar orden:', error);
        mostrarMensaje('Error al procesar la orden', 'error');
    }
}

export async function eliminarOrden(idOrden) {
    if (!confirm('¿Está seguro de eliminar esta orden?')) {
        return;
    }

    try {
        const url = `https://calidad.cominvi.com.mx:8880/api/principal/orden/${idOrden}`;
        const opciones = { method: 'DELETE' };

        const resp = await fetch(url, opciones);

        if (resp.ok) {
            mostrarMensaje('Orden eliminada con éxito', 'success');
            await cargarOrdenes();
        } else {
            mostrarMensaje('No se pudo eliminar la orden', 'error');
        }
    } catch (error) {
        console.error('Error al eliminar orden:', error);
        mostrarMensaje('Error al eliminar la orden', 'error');
    }
}

export function limpiarFormulario() {
    document.getElementById('cmbUsuario').selectedIndex = 0;
    document.getElementById('cmbProducto').selectedIndex = 0;
    document.getElementById('txtCantidad').value = 1;
    document.getElementById('txtPrecioUnitario').value = '';

    const campos = ['cmbUsuario', 'cmbProducto', 'txtCantidad', 'txtPrecioUnitario'];
    campos.forEach(id => {
        const elemento = document.getElementById(id);
        elemento.classList.remove('is-valid', 'is-invalid');
    });
}

export function setDetalleVisible(visible) {
    if (visible) {
        document.getElementById('divDetalleOrden').style.display = 'block';
        document.getElementById('divCatalogoOrdenes').style.display = 'none';
    } else {
        document.getElementById('divDetalleOrden').style.display = 'none';
        document.getElementById('divCatalogoOrdenes').style.display = 'block';
    }
}

export async function mostrarFormularioNuevo() {
    limpiarFormulario();
    setDetalleVisible(true);

    setTimeout(async () => {
        const usuariosOk = await cargarUsuarios();
        const productosOk = await cargarProductos();

        if (!usuariosOk || !productosOk) {
            mostrarMensaje('Error al cargar datos necesarios para el formulario', 'error');
        }
    }, 100);
}

function mostrarMensaje(mensaje, tipo) {
    Swal.fire({
        title: tipo === 'error' ? 'Error' : tipo === 'warning' ? 'Advertencia' : 'Éxito',
        text: mensaje,
        icon: tipo,
        timer: 3000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
    });
}

