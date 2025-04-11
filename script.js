document.addEventListener("DOMContentLoaded", () => {
  // Get the toggle button and order summary
  const toggleButton = document.querySelector(".toggle-button")
  const orderSummary = document.querySelector(".order-summary")

  // Set the initial total price in the toggle button
  const totalPriceElement = document.querySelector(".price-row.total .price-value")
  if (totalPriceElement) {
    const totalPrice = totalPriceElement.textContent
    document.querySelector(".total-price").textContent = totalPrice
  }

  // Add click event to toggle button
  if (toggleButton && orderSummary) {
    toggleButton.addEventListener("click", function () {
      // Toggle active class on button
      this.classList.toggle("active")

      // Toggle active class on order summary
      orderSummary.classList.toggle("active")

      // Change icon based on state
      const icon = this.querySelector(".toggle-icon i")
      if (orderSummary.classList.contains("active")) {
        icon.className = "fas fa-chevron-up"
      } else {
        icon.className = "fas fa-chevron-down"
      }
    })
  }

  // Handle dropdown menu for the three dots
  const dropdownToggle = document.querySelector(".dropdown-toggle")
  const dropdownMenu = document.querySelector(".dropdown-menu")

  if (dropdownToggle && dropdownMenu) {
    dropdownToggle.addEventListener("click", (e) => {
      e.stopPropagation()
      dropdownMenu.classList.toggle("show")
    })

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
      if (dropdownMenu.classList.contains("show")) {
        dropdownMenu.classList.remove("show")
      }
    })
  }
})
