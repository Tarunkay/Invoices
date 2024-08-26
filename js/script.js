document.addEventListener('DOMContentLoaded', () => {
    const modeToggle = document.getElementById('mode-toggle');
    const invoiceList = document.getElementById('invoice-list');
    const newInvoiceBtn = document.getElementById('new-invoice-btn');
    const invoiceModal = document.getElementById('invoice-modal');
    const closeModal = document.querySelector('.close');
    const invoiceForm = document.getElementById('invoice-form');
    const statusFilter = document.getElementById('status-filter');
    const addItemBtn = document.getElementById('add-item-btn');
    const itemsContainer = document.getElementById('items-container');
    const totalAmountInput = document.getElementById('total-amount');
    const invoiceDetail = document.getElementById('invoice-detail');
    const backToListBtn = document.getElementById('back-to-list');
    const editInvoiceBtn = document.getElementById('edit-invoice-btn');
    let discount = 0;

    let selectedInvoiceId = null;


    if (modeToggle) {
        modeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            document.body.classList.toggle('light-mode');
        });
    }
    

    if (newInvoiceBtn && invoiceModal && invoiceForm && itemsContainer && totalAmountInput) {
        newInvoiceBtn.addEventListener('click', () => {
            invoiceModal.style.display = 'block';
            document.getElementById('form-title').textContent = 'New Invoice';
            invoiceForm.reset();
            itemsContainer.innerHTML = ''; 
            totalAmountInput.value = ''; 
            selectedInvoiceId = null; 
        });
    }

    if (closeModal && invoiceModal) {
        closeModal.addEventListener('click', () => {
            invoiceModal.style.display = 'none';
        });
    }
    

    if (addItemBtn && itemsContainer) {
        addItemBtn.addEventListener('click', () => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('item-entry');
            itemDiv.innerHTML = `
                <input type="text" class="item-name" placeholder="Item" required>
                <input type="number" class="item-quantity" placeholder="Quantity" min="1" required>
                <input type="number" class="item-price" placeholder="Price" min="0" step="0.01" required>
                <button type="button" class="delete-item-btn">Delete</button>
            `;
            itemsContainer.appendChild(itemDiv);

            itemDiv.querySelector('.delete-item-btn').addEventListener('click', () => {
                itemsContainer.removeChild(itemDiv);
                calculateTotal();
            });

            itemDiv.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', calculateTotal);
            });
        });
    }
    

    if (invoiceForm) {
        invoiceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const billerName = document.getElementById('biller-name')?.value || '';
            const billerEmail = document.getElementById('biller-email')?.value || '';
            const billerCity = document.getElementById('biller-city')?.value || '';
            const billerState = document.getElementById('biller-state')?.value || '';
            const billerPincode = document.getElementById('biller-pincode')?.value || '';
            const invoiceDate = document.getElementById('invoice-date')?.value || '';
            let invoiceAmount = parseFloat(totalAmountInput?.value) || 0;
            const invoiceStatus = document.getElementById('invoice-status')?.value || '';

            if (invoiceAmount > 10000) {
                discount = invoiceAmount * 0.60;
                invoiceAmount = invoiceAmount - discount; 
            } else if (invoiceAmount > 2000) {
                discount = invoiceAmount * 0.90;
                invoiceAmount = invoiceAmount - discount;
            }

            const invoice = {
                id: selectedInvoiceId || generateInvoiceID(),
                biller: {
                    name: billerName,
                    email: billerEmail,
                    city: billerCity,
                    state: billerState,
                    pincode: billerPincode
                },
                invoiceDate,
                invoiceAmount,
                invoiceStatus,
                items: Array.from(itemsContainer.querySelectorAll('.item-entry')).map(entry => ({
                    name: entry.querySelector('.item-name')?.value || '',
                    quantity: parseInt(entry.querySelector('.item-quantity')?.value) || 0,
                    price: parseFloat(entry.querySelector('.item-price')?.value) || 0,
                }))
            };

            if (selectedInvoiceId) {
                updateInvoice(invoice);
            } else {
                saveInvoice(invoice);
            }
            
            if (invoiceModal) {
                invoiceModal.style.display = 'none';
            }
            displayInvoices(); 
        });
    }

    function generateInvoiceID() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const randomLetters = letters.charAt(Math.floor(Math.random() * letters.length)) +
                              letters.charAt(Math.floor(Math.random() * letters.length));
        const randomNumbers = Math.floor(1000 + Math.random() * 9000);
        return `#${randomLetters}${randomNumbers}`;
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', displayInvoices);
    }

    function saveInvoice(invoice) {
        const invoices = getInvoices();
        invoices.push(invoice);
        localStorage.setItem('invoices', JSON.stringify(invoices));
    }

    function updateInvoice(updatedInvoice) {
        const invoices = getInvoices();
        const index = invoices.findIndex(invoice => invoice.id === updatedInvoice.id);
        if (index > -1) {
            invoices[index] = updatedInvoice;
            localStorage.setItem('invoices', JSON.stringify(invoices));
        }
    }

    function getInvoices() {
        return JSON.parse(localStorage.getItem('invoices')) || [];
    }

    function calculateTotal() {
        let total = 0;
        const itemEntries = itemsContainer.querySelectorAll('.item-entry');
        itemEntries.forEach(itemEntry => {
            const price = parseFloat(itemEntry.querySelector('.item-price')?.value) || 0;
            const quantity = parseInt(itemEntry.querySelector('.item-quantity')?.value) || 0;
            total += price * quantity;
        });
        if (totalAmountInput) {
            totalAmountInput.value = total.toFixed(2);
        }
    }

    function displayInvoices() {
        const invoices = getInvoices();
    const filteredInvoices = statusFilter.value === 'all' ? invoices : invoices.filter(invoice => invoice.invoiceStatus === statusFilter.value);
    invoiceList.innerHTML = '';
    
    // Update the invoice count
    document.getElementById('invoice-count').textContent = filteredInvoices.length;
    
    filteredInvoices.forEach(invoice => {
        const invoiceDiv = document.createElement('div');
        invoiceDiv.classList.add('invoice');
        invoiceDiv.innerHTML = `
            <div>
                <strong>ID:</strong> ${invoice.id}
            </div>
            <div>
                <strong>Biller Name:</strong> ${invoice.biller.name}
            </div>
            <div>
                <strong>Amount:</strong> $${invoice.invoiceAmount.toFixed(2)}
            </div>
            <div>
                <strong>Status:</strong> ${invoice.invoiceStatus}
            </div>
            <button class="view-detail-btn" data-id="${invoice.id}">View Details</button>
        `;
        invoiceList.appendChild(invoiceDiv);
    });

    invoiceList.querySelectorAll('.view-detail-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const invoiceId = e.target.dataset.id;
            displayInvoiceDetail(invoiceId);
        });
    });
        if (invoiceList) {
            const invoices = getInvoices();
            const filteredInvoices = statusFilter?.value === 'all' ? invoices : invoices.filter(invoice => invoice.invoiceStatus === statusFilter?.value);
            invoiceList.innerHTML = '';
            filteredInvoices.forEach(invoice => {
                const invoiceDiv = document.createElement('div');
                invoiceDiv.classList.add('invoice');
                invoiceDiv.innerHTML = `
                    <div>
                        <strong>ID:</strong> ${invoice.id}
                    </div>
                    <div>
                        <strong>Biller Name:</strong> ${invoice.biller.name}
                    </div>
                    <div>
                        <strong>Amount:</strong> $${invoice.invoiceAmount.toFixed(2)}
                    </div>
                    <div>
                        <strong>Status:</strong> ${invoice.invoiceStatus}
                    </div>
                    <button class="view-detail-btn" data-id="${invoice.id}">View Details</button>
                    <button class="delete-invoice-btn" data-id="${invoice.id}">Delete</button>
                `;
                invoiceList.appendChild(invoiceDiv);
            });
    
            invoiceList.querySelectorAll('.view-detail-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const invoiceId = e.target.dataset.id;
                    displayInvoiceDetail(invoiceId);
                });
            });
    
            invoiceList.querySelectorAll('.delete-invoice-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const invoiceId = e.target.dataset.id;
                    deleteInvoice(invoiceId);
                    displayInvoices(); 
                });
            });
        }
    }
    function deleteInvoice(id) {
        const invoices = getInvoices();
        const updatedInvoices = invoices.filter(invoice => invoice.id !== id);
        localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
    }
    
    

    function displayInvoiceDetail(id) {
        const invoices = getInvoices();
        const invoice = invoices.find(invoice => invoice.id === id);
        if (invoice) {
            document.getElementById('invoice-detail-content').innerHTML = `
                <h3>Invoice ID: ${invoice.id}</h3>
                <p><strong>Biller Name:</strong> ${invoice.biller.name}</p>
                <p><strong>Biller Email:</strong> ${invoice.biller.email}</p>
                <p><strong>Biller City:</strong> ${invoice.biller.city}</p>
                <p><strong>Biller State:</strong> ${invoice.biller.state}</p>
                <p><strong>Biller Pincode:</strong> ${invoice.biller.pincode}</p>
                <p><strong>Invoice Date:</strong> ${invoice.invoiceDate}</p>
                <p><strong>Amount:</strong> $${invoice.invoiceAmount.toFixed(2)}</p>
                <p><strong>Status:</strong> ${invoice.invoiceStatus}</p>
                <h4>Items:</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>$${item.price.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            if (invoiceList) {
                invoiceList.style.display = 'none';
            }
            if (invoiceDetail) {
                invoiceDetail.style.display = 'block';
            }

            selectedInvoiceId = id;
        }
    }

    if (backToListBtn) {
        backToListBtn.addEventListener('click', () => {
            if (invoiceDetail) {
                invoiceDetail.style.display = 'none';
            }
            if (invoiceList) {
                invoiceList.style.display = 'block';
            }
        });
    }

    if (editInvoiceBtn) {
        editInvoiceBtn.addEventListener('click', () => {
            if (selectedInvoiceId) {
                const invoices = getInvoices();
                const invoice = invoices.find(invoice => invoice.id === selectedInvoiceId);
    
                if (invoice) {
                    console.log('Updating invoice:', invoice);
    
                    const billerNameInput = document.getElementById('biller-name');
                    const billerEmailInput = document.getElementById('biller-email');
                    const billerCityInput = document.getElementById('biller-city');
                    const billerStateInput = document.getElementById('biller-state');
                    const billerPincodeInput = document.getElementById('biller-pincode');
                    const invoiceDateInput = document.getElementById('invoice-date');
                    const invoiceStatusInput = document.getElementById('invoice-status');
                    
                    console.log('Field values:', {
                        billerName: invoice.biller.name,
                        billerEmail: invoice.biller.email,
                        billerCity: invoice.biller.city,
                        billerState: invoice.biller.state,
                        billerPincode: invoice.biller.pincode,
                        invoiceDate: invoice.invoiceDate,
                        invoiceStatus: invoice.invoiceStatus
                    });
    
                    if (billerNameInput) billerNameInput.value = invoice.biller.name || '';
                    if (billerEmailInput) billerEmailInput.value = invoice.biller.email || '';
                    if (billerCityInput) billerCityInput.value = invoice.biller.city || '';
                    if (billerStateInput) billerStateInput.value = invoice.biller.state || '';
                    if (billerPincodeInput) billerPincodeInput.value = invoice.biller.pincode || '';
                    if (invoiceDateInput) invoiceDateInput.value = invoice.invoiceDate || '';
                    if (invoiceStatusInput) invoiceStatusInput.value = invoice.invoiceStatus || '';
    
                    
                    if (itemsContainer) {
                        itemsContainer.innerHTML = '';
                        invoice.items.forEach(item => {
                            const itemDiv = document.createElement('div');
                            itemDiv.classList.add('item-entry');
                            itemDiv.innerHTML = `
                                <input type="text" class="item-name" value="${item.name}" placeholder="Item" required>
                                <input type="number" class="item-quantity" value="${item.quantity}" placeholder="Quantity" min="1" required>
                                <input type="number" class="item-price" value="${item.price}" placeholder="Price" min="0" step="0.01" required>
                                <button type="button" class="delete-item-btn">Delete</button>
                            `;
                            itemsContainer.appendChild(itemDiv);
    
                            itemDiv.querySelector('.delete-item-btn').addEventListener('click', () => {
                                itemsContainer.removeChild(itemDiv);
                                calculateTotal();
                            });
    
                            itemDiv.querySelectorAll('input').forEach(input => {
                                input.addEventListener('input', calculateTotal);
                            });
                        });
    
                        calculateTotal(); 
                    }
    
                    if (invoiceModal) {
                        invoiceModal.style.display = 'block';
                    }
                    document.getElementById('form-title').textContent = 'Edit Invoice';
                } else {
                    console.error('Invoice not found:', selectedInvoiceId);
                }
            } else {
                console.error('No invoice selected for editing.');
            }
        });
    }
    
    
    displayInvoices(); 
});