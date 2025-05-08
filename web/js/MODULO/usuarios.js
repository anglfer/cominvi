let usuarios = [];
let enviandoFormulario = false;

export function inicializarModulo() {
    consultarUsuarios();
    setDetalleUsuarioVisible(false);

    document.getElementById('btnNuevoUsuario').addEventListener('click', mostrarFormularioNuevo);
    document.getElementById('btnCancelarUsuario').addEventListener('click', () => setDetalleUsuarioVisible(false));
    document.getElementById('btnBuscar').addEventListener('click', buscarUsuarios);
    document.getElementById('chkEstatus').addEventListener('change', actualizarLabelEstatus);
}

function actualizarLabelEstatus() {
    const esActivo = document.getElementById('chkEstatus').checked;
    const label = document.getElementById('lblEstatus');

    if (esActivo) {
        label.textContent = 'Activo';
        label.className = 'text-success fw-bold';
    } else {
        label.textContent = 'Inactivo';
        label.className = 'text-danger';
    }
}

export async function consultarUsuarios() {
    try {
        const url = 'https://calidad.cominvi.com.mx:8880/api/principal/usuario';
        const resp = await fetch(url);

        if (!resp.ok) {
            throw new Error('Error al obtener usuarios');
        }

        const datos = await resp.json();
        usuarios = Array.isArray(datos) ? datos : [datos];
        console.log("Usuarios recibidos:", usuarios);

        actualizarTablaUsuarios();
    } catch (error) {
        mostrarMensaje('Error al cargar usuarios', 'error');
        console.error('Error:', error);
        usuarios = [];
        actualizarTablaUsuarios();
    }
}

function actualizarTablaUsuarios() {
    let contenido = '';

    for (const usuario of usuarios) {
        const statusNum = Number(usuario.estatus);
        const esActivo = statusNum === 1;

        contenido += `
            <tr>
                <td>${usuario.idusuario}</td>
                <td>${usuario.nombre}</td>
                <td>${usuario.paterno}</td>
                <td>${usuario.materno}</td>
                <td>${usuario.correo}</td>
                <td>${usuario.fecharegistro}</td>
                <td>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" disabled
                            ${esActivo ? 'checked' : ''}
                            style="transform: scale(1.4);">
                        <label class="form-check-label ${esActivo ? 'text-success fw-bold' : 'text-danger'}">
                            ${esActivo ? 'Activo' : 'Inactivo'}
                        </label>
                    </div>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="cm.editarUsuario(${usuario.idusuario})">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" title="Eliminar"
                        onclick="cm.eliminarUsuario(${usuario.idusuario})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    document.getElementById('tbodyUsuarios').innerHTML = contenido ||
        '<tr><td colspan="8" class="text-center">No hay usuarios registrados</td></tr>';
}

export async function guardarUsuario() {
    if (enviandoFormulario) return;
    enviandoFormulario = true;

    try {
        const idUsuario = document.getElementById('txtIdUsuario').value;
        const nombre = document.getElementById('txtNombre').value.trim();
        const paterno = document.getElementById('txtPaterno').value.trim();
        const materno = document.getElementById('txtMaterno').value.trim();
        const correo = document.getElementById('txtCorreo').value.trim();
        const fechaRegistro = document.getElementById('txtFechaRegistro').value;
        const estatus = document.getElementById('chkEstatus').checked ? 1 : 0;

        const usuario = {
            idusuario: idUsuario ? parseInt(idUsuario) : 0,
            nombre: nombre,
            paterno: paterno,
            materno: materno,
            correo: correo,
            estatus: estatus,
            fecharegistro: fechaRegistro
        };

        console.log("Enviando usuario con estatus:", usuario.estatus);

        const url = 'https://calidad.cominvi.com.mx:8880/api/principal/usuario';
        const opciones = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(usuario)
        };

        const resp = await fetch(url, opciones);

        if (resp.ok) {
            const respData = await resp.json();
            console.log("Respuesta del servidor:", respData);

            mostrarMensaje(`Usuario ${idUsuario ? 'actualizado' : 'guardado'} con éxito`, 'success');

            setTimeout(async () => {
                await consultarUsuarios();
                setDetalleUsuarioVisible(false);
            }, 500);
        } else {
            const errorData = await resp.text();
            console.error("Error del servidor:", errorData);
            mostrarMensaje('Error al guardar usuario', 'error');
        }
    } catch (error) {
        mostrarMensaje('Error al procesar la solicitud', 'error');
        console.error('Error:', error);
    } finally {
        enviandoFormulario = false;
    }
}

export async function editarUsuario(idUsuario) {
    try {
        const url = `https://calidad.cominvi.com.mx:8880/api/principal/usuario/${idUsuario}`;
        const resp = await fetch(url);

        if (!resp.ok) {
            throw new Error('Error al obtener usuario');
        }

        const usuario = await resp.json();
        console.log("Usuario a editar:", usuario);

        document.getElementById('txtIdUsuario').value = usuario.idusuario;
        document.getElementById('txtNombre').value = usuario.nombre;
        document.getElementById('txtPaterno').value = usuario.paterno;
        document.getElementById('txtMaterno').value = usuario.materno;
        document.getElementById('txtCorreo').value = usuario.correo;
        document.getElementById('txtFechaRegistro').value = usuario.fecharegistro;

        const esActivo = Number(usuario.estatus) === 1;
        document.getElementById('chkEstatus').checked = esActivo;

        actualizarLabelEstatus();

        setDetalleUsuarioVisible(true);
    } catch (error) {
        mostrarMensaje('Error al cargar datos del usuario', 'error');
        console.error('Error:', error);
    }
}

