// Define the already added products (SKUs)
const alreadyAddedProducts = [
    "ZEC_20037000001D55D55D63", // Gorro Tiger
    "IMP_P21.100.03"            // Herschel Classic Backpack
];

let productsData = [];
let selectedProducts = new Set();
let filteredProducts = [];
let hasSearched = false;

// DOM Elements
const searchInput = document.getElementById('productSearch');
const searchResults = document.getElementById('searchResults');
const searchPlaceholder = document.getElementById('searchPlaceholder');
const noResults = document.getElementById('noResults');
const addButton = document.getElementById('addSelectedProducts');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Load products data from JSON file
    fetch('products-data.json')
        .then(response => response.json())
        .then(data => {
            productsData = data;
            setupEventListeners();
        })
        .catch(error => {
            console.error('Error loading products data:', error);
        });
});

function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        
        if (query === '') {
            // If search is cleared, show placeholder and hide results
            searchPlaceholder.style.display = 'block';
            searchResults.style.display = 'none';
            noResults.style.display = 'none';
            hasSearched = false;
        } else {
            // Filter products based on search query
            filteredProducts = productsData.filter(product => 
                product.Nombre.toLowerCase().includes(query) ||
                product.SKU.toLowerCase().includes(query) ||
                product.Descripcion.toLowerCase().includes(query) ||
                (product.Categorias && product.Categorias.toLowerCase().includes(query))
            );
            
            hasSearched = true;
            renderProducts(filteredProducts);
        }
    });

    // Add selected products button
    addButton.addEventListener('click', function() {
        if (selectedProducts.size > 0) {
            // Here you would typically add the selected products to your main table
            const selectedProductsData = productsData.filter(product => 
                selectedProducts.has(product.SKU)
            );
            
            console.log('Adding selected products:', selectedProductsData);
            
            // Show success message (you can customize this)
            alert(`Se agregaron ${selectedProducts.size} producto(s) a la cotización.`);
            
            // Reset and close modal
            resetModal();
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalProductoImportado'));
            modal.hide();
        }
    });

    // Reset modal when closed
    document.getElementById('modalProductoImportado').addEventListener('hidden.bs.modal', function() {
        resetModal();
    });
}

function renderProducts(products) {
    if (products.length === 0 && hasSearched) {
        searchPlaceholder.style.display = 'none';
        searchResults.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }

    searchPlaceholder.style.display = 'none';
    searchResults.style.display = 'block';
    noResults.style.display = 'none';

    searchResults.innerHTML = products.map(product => {
        const isAlreadyAdded = alreadyAddedProducts.includes(product.SKU);
        const isSelected = selectedProducts.has(product.SKU);

        return `
            <div class="product-search-item ${isSelected ? 'selected' : ''} ${isAlreadyAdded ? 'already-added' : ''}" 
                    data-product-id="${product.SKU}">
                ${isAlreadyAdded ? '<span class="already-added-badge">Ya agregado</span>' : ''}
                <div class="d-flex align-items-center">
                    ${!isAlreadyAdded ? `
                        <div class="form-check me-3">
                            <input class="form-check-input" type="checkbox" 
                                    id="product-${product.SKU}" 
                                    ${isSelected ? 'checked' : ''}
                                    ${isAlreadyAdded ? 'disabled' : ''}
                                    onchange="toggleProduct('${product.SKU}')">
                        </div>
                    ` : ''}
                    <div class="me-3">
                        <img src="${product.Imagen}" alt="${product.Nombre}" class="product-image-small">
                    </div>
                    <div class="flex-grow-1">
                        <div class="product-name">${product.Nombre}</div>
                        <div class="product-sku">SKU: ${product.SKU}</div>
                        <div class="mt-2">
                            <div class="product-stock">Stock disponible: ${product.Stock}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers to product items
    document.querySelectorAll('.product-search-item:not(.already-added)').forEach(item => {
        item.addEventListener('click', function(e) {
            // Don't trigger if clicking on checkbox
            if (e.target.type === 'checkbox') return;
            
            const productId = this.dataset.productId;
            const checkbox = this.querySelector('input[type="checkbox"]');
            
            // Only toggle if not already added
            if (!alreadyAddedProducts.includes(productId)) {
                checkbox.checked = !checkbox.checked;
                toggleProduct(productId);
            }
        });
    });
}

function toggleProduct(productId) {
    // Don't allow toggling already added products
    if (alreadyAddedProducts.includes(productId)) return;
    
    const item = document.querySelector(`[data-product-id="${productId}"]`);
    const checkbox = document.getElementById(`product-${productId}`);
    
    if (checkbox.checked) {
        selectedProducts.add(productId);
        item.classList.add('selected');
    } else {
        selectedProducts.delete(productId);
        item.classList.remove('selected');
    }
    
    updateSelectedCount();
}

function updateSelectedCount() {
    const count = selectedProducts.size;
    
    if (count > 0) {
        addButton.disabled = false;
        addButton.textContent = `Agregar ${count} producto${count > 1 ? 's' : ''} seleccionado${count > 1 ? 's' : ''}`;
    } else {
        addButton.disabled = true;
        addButton.textContent = 'Agregar productos seleccionados';
    }
}

function resetModal() {
    selectedProducts.clear();
    searchInput.value = '';
    filteredProducts = [];
    hasSearched = false;
    searchPlaceholder.style.display = 'block';
    searchResults.style.display = 'none';
    noResults.style.display = 'none';
    updateSelectedCount();
}