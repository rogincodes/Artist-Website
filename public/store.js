if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
} else {
    ready();
};

function ready() {
    var removeCartItemButton = document.getElementsByClassName('btn-danger');
    for (var i = 0; i < removeCartItemButton.length; i++) {
        var button = removeCartItemButton[i];
        button.addEventListener('click', removeCartItem);
    };

    var quantityInputs = document.getElementsByClassName('cart-quantity-input');
    for (var i = 0; i < quantityInputs.length; i++) {
        var input = quantityInputs[i];
        input.addEventListener('change', quantityChanged);
    };

    var addToCartButtons = document.getElementsByClassName('shop-item-btn');
    for (var i = 0; i < addToCartButtons.length; i++) {
        var button = addToCartButtons[i];
        button.addEventListener('click', addToCartClicked);
    };

    document.getElementsByClassName('btn-purchase')[0].addEventListener('click', purchaseClicked);
};

var stripeHandler = StripeCheckout.configure({
    key: stripePublicKey,
    locale: 'en',
    token: function(token) {
        var items = [];
        var cartItemContainer = document.getElementsByClassName('cart')[0];
        var cartRows = cartItemContainer.getElementsByClassName('cart-row');
        for (var i = 0; i < cartRows.length; i++) {
            var cartRow = cartRows[i];
            var quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0];
            var quantity = quantityElement.value;
            var id = cartRow.dataset.itemId;
            items.push({
                id: id,
                quantity: quantity
            });
        }

        fetch('/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                stripeTokenId: token.id,
                items: items
            })
        }).then(function(res) {
            return res.json()
        }).then(function(data) {
            alert(data.message)
            var cartItems = document.getElementsByClassName('cart')[0];
             while (cartItems.hasChildNodes()) {
             cartItems.removeChild(cartItems.firstChild);
            }
            updateCartTotal();
        }).catch(function(error) {
            console.error(error)
        })
    }
})

function purchaseClicked(event) {
    var priceElement = document.getElementsByClassName('cart-total-price')[0];
    var price = parseFloat(priceElement.innerText.replace('₱', '')) * 100;
    stripeHandler.open({
        amount: price
    })
}

function addToCartClicked(event) {
    var buttonClicked = event.target;
    var shopItem = buttonClicked.parentElement.parentElement;
    var title = shopItem.getElementsByClassName('shop-item-title')[0].innerText;
    var price = shopItem.getElementsByClassName('shop-item-price')[0].innerText;
    var imageSrc = shopItem.getElementsByClassName('shop-item-image')[0].src;
    var id = shopItem.dataset.itemId

    addItemToCart(title, price, imageSrc, id);
    updateCartTotal();
}

function addItemToCart(title, price, imageSrc, id) {
    var cartRow = document.createElement('div');
    cartRow.classList.add('cart-row');
    cartRow.dataset.itemId = id;
    var cartItems = document.getElementsByClassName('cart')[0];
    var cartItemNames = cartItems.getElementsByClassName('cart-item-title');

    for (var i = 0; i < cartItemNames.length; i++) {
        if (cartItemNames[i].innerText == title) {
            var cartQuantityInputs = cartItems.getElementsByClassName('cart-quantity-input');
            for (var i = 0; i < cartQuantityInputs.length; i++) {
                var input = cartQuantityInputs[i];
                var inputParentElement = input.parentElement.parentElement;
                if (inputParentElement.innerText.includes(title)) {                    
                    var inputValue = parseInt(cartQuantityInputs[i].value);
                    input.value = inputValue + 1;
                    return;                 
                } 
            };
        }
    };

    var cartRowContent = `
        <div class="cart-item cart-column">
            <img class="cart-item-image" src="${imageSrc}" alt="Bootleg Tee" height="100px" width="100px">
            <span class="cart-item-title">${title}</span>
        </div>
        <span class="cart-price cart-column">${price}</span>
        <div class="cart-quantity cart-column">
            <input class="cart-quantity-input" type="number" value="1">
            <button class="btn btn-danger" role="button">REMOVE</button>
        </div>`;
    cartRow.innerHTML = cartRowContent;
    cartItems.append(cartRow);
    cartRow.getElementsByClassName('btn-danger')[0].addEventListener('click', removeCartItem);
    cartRow.getElementsByClassName('cart-quantity')[0].addEventListener('change', quantityChanged);
};

function removeCartItem(event) {
    var buttonClicked = event.target;
    buttonClicked.parentElement.parentElement.remove();
    updateCartTotal();
};

function quantityChanged(event) {
    var input = event.target;
    if (isNaN(input.value) || input.value <=0) {
        input.value = 1;
    }
    updateCartTotal();
};

function updateCartTotal() {
    var cartItemContainer = document.getElementsByClassName('cart')[0];
    var cartRows =  cartItemContainer.getElementsByClassName('cart-row');
    var total = 0;

    for (var i = 0; i < cartRows.length; i++) {
        var cartRow = cartRows[i];
        var priceElement = cartRow.getElementsByClassName('cart-price')[0];
        var quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0];
        var price = priceElement.innerText.toString().replace('₱', '');
        var numericValue = price.replace(/,/g, '');
        var formattedPrice = parseFloat(numericValue);
        var quantity = quantityElement.value;
        total = total + (formattedPrice * quantity);
    };

    total = Math.round(total * 100) / 100;
    var formattedTotal = addCommas(total);
    document.getElementsByClassName('cart-total-price')[0].innerText = '₱' + formattedTotal;
};

function addCommas(totalValue) {
    var reversedValue = totalValue.toString().split('').reverse().join('');
    var formattedValue = reversedValue.replace(/(\d{3})(?=\d)/g, '$1,');
    formattedValue = formattedValue.split('').reverse().join('');
    return formattedValue;
}