export function limpiarFormulario() {
    document.getElementById('txtIdUsuario').value = '';
    document.getElementById('txtNombre').value = '';
    document.getElementById('txtPaterno').value = '';
    document.getElementById('txtMaterno').value = '';
    document.getElementById('txtCorreo').value = '';

    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('txtFechaRegistro').value = hoy;

    document.getElementById('chkEstatus').checked = true;
    actualizarLabelEstatus();

    const campos = ['txtNombre', 'txtPaterno', 'txtMaterno', 'txtCorreo', 'txtFechaRegistro'];
    campos.forEach(campo => {
        document.getElementById(campo).classList.remove('is-valid', 'is-invalid');
    });
}

export async function eliminarUsuario(idUsuario) {
    if (!idUsuario) {
        const id = document.getElementById('txtIdUsuario').value;
        if (!id) {
            mostrarMensaje('Seleccione un usuario para eliminar', 'error');
            return;
        }
        idUsuario = parseInt(id);
    }

    const confirmacion = await Swal.fire({
        title: '¿Está seguro?',
        text: "Esta acción eliminará el usuario permanentemente",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
        const url = `https://calidad.cominvi.com.mx:8880/api/principal/usuario/${idUsuario}`;
        const opciones = { method: 'DELETE' };

        const resp = await fetch(url, opciones);

        if (resp.ok) {
            mostrarMensaje('Usuario eliminado con éxito', 'success');
            await consultarUsuarios();
            setDetalleUsuarioVisible(false);
        } else {
            const errorData = await resp.text();
            console.error('Error del servidor:', errorData);
            mostrarMensaje('No se pudo eliminar el usuario', 'error');
        }
    } catch (error) {
        mostrarMensaje('Error al eliminar usuario', 'error');
        console.error('Error:', error);
    }
}

function validarFormularioUsuario() {
    let valido = true;
    const campos = [
        { id: 'txtNombre', mensaje: 'El nombre es obligatorio' },
        { id: 'txtPaterno', mensaje: 'El apellido paterno es obligatorio' },
        { id: 'txtMaterno', mensaje: 'El apellido materno es obligatorio' },
        {
            id: 'txtCorreo',
            mensaje: 'Ingrese un correo electrónico válido',
            validacion: valor => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)
        },
        {
            id: 'txtFechaRegistro',
            mensaje: 'La fecha de registro no puede ser futura',
            validacion: valor => {
                const fechaRegistro = new Date(valor);
                const hoy = new Date();
                return fechaRegistro <= hoy;
            }
        }
    ];

    campos.forEach(campo => {
        const elemento = document.getElementById(campo.id);
        const valor = elemento.value.trim();

        if (!valor || (campo.validacion && !campo.validacion(valor))) {
            elemento.classList.add('is-invalid');
            valido = false;
            mostrarMensaje(campo.mensaje, 'error');
        } else {
            elemento.classList.remove('is-invalid');
            elemento.classList.add('is-valid');
        }
    });

    return valido;
}

async function verificarCorreoExistente(correo, idUsuarioActual = 0) {
    try {
        const url = 'https://calidad.cominvi.com.mx:8880/api/principal/usuario';
        const resp = await fetch(url);

        if (!resp.ok) {
            return false;
        }

        const datos = await resp.json();
        const todosUsuarios = Array.isArray(datos) ? datos : [datos];

        return todosUsuarios.some(u =>
            u.correo.toLowerCase() === correo.toLowerCase() &&
            u.idusuario !== parseInt(idUsuarioActual)
        );
    } catch (error) {
        console.error('Error al verificar correo:', error);
        return false;
    }
}

export async function validarYGuardarUsuario() {
    if (enviandoFormulario) return;

    if (!validarFormularioUsuario()) {
        mostrarMensaje('Por favor, complete correctamente todos los campos', 'error');
        return;
    }

    const idUsuario = document.getElementById('txtIdUsuario').value;
    const correo = document.getElementById('txtCorreo').value.trim();

    const correoExiste = await verificarCorreoExistente(correo, idUsuario);

    if (correoExiste) {
        document.getElementById('txtCorreo').classList.add('is-invalid');
        mostrarMensaje('El correo electrónico ya está registrado por otro usuario', 'error');
        return;
    }

    guardarUsuario();
}

export async function buscarUsuarios() {
    const textoBusqueda = document.getElementById('txtBusqueda').value.trim().toLowerCase();

    try {
        await consultarUsuarios();

        if (textoBusqueda) {
            const usuariosFiltrados = usuarios.filter(usuario =>
                usuario.nombre.toLowerCase().includes(textoBusqueda) ||
                usuario.paterno.toLowerCase().includes(textoBusqueda) ||
                usuario.materno.toLowerCase().includes(textoBusqueda) ||
                usuario.correo.toLowerCase().includes(textoBusqueda) ||
                usuario.idusuario.toString().includes(textoBusqueda)
            );

            usuarios = usuariosFiltrados;
        }

        actualizarTablaUsuarios();
    } catch (error) {
        mostrarMensaje('Error al buscar usuarios', 'error');
        console.error('Error:', error);
    }
}

export function setDetalleUsuarioVisible(visible) {
    if (visible) {
        document.getElementById('divCatalogoUsuarios').style.display = 'none';
        document.getElementById('divDetalleUsuario').style.display = 'block';
    } else {
        document.getElementById('divDetalleUsuario').style.display = 'none';
        document.getElementById('divCatalogoUsuarios').style.display = 'block';
        limpiarFormulario();
    }
}


export function mostrarFormularioNuevo() {
    limpiarFormulario();
    setDetalleUsuarioVisible(true);
}

function mostrarMensaje(mensaje, tipo) {
    Swal.fire({
        title: tipo === 'error' ? 'Error' : 'Éxito',
        text: mensaje,
        icon: tipo,
        timer: 3000,
        showConfirmButton: false
    });
}