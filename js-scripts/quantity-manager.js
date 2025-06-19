let quantities = [0];

function renderQuantities() {
    const container = document.getElementById('quantitiesContainer');
    container.innerHTML = '';
    quantities.forEach((qty, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'input-group';

        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'form-control';
        input.required = true;
        input.value = qty;
        input.oninput = (e) => updateQuantity(index, parseInt(e.target.value) || 0);

        wrapper.appendChild(input);

        if (quantities.length > 1) {
            const buttonWrapper = document.createElement('span');
            buttonWrapper.className = 'input-group-text p-2';

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'delete-btn';
            removeBtn.innerHTML = '<i class="far fa-trash-alt"></i>';
            removeBtn.onclick = () => removeQuantity(index);

            buttonWrapper.appendChild(removeBtn);
            wrapper.appendChild(buttonWrapper);
        }

        container.appendChild(wrapper);
    });
}

function updateQuantity(index, value) {
    quantities[index] = value;
}

function addQuantity() {
    quantities.push(0);
    renderQuantities();
}

function removeQuantity(index) {
    quantities.splice(index, 1);
    renderQuantities();
}

renderQuantities();