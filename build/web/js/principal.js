let moduloCargado = false;
let cm = null;

async function cargarModuloUsuarios() {
    let contenedor = document.getElementById('contenedorPrincipal');
    if (moduloCargado) {
        contenedor.innerHTML = '';
        moduloCargado = false;
    } else {
        let url = 'modulos/usuarios.html';
        let resp = await fetch(url);
        let contenido = await resp.text();
        contenedor.innerHTML = contenido;

        import('./MODULO/usuarios.js').then(obj => {
            cm = obj;
            cm.inicializarModulo();
        });
        moduloCargado = true;
    }
}

async function cargarModuloOrdenes() {
    let contenedor = document.getElementById('contenedorPrincipal');
    if (moduloCargado) {
        contenedor.innerHTML = '';
        moduloCargado = false;
    } else {
        let url = 'modulos/ordenes.html';
        let resp = await fetch(url);
        let contenido = await resp.text();
        contenedor.innerHTML = contenido;

        import('./MODULO/ordenes.js').then(obj => {
            cm = obj;
            cm.inicializarModulo();
        });
        moduloCargado = true;
    }
}