
/* ==========================================
   KFITNESS - LOGIN PREMIUM
   Mejoras visuales independientes
   ========================================== */

document.addEventListener('DOMContentLoaded', function () {

    const password = document.getElementById('login-password');
    const botonVer = document.getElementById('login-ver-password');
    const botonEnviar = document.querySelector(
        '#form-login button[type="submit"]'
    );

    // Mostrar y ocultar contraseña
    if (password && botonVer) {

        botonVer.addEventListener('click', function () {

            const visible = password.type === 'password';

            password.type = visible ? 'text' : 'password';

            botonVer.setAttribute(
                'aria-label',
                visible ? 'Ocultar contraseña' : 'Mostrar contraseña'
            );

            botonVer.setAttribute(
                'aria-pressed',
                String(visible)
            );
        });
    }

    // Reflejar visualmente el estado del botón original
    if (botonEnviar) {

        const actualizarCarga = function () {
            const cargando = botonEnviar.disabled;

            botonEnviar.classList.toggle('cargando', cargando);
            botonEnviar.setAttribute('aria-busy', String(cargando));
        };

        const observador = new MutationObserver(actualizarCarga);

        observador.observe(botonEnviar, {
            attributes: true,
            attributeFilter: ['disabled']
        });

        actualizarCarga();
    }

});
