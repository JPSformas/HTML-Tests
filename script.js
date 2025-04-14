document.addEventListener("DOMContentLoaded", () => {
  // Get all checkboxes, summary elements, and checkout button
  const checkboxes = document.querySelectorAll('input[name="buy-item"]')
  const checkAllCheckbox = document.getElementById("check-all")
  const checkAllCheckboxMobile = document.getElementById("check-all-mobile");
  const itemCountElement = document.querySelector(".summary-item .item-count")
  const subtotalElement = document.querySelector(".summary-item.subtotal .price-value")
  const ivaElement = document.querySelector(".summary-item.IVA .price-value")
  const totalElement = document.querySelector(".summary-item.total .price-value")
  const checkoutButton = document.querySelector(".checkout")

  // Initial count of total items
  const totalItems = checkboxes.length

  // IVA rate (21%)
  const IVA_RATE = 0.21

  // Track the currently applied coupon
  let currentCoupon = null

  // Store deleted items for undo functionality
  let lastDeletedItem = null
  let notificationTimeout = null

  // Function to parse price string (handles Argentine format: $123.456,78)
  function parsePrice(priceString) {
    // Handle "Gratis" text
    if (priceString === "Gratis") return 0

    // Remove currency symbol and any spaces
    const cleanPrice = priceString.replace("$", "").replace(/\s/g, "")
    // Replace dots (thousands separator) with nothing and commas (decimal separator) with dots
    const normalizedPrice = cleanPrice.replace(/\./g, "").replace(",", ".")
    // Parse as float
    return Number.parseFloat(normalizedPrice)
  }

  // Function to format price (Argentine format: $123.456,78)
  function formatPrice(price) {
    // Convert to string with 2 decimal places
    const priceStr = price.toFixed(2)
    // Split into integer and decimal parts
    const parts = priceStr.split(".")
    // Add thousands separators to integer part
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    // Join with comma as decimal separator
    return "$" + parts.join(",")
  }

  // Function to calculate subtotal of selected items
  function calculateSubtotal() {
    let subtotal = 0

    // Get fresh references to all checkboxes to ensure we're working with the current DOM state
    const currentCheckboxes = document.querySelectorAll('input[name="buy-item"]')

    // Loop through each checkbox
    currentCheckboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        // Find the price element for this cart item
        const priceElement = checkbox.closest(".cart-item").querySelector(".price-row.total-row .price-value")
        if (priceElement) {
          // Parse the price and add to subtotal
          subtotal += parsePrice(priceElement.textContent)
        }
      }
    })

    return subtotal
  }

  // Modify the updateUI function to ensure it properly updates the "check all" checkbox state
  function updateUI() {
    // Count checked items
    const checkedItems = document.querySelectorAll('input[name="buy-item"]:checked').length
    const totalRemainingItems = document.querySelectorAll('input[name="buy-item"]').length

    // NEW CODE: Add or remove .checked on each .cart-item based on checkbox state
    const allCheckboxes = document.querySelectorAll('input[name="buy-item"]');
    allCheckboxes.forEach((checkbox) => {
      const cartItem = checkbox.closest(".cart-item");
      if (checkbox.checked) {
        cartItem.classList.add("checked");
      } else {
        cartItem.classList.remove("checked");
      }
    });

    // Update item count in summary
    itemCountElement.textContent = checkedItems

    // Calculate subtotal
    const subtotal = calculateSubtotal()

    // Update subtotal in summary
    subtotalElement.textContent = formatPrice(subtotal)

    // If there's a coupon applied, update the discount
    if (currentCoupon) {
      updateCouponDiscount(currentCoupon)
    } else {
      // No coupon applied, calculate IVA and total directly
      const iva = subtotal * IVA_RATE
      const total = subtotal + iva

      // Update IVA and total values
      ivaElement.textContent = formatPrice(iva)
      totalElement.textContent = formatPrice(total)

      // Remove total_sin_IVA if it exists and no coupon is applied
      const totalSinIvaElement = document.querySelector(".summary-item.total_sin_IVA")
      if (totalSinIvaElement) {
        totalSinIvaElement.remove()
      }
    }

    // Update checkout button text based on selection
    if (checkedItems === 0) {
      // No items selected
      checkoutButton.textContent = "Comenzar compra"
      checkoutButton.disabled = true
      checkoutButton.style.opacity = "0.5"
    } else if (checkedItems === totalRemainingItems) {
      // All items selected
      checkoutButton.textContent = "Comprar todos los productos"
      checkoutButton.disabled = false
      checkoutButton.style.opacity = "1"
    } else {
      // Some items selected
      checkoutButton.textContent = "Comprar productos seleccionados"
      checkoutButton.disabled = false
      checkoutButton.style.opacity = "1"
    }

    // Update "check all" checkbox state
    checkAllCheckbox.checked = checkedItems > 0 && checkedItems === totalRemainingItems
    checkAllCheckbox.indeterminate = checkedItems > 0 && checkedItems < totalRemainingItems
    checkAllCheckboxMobile.checked = checkAllCheckbox.checked;
    checkAllCheckboxMobile.indeterminate = checkAllCheckbox.indeterminate;
  }

  // 1) Single function that reads the event target's .checked
  function handleCheckAllChange(e) {
    const isChecked = e.target.checked;
    // Set all checkboxes to match the "select all" checkbox’s state
    checkboxes.forEach((checkbox) => {
      checkbox.checked = isChecked;
    });
    // Update the UI
    updateUI();
  }

  // 2) Add event listeners for BOTH check-all inputs
  checkAllCheckbox.addEventListener("change", handleCheckAllChange);
  checkAllCheckboxMobile.addEventListener("change", handleCheckAllChange);

  // 3) Keep the per-item event listeners as is
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", updateUI);
  });


  // Add event listeners to quantity inputs to update totals when quantity changes
  document.querySelectorAll(".quantity input").forEach((input) => {
    input.addEventListener("change", function () {
      // Get the cart item
      const cartItem = this.closest(".cart-item")

      // Get the unit price and setup price
      const unitPriceElement = cartItem.querySelector(".price-row:first-child .price-value")
      const setupPriceElement = cartItem.querySelector(".price-row.setup-row .price-value")
      const totalPriceElement = cartItem.querySelector(".price-row.total-row .price-value")

      if (unitPriceElement && totalPriceElement) {
        const unitPrice = parsePrice(unitPriceElement.textContent)
        const setupPrice = setupPriceElement ? parsePrice(setupPriceElement.textContent) : 0
        const quantity = Number.parseInt(this.value) || 0

        // Calculate new total for this item
        const itemTotal = unitPrice * quantity + setupPrice

        // Update the item total
        totalPriceElement.textContent = formatPrice(itemTotal)

        // Update the summary
        updateUI()
      }
    })
  })

  // Apply green color only to "Gratis" setup values
  document.querySelectorAll(".price-row:nth-child(2) .price-value").forEach((element) => {
    if (element.textContent === "Gratis") {
      element.classList.add("free-value")
    } else {
      element.classList.remove("free-value")
    }
  })

  // Initialize UI on page load
  updateUI()

  // Add event listeners for the dropdown menu (keeping existing functionality)
  const dropdownToggle = document.querySelector(".dropdown-toggle")
  const dropdownMenu = document.querySelector(".dropdown-menu")

  if (dropdownToggle && dropdownMenu) {
    dropdownToggle.addEventListener("click", (e) => {
      e.stopPropagation()
      dropdownMenu.classList.toggle("show")
    })

    // Close the dropdown when clicking outside
    document.addEventListener("click", () => {
      if (dropdownMenu.classList.contains("show")) {
        dropdownMenu.classList.remove("show")
      }
    })
  }

  // NEW CODE: Identify apparel items and add size breakdown functionality

  // Function to check if a cart item is an apparel item
  function isApparelItem(cartItem) {
    // For this example, we'll identify the third item (Remera Fall) as an apparel item
    // In a real application, you might want to add a data attribute or class to identify apparel items
    const productName = cartItem.querySelector(".product-title")?.textContent.toLowerCase() || ""
    return (
      productName.includes("remera") ||
      productName.includes("camisa") ||
      productName.includes("pantalón") ||
      productName.includes("pantalon") ||
      productName.includes("campera") ||
      productName.includes("buzo")
    )
  }

  // Function to create size breakdown button and dropdown
  function addSizeBreakdownToApparelItems() {
    document.querySelectorAll(".cart-item").forEach((cartItem) => {
      if (isApparelItem(cartItem)) {
        // Add apparel class to the cart item
        cartItem.classList.add("cart-item-apparel")

        // Find the quantity container
        const quantityContainer = cartItem.querySelector(".quantity")

        // Check if the size breakdown button already exists
        if (!cartItem.querySelector(".size-breakdown-toggle")) {
          // Create size breakdown button
          const sizeBreakdownBtn = document.createElement("button")
          sizeBreakdownBtn.className = "size-breakdown-toggle"
          sizeBreakdownBtn.textContent = "Mostrar desglose de talles"

          // Create size breakdown container
          const sizeBreakdownContainer = document.createElement("div")
          sizeBreakdownContainer.className = "size-breakdown-container"

          // Sample size data - in a real application, this would come from your database
          // For this example, we'll use the data from the image
          const sizeData = [
            { size: "S", quantity: 2, stock: 262 },
            { size: "M", quantity: 3, stock: 5 },
            { size: "L", quantity: 1, stock: 1633 },
            { size: "XL", quantity: 4, stock: 30 },
          ]

          // Create size breakdown content
          const sizeBreakdownContent = document.createElement("div")
          sizeBreakdownContent.className = "size-breakdown-content"

          // Add size rows
          sizeData.forEach((sizeItem) => {
            const sizeRow = document.createElement("div")
            sizeRow.className = "size-row"

            const sizeLabel = document.createElement("div")
            sizeLabel.className = "size-label"
            sizeLabel.innerHTML = `${sizeItem.size} <span class="stock-info">(${sizeItem.stock} un.)</span>`

            const sizeQuantityInput = document.createElement("div")
            sizeQuantityInput.className = "size-quantity-input"

            const quantityInput = document.createElement("input")
            quantityInput.type = "number"
            quantityInput.className = "size-quantity"
            quantityInput.placeholder = "Cantidad"
            quantityInput.value = sizeItem.quantity || 0
            quantityInput.min = "0"
            quantityInput.max = sizeItem.stock
            quantityInput.dataset.stock = sizeItem.stock

            // Add up/down arrows for the input
            const arrowsContainer = document.createElement("div")
            arrowsContainer.className = "quantity-arrows"

            const upArrow = document.createElement("div")
            upArrow.className = "arrow up"
            upArrow.innerHTML = "▲"
            upArrow.addEventListener("click", () => {
              const currentValue = Number.parseInt(quantityInput.value) || 0
              const maxStock = Number.parseInt(quantityInput.dataset.stock)

              if (currentValue < maxStock) {
                quantityInput.value = currentValue + 1
              } else {
                quantityInput.value = maxStock
                // Optional: Show a small notification that max stock was reached
                const stockNotification = document.createElement("div")
                stockNotification.className = "stock-notification"
                stockNotification.textContent = `Máximo disponible: ${maxStock} un.`

                // Position the notification near the input
                const parent = quantityInput.closest(".size-quantity-input")

                // Remove any existing notification
                const existingNotification = parent.querySelector(".stock-notification")
                if (existingNotification) {
                  existingNotification.remove()
                }

                parent.appendChild(stockNotification)

                // Remove the notification after 3 seconds
                setTimeout(() => {
                  stockNotification.remove()
                }, 3000)
              }

              // Trigger change event
              const event = new Event("change", { bubbles: true })
              quantityInput.dispatchEvent(event)
            })

            const downArrow = document.createElement("div")
            downArrow.className = "arrow down"
            downArrow.innerHTML = "▼"
            downArrow.addEventListener("click", () => {
              const currentValue = Number.parseInt(quantityInput.value) || 0
              if (currentValue > 0) {
                quantityInput.value = currentValue - 1
                // Trigger change event
                const event = new Event("change", { bubbles: true })
                quantityInput.dispatchEvent(event)
              }
            })

            arrowsContainer.appendChild(upArrow)
            arrowsContainer.appendChild(downArrow)

            sizeQuantityInput.appendChild(quantityInput)
            sizeQuantityInput.appendChild(arrowsContainer)

            sizeRow.appendChild(sizeLabel)

            sizeRow.appendChild(sizeQuantityInput)

            sizeBreakdownContent.appendChild(sizeRow)
          })

          // Add "Add units" button
          const addUnitsBtn = document.createElement("button")
          addUnitsBtn.className = "add-units-btn"
          addUnitsBtn.textContent = "Agregar unidades"
          addUnitsBtn.addEventListener("click", () => {
            // Get all size inputs
            const sizeInputs = sizeBreakdownContent.querySelectorAll(".size-quantity")
            let totalQuantity = 0

            // Calculate total quantity
            sizeInputs.forEach((input) => {
              totalQuantity += Number.parseInt(input.value) || 0
            })

            // Update the main quantity input
            const mainQuantityInput = cartItem.querySelector(".quantity input")
            if (mainQuantityInput) {
              mainQuantityInput.value = totalQuantity
              // Trigger change event to update totals
              const event = new Event("change", { bubbles: true })
              mainQuantityInput.dispatchEvent(event)
            }

            // Hide the size breakdown
            sizeBreakdownContainer.classList.remove("show")
          })

          sizeBreakdownContent.appendChild(addUnitsBtn)
          sizeBreakdownContainer.appendChild(sizeBreakdownContent)

          // Add event listener to toggle size breakdown
          sizeBreakdownBtn.addEventListener("click", (e) => {
            e.preventDefault()
            sizeBreakdownContainer.classList.toggle("show")
          })

          // Add elements to the DOM
          const productInfoDiv = cartItem.querySelector(".product-info div")
          if (quantityContainer) {
            const nextSibling = quantityContainer.nextSibling
            if (nextSibling) {
              // If there's a node after .quantity, insert before that node (thus after .quantity).
              productInfoDiv.insertBefore(sizeBreakdownBtn, nextSibling)
              productInfoDiv.insertBefore(sizeBreakdownContainer, nextSibling)
            } else {
              // If .quantity is the last child, just append at the end of productInfoDiv
              productInfoDiv.appendChild(sizeBreakdownBtn)
              productInfoDiv.appendChild(sizeBreakdownContainer)
            }
          } else {
            // Fallback if no .quantity found at all
            productInfoDiv.appendChild(sizeBreakdownBtn)
            productInfoDiv.appendChild(sizeBreakdownContainer)
          }

          // Close the size breakdown when clicking outside
          document.addEventListener("click", (e) => {
            if (
              !sizeBreakdownBtn.contains(e.target) &&
              !sizeBreakdownContainer.contains(e.target) &&
              sizeBreakdownContainer.classList.contains("show")
            ) {
              sizeBreakdownContainer.classList.remove("show")
            }
          })

          // Find all size quantity inputs and add input validation
          const sizeQuantityInputs = cartItem.querySelectorAll(".size-quantity")

          sizeQuantityInputs.forEach((input) => {
            // Add input event listener to validate as user types
            input.addEventListener("input", function () {
              validateQuantityInput(this)
            })

            // Also keep the existing change event for when user completes input
            input.addEventListener("change", function () {
              validateQuantityInput(this)
            })
          })
        }
      }
    })
  }

  // New function to validate quantity input
  function validateQuantityInput(inputElement) {
    const maxStock = Number.parseInt(inputElement.dataset.stock)
    const currentValue = Number.parseInt(inputElement.value) || 0

    if (currentValue > maxStock) {
      inputElement.value = maxStock

      // Show stock notification
      showStockNotification(inputElement, maxStock)
    }
  }

  // Extract the notification creation to a separate function
  function showStockNotification(inputElement, maxStock) {
    // Create notification
    const stockNotification = document.createElement("div")
    stockNotification.className = "stock-notification"
    stockNotification.textContent = `Máximo disponible: ${maxStock} un.`

    // Position the notification near the input
    const parent = inputElement.closest(".size-quantity-input")

    // Remove any existing notification
    const existingNotification = parent.querySelector(".stock-notification")
    if (existingNotification) {
      existingNotification.remove()
    }

    parent.appendChild(stockNotification)

    // Remove the notification after 3 seconds
    setTimeout(() => {
      stockNotification.remove()
    }, 3000)
  }

  // Call the function to add size breakdown to apparel items
  addSizeBreakdownToApparelItems()

  // Coupon validation functionality
  const couponInput = document.querySelector(".coupon-input input")
  const couponButton = document.querySelector(".coupon-input button")
  const couponSection = document.querySelector(".coupon-section")

  // List of valid coupons with their discount percentages
  const validCoupons = [
    { code: "FP5", discount: 0.05 },
    { code: "FP10", discount: 0.1 },
    { code: "FP15", discount: 0.15 },
    { code: "FP20", discount: 0.2 },
    { code: "FRENZY30", discount: 0.3 },
  ]

  // Function to validate coupon
  function validateCoupon() {
    const couponValue = couponInput.value.trim().toUpperCase()

    // Remove any existing error message
    const existingError = couponSection.querySelector(".coupon-error")
    if (existingError) {
      existingError.remove()
    }

    // Remove any existing success message
    const existingSuccess = couponSection.querySelector(".coupon-success")
    if (existingSuccess) {
      existingSuccess.remove()
    }

    // Reset input style
    couponInput.classList.remove("error")
    couponInput.classList.remove("success")

    // If empty, just return
    if (!couponValue) return

    // Check if coupon is valid
    const coupon = validCoupons.find((c) => c.code === couponValue)

    if (coupon) {
      // Valid coupon - add success styling
      couponInput.classList.add("success")

      // Store the current coupon
      currentCoupon = coupon

      // Apply discount based on coupon code
      updateCouponDiscount(coupon)

      // Show the applied coupon UI
      showAppliedCoupon(coupon)
    } else {
      // Invalid coupon - add error styling
      couponInput.classList.add("error")

      // Create error message
      const errorMessage = document.createElement("div")
      errorMessage.className = "coupon-error"
      errorMessage.innerHTML = '<i class="fas fa-exclamation-circle"></i> Revisa que esté bien escrito'

      // Add error message
      couponSection.appendChild(errorMessage)
    }
  }

  // Function to show the applied coupon UI
  function showAppliedCoupon(coupon) {
    // Calculate subtotal and discount amount
    const subtotal = calculateSubtotal()
    const discountAmount = subtotal * coupon.discount

    // Hide the coupon input and button
    const couponInputContainer = document.querySelector(".coupon-input")
    couponInputContainer.style.display = "none"

    // Create the applied coupon container
    const appliedCouponContainer = document.createElement("div")
    appliedCouponContainer.className = "applied-coupon"

    // Create the applied coupon content
    appliedCouponContainer.innerHTML = `
      <div class="coupon-check">
        <i class="fas fa-check-circle"></i>
      </div>
      <div class="coupon-info">
        <div class="coupon-code">${coupon.code} aplicado</div>
        <div class="coupon-discount">${coupon.discount * 100}% off</div>
      </div>
      <button class="remove-coupon">Quitar</button>
    `

    // Add the applied coupon container to the coupon section
    couponSection.appendChild(appliedCouponContainer)

    // Add event listener to the remove button
    const removeButton = appliedCouponContainer.querySelector(".remove-coupon")
    removeButton.addEventListener("click", removeCoupon)
  }

  // Function to remove the applied coupon
  function removeCoupon() {
    // Remove the applied coupon container
    const appliedCouponContainer = document.querySelector(".applied-coupon")
    if (appliedCouponContainer) {
      appliedCouponContainer.remove()
    }

    // Show the coupon input and button again
    const couponInputContainer = document.querySelector(".coupon-input")
    couponInputContainer.style.display = "flex"

    // Clear the input field
    couponInput.value = ""

    // Reset input styling - fix for the green border bug
    couponInput.classList.remove("success")
    couponInput.classList.remove("error")

    // Remove any existing discount from the summary
    const discountElement = document.querySelector(".summary-item.discount")
    if (discountElement) {
      discountElement.remove()
    }

    // Remove the total_sin_IVA row
    const totalSinIvaElement = document.querySelector(".summary-item.total_sin_IVA")
    if (totalSinIvaElement) {
      totalSinIvaElement.remove()
    }

    // Clear the current coupon
    currentCoupon = null

    // Update the UI without discount
    updateUI()
  }

  // Function to update coupon discount based on current subtotal
  function updateCouponDiscount(coupon) {
    // Calculate subtotal
    const subtotal = calculateSubtotal()

    // Calculate discount amount
    const discountAmount = subtotal * coupon.discount

    // Check if discount section already exists
    let discountElement = document.querySelector(".summary-item.discount")

    if (!discountElement) {
      // Create discount element if it doesn't exist
      discountElement = document.createElement("div")
      discountElement.className = "summary-item discount"

      const discountLabel = document.createElement("span")
      discountLabel.textContent = "Descuento:"

      const discountValue = document.createElement("span")
      discountValue.className = "price-value discount-value"

      discountElement.appendChild(discountLabel)
      discountElement.appendChild(discountValue)

      // Insert before IVA
      const ivaElement = document.querySelector(".summary-item.IVA")
      ivaElement.parentNode.insertBefore(discountElement, ivaElement)
    }

    // Update discount value
    const discountValueElement = discountElement.querySelector(".price-value")
    discountValueElement.textContent = "- " + formatPrice(discountAmount)

    // Update the applied coupon UI if it exists
    const appliedCouponDiscount = document.querySelector(".coupon-discount")
    if (appliedCouponDiscount) {
      appliedCouponDiscount.textContent = `-${formatPrice(discountAmount)} (${coupon.discount * 100}% off)`
    }

    // Calculate total without IVA (subtotal - discount)
    const totalSinIva = subtotal - discountAmount

    // Check if total_sin_IVA section already exists
    let totalSinIvaElement = document.querySelector(".summary-item.total_sin_IVA")

    if (!totalSinIvaElement) {
      // Create total_sin_IVA element if it doesn't exist
      totalSinIvaElement = document.createElement("div")
      totalSinIvaElement.className = "summary-item total_sin_IVA"

      const totalSinIvaLabel = document.createElement("span")
      totalSinIvaLabel.textContent = "Total sin impuestos:"

      const totalSinIvaValue = document.createElement("span")
      totalSinIvaValue.className = "price-value"

      totalSinIvaElement.appendChild(totalSinIvaLabel)
      totalSinIvaElement.appendChild(totalSinIvaValue)

      // Insert before IVA
      const ivaElement = document.querySelector(".summary-item.IVA")
      ivaElement.parentNode.insertBefore(totalSinIvaElement, ivaElement)
    }

    // Update total_sin_IVA value
    const totalSinIvaValueElement = totalSinIvaElement.querySelector(".price-value")
    totalSinIvaValueElement.textContent = formatPrice(totalSinIva)

    // Calculate IVA (21% of total_sin_IVA)
    const iva = totalSinIva * IVA_RATE

    // Calculate total (total_sin_IVA + IVA)
    const total = totalSinIva + iva

    // Update summary values
    ivaElement.textContent = formatPrice(iva)
    totalElement.textContent = formatPrice(total)
  }

  // Add event listener to coupon button
  couponButton.addEventListener("click", validateCoupon)

  // Add event listener for Enter key on coupon input
  couponInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      validateCoupon()
    }
  })

  // Clear error when typing in coupon input
  couponInput.addEventListener("input", () => {
    // Remove any existing error message
    const existingError = couponSection.querySelector(".coupon-error")
    if (existingError) {
      existingError.remove()
    }

    // Remove any existing success message
    const existingSuccess = couponSection.querySelector(".coupon-success")
    if (existingSuccess) {
      existingSuccess.remove()
    }

    // Reset input style
    couponInput.classList.remove("error")
    couponInput.classList.remove("success")
  })

  // Function to handle item deletion
  function handleDeleteItem(e) {
    // Get the cart item
    const cartItem = e.currentTarget.closest(".cart-item")

    if (cartItem) {
      // Store information about the deleted item for undo functionality
      lastDeletedItem = {
        element: cartItem,
        wasChecked: cartItem.querySelector('input[name="buy-item"]').checked,
        isFirst: !cartItem.previousElementSibling || cartItem.previousElementSibling.classList.contains("table-header"),
        previousItem:
          cartItem.previousElementSibling && !cartItem.previousElementSibling.classList.contains("table-header")
            ? cartItem.previousElementSibling
            : null,
      }

      // Remove the item from the DOM
      cartItem.remove()

      // Show the delete notification
      showDeleteNotification(cartItem)

      // Force recalculation of prices
      if (currentCoupon) {
        updateCouponDiscount(currentCoupon)
      }

      // Update the UI
      updateUI()

      // Update the "check all" checkbox state after deletion
      updateCheckAllState()
    }
  }

  // Function to update the "check all" checkbox state
  function updateCheckAllState() {
    const remainingCheckboxes = document.querySelectorAll('input[name="buy-item"]')
    const checkedCheckboxes = document.querySelectorAll('input[name="buy-item"]:checked')

    // If there are no remaining checkboxes, uncheck the "check all" checkbox
    if (remainingCheckboxes.length === 0) {
      checkAllCheckbox.checked = false
      checkAllCheckbox.indeterminate = false
    }
    // If all remaining checkboxes are checked, check the "check all" checkbox
    else if (checkedCheckboxes.length === remainingCheckboxes.length) {
      checkAllCheckbox.checked = true
      checkAllCheckbox.indeterminate = false
    }
    // If some but not all checkboxes are checked, set the "check all" checkbox to indeterminate
    else if (checkedCheckboxes.length > 0) {
      checkAllCheckbox.checked = false
      checkAllCheckbox.indeterminate = true
    }
    // If no checkboxes are checked, uncheck the "check all" checkbox
    else {
      checkAllCheckbox.checked = false
      checkAllCheckbox.indeterminate = false
    }
  }

  // Function to create and show the delete notification
  function showDeleteNotification(cartItem) {
    // Clear any existing notification timeout
    if (notificationTimeout) {
      clearTimeout(notificationTimeout)
    }

    // Remove any existing notification
    const existingNotification = document.querySelector(".delete-notification")
    if (existingNotification) {
      existingNotification.remove()
    }

    // Create notification element
    const notification = document.createElement("div")
    notification.className = "delete-notification"
    notification.innerHTML = `
      <span>¡Listo! Eliminaste el producto.</span>
      <button class="undo-button">DESHACER</button>
    `

    // Add notification to the body
    document.body.appendChild(notification)

    // Add event listener to the undo button
    const undoButton = notification.querySelector(".undo-button")
    undoButton.addEventListener("click", () => {
      // Restore the deleted item
      if (lastDeletedItem && lastDeletedItem.element) {
        // Get the cart table
        const cartTable = document.querySelector(".cart-table")

        // If the item was the first one, insert after the header
        if (lastDeletedItem.isFirst) {
          const tableHeader = cartTable.querySelector(".table-header")
          tableHeader.after(lastDeletedItem.element)
        }
        // Otherwise, insert after the previous item
        else if (lastDeletedItem.previousItem) {
          lastDeletedItem.previousItem.after(lastDeletedItem.element)
        }
        // If all else fails, just append to the cart table
        else {
          cartTable.appendChild(lastDeletedItem.element)
        }

        // Restore checkbox state
        const checkbox = lastDeletedItem.element.querySelector('input[name="buy-item"]')
        if (checkbox) {
          checkbox.checked = lastDeletedItem.wasChecked
        }

        // Re-add event listeners
        addDeleteButtonListeners()

        // Add event listeners to the restored checkbox
        if (checkbox) {
          checkbox.addEventListener("change", updateUI)
        }

        // Force recalculation of prices with coupon if applied
        if (currentCoupon) {
          updateCouponDiscount(currentCoupon)
        }

        // Update the UI to recalculate all prices
        updateUI()

        // Update the "check all" checkbox state after restoration
        updateCheckAllState()

        // Remove the notification
        notification.remove()

        // Clear the timeout
        if (notificationTimeout) {
          clearTimeout(notificationTimeout)
          notificationTimeout = null
        }
      }
    })

    // Set timeout to remove the notification after 5 seconds
    notificationTimeout = setTimeout(() => {
      notification.classList.add("fade-out")

      // Remove the notification after the fade-out animation
      setTimeout(() => {
        notification.remove()
        notificationTimeout = null
      }, 300)
    }, 5000)
  }

  // Function to add event listeners to all delete buttons
  function addDeleteButtonListeners() {
    document.querySelectorAll(".action-button.delete").forEach((button) => {
      // Remove any existing event listeners to prevent duplicates
      button.removeEventListener("click", handleDeleteItem)

      // Add the event listener
      button.addEventListener("click", handleDeleteItem)
    })
  }

  // Add event listeners to delete buttons
  addDeleteButtonListeners()
})
