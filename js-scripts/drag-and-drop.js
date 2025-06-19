function initializeDragAndDrop() {
    const tableBody = document.querySelector('table tbody');
    if (!tableBody) return;

    Sortable.create(tableBody, {
        animation: 200,
        handle: '.dragItem',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        onStart: () => document.body.style.cursor = 'grabbing',
        onEnd: (evt) => {
            document.body.style.cursor = '';
            updateItemIds();
            saveNewOrder();
        }
    });

    addDragHandleFeedback();
}

function addDragHandleFeedback() {
    const dragHandles = document.querySelectorAll('.dragItem span');
    dragHandles.forEach(handle => {
        handle.addEventListener('mouseenter', () => handle.style.transform = 'scale(1.1)');
        handle.addEventListener('mouseleave', () => handle.style.transform = 'scale(1)');
    });
}

function updateItemIds() {
    const rows = document.querySelectorAll('.item-container');
    rows.forEach((row, i) => row.id = `item-${i + 1}`);
}

function saveNewOrder() {
    const rows = document.querySelectorAll('.item-container');
    const order = Array.from(rows).map((row, i) => ({
        id: row.getAttribute('data-id'),
        position: i + 1,
        productName: row.querySelector('.productName').textContent.trim()
    }));
    localStorage.setItem('itemOrder', JSON.stringify(order));
}