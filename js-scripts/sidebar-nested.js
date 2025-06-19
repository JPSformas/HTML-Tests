document.addEventListener('DOMContentLoaded', function() {
    const btnAgregarCantidades = document.getElementById('btnAgregarCantidades');
    const nestedSidebar = document.getElementById('nestedSidebar');
    const btnBackNestedSidebar = document.getElementById('btnBackNestedSidebar');
    const mainSidebar = document.getElementById('sidebarMasElementos');

    if (btnAgregarCantidades && nestedSidebar && btnBackNestedSidebar) {
        btnAgregarCantidades.addEventListener('click', function() {
            nestedSidebar.classList.add('show');
        });

        btnBackNestedSidebar.addEventListener('click', function() {
            nestedSidebar.classList.remove('show');
        });
    }

    if (mainSidebar && nestedSidebar) {
        mainSidebar.addEventListener('hidden.bs.offcanvas', () => {
            nestedSidebar.classList.remove('show');
        });
    }

    initializeDragAndDrop();
});